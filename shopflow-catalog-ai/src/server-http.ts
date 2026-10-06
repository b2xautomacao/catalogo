/**
 * server-http.ts
 *
 * Sprint 13 Consolidada: Production Security + Observability + Release Candidate
 * Provides hardened HTTP/JSON-RPC transport with rate limiting, structured logging,
 * metrics collection, session isolation, health/ready endpoints, Bearer authentication,
 * CORS protection, payload limits, and zero secret logging.
 */

import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/server';
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

export function createHttpServer(options: HttpServerOptions = {}) {
  const {
    corsOrigin = '*',
    maxPayloadBytes = 1024 * 1024, // 1MB
    requestTimeoutMs = 30000,
    rateLimiter = new RateLimiter(),
  } = options;

  const productRepo = new ProductRepository();
  const metrics = MetricsCollector.getInstance();

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Request-ID');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
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

    // 4. MCP JSON-RPC / REST Endpoint
    if (req.method === 'POST' && (pathname === '/mcp' || pathname === '/rpc' || pathname === '/')) {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        metrics.recordAuthFailure();
        Logger.warn('Authentication failed: Missing or invalid Authorization header', {
          request_id: requestId,
          status: '401',
          error_code: 'UNAUTHORIZED',
        });
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' } }));
        return;
      }

      const apiKey = authHeader.substring(7).trim();

      // Read Body with payload limit
      let bodyStr = '';
      let receivedBytes = 0;

      req.on('data', (chunk) => {
        receivedBytes += chunk.length;
        if (receivedBytes > maxPayloadBytes) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeded limit' } }));
          req.destroy();
          return;
        }
        bodyStr += chunk;
      });

      req.on('end', async () => {
        try {
          // Authenticate and obtain isolated context
          const contextProvider = new AuthenticatedContextProvider(apiKey);
          const agentContext = await contextProvider.getContext();
          
          // Isolated Session per Request
          const session = new AgentSession({
            ...agentContext,
            sessionId: requestId,
          });

          // Parse JSON-RPC Payload
          let payload: any;
          try {
            payload = JSON.parse(bodyStr || '{}');
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { code: 'INVALID_JSON', message: 'Malformed JSON payload' } }));
            return;
          }

          const { tool, arguments: toolArgs, id: rpcId = 1 } = payload;

          if (!tool) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ jsonrpc: '2.0', id: rpcId, error: { code: -32600, message: 'Invalid Request: missing tool name' } }));
            return;
          }

          // Rate Limit Check (by Principal ID and Tool Risk Tier)
          const rateCheck = rateLimiter.check(agentContext.principalId, tool);
          res.setHeader('X-RateLimit-Limit', String(rateCheck.limit));
          res.setHeader('X-RateLimit-Remaining', String(rateCheck.remaining));
          res.setHeader('X-RateLimit-Reset', String(rateCheck.resetSeconds));

          if (!rateCheck.allowed) {
            metrics.recordRateLimited();
            res.setHeader('Retry-After', String(rateCheck.resetSeconds));
            Logger.warn(`Rate limit exceeded for tool ${tool}`, {
              request_id: requestId,
              session_id: session.getSessionId(),
              principal_id: agentContext.principalId,
              principal_type: agentContext.principalType,
              tool,
              error_code: 'RATE_LIMITED',
              status: '429',
            });
            res.writeHead(429, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: {
                code: 'RATE_LIMITED',
                message: `Too many requests for tool '${tool}'. Please retry in ${rateCheck.resetSeconds} seconds.`,
              },
            }));
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
              res.end(JSON.stringify({ jsonrpc: '2.0', id: rpcId, error: { code: -32601, message: `Tool '${tool}' not found` } }));
              return;
            }

          const durationMs = Date.now() - startTime;
          metrics.recordToolCall(tool, durationMs, false);

          Logger.info(`Tool ${tool} executed successfully`, {
            request_id: requestId,
            session_id: session.getSessionId(),
            principal_id: agentContext.principalId,
            principal_type: agentContext.principalType,
            tool,
            duration_ms: durationMs,
            status: '200',
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: rpcId,
            result: responseData,
          }));
        } catch (err: any) {
          const durationMs = Date.now() - startTime;
          const statusCode = err?.name === 'ForbiddenError' ? 403 : err?.name === 'AuthorizationError' || err?.code === 'INVALID_CREDENTIAL' ? 401 : 500;
          
          metrics.recordToolCall('unknown', durationMs, true);

          Logger.error(`Request failed: ${err?.message || 'Unknown error'}`, {
            request_id: requestId,
            duration_ms: durationMs,
            status: String(statusCode),
            error_code: err?.code || 'INTERNAL_ERROR',
          });

          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: {
              code: err?.code || 'INTERNAL_ERROR',
              message: err?.message || 'An error occurred during request processing',
            },
          }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }));
  });

  return server;
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

if (process.env.RUN_HTTP_SERVER === 'true' || process.argv[1]?.endsWith('server-http.ts') || process.argv[1]?.endsWith('server-http.js')) {
  if (process.env.NODE_ENV !== 'test') {
    const PORT = Number(process.env.MCP_PORT) || 3000;
    const server = createHttpServer();
    setupGracefulShutdown(server);
    server.listen(PORT, () => {
      Logger.info(`[MCP Remote HTTP Runtime] Listening on port ${PORT}`);
    });
  }
}
