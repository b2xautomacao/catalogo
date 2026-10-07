# B2XCATALOGO — Tenant MCP Hub Architecture & Operations

## 1. Visão Geral do Produto

O **Tenant MCP Hub** transforma o servidor Model Context Protocol (MCP) do B2XCATALOGO em uma experiência de produto ponta a ponta para cada lojista (tenant). Ele permite conectar assistentes de IA (Claude, Cursor, ChatGPT, Gemini, Codex, n8n ou agentes autônomos) diretamente ao catálogo de produtos e estoques da loja, mantendo isolamento absoluto entre tenants e aplicando o princípio do menor privilégio (least privilege).

```text
Claude / ChatGPT / Codex / Gemini / n8n / Agentes
                     ↓ (HTTP POST com Bearer Token)
         MCP Remote HTTP Runtime
                     ↓ (Validação de Prefixo & SHA-256 Hash)
         Credential & AgentContext
                     ↓ (Verificação Estrita de Scopes)
          Tenant Store Access Guard
                     ↓ (Injeção Forçada do store_id do Tenant)
              Domain Services & Ledger
                     ↓ (Audit Log Seguro Registrado)
           Banco de Dados PostgreSQL (RLS)
```

---

## 2. Princípios Arquiteturais e Hard Rules

1. **A IA NUNCA recebe credenciais diretas do banco**:
   - Sem service_role do Supabase;
   - Sem credenciais PostgreSQL;
   - Sem permissão de definir ou adulterar `store_id`.
2. **1 Credencial = 1 Integração / Agente**:
   - Cada assistente ou agente possui sua própria credencial com escopos específicos.
   - NUNCA compartilhar uma chave única para a loja inteira.
3. **Armazenamento de Segredo por Hash (Show-Once)**:
   - Apenas o prefixo público (`key_prefix`) e o hash criptográfico SHA-256 (`key_hash`) são gravados no banco.
   - A chave bruta (`b2x_live_<prefix>_<secret>`) é exibida **uma única vez** no modal de criação e jamais pode ser recuperada.
4. **Isolamento de Tenant**:
   - Lojistas comuns (`store_admin`) operam estritamente sobre a sua própria loja. Tentativas de acessar dados de outras lojas retornam `404 NOT_FOUND` para mitigar enumeração.
   - Super Admins possuem visão multi-loja explicitamente controlada por seleção de escopo.
5. **Auditoria Segura**:
   - Toda invocação de ferramenta MCP é registrada em `agent_audit_log`.
   - Nenhum segredo, header de autorização ou prompt confidencial é exposto nos logs.

---

## 3. Ciclo de Vida da Credencial MCP

### 3.1 Geração Criptograficamente Segura
Implementada em `src/lib/apiKeyCrypto.ts` usando a Web Crypto API (`globalThis.crypto`):
- Formato: `b2x_live_<16-hex-prefix>_<64-hex-secret>`
- Prefixo público mascarado: `b2x_live_ab12••••••`
- Hash persistido: SHA-256 do segredo hexadecimal gerado com entropia criptográfica (32 bytes aleatórios).

### 3.2 Estados da Credencial
- **ATIVA**: Chave válida, não revogada e dentro do prazo de expiração (se configurado).
- **REVOGADA**: Campo `revoked_at` preenchido. O runtime do MCP rejeita chamadas imediatamente com `401 INVALID_CREDENTIAL`.
- **EXPIRADA**: Data atual posterior ao `expires_at`.

### 3.3 Rotação Segura
Caso haja suspeita de vazamento:
1. Criar uma nova credencial com o mesmo perfil de permissão;
2. Atualizar o cliente ou arquivo de configuração da IA com a nova chave;
3. Revogar imediatamente a credencial anterior.

---

## 4. Matriz de Permissões (Scopes Canônicos)

O sistema opera com 8 escopos canônicos mapeados para termos amigáveis:

| Escopo Técnico | Rótulo na Interface | Risco | Ferramentas Habilitadas |
|---|---|---|---|
| `catalog:read` | Consultar catálogo | Baixo | `buscar_catalogo`, `listar_produtos`, `obter_produto`, `catalog_health` |
| `catalog:write` | Criar e alterar produtos | Médio | `criar_produto`, `atualizar_produto`, `desativar_produto`, `atualizar_produtos_em_lote` |
| `stock:read` | Consultar estoque | Baixo | `consultar_estoque` |
| `stock:adjust` | Ajustar estoque | Alto | `ajustar_estoque` (transacional via Inventory Ledger) |
| `grade:read` | Consultar grades | Baixo | `listar_modelos_grade`, `obter_modelo_grade` |
| `grade:write` | Criar/aplicar grades | Médio | `criar_modelo_grade`, `aplicar_grade_produto` |
| `store:list` | Listar lojas (Superadmin) | Baixo | `buscar_lojas` |
| `store:select` | Selecionar loja (Superadmin)| Médio | `selecionar_loja`, `obter_loja_ativa` |

---

## 5. Scoped AI Guide (Guia Dinâmico para Agentes)

Um dos diferenciais centrais do Tenant MCP Hub é o gerador de **Guia Rápido para IA**:
- Ao clicar em **"Guia IA"** em uma credencial específica, o sistema gera dinamicamente um prompt enxuto adaptado exclusivamente às permissões daquela credencial.
- **Credenciais Read-Only**: Contêm apenas instruções de consulta. Ferramentas de escrita (`criar_produto`, `atualizar_produto`, `ajustar_estoque`, etc.) são omitidas e é incluído um checklist explícito:
  - *Você pode: pesquisar catálogo, consultar produtos, consultar estoque, consultar grades.*
  - *Você NÃO pode: criar/alterar produtos, ajustar estoque, aplicar grades.*
- **Credenciais de Escrita**: Incluem orientações rigorosas de **idempotência** (`operation_id` obrigatório para repetição segura de requisições).

---

## 6. Auditoria de Atividade (`agent_audit_log`)

- **Tenant Isolation**: O lojista visualiza apenas os eventos da sua própria loja.
- **Campos exibidos**:
  - Horário da requisição (`created_at`);
  - Ferramenta invocada (`tool_name`);
  - Status do evento (`OK`, `NEGADO`, `ERRO`);
  - Tempo de execução (`duration_ms`);
  - Código de erro público (`error_code`, ex: `SCOPE_DENIED`, `IDEMPOTENCY_CONFLICT`).
- **Super Admin**: Possui capacidade adicional de filtrar o histórico global ou selecionar uma loja específica.
