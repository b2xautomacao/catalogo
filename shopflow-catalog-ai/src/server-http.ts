/**
 * server-http.ts
 *
 * Sprint 13 Consolidada + MCP Remote Connection Remediation:
 * Production-ready MCP Streamable HTTP & JSON-RPC Transport with official MCP SDK
 * (WebStandardStreamableHTTPServerTransport), session isolation, Bearer authentication,
 * rate limiting, health/ready checks, observability metrics, and zero secret logging.
 */

import http from 'node:http';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';
import { AuthenticatedContextProvider } from './auth/authenticated-context-provider.js';
import { AgentSession } from './auth/agent-session.js';
import { CatalogService } from './services/catalog.service.js';
import { StoreService } from './services/store.service.js';
import { InventoryService } from './services/inventory.service.js';
import { GradeService } from './services/grade.service.js';
import { registerCatalogHealthTool } from './tools/catalog-health.tool.js';
import { registerListarProdutosTool } from './tools/listar-produtos.tool.js';
import { registerObterProdutoTool } from './tools/obter-produto.tool.js';
import { registerBuscarCatalogoTool } from './tools/buscar-catalogo.tool.js';
import { registerBuscarLojasTool } from './tools/buscar-lojas.tool.js';
import { registerSelecionarLojaTool } from './tools/selecionar-loja.tool.js';
import { registerObterLojaAtivaTool } from './tools/obter-loja-ativa.tool.js';
import { registerCriarProdutoTool } from './tools/criar-produto.tool.js';
import { registerAtualizarProdutoTool } from './tools/atualizar-produto.tool.js';
import { registerDesativarProdutoTool } from './tools/desativar-produto.tool.js';
import { registerAtualizarProdutosEmLoteTool } from './tools/atualizar-produtos-em-lote.tool.js';
import { registerConsultarEstoqueTool } from './tools/consultar-estoque.tool.js';
import { registerAjustarEstoqueTool } from './tools/ajustar-estoque.tool.js';
import { registerListarModelosGradeTool } from './tools/listar-modelos-grade.tool.js';
import { registerObterModeloGradeTool } from './tools/obter-modelo-grade.tool.js';
import { registerCriarModeloGradeTool } from './tools/criar-modelo-grade.tool.js';
import { registerAplicarGradeProdutoTool } from './tools/aplicar-grade-produto.tool.js';
import { ProductRepository } from './repositories/product.repository.js';
import { RateLimiter } from './security/rate-limiter.js';
import { Logger } from './observability/logger.js';
import { MetricsCollector } from './observability/metrics.js';
import './config/env.js';

export interface HttpServerOptions {
  port?: number;
  corsOrigin?: string;
  maxPayloadBytes?: number;
  requestTimeoutMs?: number;
  rateLimiter?: RateLimiter;
}

interface McpSessionRecord {
  sessionId: string;
  server: McpServer;
  transport: WebStandardStreamableHTTPServerTransport;
  session: AgentSession;
  principalId: string;
  createdAt: number;
  lastAccess: number;
}

/**
 * Instantiates and registers all 17 official catalog tools onto an McpServer instance
 * bound to an isolated AgentSession.
 */
function createConfiguredMcpServer(session: AgentSession) {
  const server = new McpServer({
    name: 'shopflow-catalog-ai',
    version: '1.0.0',
  });

  const catalogService = new CatalogService(session);
  const storeService = new StoreService(session);
  const inventoryService = new InventoryService(session);
  const gradeService = new GradeService(session);

  // Read-Only Catalog Tools (4)
  registerCatalogHealthTool(server, catalogService);
  registerListarProdutosTool(server, catalogService);
  registerObterProdutoTool(server, catalogService);
  registerBuscarCatalogoTool(server, catalogService);

  // Store Resolution & Selection Tools (3)
  registerBuscarLojasTool(server, storeService);
  registerSelecionarLojaTool(server, storeService);
  registerObterLojaAtivaTool(server, storeService);

  // Safe Catalog Write & Lifecycle Tools (4)
  registerCriarProdutoTool(server, catalogService);
  registerAtualizarProdutoTool(server, catalogService);
  registerDesativarProdutoTool(server, catalogService);
  registerAtualizarProdutosEmLoteTool(server, catalogService);

  // Safe Inventory Read & Write Tools (2)
  registerConsultarEstoqueTool(server, inventoryService);
  registerAjustarEstoqueTool(server, inventoryService);

  // Normalized Grade Template & Snapshot Tools (4)
  registerListarModelosGradeTool(server, gradeService);
  registerObterModeloGradeTool(server, gradeService);
  registerCriarModeloGradeTool(server, gradeService);
  registerAplicarGradeProdutoTool(server, gradeService);

  return { server, catalogService, storeService, inventoryService, gradeService };
}

