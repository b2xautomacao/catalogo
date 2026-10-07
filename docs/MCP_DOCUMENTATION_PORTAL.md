# B2XCATALOGO — Portal de Documentação MCP & Registry Canônico

## 1. Visão Geral e Single Source of Truth

Para evitar divergência entre a documentação interativa na UI, a documentação exportável em Markdown e os prompts fornecidos para LLMs, o B2XCATALOGO centraliza todas as definições no **MCP Documentation Registry** (`src/lib/mcpDocsRegistry.ts`).

```text
               MCP Documentation Registry (mcpDocsRegistry.ts)
                                       ↓
         ┌─────────────────────────────┼─────────────────────────────┐
         ↓                             ↓                             ↓
Portal de Docs Web            Exportação em Markdown         Guia Customizado IA
(Interactive UI & Search)       (generateMarkdownDocs)        (generateAiGuide)
```

---

## 2. Catálogo Oficial das 17 Ferramentas MCP

| # | Ferramenta | Categoria | Scope Requerido | Idempotência | Descrição Resumida |
|---|---|---|---|---|---|
| 1 | `catalog_health` | Diagnóstico | `catalog:read` | Não | Verifica conectividade e saúde do catálogo no tenant. |
| 2 | `listar_produtos` | Catálogo | `catalog:read` | Não | Lista produtos ativos com paginação e filtros. |
| 3 | `obter_produto` | Catálogo | `catalog:read` | Não | Obtém detalhes completos do produto, variações e preços. |
| 4 | `buscar_catalogo` | Catálogo | `catalog:read` | Não | Busca semântica e operacional no catálogo. |
| 5 | `criar_produto` | Catálogo | `catalog:write` | Não | Cadastra um novo produto na loja ativa. |
| 6 | `atualizar_produto` | Catálogo | `catalog:write` | Não | Atualiza campos cadastrais de um produto existente. |
| 7 | `desativar_produto` | Catálogo | `catalog:write` | Sim | Soft-delete do produto (`is_active = false`). |
| 8 | `atualizar_produtos_em_lote` | Catálogo | `catalog:write` | Sim | Modifica múltiplos produtos de forma atômica. |
| 9 | `consultar_estoque` | Estoque | `stock:read` | Não | Consulta saldos físicos e reservados de itens. |
| 10 | `ajustar_estoque` | Estoque | `stock:adjust` | Sim | Movimenta estoque no ledger com rastreabilidade. |
| 11 | `listar_modelos_grade` | Grades | `grade:read` | Não | Lista modelos e templates de grades de tamanho. |
| 12 | `obter_modelo_grade` | Grades | `grade:read` | Não | Detalhes de um modelo de grade e seus tamanhos. |
| 13 | `criar_modelo_grade` | Grades | `grade:write` | Não | Cadastra um novo template de grade na loja. |
| 14 | `aplicar_grade_produto` | Grades | `grade:write` | Sim | Aplica matriz de variações a um produto. |
| 15 | `buscar_lojas` | Contexto | `store:list` | Não | Lista lojas onde o usuário possui acesso autorizado. |
| 16 | `obter_loja_ativa` | Contexto | `store:select` | Não | Retorna metadados da loja atualmente em sessão. |
| 17 | `selecionar_loja` | Contexto | `store:select` | Sim | Altera a loja ativa da sessão no MCP runtime. |

---

## 3. Limites de Taxa de Requisição (Rate Limits)

Os limites são aplicados por minuto por hash de credencial:

1. **Leitura (`READ`) — 120 req/min**:
   - `catalog_health`, `listar_produtos`, `obter_produto`, `buscar_catalogo`, `consultar_estoque`, `listar_modelos_grade`, `obter_modelo_grade`, `buscar_lojas`, `obter_loja_ativa`.
2. **Escrita (`WRITE`) — 60 req/min**:
   - `criar_produto`, `atualizar_produto`, `desativar_produto`, `criar_modelo_grade`, `selecionar_loja`.
3. **Escrita Sensível / Lote (`SENSITIVE_WRITE`) — 20 req/min**:
   - `ajustar_estoque`, `atualizar_produtos_em_lote`, `aplicar_grade_produto`.

---

## 4. Catálogo de Erros Públicos Padronizados

| Código de Erro | HTTP Status | Retry Seguro? | Descrição |
|---|---|---|---|
| `INVALID_CREDENTIAL` | 401 | Não | Chave inexistente, inválida ou revogada. |
| `SCOPE_DENIED` | 403 | Não | Credencial sem permissão para executar a ferramenta. |
| `STORE_ACCESS_DENIED` | 403 | Não | Tentativa de acesso a loja não vinculada à credencial. |
| `STORE_CONTEXT_REQUIRED` | 400 | Não | Operação requer contexto de loja ativa. |
| `PRODUCT_NOT_FOUND` | 404 | Não | Produto não encontrado na loja ativa. |
| `INVENTORY_TARGET_NOT_FOUND` | 404 | Não | Variação não encontrada para ajuste de estoque. |
| `INSUFFICIENT_STOCK` | 422 | Não | Saldo insuficiente para saída de estoque. |
| `IDEMPOTENCY_CONFLICT` | 409 | Não | Reutilização de `operation_id` com payload alterado. |
| `RATE_LIMITED` | 429 | Sim (com backoff) | Limite por minuto atingido. |
| `TIMEOUT` | 504 | Sim (mesmo `operation_id`) | Tempo limite de execução atingido. |
| `INTERNAL_ERROR` | 500 | Não | Erro inesperado no runtime. |

---

## 5. Regras Críticas de Idempotência

Operações com alteração de estado suportam o parâmetro `operation_id`:
- **Mesmo `operation_id` + Mesmo Payload**: Em caso de timeout ou falha de rede, a requisição pode ser repetida com segurança. O servidor retorna o resultado pré-calculado sem duplicar movimentos no estoque.
- **Mesmo `operation_id` + Payload Diferente**: O servidor rejeita imediatamente com `IDEMPOTENCY_CONFLICT`.

---

## 6. Testes Automatizados de Consistência

O arquivo `src/lib/__tests__/mcpDocsRegistry.test.ts` implementa testes de conformidade para prevenir qualquer desvio:
1. `MCP_TOOLS.length === 17` e validação nominal de todas as 17 ferramentas;
2. `MCP_SCOPES.length === 8` e validação de que toda ferramenta exige um escopo válido;
3. `MCP_ERROR_CATALOG.length === 11`;
4. Geração integral de documentação em Markdown sem vazamento de segredos;
5. Filtragem dinâmica do AI Guide conforme os escopos da credencial;
6. Inclusão condicional de regras de idempotência em credenciais com escrita;
7. Validação criptográfica de Web Crypto, mascaramento de prefixo e status.
