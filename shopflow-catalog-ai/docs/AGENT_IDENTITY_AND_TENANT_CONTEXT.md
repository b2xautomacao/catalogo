# Agent Identity and Tenant Context (ADR & Arquitetura)

## 1. Princípios de Segurança
A premissa fundamental deste servidor MCP é a seguinte Decisão de Arquitetura de Software (ADR):
> **O LLM nunca controla diretamente a identidade, API Key ou `store_id` (tenant) em operações de negócio.**

Toda a autoridade deriva do backend (da autenticação do cliente conectando-se ao servidor MCP). O modelo pode pesquisar lojas pelo termo fornecido pelo usuário e apresentar opções, mas a ativação da loja para a sessão ocorre estritamente por meio da ferramenta de seleção explícita com validação no banco de dados.

### Princípios Cardeais:
- **`Search ≠ Select` (Busca NÃO é Seleção):** A ferramenta `buscar_lojas` nunca altera `activeStoreId` em memória, mesmo se retornar 1 único resultado.
- **`activeStoreId ≠ Authorization` (Loja Ativa NÃO é Autorização):** `activeStoreId` apenas reflete qual loja autorizada está em foco na sessão. Toda ativação exige `canAccessStore(context, storeId)`.
- **Isolamento de Sessão (`AgentSession`):** O estado da loja ativa reside estritamente na instância da sessão do cliente, evitando vazamentos *cross-session*.

---

## 2. Modelo de Acesso a Lojas (`StoreAccess`) `[IMPLEMENTED]`

Para evitar a ambiguidade conceitual de arrays vazios, o acesso é modelado como uma união estrita:

```typescript
export type StoreAccess =
  | { mode: 'all' }
  | { mode: 'restricted'; storeIds: string[] };

export interface AgentContext {
  principalType: 'tenant' | 'user' | 'superadmin';
  principalId: string;
  storeAccess: StoreAccess;
  activeStoreId: string | null;
  scopes: string[];
  sessionId: string;
}
```

### Configuração por Principal:
1. **`superadmin`:**
   - `storeAccess = { mode: 'all' }`
   - `activeStoreId = null` (inicialmente sem loja ativa; requer `selecionar_loja` para liberar operações tenant-scoped).
   - Scopes: `catalog:read`, `store:list`, `store:select`.
2. **`tenant` (API Key):**
   - `storeAccess = { mode: 'restricted', storeIds: [STORE_UUID] }`
   - `activeStoreId = STORE_UUID` (já nasce vinculado e restrito à própria loja).
   - Scopes: `catalog:read`, `store:list`.
3. **`single_tenant` (Desenvolvimento via Env):**
   - `storeAccess = { mode: 'restricted', storeIds: [MCP_STORE_ID] }`
   - `activeStoreId = MCP_STORE_ID`.
   - Scopes: `catalog:read`, `store:list`.

---

## 3. Fluxo de Resolução e Desambiguação de Lojas `[IMPLEMENTED]`

Exemplo de diálogo e fluxo técnico:

1. **Usuário:** "Trabalhe na loja Mega Calçados."
2. **IA chama:** `buscar_lojas({ query: "Mega Calçados" })`
3. **Backend:**
   - Valida escopo `store:list`.
   - Executa busca filtrada no universo autorizado (`StoreAccess`).
   - Registra evento de auditoria `store_search`.
   - Retorna:
     ```json
     {
       "matches": [
         { "id": "11111111-...", "name": "Mega Calçados — Goiânia", "url_slug": "mega-calcados-goiania" },
         { "id": "22222222-...", "name": "Mega Calçados — Anápolis", "url_slug": "mega-calcados-anapolis" }
       ],
       "count": 2,
       "selectionRequired": true
     }
     ```
4. **IA pergunta ao usuário:** "Encontrei duas lojas: Mega Calçados — Goiânia e Mega Calçados — Anápolis. Em qual delas deseja trabalhar?"
5. **Usuário:** "Goiânia."
6. **IA chama:** `selecionar_loja({ store_id: "11111111-..." })`
7. **Backend:**
   - Valida escopo `store:select`.
   - Valida existência da loja e `canAccessStore(context, storeId)`.
   - Define `session.setActiveStoreId(storeId)`.
   - Registra evento de auditoria `store_selected`.
   - Retorna confirmação segura.
