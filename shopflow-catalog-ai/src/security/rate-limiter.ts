/**
 * rate-limiter.ts
 *
 * Sprint 13 — FASE B: Rate Limits & Resilience
 * Sliding-window rate limiter by principal/credential (and IP fallback) with tiered risk limits.
 */

export type RiskTier = 'READ' | 'WRITE' | 'SENSITIVE_WRITE';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const DEFAULT_RATE_LIMITS: Record<RiskTier, RateLimitConfig> = {
  READ: { windowMs: 60 * 1000, maxRequests: 120 }, // 120 requests/minute
  WRITE: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests/minute
  SENSITIVE_WRITE: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 requests/minute (bulk, ledger adjustments, grade application)
};

export const TOOL_RISK_TIERS: Record<string, RiskTier> = {
  catalog_health: 'READ',
  listar_produtos: 'READ',
  obter_produto: 'READ',
  buscar_catalogo: 'READ',
  buscar_lojas: 'READ',
  obter_loja_ativa: 'READ',
  consultar_estoque: 'READ',
  listar_modelos_grade: 'READ',
  obter_modelo_grade: 'READ',

  criar_produto: 'WRITE',
  atualizar_produto: 'WRITE',
  desativar_produto: 'WRITE',
  selecionar_loja: 'WRITE',
  criar_modelo_grade: 'WRITE',

  ajustar_estoque: 'SENSITIVE_WRITE',
  atualizar_produtos_em_lote: 'SENSITIVE_WRITE',
  aplicar_grade_produto: 'SENSITIVE_WRITE',
};

interface RateRecord {
  timestamps: number[];
}

export class RateLimiter {
  private records: Map<string, RateRecord> = new Map();
  private limits: Record<RiskTier, RateLimitConfig>;

  constructor(customLimits: Partial<Record<RiskTier, RateLimitConfig>> = {}) {
    this.limits = {
      ...DEFAULT_RATE_LIMITS,
      ...customLimits,
    };
  }

  /**
   * Check if a request for a specific key and tool/tier is allowed.
   */
  check(
    key: string,
    toolNameOrTier: string | RiskTier
  ): {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetSeconds: number;
  } {
    const tier: RiskTier =
      (TOOL_RISK_TIERS[toolNameOrTier] as RiskTier) ||
      (toolNameOrTier in this.limits ? (toolNameOrTier as RiskTier) : 'READ');

    const config = this.limits[tier];
    const compositeKey = `${key}:${tier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let record = this.records.get(compositeKey);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(compositeKey, record);
    }

    // Filter out timestamps outside current sliding window
    record.timestamps = record.timestamps.filter((t) => t > windowStart);

    if (record.timestamps.length >= config.maxRequests) {
      const oldestInWindow = record.timestamps[0];
      const resetMs = oldestInWindow + config.windowMs - now;
      const resetSeconds = Math.max(1, Math.ceil(resetMs / 1000));
      return {
        allowed: false,
        remaining: 0,
        limit: config.maxRequests,
        resetSeconds,
      };
    }

    // Register this request timestamp
    record.timestamps.push(now);

    const remaining = config.maxRequests - record.timestamps.length;
    return {
      allowed: true,
      remaining,
      limit: config.maxRequests,
      resetSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  /**
   * Reset all records (useful in test suites)
   */
  reset(): void {
    this.records.clear();
  }
}
