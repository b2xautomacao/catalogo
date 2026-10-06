import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RateLimiter, TOOL_RISK_TIERS } from '../src/security/rate-limiter.js';

describe('Sprint 13 — FASE B: Rate Limiting & Risk Tiers', () => {
  it('1. Tool risk tiers are properly mapped to READ, WRITE, and SENSITIVE_WRITE', () => {
    assert.equal(TOOL_RISK_TIERS['listar_produtos'], 'READ');
    assert.equal(TOOL_RISK_TIERS['buscar_catalogo'], 'READ');
    assert.equal(TOOL_RISK_TIERS['criar_produto'], 'WRITE');
    assert.equal(TOOL_RISK_TIERS['atualizar_produto'], 'WRITE');
    assert.equal(TOOL_RISK_TIERS['ajustar_estoque'], 'SENSITIVE_WRITE');
    assert.equal(TOOL_RISK_TIERS['atualizar_produtos_em_lote'], 'SENSITIVE_WRITE');
    assert.equal(TOOL_RISK_TIERS['aplicar_grade_produto'], 'SENSITIVE_WRITE');
  });

  it('2. RateLimiter permits requests within threshold and decrements remaining quota', () => {
    const limiter = new RateLimiter({
      READ: { windowMs: 60000, maxRequests: 3 },
    });

    const check1 = limiter.check('principal-1', 'listar_produtos');
    assert.equal(check1.allowed, true);
    assert.equal(check1.remaining, 2);

    const check2 = limiter.check('principal-1', 'listar_produtos');
    assert.equal(check2.allowed, true);
    assert.equal(check2.remaining, 1);

    const check3 = limiter.check('principal-1', 'listar_produtos');
    assert.equal(check3.allowed, true);
    assert.equal(check3.remaining, 0);

    // 4th request exceeds maxRequests = 3
    const check4 = limiter.check('principal-1', 'listar_produtos');
    assert.equal(check4.allowed, false);
    assert.equal(check4.remaining, 0);
    assert.ok(check4.resetSeconds > 0);
  });

  it('3. Rate limits are isolated per principal key and per risk tier', () => {
    const limiter = new RateLimiter({
      READ: { windowMs: 60000, maxRequests: 2 },
      WRITE: { windowMs: 60000, maxRequests: 2 },
    });

    // Exhaust READ limit for principal-1
    limiter.check('principal-1', 'listar_produtos');
    limiter.check('principal-1', 'listar_produtos');
    const checkReadBlocked = limiter.check('principal-1', 'listar_produtos');
    assert.equal(checkReadBlocked.allowed, false);

    // principal-1 can still perform WRITE operations
    const checkWriteAllowed = limiter.check('principal-1', 'criar_produto');
    assert.equal(checkWriteAllowed.allowed, true);

    // principal-2 is unaffected by principal-1 rate limit
    const checkPrincipal2 = limiter.check('principal-2', 'listar_produtos');
    assert.equal(checkPrincipal2.allowed, true);
  });
});