export function createHttpServer(options: HttpServerOptions = {}) {
  const {
    corsOrigin = '*',
    maxPayloadBytes = 1024 * 1024, // 1MB
    requestTimeoutMs = 30000,
    rateLimiter = new RateLimiter(),
  } = options;

  const productRepo = new ProductRepository();
  const metrics = MetricsCollector.getInstance();
  const activeSessions = new Map<string, McpSessionRecord>();

  // Periodic cleanup of stale sessions (> 30 min of inactivity)
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    const TTL_MS = 30 * 60 * 1000;
    for (const [id, rec] of activeSessions.entries()) {
      if (now - rec.lastAccess > TTL_MS) {
        rec.transport.close().catch(() => {});
        activeSessions.delete(id);
      }
    }
  }, 60 * 1000).unref();

  const server = http.createServer(async (req, res) => {
    const startTime = Date.now();
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    metrics.recordRequest();

    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // Timeout
    req.setTimeout(requestTimeoutMs, () => {
      res.writeHead(504, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 'TIMEOUT', message: 'Request timeout' } }));
    });

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type, X-Request-ID, Mcp-Session-Id, Accept'
    );
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id, X-Request-ID');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const host = req.headers.host || 'localhost';
    const url = new URL(req.url || '/', `http://${host}`);
    const pathname = url.pathname;

    // 1. Health check (Liveness - Lightweight, zero database load)
    if (req.method === 'GET' && pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      return;
    }

    // 2. Ready check (Readiness with dependency check and timeout guard)
    if (req.method === 'GET' && pathname === '/ready') {
      try {
        const isHealthy = await Promise.race([
          productRepo.checkHealth(),
          new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000)),
        ]).catch(() => false);

        if (isHealthy) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ready', database: 'connected' }));
        } else {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'not_ready', database: 'disconnected' }));
        }
      } catch {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'not_ready', error: 'Readiness check failed' }));
      }
      return;
    }

    // 3. Operational Metrics
    if (req.method === 'GET' && pathname === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(metrics.getSnapshot(), null, 2));
      return;
    }

    // 4. MCP Streamable HTTP & JSON-RPC Endpoint
    if (pathname === '/mcp' || pathname === '/rpc' || pathname === '/') {
      // Read body with payload limits
      const chunks: Buffer[] = [];
      let receivedBytes = 0;
      let bodyExceeded = false;

      req.on('data', (chunk: Buffer) => {
        receivedBytes += chunk.length;
        if (receivedBytes > maxPayloadBytes) {
          bodyExceeded = true;
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeded limit' } }));
          req.destroy();
        } else {
          chunks.push(chunk);
        }
      });

      req.on('end', async () => {
        if (bodyExceeded) return;

        const bodyBuffer = Buffer.concat(chunks);
        const bodyStr = bodyBuffer.toString('utf-8');

        // Check if existing session via Mcp-Session-Id header
        const sessionIdHeader = (req.headers['mcp-session-id'] as string)?.trim();

        if (sessionIdHeader) {
          const sessionRecord = activeSessions.get(sessionIdHeader);
          if (!sessionRecord) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                jsonrpc: '2.0',
                error: { code: -32001, message: 'Session not found' },
                id: null,
              })
            );
            return;
          }

          sessionRecord.lastAccess = Date.now();

          // Prepare Web Standard Request
          const webReq = createWebStandardRequest(req, url, bodyBuffer);

          try {
            const webRes = await sessionRecord.transport.handleRequest(webReq);

            // Forward Web Standard Response to Node response
            await pipeWebResponseToNode(webRes, res, sessionIdHeader);

            if (req.method === 'DELETE') {
              activeSessions.delete(sessionIdHeader);
            }
          } catch (err: any) {
            handleErrorResponse(err, res, requestId, startTime, metrics);
          }
          return;
        }

        // No session ID -> Must authenticate via Bearer token
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          metrics.recordAuthFailure();
          Logger.warn('Authentication failed: Missing or invalid Authorization header', {
            request_id: requestId,
            status: '401',
            error_code: 'UNAUTHORIZED',
          });
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' },
            })
          );
          return;
        }

        const apiKey = authHeader.substring(7).trim();

        try {
          // Authenticate and obtain isolated context
          const contextProvider = new AuthenticatedContextProvider(apiKey);
          const agentContext = await contextProvider.getContext();

          // Check if payload is legacy direct tool invocation: { tool: "..." }
          let parsedPayload: any = null;
          if (bodyStr.trim().length > 0) {
            try {
              parsedPayload = JSON.parse(bodyStr);
            } catch {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'INVALID_JSON', message: 'Malformed JSON payload' } }));
              return;
            }
          }

          // Legacy REST dispatch if payload has 'tool' and no 'jsonrpc'
          if (parsedPayload && parsedPayload.tool && !parsedPayload.jsonrpc) {
            await handleLegacyToolDispatch({
              payload: parsedPayload,
              agentContext,
              rateLimiter,
              requestId,
              startTime,
              metrics,
              res,
            });
            return;
          }

          // Official MCP Streamable HTTP Initialization
          const newSessionId = randomUUID();
          const session = new AgentSession({
            ...agentContext,
            sessionId: newSessionId,
          });

          const { server: mcpServer } = createConfiguredMcpServer(session);

          const transport = new WebStandardStreamableHTTPServerTransport({
            sessionIdGenerator: () => newSessionId,
            enableJsonResponse: true,
          });

          await mcpServer.connect(transport);

          activeSessions.set(newSessionId, {
            sessionId: newSessionId,
            server: mcpServer,
            transport,
            session,
            principalId: agentContext.principalId,
            createdAt: Date.now(),
            lastAccess: Date.now(),
          });

          // Build Web Standard Request
          const webReq = createWebStandardRequest(req, url, bodyBuffer);

          const webRes = await transport.handleRequest(webReq);

          await pipeWebResponseToNode(webRes, res, newSessionId);
        } catch (err: any) {
          handleErrorResponse(err, res, requestId, startTime, metrics);
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }));
  });

  return server;
}

