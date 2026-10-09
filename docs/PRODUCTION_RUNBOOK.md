# Production Runbook — B2XCATALOGO & Shopflow Catalog AI

## 1. Topologia EasyPanel & Roteamento de Produção

### Topologia de Serviços:
```text
mcp.gargalozero.com.br
        ↓
B2XCATALOGO-MCP (porta interna 3000)
        ↓
Streamable HTTP Runtime (/mcp)

catalogo.gargalozero.com.br (ou domínio principal)
        ↓
B2XCATALOGO-WEB (porta interna 80)
        ↓
Nginx / Vite SPA
```

### Configuração no EasyPanel & Precedência de Wildcards:
1. No serviço **`B2XCATALOGO-MCP`**:
   - Adicionar o domínio dedicado `mcp.gargalozero.com.br`.
   - Configurar a porta interna para `3000`.
   - Garantir que o container está ativo e com status *healthy*.
   - **Precedência:** No proxy reverso (Traefik/EasyPanel), rotas de host explícitas (`mcp.gargalozero.com.br`) possuem prioridade estrita de matching sobre regras wildcard (`*.gargalozero.com.br`).
2. No serviço **`B2XCATALOGO-WEB`**:
   - Manter os domínios do frontend / catálogo e os wildcards de lojas (`*.gargalozero.com.br` e `*.aoseudispor.com.br`).
   - Remover qualquer menção explícita de `mcp.gargalozero.com.br` deste container.
   - O frontend conta com a política central de hosts (`src/lib/platformHosts.ts`), impedindo que qualquer requisição residual tente consultar stores por slug reservado.

---

## 2. Starting & Managing Services

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

---

## 3. Health, Readiness & Metrics Verification
- **Liveness:** `curl -i http://localhost:3000/health` (Retorna HTTP 200 `{ status: "ok" }`)
- **Readiness:** `curl -i http://localhost:3000/ready` (Retorna HTTP 200 `{ status: "ready", database: "connected" }`)
- **Metrics:** `curl -i http://localhost:3000/metrics` (Retorna métricas operacionais consolidadas)

---

## 4. MCP Streamable HTTP Handshake Verification
```bash
# Teste de Inicialização MCP via Streamable HTTP:
curl -i -X POST https://mcp.gargalozero.com.br/mcp \
  -H "Authorization: Bearer <B2X_API_KEY>" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
```
*Resposta esperada:* HTTP 200 com header `Mcp-Session-Id` e JSON-RPC de inicialização com capabilities e serverInfo `shopflow-catalog-ai`.

---

## 5. Credential Administration
- **Create Store Admin Credential:** `npm run api-key:create -- --store-id <UUID> --name "Admin Bot" --scopes "catalog:read,catalog:write,stock:read,stock:adjust,grade:read,grade:write"`
- **Create Least-Privilege Inventory Credential:** `npm run api-key:create -- --store-id <UUID> --name "Warehouse Scanner" --scopes "stock:read,stock:adjust"`

---

## 6. Emergency Procedures
- **Disable Remote MCP Access:** Parar o container (`docker stop shopflow-catalog-ai`) ou revogar chaves via UI/banco.
- **Rollback Deployment:** Re-deploy da imagem anterior ou checkout do commit anterior.
