# B2XCATALOGO: MCP Architecture Audit (Sprint 0)

## 1. Resumo Executivo
Esta auditoria inspecionou o projeto `B2XCATALOGO` e seu banco de dados Supabase para preparar o terreno para a implementação de um servidor MCP em `shopflow-catalog-ai/`. O projeto atual é uma plataforma multi-tenant madura de e-commerce/catálogo (varejo e atacado) em React, fortemente acoplada ao Supabase. A futura implementação MCP exigirá rigoroso controle de tenant (inquilino), pois utilizará chaves administrativas.

## 2. Arquitetura Atual
- **Stack Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix UI), Zustand (estado), React Query (data fetching), React Hook Form + Zod.
- **Backend/DB:** Supabase (PostgreSQL) com intenso uso de Row Level Security (RLS).
- **Estrutura:** O frontend está em `catalogo/src/`, as migrations de banco em `catalogo/supabase/migrations/`. 

## 3. Integração Supabase
A integração existente utiliza o cliente `@supabase/supabase-js`. 
O banco possui dezenas de tabelas de domínio. O schema reflete uma complexidade moderada/alta devido às funcionalidades de grades, variações, múltiplos preços (varejo/atacado) e ledgers de estoque.

## 4. Modelo Multi-tenant
O isolamento entre lojistas é feito primariamente pelo campo **`store_id` (uuid)**.
- **Tenant:** A entidade principal é a tabela `stores`.
- **Usuários:** A tabela `profiles` associa um `auth.users(id)` a um `store_id`.
- **Dados:** Praticamente todas as tabelas de negócio (`products`, `categories`, `orders`, `customers`) possuem uma foreign key `store_id` que não pode ser nula. 

## 5. Modelo de Dados do Catálogo
As tabelas principais identificadas para o catálogo são:
- **`products`**: Tabela central (`id`, `store_id`, `name`, `description`, `retail_price`, `wholesale_price`, `stock`, `is_active`, `sku`, `barcode`, etc.).
- **`categories`**: `name`, `store_id`, `is_active`.
- **`product_variations`**: Permite gerenciar cores, tamanhos, SKUs específicos, preço ajustado e estoque por variação. Suporta modelagem avançada (grades).
- **`product_images`**: Associação de URLs de imagens com ordem de exibição (`image_order`, `is_primary`) e variação específica.
- **`store_price_models`**: Configurações da loja para regras de preço (atacado, tiers, etc.).

## 6. Fluxos Atuais
- **Criar Produto:** Exige a criação do registro em `products` com o `store_id` obrigatório.
- **Exclusão:** Os produtos utilizam **Soft Delete / Inativação** via o campo booleano `is_active` (presente em `products`, `categories`, `product_variations`). Não devem ser deletados fisicamente para manter a integridade de `orders`.
- **Estoque:** O sistema possui a tabela **`stock_movements`** funcionando como um *ledger* (livro-razão) de entradas e saídas (tipos: reservation, sale, return, adjustment, release). Atualizar o estoque exigirá registrar a movimentação, e não apenas sobrescrever `products.stock`.

## 7. Segurança e Riscos da Credencial
O servidor MCP funcionará no backend usando a **Supabase Secret Key (Service Role Key)**.
- **Risco Primário:** A Service Role Key **ignora as políticas de RLS**. 
- **Impacto:** Um bug no MCP ou uma alucinação da IA poderia fazer uma tool listar, editar ou deletar produtos de *todas as lojas* do banco de dados (Cross-Tenant Data Leak/Manipulation).
- **Guardrails Necessários:** 
  1. O servidor MCP **nunca** deve confiar apenas nos parâmetros da IA para definir o `store_id`.
  2. O `store_id` deve ser injetado via variável de ambiente (se o MCP for de uso exclusivo para um tenant) ou deve ser rigidamente validado contra o token de autenticação do cliente MCP.
  3. Todas as queries do MCP usando o SDK oficial do Supabase DEVEM explicitamente conter `.eq('store_id', CURRENT_TENANT_ID)`.

## 8. Arquitetura Proposta para o MCP
A estrutura recomendada para `shopflow-catalog-ai`:
```text
shopflow-catalog-ai/
  package.json
  tsconfig.json
  src/
    index.ts             # Ponto de entrada, inicializa o McpServer via STDIO
    config/
      env.ts             # Validação com Zod de SUPABASE_URL, etc.
    lib/
      supabase.ts        # Instância do cliente Supabase admin
    schemas/
      product.schema.ts  # Zod schemas (CreateProduct, UpdateProduct)
    tools/
      catalog.tools.ts   # Definição e handlers das tools (list, create, update)
    services/
      product.service.ts # Lógica de negócio (abstrai queries e injeção do store_id)
```

## 9. Decisão sobre Credenciais
As credenciais devem residir estritamente no `.env` do backend do MCP e não devem ser expostas.
Nomes de variáveis sugeridas:
```env
# URL do projeto Supabase
SUPABASE_URL=

# Chave de Serviço Administrativa (NÃO EXPOR NO FRONTEND/GIT)
SUPABASE_SERVICE_ROLE_KEY=

# Se o MCP rodar para um lojista específico, define o escopo fixo:
MCP_DEFAULT_TENANT_ID=

# Flag de segurança para prevenir modificações acidentais na primeira fase
MCP_ALLOW_WRITES=false
```

## 10. Tools Candidatas
*Nota: Todas as tools abaixo assumem que o `store_id` é injetado internamente pelo servidor e não confiado como parâmetro da IA.*

| Nome | Risco | Objetivo / Resumo | Entra no MVP? |
| --- | --- | --- | --- |
| `catalog_health` | READ | Testa conexão com o banco e retorna se o catálogo está acessível. | SIM |
| `listar_produtos` | READ | Busca produtos com filtros (termo, categoria). Paginação obrigatória. | SIM |
| `buscar_produto` | READ | Traz detalhes ricos do produto (imagens, variações) por ID ou SKU. | SIM |
| `criar_produto` | WRITE | Insere produto básico (nome, preço, is_active=true). Requer tenant guard. | NÃO (Fase 2) |
| `desativar_produto` | WRITE | Define `is_active=false` em um produto. Substitui exclusão física. | NÃO (Fase 2) |
| `ajustar_estoque` | WRITE | Cria um registro em `stock_movements` (adjustment) e atualiza o saldo. | NÃO (Fase 3) |

## 11. Escopo Recomendado da Sprint 1
A Sprint 1 deve ser restrita a estabelecer as fundações de forma segura:
1. Criar o setup Node.js/TypeScript em `shopflow-catalog-ai/`.
2. Configurar ESLint/TypeScript.
3. Configurar a conexão Supabase e carregar credenciais usando dotenv.
4. Implementar o servidor MCP (`@modelcontextprotocol/sdk`) com comunicação STDIO.
5. Implementar **Apenas Tools de Leitura (READ)**: `catalog_health`, `listar_produtos` e `buscar_produto`.
6. Garantir que os filtros de `store_id` estejam hardcoded/injetados com segurança na camada de serviço.
