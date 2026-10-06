# Remote MCP Runtime & Transport Architecture

## 1. Overview
Shopflow Catalog AI supports both local STDIO transport (for local developer tooling and CLI agents) and remote HTTP/JSON-RPC transport (for multi-tenant and multi-agent remote infrastructure).

## 2. Shared Domain & Zero Business Logic Duplication
All tools, domain services (`CatalogService`, `StoreService`, `InventoryService`, `GradeService`), repositories, and validation schemas are shared identically between `src/index.ts` (STDIO) and `src/server-http.ts` (HTTP/Remote).

## 3. Session Isolation & Context Lifecycle
- Each remote HTTP request receives a dedicated `AgentSession` context bound to its authenticated Bearer token and unique `x-request-id`.
- No global variables are used for tenant or active store state.
- Session A (Store A) and Session B (Store B) running concurrently maintain strict tenant isolation.

## 4. Operational Endpoints
- `GET /health`: Liveness probe returning HTTP 200 `{ status: "ok", timestamp: "..." }`.
- `GET /ready`: Readiness probe verifying database and core connectivity, returning HTTP 200 `{ status: "ready" }` or HTTP 503 `{ status: "not_ready" }`.

## 5. Security & Error Masking
- Authentication is strictly required via `Authorization: Bearer <b2x_api_key>`.
- Internal stack traces and database schema specifics are masked from client responses.
- Enforces payload size limits (1MB) and configurable request timeouts.
- Containerized via multi-stage `Dockerfile`.