/**
 * Builds a Web Standard Request from a Node.js IncomingMessage
 */
function createWebStandardRequest(req: http.IncomingMessage, url: URL, bodyBuffer: Buffer): Request {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v) {
      if (Array.isArray(v)) {
        for (const item of v) headers.append(k, item);
      } else {
        headers.set(k, v);
      }
    }
  }

  // Ensure Accept header includes text/event-stream for MCP Streamable HTTP specification
  let accept = headers.get('accept') || 'application/json, text/event-stream';
  if (!accept.includes('text/event-stream')) {
    accept = `${accept}, text/event-stream`;
    headers.set('accept', accept);
  }

  const isBodyAllowed = req.method !== 'GET' && req.method !== 'HEAD';

  return new Request(url, {
    method: req.method,
    headers,
    body: isBodyAllowed && bodyBuffer.length > 0 ? bodyBuffer : undefined,
    duplex: 'half',
  } as any);
}

/**
 * Pipes a Web Standard Response back into a Node.js ServerResponse
 */
async function pipeWebResponseToNode(webRes: Response, res: http.ServerResponse, sessionId?: string) {
  res.statusCode = webRes.status;

  for (const [k, v] of webRes.headers.entries()) {
    res.setHeader(k, v);
  }

  if (sessionId) {
    res.setHeader('Mcp-Session-Id', sessionId);
  }

  // Handle 204 No Content or body-less responses immediately
  if (webRes.status === 204 || !webRes.body) {
    res.end();
    return;
  }

  const contentType = webRes.headers.get('content-type') || '';
  if (contentType.includes('text/event-stream')) {
    Readable.fromWeb(webRes.body as any).pipe(res);
  } else {
    const text = await webRes.text();
    res.end(text);
  }
}

/**
 * Handles legacy tool dispatch for backwards compatibility
 */
