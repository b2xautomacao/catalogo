# Bulk Catalog Operations Architecture & Specification

## 1. Overview
The Bulk Catalog Operations subsystem provides secure, transactional, idempotent batch updates to product catalog attributes without risking mass assignment vulnerabilities or inventory integrity.

## 2. Strict Allowlist vs Prohibited Fields
To guarantee that sensitive systems (such as the inventory ledger, variation matrix, grade snapshots, and multi-tenant security) remain uncorrupted, updates are gated by a strict schema allowlist:

### Allowed Fields
- `is_active`: boolean (activate / deactivate)
- `category`: string
- `category_id`: UUID
- `material`: string
- `product_gender`: 'masculino' | 'feminino' | 'unissex' | 'infantil'
- `product_category_type`: 'calcado' | 'roupa_superior' | 'roupa_inferior' | 'acessorio'
- `is_featured`: boolean
- `retail_price`: numeric (>= 0)
- `wholesale_price`: numeric (>= 0)
- `min_wholesale_qty`: integer (>= 1)

### Prohibited Fields
- `stock` / `reserved_stock` (must be mutated exclusively via the canonical Inventory Ledger)
- `grade composition` / `snapshots` (must be mutated via Grade Engine)
- `variations` / `variation deletion`
- `store_id` / `owner_id` (immutable tenant boundary)
- `id` / `created_at` / `api credentials`

## 3. Idempotency & Operation ID
Every batch operation requires a client-generated `operation_id` (minimum 8 characters).
- Retries with the same `operation_id` verify past execution in `audit_logs` and return without duplicate writes.
- Partial failures and cross-tenant attempts report explicit counts (`success_count`, `failed_count`, `skipped_count`).

## 4. MCP Parity
The tool `atualizar_produtos_em_lote` enforces scope `catalog:write`, validates against `BulkUpdateProductsSchema`, and executes within the caller's `activeStoreId`.
