# Release Candidate Checklist — B2XCATALOGO & Shopflow Catalog AI

## 1. Security & Multi-Tenant Isolation
- [x] Dual tenant guard enforced on all repository and database writes (`WHERE id = :id AND store_id = :store_id`).
- [x] Zero service role keys or secret strings present in the frontend bundle.
- [x] All `SECURITY DEFINER` PostgreSQL functions hardened with explicit `search_path = public, pg_temp`.
- [x] Timing-safe SHA256 API key hashing with immediate revocation checks.
- [x] Automatic secret and credential redaction in all logging channels.
- [x] Rate limiting enforced with risk tiers (`READ`: 120/min, `WRITE`: 60/min, `SENSITIVE_WRITE`: 20/min).

## 2. Domain & Data Integrity
- [x] Physical vs commercial pack stock semantics strictly maintained across ledger and matrix.
- [x] Normalized grade templates with immutable snapshots and child traces preserved.
- [x] Bulk catalog operations protected with closed allowlists and mandatory `operation_id` idempotency.
- [x] Non-destructive variation reconciliation preserving historical IDs and ledger balance history.
- [x] Tiered pricing models validated and constrained (maximum 4 price tiers, non-overlapping minimum quantities).

## 3. Runtime & Observability
- [x] Dual transport verified: local STDIO transport and remote HTTP/JSON-RPC transport.
- [x] Session isolation verified: concurrent Store A and Store B sessions execute with zero cross-tenant contamination.
- [x] Liveness (`/health`), Readiness (`/ready`), and Metrics (`/metrics`) endpoints operational.
- [x] Multi-stage Docker container build and healthcheck verified.

## 4. Test Verification
- [x] Frontend unit and domain tests: **61/61 PASSING** (0 failures).
- [x] MCP server and integration tests: **135+/135+ PASSING** (0 failures).
- [x] Frontend production build (`tsc -b && vite build`): **CLEAN (0 errors)**.
- [x] MCP production build (`tsc`): **CLEAN (0 errors)**.
