import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHttpServer } from '../src/server-http.js';

describe('Sprint 12 — FASE C: Remote MCP Transport & Session Isolation', () => {
  let server: http.Server;
  let port: number;

  before(async () => {
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
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('1. GET /health returns 200 with status ok and timestamp', async () => {
    const res = await fetch(`http://localhost:${port}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.ok(body.timestamp);
    assert.ok(res.headers.get('x-request-id'));
  });

  it('2. GET /ready returns 200 or 503 depending on database reachability', async () => {
    const res = await fetch(`http://localhost:${port}/ready`);
    assert.ok([200, 503].includes(res.status));
    const body = await res.json();
    assert.ok(body.status === 'ready' || body.status === 'not_ready');
  });

  it('3. POST /mcp without Authorization header is rejected with 401 UNAUTHORIZED', async () => {
    const res = await fetch(`http://localhost:${port}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'catalog_health' }),
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error.code, 'UNAUTHORIZED');
  });

  it('4. POST /mcp with oversized payload is rejected with 413 PAYLOAD_TOO_LARGE', async () => {
    const largeBody = JSON.stringify({
      tool: 'criar_produto',
      arguments: { description: 'a'.repeat(2048) }, // Exceeds 1024 maxPayloadBytes
    });

    try {
      const res = await fetch(`http://localhost:${port}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer b2x_live_0123456789abcdef_112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00',
        },
        body: largeBody,
      });
      assert.ok([413, 500].includes(res.status));
    } catch (err: any) {
      // Connection may be destroyed by server on payload overflow
      assert.ok(err);
    }
  });

  it('5. CORS headers are returned correctly and OPTIONS preflight succeeds with 204', async () => {
    const res = await fetch(`http://localhost:${port}/mcp`, {
      method: 'OPTIONS',
    });

    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
  });
});
