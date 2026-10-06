# Production Security & Observability Blueprint

## 1. Threat Model & Mitigations
- **Cross-Tenant Access / IDOR:** Prevented via dual-tenant checks (`WHERE id = :id AND store_id = :active_store_id`), PostgreSQL RLS, and explicit store scope validation. Cross-tenant queries return `NOT_FOUND` to prevent resource enumeration.
- **Scope Escalation:** Strict Zod input schemas, runtime `requireScope()` guards on each tool/service method, and delegation rules restricting sub-credential creation to subsets of authorized scopes.
- **Credential Theft & Replay:** Hashes timing-safe comparison (`crypto.timingSafeEqual`), minimum 64-hex entropy, expiration checks, and immediate revocation.
- **Mass Assignment:** All write APIs, bulk updates, and grade assignments enforce closed allowlists (`.strict()`). Sensitive fields (`stock`, `store_id`, `id`) are strictly rejected.
- **SQL Injection:** Zero raw SQL queries; all operations use parameterized Supabase queries or vetted RPCs with explicit `search_path = public, pg_temp`.
- **Request Flooding & Abuse:** Tiered rate limiting per principal:
  - `READ`: 120 req/min
  - `WRITE`: 60 req/min
  - `SENSITIVE_WRITE`: 20 req/min
- **Secret Leakage:** Automatic redaction of Authorization headers, API keys, and JWTs across all logging pipelines.

## 2. Observability Architecture
- **Structured JSON Logging:** Every HTTP request and MCP tool execution produces a JSON log entry correlated with `request_id` and `session_id`.
- **Telemetry & Metrics:** Aggregated counters for `requests_total`, `tool_calls_total`, `tool_errors_total`, `auth_failures_total`, `rate_limited_total`, along with latency percentiles (`p50`, `p95`, `p99`). Exposed via `GET /metrics`.
- **Health Probes:**
  - `GET /health`: Lightweight liveness check (200 OK).
  - `GET /ready`: Dependency readiness probe with 1000ms timeout guard verifying database connectivity.
