# shopflow-catalog-ai

Servidor MCP (*Model Context Protocol*) projetado para expor o catálogo e o inventário do B2XCATALOGO com segurança e isolamento multi-tenant rigoroso para agentes de IA (Grok, Claude, Antigravity, etc.).

## Objetivo
Atua como uma ponte controlada e segura entre agentes de IA e o banco de dados Supabase da plataforma, isolando rigorosamente os dados (*Tenant Guard*) para garantir que a IA acesse estritamente as lojas, catálogos, estoques e modelos de grade autorizados.

## Arquitetura
- **Protocolo:** MCP (Model Context Protocol) TypeScript SDK v2 (`@modelcontextprotocol/server`) via STDIO (`serveStdio`).
- **Linguagem / Runtime:** TypeScript + Node.js (ES Modules nativo).
- **Segurança & Tenant Guard:** A camada de contexto injeta obrigatoriamente a loja ativa (`activeStoreId`) em qualquer consulta ou mutação. O LLM nunca manipula IDs de tenant diretamente como parâmetro de ferramentas.
- **Isolamento de Sessão:** Cada conexão/cliente opera em sua própria instância de `AgentSession`, impedindo qualquer vazamento de estado de loja ativa entre diferentes sessões.

---

## Princípios Fundamentais

1. **`Search ≠ Select` (Busca NÃO é Seleção):**
   - O comando `buscar_lojas` serve apenas para descoberta/desambiguação de lojas candidatas.
   - Mesmo que a busca retorne exatamente 1 resultado, o `activeStoreId` **não** é alterado automaticamente. A ferramenta `selecionar_loja` deve ser chamada explicitamente com o identificador inequívoco.
2. **`activeStoreId ≠ Authorization` (Loja Ativa NÃO é Autorização):**
   - Ter um `activeStoreId` definido indica apenas qual loja está em foco na sessão atual.
   - Toda operação de seleção valida rigorosamente `canAccessStore(context, storeId)` contra a política de `StoreAccess` (`all` vs `restricted`).
3. **`Template ≠ Snapshot` (Modelo de Grade NÃO é Grade do Produto):**
   - Um modelo de grade (`grade_templates`) define a composição de uma grade (tamanhos e quantidades por caixa).
   - Ao aplicar uma grade a um produto (`aplicar_grade_produto`), é criado um **Snapshot Imutável** (`product_grade_snapshots` e `product_grade_snapshot_items`) que preserva a composição exata da caixa no momento da aplicação.
   - Alterações posteriores no modelo não afetam retroativamente os produtos já cadastrados.
4. **`Grade ≠ Stock` (Aplicação de Grade NÃO Altera Estoque):**
   - A criação e aplicação de grade geram variações com **estoque inicial rigorosamente zero**.
   - Qualquer entrada ou contagem de estoque é executada exclusivamente através de `ajustar_estoque` com registro no ledger histórico.

---

## Modos de Autenticação (`MCP_AUTH_MODE`)

O servidor suporta dois modos operacionais configuráveis via `.env`:

### 1. Modo `single_tenant` (Desenvolvimento Local / Bot Dedicado)
Neste modo, a identidade do tenant é definida estaticamente via variável de ambiente:
```env
MCP_AUTH_MODE=single_tenant
MCP_STORE_ID=<uuid-da-loja>
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_SECRET_KEY=<service-role-key>
```

### 2. Modo `authenticated` (Multi-Tenant com API Keys)
Neste modo, a identidade, escopos e tenant ativo são resolvidos dinamicamente através de uma API Key criptograficamente segura:
```env
MCP_AUTH_MODE=authenticated
B2X_API_KEY=b2x_live_<prefix>_<secret>
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_SECRET_KEY=<service-role-key>
```

---

## Geração de API Keys (CLI Administrativo)

As chaves são geradas via CLI seguro e armazenadas **somente** com hash SHA-256 e prefixo para lookup constante:

### Escopos Disponíveis (`ALLOWED_SCOPES`):
- `catalog:read`: Consulta produtos e catálogo.
- `catalog:write`: Criação, atualização e desativação lógica de produtos.
- `stock:read`: Consulta de inventário e reconciliação física.
- `stock:adjust`: Ajustes manuais de estoque e contagem física (ledger).
- `grade:read`: Listagem e consulta de modelos de grade (canônicos e customizados).
- `grade:write`: Criação de modelos customizados e aplicação de grade a produtos.
- `store:list`: Listagem e busca de lojas.
- `store:select`: Seleção de loja ativa na sessão.

### Exemplo de Criação de Chave:
```bash
npm run api-key:create -- --type tenant --store <store_uuid> --name "Grok Agent" --scopes catalog:read,catalog:write,stock:read,stock:adjust,grade:read,grade:write,store:list
```

---

## Instalação e Execução

```bash
# Instalação de dependências
npm install

# Testes automatizados (98 testes passando)
npm test

# Compilação TypeScript
npm run build

# Execução em Produção
npm start

# Execução em Desenvolvimento (com hot reload via tsx)
npm run dev
```

---

## Ferramentas Disponíveis (Total: 15 Tools)

### Descoberta & Sessão Multi-Tenant (3 Tools)
1. `buscar_lojas`: Busca lojas por nome/slug dentro do universo autorizado. *(Requer `store:list`)*
2. `selecionar_loja`: Ativa explicitamente uma loja para a sessão atual. *(Requer `store:select`)*
3. `obter_loja_ativa`: Retorna informações sobre a loja atualmente ativa na sessão. *(Requer `store:list`)*

### Catálogo — Leitura & Escrita Segura (6 Tools)
4. `catalog_health`: Diagnóstico de conectividade e contexto. *(Requer `catalog:read`)*
5. `listar_produtos`: Consulta paginada de produtos com filtros. *(Requer `catalog:read`)*
6. `obter_produto`: Consulta detalhada de produto (fotos e variações). *(Requer `catalog:read`)*
7. `criar_produto`: Cria um novo produto na loja ativa (sem alterar estoque). *(Requer `catalog:write`)*
8. `atualizar_produto`: Atualiza dados permitidos de um produto. *(Requer `catalog:write`)*
9. `desativar_produto`: Desativa logicamente um produto (`is_active = false`). *(Requer `catalog:write`)*

### Inventário & Contabilidade de Estoque (2 Tools)
10. `consultar_estoque`: Consulta saldo operacional, unidade (`unit` vs `pack`), equivalência física e status de reconciliação. *(Requer `stock:read`)*
11. `ajustar_estoque`: Realiza ajustes de inventário (`increase`, `decrease`, `count`) com `operation_id` obrigatório e registro atômico no ledger. *(Requer `stock:adjust`)*

### Modelos de Grade & Snapshots de Produto (4 Tools)
12. `listar_modelos_grade`: Lista templates de grade disponíveis (templates canônicos do sistema + modelos customizados da loja ativa). *(Requer `grade:read`)*
13. `obter_modelo_grade`: Obtém a composição detalhada de tamanhos e quantidades por caixa de um modelo. *(Requer `grade:read`)*
14. `criar_modelo_grade`: Cria um novo modelo de grade customizado para a loja ativa. *(Requer `grade:write`)*
15. `aplicar_grade_produto`: Aplica um modelo de grade a um produto, criando snapshot imutável e variação de compatibilidade com estoque inicial zero. *(Requer `grade:write`)*
