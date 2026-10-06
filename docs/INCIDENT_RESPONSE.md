# Production Incident Response Runbook

## 1. Overview
This document defines procedures for triaging, mitigating, and resolving production incidents in B2XCATALOGO and Shopflow Catalog AI.

## 2. Standard Incident Scenarios & Procedures

### Scenario A: Compromised / Leaked API Credential
1. **Identify Key Prefix:** Locate the 16-hex prefix from logs or reporting.
2. **Immediate Revocation:** Execute SQL or CLI revocation:
   ```sql
   UPDATE api_credentials SET revoked_at = NOW(), is_active = false WHERE key_prefix = '<prefix>';
   ```
3. **Audit Inspection:** Review `agent_audit_logs` for any unauthorized operations executed using the compromised key prefix.
4. **Issue Replacement:** Generate a new credential for the store administrator with least privilege scopes.

### Scenario B: Cross-Tenant Access Anomaly
1. **Triage:** Check `agent_audit_logs` and structured error logs for `STORE_ACCESS_DENIED` or `PRODUCT_NOT_FOUND` spikes.
2. **Verify Session Isolation:** Ensure requests are being properly routed with distinct `Authorization` headers.
3. **Emergency Circuit Breaker:** If necessary, rotate credentials or temporarily deactivate the affected store account.

### Scenario C: Stock Mismatch / Ledger Inconsistency
1. **Ledger Verification:** Run canonical reconciliation query comparing `SUM(movement_quantity)` against `product_variations.stock`.
2. **Audit Source Types:** Inspect `stock_movements.source_type` to identify if manual adjustments, order pickings, or external integrations caused the drift.
3. **Canonical Count Adjustment:** Execute `apply_stock_adjustment` with `operation = 'count'` and `source_type = 'system_reconciliation'`.

### Scenario D: Remote MCP Runtime Unavailable / Database Outage
1. **Probe Inspection:** Query `GET /health` and `GET /ready`. If `/ready` returns HTTP 503, inspect Supabase connection pool and network routing.
2. **Restart Container:** Execute graceful restart: `docker restart <container_name>`.
3. **Fallback to STDIO:** Autonomous local agents can continue operation via local STDIO transport.
