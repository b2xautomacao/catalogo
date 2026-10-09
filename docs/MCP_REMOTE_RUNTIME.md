# Remote MCP Runtime & Transport Architecture

## 1. Overview
Shopflow Catalog AI supports both local STDIO transport (for local developer tooling and CLI agents) and remote Streamable HTTP / JSON-RPC transport (for multi-tenant, multi-agent remote infrastructure and Codex integration).

## 2. Canonical Endpoint
- **URL do Servidor MCP:** `https://mcp.gargalozero.com.br/mcp`
- **Transporte Oficial:** MCP Streamable HTTP (SDK `@modelcontextprotocol/server@2.3.0` via `WebStandardStreamableHTTPServerTransport`).
- **Porta Interna do Container:** `3000` (`MCP_PORT=3000`).

## 3. Protocol Flow & Session Lifecycle
- **Handshake Inicial:** Requisição `POST /mcp` com `method: "initialize"` e cabeçalho `Authorization: Bearer <b2x_api_key>`.
- **Identificador de Sessão:** O servidor responde com o header `Mcp-Session-Id: <UUID>` e o resultado do handshake contendo capabilities e informações do servidor.
- **Requisições Subsequentes:** O cliente envia `Mcp-Session-Id: <UUID>` em chamadas subsequentes (`notifications/initialized`, `tools/list`, `tools/call`).
- **Encerramento:** Ao receber `DELETE /mcp` com `Mcp-Session-Id`, a sessão e seus recursos em memória são desalocados imediatamente.
- **Sessões Inativas:** Limpeza automática de sessões inativas após 30 minutos sem requisições.

## 4. Shared Domain & Zero Business Logic Duplication
Todas as 21 ferramentas, serviços de domínio (`CatalogService`, `StoreService`, `InventoryService`, `GradeService`, `ProductMediaService`), repositórios e validações Zod são compartilhados identicamente entre `src/index.ts` (STDIO) e `src/server-http.ts` (Streamable HTTP).

### Ferramentas Registradas (21):
1. `catalog_health`
2. `listar_produtos`
3. `obter_produto`
4. `buscar_catalogo`
5. `buscar_lojas`
6. `selecionar_loja`
7. `obter_loja_ativa`
8. `criar_produto`
9. `atualizar_produto`
10. `desativar_produto`
11. `atualizar_produtos_em_lote`
12. `consultar_estoque`
13. `ajustar_estoque`
14. `listar_modelos_grade`
15. `obter_modelo_grade`
16. `criar_modelo_grade`
17. `aplicar_grade_produto`
18. `adicionar_imagem_produto`
19. `listar_imagens_produto`
20. `definir_imagem_principal`
21. `remover_imagem_produto`

## 5. Session Isolation & Context Lifecycle
- Cada sessão remota recebe um contexto `AgentSession` dedicado, isolado e vinculado ao token autenticado.
- Não existem variáveis globais para estado de tenant ou loja ativa.
- Sessão A (Loja A) e Sessão B (Loja B) em execução simultânea mantêm isolamento rigoroso.

## 6. Endpoints Operacionais
- `GET /health`: Liveness probe retornando HTTP 200 `{ status: "ok", timestamp: "..." }`.
- `GET /ready`: Readiness probe verificando banco e conectividade, retornando HTTP 200 `{ status: "ready" }` ou HTTP 503 `{ status: "not_ready" }`.
- `GET /metrics`: Métricas consolidadas de requisições, chamadas de tools e taxa de erro.

## 7. Configuração do Cliente Codex
Exemplo sanitizado de configuração no Codex:

```toml
[mcp_servers.b2xcatalogo]
url = "https://mcp.gargalozero.com.br/mcp"
bearer_token_env_var = "B2X_MCP_TOKEN"
```

## 8. Troubleshooting: Erro 405 Method Not Allowed / text/html
- **Sintoma:** Ao disparar `POST https://mcp.gargalozero.com.br/mcp`, o cliente recebe `HTTP 405 Method Not Allowed` com `Content-Type: text/html` e corpo HTML do Nginx / SPA do frontend.
- **Causa Raiz:** O domínio `mcp.gargalozero.com.br` está associado no proxy reverso (EasyPanel) ao container `B2XCATALOGO-WEB` (porta 80) em vez do container `B2XCATALOGO-MCP` (porta 3000). O Nginx estático recusa POST para `/index.html` e retorna 405.
- **Solução:** No EasyPanel, mover o domínio `mcp.gargalozero.com.br` para o serviço `B2XCATALOGO-MCP` apontando para a porta `3000`.
