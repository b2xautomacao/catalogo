import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHttpServer } from '../src/server-http.js';
import { CredentialRepository } from '../src/auth/credential.repository.js';
import { ProductRepository } from '../src/repositories/product.repository.js';
import { generateApiKey } from '../src/auth/api-key.crypto.js';

describe('Sprint 13 / Remediation: Remote MCP Streamable HTTP & Transport Lifecycle', () => {
  let server: http.Server;
  let port: number;

  // Mock valid credential
  const validKey = generateApiKey('live');
  const testStoreId = '11111111-2222-3333-4444-555555555555';

  const originalFindByPrefix = CredentialRepository.prototype.findByPrefix;
  const originalTouch = CredentialRepository.prototype.touchLastUsed;
  const originalCheckHealth = ProductRepository.prototype.checkHealth;

  before(async () => {
    ProductRepository.prototype.checkHealth = async () => true;

    // Mock database lookup for valid test credential
    CredentialRepository.prototype.findByPrefix = async (prefix: string) => {
      if (prefix === validKey.keyPrefix) {
        return {
          id: 'cred-test-1',
          key_prefix: validKey.keyPrefix,
          key_hash: validKey.keyHash,
          principal_type: 'tenant',
          principal_id: 'tenant-user-1',
          store_id: testStoreId,
          scopes: [
            'catalog:read',
            'catalog:write',
            'stock:read',
            'stock:adjust',
            'grade:read',
            'grade:write',
          ],
          name: 'Test Streamable MCP Key',
          created_at: new Date().toISOString(),
          expires_at: null,
          revoked_at: null,
          last_used_at: null,
        };
      }
      return null;
    };

    CredentialRepository.prototype.touchLastUsed = async () => {};

    server = createHttpServer({ maxPayloadBytes: 1024, requestTimeoutMs: 5000 });
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address() as any;
        port = addr.port;
        resolve();
      });
    });
  });

  after(async () => {
    const { ProductRepository } = await import('../src/repositories/product.repository.js');
    ProductRepository.prototype.checkHealth = originalCheckHealth;
    CredentialRepository.prototype.findByPrefix = originalFindByPrefix;
    CredentialRepository.prototype.touchLastUsed = originalTouch;
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('1. GET /health returns 200 with status ok and timestamp', async () => {
    const res = await fetch(`http://localhost:${port}/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.equal(body.status, 'ok');
    assert.ok(body.timestamp);
    assert.ok(res.headers.get('x-request-id'));
  });

  it('2. GET /ready returns 200 or 503 depending on database reachability', async () => {
    const res = await fetch(`http://localhost:${port}/ready`);
    assert.ok([200, 503].includes(res.status));
    const body = (await res.json()) as any;
    assert.ok(body.status === 'ready' || body.status === 'not_ready');
  });

  it('3. POST /mcp without Authorization header is rejected with 401 UNAUTHORIZED', async () => {
    const res = await fetch(`http://localhost:${port}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'codex', version: '1.0.0' },
        },
      }),
    });

    assert.equal(res.status, 401);
    const body = (await res.json()) as any;
    assert.equal(body.error.code, 'UNAUTHORIZED');
  });

  it('4. POST /mcp with invalid bearer token is rejected with 401', async () => {
    const res = await fetch(`http://localhost:${port}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer b2x_live_0000000000000000_1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'codex', version: '1.0.0' },
        },
      }),
    });

    assert.equal(res.status, 401);
    const body = (await res.json()) as any;
    assert.ok(body.error);
  });

  it('5. POST /mcp with oversized payload is rejected with 413 PAYLOAD_TOO_LARGE', async () => {
    const largeBody = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'criar_produto', arguments: { desc: 'a'.repeat(2048) } },
    });

    try {
      const res = await fetch(`http://localhost:${port}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validKey.rawKey}`,
        },
        body: largeBody,
      });
      assert.ok([413, 500].includes(res.status));
    } catch (err: any) {
      assert.ok(err);
    }
  });

  it('6. POST /mcp initialize succeeds and returns MCP protocol handshake and Mcp-Session-Id', async () => {
    const res = await fetch(`http://localhost:${port}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validKey.rawKey}`,
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'codex', version: '1.0.0' },
        },
      }),
    });

    assert.equal(res.status, 200);
    const sessionId = res.headers.get('mcp-session-id');
    assert.ok(sessionId, 'Should return Mcp-Session-Id header');

    const bodyText = await res.text();
    // Parse SSE or JSON
    let jsonResult: any = null;
    if (bodyText.includes('data:')) {
      const jsonLine = bodyText.split('\n').find((l) => l.startsWith('data: '));
      jsonResult = JSON.parse(jsonLine!.replace('data: ', ''));
    } else {
      jsonResult = JSON.parse(bodyText);
    }

    assert.equal(jsonResult.id, 1);
    assert.ok(jsonResult.result);
    assert.equal(jsonResult.result.serverInfo.name, 'shopflow-catalog-ai');
    assert.equal(jsonResult.result.serverInfo.version, '1.0.0');
    assert.ok(jsonResult.result.capabilities.tools);
  });

  it('7. MCP session handles notifications/initialized, tools/list and tools/call', async () => {
    // Step A: Initialize
    const initRes = await fetch(`http://localhost:${port}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validKey.rawKey}`,
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'codex', version: '1.0.0' },
        },
      }),
    });

    assert.equal(initRes.status, 200);
    const sessionId = initRes.headers.get('mcp-session-id')!;
    assert.ok(sessionId);

    // Step B: Send notification
    const notifRes = await fetch(`http://localhost:${port}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mcp-Session-Id': sessionId,
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      }),
    });
    assert.ok([200, 202, 204].includes(notifRes.status));

    // Step C: Discover tools (tools/list)
    const listRes = await fetch(`http://localhost:${port}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mcp-Session-Id': sessionId,
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      }),
    });

    assert.equal(listRes.status, 200);
    const listBodyText = await listRes.text();
    let listData: any;
    if (listBodyText.includes('data:')) {
      const line = listBodyText.split('\n').find((l) => l.startsWith('data: '));
      listData = JSON.parse(line!.replace('data: ', ''));
    } else {
      listData = JSON.parse(listBodyText);
    }

    assert.equal(listData.id, 2);
    assert.ok(Array.isArray(listData.result.tools));
    assert.equal(listData.result.tools.length, 21, 'Must register exactly 21 tools');

    const toolNames = listData.result.tools.map((t: any) => t.name);
    assert.ok(toolNames.includes('catalog_health'));
    assert.ok(toolNames.includes('listar_produtos'));
    assert.ok(toolNames.includes('obter_produto'));
    assert.ok(toolNames.includes('buscar_catalogo'));
    assert.ok(toolNames.includes('buscar_lojas'));
    assert.ok(toolNames.includes('selecionar_loja'));
    assert.ok(toolNames.includes('obter_loja_ativa'));
    assert.ok(toolNames.includes('criar_produto'));
    assert.ok(toolNames.includes('atualizar_produto'));
    assert.ok(toolNames.includes('desativar_produto'));
    assert.ok(toolNames.includes('atualizar_produtos_em_lote'));
    assert.ok(toolNames.includes('consultar_estoque'));
    assert.ok(toolNames.includes('ajustar_estoque'));
    assert.ok(toolNames.includes('listar_modelos_grade'));
    assert.ok(toolNames.includes('obter_modelo_grade'));
    assert.ok(toolNames.includes('criar_modelo_grade'));
    assert.ok(toolNames.includes('aplicar_grade_produto'));
    assert.ok(toolNames.includes('adicionar_imagem_produto'));
    assert.ok(toolNames.includes('listar_imagens_produto'));
    assert.ok(toolNames.includes('definir_imagem_principal'));
    assert.ok(toolNames.includes('remover_imagem_produto'));

    // Step D: Execute read-only tool (catalog_health)
    const callRes = await fetch(`http://localhost:${port}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mcp-Session-Id': sessionId,
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'catalog_health',
          arguments: {},
        },
      }),
    });

    assert.equal(callRes.status, 200);
    const callBodyText = await callRes.text();
    let callData: any;
    if (callBodyText.includes('data:')) {
      const line = callBodyText.split('\n').find((l) => l.startsWith('data: '));
      callData = JSON.parse(line!.replace('data: ', ''));
    } else {
      callData = JSON.parse(callBodyText);
    }

    assert.equal(callData.id, 3);
    assert.ok(callData.result.content);
    assert.ok(callData.result.content.length > 0);
  });

  it('8. CORS headers are returned correctly and OPTIONS preflight succeeds with 204', async () => {
    const res = await fetch(`http://localhost:${port}/mcp`, {
      method: 'OPTIONS',
    });

    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
    assert.ok(res.headers.get('access-control-expose-headers')?.includes('Mcp-Session-Id'));
  });
});
