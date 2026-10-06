# MCP Authentication, Multi-Agent Identity & Delegated Access

## 1. Overview
The Multi-Agent Identity model provides granular, least-privilege delegated access to autonomous agents and external integrations without compromising store security or privilege boundaries.

## 2. Granular Scopes
- `catalog:read`: Search and view products, categories, and catalog status.
- `catalog:write`: Create, edit, and deactivate products, and execute bulk operations.
- `stock:read`: Query inventory levels, stock by size/color, and ledger movements.
- `stock:adjust`: Post stock count and increase/decrease ledger adjustments.
- `grade:read`: List and inspect system and custom grade templates.
- `grade:write`: Create grade templates and apply grade snapshots to products.
- `store:list`: Discover authorized stores.
- `store:select`: Select and activate a store context (required for superadmins).

## 3. Delegation & Privilege Escalation Guards
- A delegating identity can only generate credentials possessing a strict subset of its own granted scopes.
- Store isolation is enforced: a tenant cannot grant access to stores beyond its authorized store list.
- Credentials support expiration (`expires_at`) and immediate revocation (`is_active = false`).

## 4. Secret Security & Audit Logging
- API credentials use secure hashing (`sha256`); raw secret tokens are never stored in the database.
- Context and session objects never expose raw keys.
- Authentication failures, scope denials, and store access violations generate structured audit events without logging secrets.