8. **IA chama:** `listar_produtos({})` $\rightarrow$ Retorna apenas os produtos da loja de Goiânia!

---

## 4. Tabela de Auditoria (`agent_audit_log`) `[IMPLEMENTED]`

Implementada via migração canônica em `supabase/migrations/20261005000001_create_agent_audit_log.sql`:

```sql
CREATE TABLE public.agent_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    principal_type TEXT NOT NULL,
    principal_id TEXT NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    tool_name TEXT,
    entity_type TEXT,
    entity_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Eventos Rastreados:
- `store_search`: Registra termo de busca e quantidade de correspondências (sem despejo de dados sensíveis).
- `store_selected`: Registra a loja selecionada e a loja anterior na sessão.
- `store_context_cleared`: Registra a limpeza de contexto de loja ativa.

---

## 5. Safe Catalog Write & Lifecycle Authorization `[IMPLEMENTED]`

Operações de escrita e ciclo de vida no catálogo (`criar_produto`, `atualizar_produto`, `desativar_produto`) seguem um pipeline rigoroso de autorização e isolamento em camadas:

```text
credential (API Key / Env)
↓
scopes (requireScope("catalog:write"))
↓
session (AgentSession)
↓
activeStoreId (requireActiveStore(context))
↓
tenant guard (validação relacional de category_id, lookup tenant-scoped)
↓
validation (Zod .strict() blocking store_id, id, stock, etc.)
↓
write / soft delete (WHERE id = product_id AND store_id = activeStoreId)
↓
audit (logProductCreated / logProductUpdated / logProductDeactivated)
```

### Regras Críticas de Escrita e Ciclo de Vida:
1. **Injeção Obrigatória de `store_id`:** O `store_id` **nunca** vem do payload do LLM. É injetado pelo backend a partir de `context.activeStoreId`.
2. **Duplo Tenant Guard na Mutação:** Para updates e soft delete, a query executa obrigatoriamente `WHERE id = product_id AND store_id = activeStoreId`. Se o produto for de outro tenant, retorna `PRODUCT_NOT_FOUND` sem revelar existência cross-tenant.
3. **Soft Delete Seguro:** A desativação lógica (`desativar_produto`) altera apenas `is_active = false`. Não ocorre remoção física (`DELETE`), preservando dados históricos, fotos, variações e pedidos.
4. **Idempotência de Desativação:** Desativar um produto que já possui `is_active = false` retorna sucesso idempotente (`alreadyInactive: true`) sem gerar erros ou reexecutar mutações desnecessárias.
5. **Validação de Categoria Tenant-Safe:** Qualquer `category_id` informado é validado contra `category.id = category_id AND category.store_id = activeStoreId`. Caso não pertença à mesma loja, retorna `CATEGORY_NOT_FOUND`.
6. **Isolamento de Estoque:** `stock`, `estoque`, `quantity` e `inventory` são terminantemente proibidos nos schemas Zod de entrada. Nenhuma tool de escrita ou ciclo de vida altera `products.stock` ou a tabela `stock_movements`.

---

## 6. Ferramentas Homologadas (Total: 9) `[IMPLEMENTED]`

1. `catalog_health` (`catalog:read`)
2. `listar_produtos` (`catalog:read` + `requireActiveStore`)
3. `obter_produto` (`catalog:read` + `requireActiveStore`)
4. `buscar_lojas` (`store:list`)
5. `selecionar_loja` (`store:select`)
6. `obter_loja_ativa` (`store:list`)
7. `criar_produto` (`catalog:write` + `requireActiveStore`)
8. `atualizar_produto` (`catalog:write` + `requireActiveStore`)
9. `desativar_produto` (`catalog:write` + `requireActiveStore`)

---

## 7. Evolução Planejada `[PLANNED]`

- **Sprint 6 (Planejada):**
  - Inventory Ledger / Safe Stock Adjustments via movimentações canônicas (`stock_movements`).
- **Sprint 7+ (Planejada):**
  - Transporte MCP HTTP / SSE / OAuth 2.0.


