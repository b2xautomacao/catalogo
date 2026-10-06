/**
 * metrics.ts
 *
 * Sprint 13 — FASE C: Observability & Operational Metrics Collector
 * Collects aggregated counters and latency observations without high cardinality tags.
 */

export interface MetricsSnapshot {
  requests_total: number;
  tool_calls_total: Record<string, number>;
  tool_errors_total: Record<string, number>;
  auth_failures_total: number;
  rate_limited_total: number;
  latencies_ms: number[];
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
}

export class MetricsCollector {
  private static instance: MetricsCollector;

  private requestsTotal = 0;
  private toolCalls: Map<string, number> = new Map();
  private toolErrors: Map<string, number> = new Map();
  private authFailuresTotal = 0;
  private rateLimitedTotal = 0;
  private latencySamples: number[] = [];
  private readonly maxSamples = 1000;

  private constructor() {}

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  recordRequest(): void {
    this.requestsTotal++;
  }

  recordAuthFailure(): void {
    this.authFailuresTotal++;
  }

  recordRateLimited(): void {
    this.rateLimitedTotal++;
  }

  recordToolCall(toolName: string, durationMs: number, isError = false): void {
    const currentCalls = this.toolCalls.get(toolName) || 0;
    this.toolCalls.set(toolName, currentCalls + 1);

    if (isError) {
      const currentErrors = this.toolErrors.get(toolName) || 0;
      this.toolErrors.set(toolName, currentErrors + 1);
    }

    if (this.latencySamples.length >= this.maxSamples) {
      this.latencySamples.shift();
    }
    this.latencySamples.push(durationMs);
  }

  private calculatePercentile(p: number): number {
    if (this.latencySamples.length === 0) return 0;
    const sorted = [...this.latencySamples].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  getSnapshot(): MetricsSnapshot {
    return {
      requests_total: this.requestsTotal,
      tool_calls_total: Object.fromEntries(this.toolCalls.entries()),
      tool_errors_total: Object.fromEntries(this.toolErrors.entries()),
      auth_failures_total: this.authFailuresTotal,
      rate_limited_total: this.rateLimitedTotal,
      latencies_ms: this.latencySamples.slice(-20),
      p50_ms: this.calculatePercentile(50),
      p95_ms: this.calculatePercentile(95),
      p99_ms: this.calculatePercentile(99),
    };
  }

  reset(): void {
    this.requestsTotal = 0;
    this.toolCalls.clear();
    this.toolErrors.clear();
    this.authFailuresTotal = 0;
    this.rateLimitedTotal = 0;
    this.latencySamples = [];
  }
}
