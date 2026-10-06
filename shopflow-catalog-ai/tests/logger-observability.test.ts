import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redactSecrets } from '../src/observability/logger.js';
import { MetricsCollector } from '../src/observability/metrics.js';

describe('Sprint 13 — FASE C: Observability, Metrics & Secret Redaction', () => {
  it('1. redactSecrets eliminates raw API keys, Bearer tokens, and JWTs from string representations', () => {
    const rawApiKey = 'b2x_live_0123456789abcdef_112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00';
    const authHeader = 'Bearer super_secret_token_12345';
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignature';

    const testLog = `Request received with Auth: ${authHeader}, Key: ${rawApiKey}, and Token: ${jwt}`;
    const sanitized = redactSecrets(testLog);

    assert.equal(sanitized.includes('super_secret_token_12345'), false);
    assert.equal(sanitized.includes('112233445566778899aabbccddeeff00'), false);
    assert.equal(sanitized.includes('doNotLeakThisSignature'), false);
    assert.ok(sanitized.includes('Bearer [REDACTED]'));
    assert.ok(sanitized.includes('b2x_live_[REDACTED]'));
  });

  it('2. MetricsCollector tracks counters, latency samples, and computes percentiles (p50, p95)', () => {
    const metrics = MetricsCollector.getInstance();
    metrics.reset();

    metrics.recordRequest();
    metrics.recordRequest();
    metrics.recordAuthFailure();
    metrics.recordRateLimited();

    metrics.recordToolCall('listar_produtos', 15);
    metrics.recordToolCall('listar_produtos', 25);
    metrics.recordToolCall('listar_produtos', 100);
    metrics.recordToolCall('criar_produto', 50, true);

    const snapshot = metrics.getSnapshot();
    assert.equal(snapshot.requests_total, 2);
    assert.equal(snapshot.auth_failures_total, 1);
    assert.equal(snapshot.rate_limited_total, 1);
    assert.equal(snapshot.tool_calls_total['listar_produtos'], 3);
    assert.equal(snapshot.tool_errors_total['criar_produto'], 1);
    assert.ok(snapshot.p50_ms >= 15);
    assert.ok(snapshot.p95_ms >= 50);
  });
});
