# Production Runbook — B2XCATALOGO & Shopflow Catalog AI

## 1. Starting & Managing Services

### Running Remote MCP Runtime
```bash
# Build production bundle
npm run build

# Start HTTP server
RUN_HTTP_SERVER=true MCP_PORT=3000 node dist/server-http.js
```

### Docker Container Management
```bash
# Build container
docker build -t shopflow-catalog-ai:latest .

# Run container with environment configuration
docker run -d \
  -p 3000:3000 \
  -e SUPABASE_URL="https://your-project.supabase.co" \
  -e SUPABASE_ANON_KEY="your-anon-key" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  --name shopflow-catalog-ai \
  shopflow-catalog-ai:latest
```

## 2. Health, Readiness & Metrics Verification
- **Liveness:** `curl -i http://localhost:3000/health` (Returns HTTP 200 `{ status: "ok" }`)
- **Readiness:** `curl -i http://localhost:3000/ready` (Returns HTTP 200 `{ status: "ready", database: "connected" }`)
- **Metrics:** `curl -i http://localhost:3000/metrics` (Returns aggregated request counts, error counts, and latency percentiles)

## 3. Credential Administration
- **Create Store Admin Credential:** `npm run api-key:create -- --store-id <UUID> --name "Admin Bot" --scopes "catalog:read,catalog:write,stock:read,stock:adjust,grade:read,grade:write"`
- **Create Least-Privilege Inventory Credential:** `npm run api-key:create -- --store-id <UUID> --name "Warehouse Scanner" --scopes "stock:read,stock:adjust"`

## 4. Emergency Procedures
- **Disable Remote MCP Access:** Stop the container (`docker stop shopflow-catalog-ai`) or revoke active API keys.
- **Rollback Deployment:** Re-deploy previous Docker image tag or checkout previous release commit.