async function handleLegacyToolDispatch(options: {
  payload: any;
  agentContext: any;
  rateLimiter: RateLimiter;
  requestId: string;
  startTime: number;
  metrics: MetricsCollector;
  res: http.ServerResponse;
}) {
  const { payload, agentContext, rateLimiter, requestId, startTime, metrics, res } = options;
  const { tool, arguments: toolArgs, id: rpcId = 1 } = payload;

  const session = new AgentSession({
    ...agentContext,
    sessionId: requestId,
  });

  // Rate limit check
  const rateCheck = rateLimiter.check(agentContext.principalId, tool);
  res.setHeader('X-RateLimit-Limit', String(rateCheck.limit));
  res.setHeader('X-RateLimit-Remaining', String(rateCheck.remaining));
  res.setHeader('X-RateLimit-Reset', String(rateCheck.resetSeconds));

  if (!rateCheck.allowed) {
    metrics.recordRateLimited();
    res.setHeader('Retry-After', String(rateCheck.resetSeconds));
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: {
          code: 'RATE_LIMITED',
          message: `Too many requests for tool '${tool}'. Please retry in ${rateCheck.resetSeconds} seconds.`,
        },
      })
    );
    return;
  }

  const catalogService = new CatalogService(session);
  const storeService = new StoreService(session);
  const inventoryService = new InventoryService(session);
  const gradeService = new GradeService(session);

  let responseData: any;
  switch (tool) {
    case 'catalog_health':
      responseData = await catalogService.checkHealth();
      break;
    case 'listar_produtos':
      responseData = await catalogService.listProducts(toolArgs || {});
      break;
    case 'obter_produto':
      responseData = await catalogService.getProduct(toolArgs?.id);
      break;
    case 'buscar_catalogo':
      responseData = await catalogService.searchCatalog(toolArgs || {});
      break;
    case 'buscar_lojas':
      responseData = await storeService.searchStores(toolArgs?.query);
      break;
    case 'selecionar_loja':
      responseData = await storeService.selectStore(toolArgs?.store_id);
      break;
    case 'obter_loja_ativa':
      responseData = await storeService.getActiveStore();
      break;
    case 'criar_produto':
      responseData = await catalogService.createProduct(toolArgs || {});
      break;
    case 'atualizar_produto':
      responseData = await catalogService.updateProduct(toolArgs || {});
      break;
    case 'desativar_produto':
      responseData = await catalogService.deactivateProduct(toolArgs?.product_id);
      break;
    case 'atualizar_produtos_em_lote':
      responseData = await catalogService.bulkUpdateProducts(toolArgs || {});
      break;
    case 'consultar_estoque':
      responseData = await inventoryService.consultarEstoque(toolArgs || {});
      break;
    case 'ajustar_estoque':
      responseData = await inventoryService.adjustStock(toolArgs || {});
      break;
    case 'listar_modelos_grade':
      responseData = await gradeService.listTemplates();
      break;
    case 'obter_modelo_grade':
      responseData = await gradeService.getTemplate(toolArgs?.template_id);
      break;
    case 'criar_modelo_grade':
      responseData = await gradeService.createTemplate(toolArgs || {});
      break;
    case 'aplicar_grade_produto':
      responseData = await gradeService.applyGradeToProduct(toolArgs || {});
      break;
    default:
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          id: rpcId,
          error: { code: -32601, message: `Tool '${tool}' not found` },
        })
      );
      return;
  }

  const durationMs = Date.now() - startTime;
  metrics.recordToolCall(tool, durationMs, false);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      jsonrpc: '2.0',
      id: rpcId,
      result: responseData,
    })
  );
}

/**
 * Maps error to secure HTTP status and JSON response without leaking secrets
 */
function handleErrorResponse(
  err: any,
  res: http.ServerResponse,
  requestId: string,
  startTime: number,
  metrics: MetricsCollector
) {
  const durationMs = Date.now() - startTime;
  const statusCode =
    err?.name === 'ForbiddenError'
      ? 403
      : err?.name === 'AuthorizationError' ||
        err?.name === 'InvalidCredentialError' ||
        err?.code === 'INVALID_CREDENTIAL' ||
        err?.message?.includes('INVALID_CREDENTIAL')
      ? 401
      : 500;

  metrics.recordToolCall('unknown', durationMs, true);

  Logger.error(`Request failed: ${err?.message || 'Unknown error'}`, {
    request_id: requestId,
    duration_ms: durationMs,
    status: String(statusCode),
    error_code: err?.code || 'INTERNAL_ERROR',
  });

  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      error: {
        code: err?.code || 'INTERNAL_ERROR',
        message: err?.message || 'An error occurred during request processing',
      },
    })
  );
}

// Graceful Shutdown Registration
function setupGracefulShutdown(server: http.Server) {
  const shutdown = (signal: string) => {
    Logger.info(`Received ${signal}. Gracefully shutting down MCP HTTP runtime...`);
    server.close(() => {
      Logger.info('MCP HTTP runtime closed cleanly.');
      process.exit(0);
    });

    // Force close after 10s if connections linger
    setTimeout(() => {
      Logger.warn('Force terminating MCP HTTP runtime.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (process.env.NODE_ENV !== 'test') {
  const PORT = Number(process.env.MCP_PORT) || 3000;
  const HOST = '0.0.0.0';
  const server = createHttpServer();
  setupGracefulShutdown(server);
  server.listen(PORT, HOST, () => {
    Logger.info(`[MCP Remote HTTP Runtime] Listening on http://${HOST}:${PORT}`);
  });
}
