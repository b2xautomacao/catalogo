/**
 * logger.ts
 *
 * Sprint 13 — FASE C: Structured Logging & Secret Redaction
 * Formats operational logs as structured JSON with mandatory secret redaction.
 */

export function redactSecrets(input: string): string {
  if (!input) return '';
  return input
    .replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
    .replace(/b2x_live_[0-9a-fA-F]{16}_[0-9a-fA-F]+/g, 'b2x_live_[REDACTED]')
    .replace(/eyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/g, '[REDACTED_JWT]');
}

export interface StructuredLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  request_id?: string;
  session_id?: string;
  principal_id?: string;
  principal_type?: string;
  tool?: string;
  duration_ms?: number;
  status?: string;
  error_code?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export class Logger {
  static log(entry: StructuredLogEntry): void {
    const rawJson = JSON.stringify({
      timestamp: entry.timestamp || new Date().toISOString(),
      level: entry.level,
      request_id: entry.request_id || null,
      session_id: entry.session_id || null,
      principal_id: entry.principal_id || null,
      principal_type: entry.principal_type || null,
      tool: entry.tool || null,
      duration_ms: typeof entry.duration_ms === 'number' ? entry.duration_ms : null,
      status: entry.status || null,
      error_code: entry.error_code || null,
      message: entry.message || null,
      metadata: entry.metadata || null,
    });

    const redacted = redactSecrets(rawJson);
    if (entry.level === 'error') {
      console.error(redacted);
    } else if (entry.level === 'warn') {
      console.warn(redacted);
    } else {
      console.log(redacted);
    }
  }

  static info(message: string, context: Partial<StructuredLogEntry> = {}): void {
    this.log({ timestamp: new Date().toISOString(), level: 'info', message, ...context });
  }

  static warn(message: string, context: Partial<StructuredLogEntry> = {}): void {
    this.log({ timestamp: new Date().toISOString(), level: 'warn', message, ...context });
  }

  static error(message: string, context: Partial<StructuredLogEntry> = {}): void {
    this.log({ timestamp: new Date().toISOString(), level: 'error', message, ...context });
  }
}
