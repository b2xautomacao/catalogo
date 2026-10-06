# B2XCATALOGO — Product Commerce & Grade Domain Audit
**Sprint 6 — Domain Audit & Architectural Blueprint**
**Status:** `Sprint 6 AUDIT COMPLETED`
**Executor:** Antigravity + Gemini 3.1
**Target Project:** `e:\projetos\B2XCATALOGO\catalogo\`
**MCP Server:** `e:\projetos\B2XCATALOGO\catalogo\shopflow-catalog-ai\`

---

## 1. Executive Summary

O B2XCATALOGO atende a um ecossistema comercial híbrido de alta complexidade: **varejo, atacarejo e atacado**, com foco expressivo nos segmentos de **calçados e vestuário**. Nesses segmentos, produtos raramente são itens unitários simples; eles envolvem combinações de cores, materiais, grades de numeração (ex: 34 ao 44), grades de letras (P ao GG), grades infantis (17/18 ao 32/33) e caixas fechadas de distribuição pré-definida (**Grade Alta, Grade Baixa e Grade Personalizada**).

Esta auditoria realizou uma inspeção detalhada em:
1. **Banco de Dados (Supabase/PostgreSQL):** Tabelas `products`, `product_variations`, `product_images`, `product_price_tiers`, `store_price_models`, `store_grades`, `store_colors`, `stock_movements`, triggers, funções e views.
2. **Frontend (React + Vite + TypeScript):** Wizards de cadastro de produto, seletores de grade, formulários de variação inteligente, hooks de precificação (`useCartPriceCalculation`, `useFlexibleGradePrice`), e regras de carrinho/checkout.
3. **Servidor MCP:** Identidade, segurança tenant-scoped, autorização por scopes (`catalog:read`, `catalog:write`, `store:list`, `store:select`) e ferramentas implementadas até a Sprint 5.

O objetivo deste documento é estabelecer a fonte única da verdade para o modelo de domínio comercial e de estoque, mapeando as limitações do estado atual e projetando a arquitetura futura para agentes de IA e aplicações web.

---

## 2. Current Product Model (Modelo de Produto Atual)

Na modelagem atual do PostgreSQL (`public.products`), o produto contém colunas híbridas herdadas de diferentes fases de evolução:

| Coluna | Tipo | Nullable | Default | Descrição / Função Atual |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave primária do produto |
| `store_id` | `UUID` | NÃO | - | FK para `stores.id` (Tenant Guard) |
| `name` | `TEXT` | NÃO | - | Nome comercial do produto |
| `description` | `TEXT` | SIM | `NULL` | Descrição detalhada |
| `retail_price` | `NUMERIC` | NÃO | `0` | Preço base de varejo (1 unidade) |
| `wholesale_price` | `NUMERIC` | SIM | `NULL` | Preço base de atacado simples |
| `min_wholesale_qty` | `INTEGER` | SIM | `1` | Quantidade mínima para atingir `wholesale_price` |
| `category` | `TEXT` | SIM | `NULL` | Nome textual da categoria |
| `sku` | `TEXT` | SIM | `NULL` | Código SKU do produto pai |
| `stock` | `INTEGER` | NÃO | `0` | Saldo de estoque global agregado |
| `reserved_stock` | `INTEGER` | NÃO | `0` | Estoque reservado em pedidos abertos |
| `allow_negative_stock` | `BOOLEAN` | NÃO | `false` | Permite venda sem estoque físico |
| `stock_alert_threshold` | `INTEGER` | SIM | `5` | Alerta de estoque baixo |
| `is_active` | `BOOLEAN` | NÃO | `true` | Status ativo/inativo (Soft Delete) |
| `is_featured` | `BOOLEAN` | SIM | `false` | Destaque na vitrine |
| `product_gender` | `TEXT` | SIM | `NULL` | `'masculino'`, `'feminino'`, `'unissex'`, `'infantil'` |
| `product_category_type` | `TEXT` | SIM | `NULL` | `'calcado'`, `'roupa_superior'`, `'roupa_inferior'`, `'acessorio'` |
| `material` | `TEXT` | SIM | `NULL` | Composição principal (ex: Couro, Sintético) |
| `created_at` / `updated_at`| `TIMESTAMPTZ`| NÃO | `now()` | Timestamps de auditoria |

---

## 3. Retail Model (Modelo de Varejo)

- **Regra:** Venda unitária avulsa para o consumidor final.
- **Preço Aplicado:** `products.retail_price` (com eventuais ajustes `product_variations.price_adjustment`).
- **Modo de Loja:** Quando a loja opera em `store_price_models.price_model = 'retail_only'`, ou quando a quantidade de itens no carrinho não atinge os critérios de atacado.

---

## 4. Wholesale Model (Modelo de Atacado)

O sistema possui duas implementações ativas de atacado:

### A. Atacado Simples (`simple_wholesale`)
- **Regra:** Concessão de preço reduzido (`products.wholesale_price`) quando atingido um limiar de volume.
- **Formas de Ativação:**
  1. **Por Produto (`min_wholesale_qty`):** Exigência de $N$ unidades do *mesmo produto* no carrinho (ex: 6 pares de sapato).
  2. **Por Total do Carrinho (`simple_wholesale_by_cart_total`):** Exigência de $M$ unidades *somadas no carrinho todo* (ex: $\ge 10$ peças variadas).

### B. Atacado por Grade Fechada (`wholesale_only` ou vendas de grade)
- O lojista vende a caixa fechada contendo uma grade completa (ex: 13 pares). O preço pode ser cobrado como `preço_unitário_atacado × total_pares` ou através de preço fixo por caixa (`product_variations.grade_price`).

---

## 5. Atacarejo Model (Modelo de Atacarejo)

### Estado Real no Código:
O atacarejo hoje é **simulado através de níveis intermediários no atacado gradativo (`store_price_models` e `product_price_tiers`)**.

- No atacado simples, o sistema possui apenas 2 preços no produto base (`retail_price` e `wholesale_price`).
- Para suportar 3 faixas reais (Varejo $\rightarrow$ Atacarejo $\rightarrow$ Atacado), a loja ativa `gradual_wholesale_enabled = true` com `gradual_tiers_count = 3`, configurando:
  - **Tier 1 (Varejo):** `min_quantity: 1`, `tier_name: "Varejo"`
  - **Tier 2 (Atacarejo):** `min_quantity: 3`, `tier_name: "Atacarejo"`
  - **Tier 3 (Atacado):** `min_quantity: 6`, `tier_name: "Atacado"`

> **Limitação Estrutural Identificada:** Se uma loja opera no modelo padrão sem preencher `product_price_tiers`, o sistema não possui uma terceira coluna nativa na tabela `products` (ex: não há `atacarejo_price` nativo em `products`). Toda a lógica avançada depende da tabela filha `product_price_tiers`.

---

## 6. Current Grade Model (Modelo de Grade Atual)

A representação atual de grades foi estruturada em ondas sucessivas de migrações:

```text
product_variations (sobrecarregada)
  ├── is_grade = false → Variação unitária simples (ex: Cor: Preto, Tamanho: 38)
  └── is_grade = true  → Caixa de Grade (ex: Grade Alta - Preto)
        ├── grade_sizes: ["36", "37", "38", "39", "40", "41", "42"] (JSONB)
        ├── grade_pairs: [1, 2, 2, 3, 2, 2, 1] (JSONB)
        ├── grade_quantity: 13 (Total de pares)
        └── flexible_grade_config: JSONB (regras de meia grade e mesclagem)
```

---

## 7. Grade Alta

### Definição Real no Frontend (`GradeConfigurationForm.tsx`):
- **Tamanhos:** `["36", "37", "38", "39", "40", "41", "42"]`
- **Distribuição de Pares:** `[1, 2, 2, 3, 2, 2, 1]`
- **Total de Pares na Caixa:** **13 pares**
- **Comportamento:** Focado em calçados femininos/unissex com maior concentração na numeração intermediária/alta (39 = 3 pares).
- **Persistência:** Gravado como uma linha em `product_variations` com `is_grade = true`, `grade_name = 'Grade Alta - [Cor]'`, `grade_sizes = ['36', ...]` e `grade_pairs = [1, 2, 2, 3, 2, 2, 1]`.

---

## 8. Grade Baixa

### Definição Real no Frontend (`GradeConfigurationForm.tsx`):
- **Tamanhos:** `["35", "36", "37", "38", "39"]`
- **Distribuição de Pares:** `[1, 2, 2, 2, 1]`
- **Total de Pares na Caixa:** **8 pares**
- **Comportamento:** Focado em calçados femininos de numeração menor/intermediária.

---

## 9. Grade Personalizada

### Definição e Flexibilidade:
O sistema oferece duas formas de customização:
1. **Modelos Reutilizáveis da Loja (`public.store_grades`):**
   - Tabela dedicada criada na migração `2026_03_10_store_grades_colors.sql`:
     ```sql
     CREATE TABLE public.store_grades (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
       name TEXT NOT NULL,
       sizes JSONB NOT NULL,
       default_quantities JSONB NOT NULL,
       is_active BOOLEAN DEFAULT true
     );
     ```
   - Permite que o lojista salve templates próprios (ex: "Minha Grade Verão 10 Pares") e reaplique em múltiplos produtos.
2. **Customização Ad-hoc no Cadastro:**
   - O usuário pode adicionar qualquer tamanho da lista mestra (`commonSizes`), ajustar pares por tamanho individualmente ou acionar o algoritmo de **Curva ABC** (`generateOptimizedDistribution`), que concentra mais pares nos números centrais.

---

## 10. Hierarquia e Relação de Domínio

A hierarquia real observada no sistema hoje é:

```text
Store (Tenant)
  │
  ├── store_grades (Templates de grade customizados da loja)
  ├── store_colors (Paleta de cores da loja com HEX)
  ├── store_price_models (Configuração global de precificação)
  │
  └── Product
        │
        ├── product_price_tiers (Faixas de preço: Varejo, Atacarejo, Atacado)
        │
        ├── product_images (Fotos ordenadas)
        │
        └── product_variations
              ├── [Variação Simples]: color = "Preto", size = "38", stock = 10, sku = "SAP-BLK-38"
              │
              └── [Grade Fechada]: color = "Preto", is_grade = true,
                                   grade_name = "Grade Alta - Preto",
                                   grade_sizes = ["36", "37", "38", "39", "40", "41", "42"],
                                   grade_pairs = [1, 2, 2, 3, 2, 2, 1],
                                   grade_quantity = 13,
                                   stock = 10 (10 caixas)
```

---

## 11. Variações (`product_variations`)

### Estrutura dos Registros:
A tabela `product_variations` possui duplicidade conceitual:
- **Papel 1 — Unidade Vendável Individual:** Representa 1 SKU unitário (ex: Camiseta Azul Tamanho G). Possui `color`, `size`, `sku`, `stock` e `price_adjustment`.
- **Papel 2 — Caixa Composta de Grade:** Representa 1 embalagem/caixa com múltiplos pares. Não possui `size` (é `NULL`), mas possui `grade_sizes` e `grade_pairs` em JSONB.

---

## 12. Modelo de SKU

- **Produto Pai (`products.sku`):** Opcional. Identifica a linha de produto (ex: `SAP-SOCIAL-01`).
- **Variação Simples (`product_variations.sku`):** Gerado combinando produto + atributos (ex: `SAP-SOCIAL-01-PRETO-38`).
- **Grade (`product_variations.sku`):** Gerado identificando a caixa de grade (ex: `SAP-SOCIAL-01-PRETO-GRADE-ALTA`).
- **Constraint no Banco:** `UNIQUE (product_id, name)` e `UNIQUE (product_id, grade_name, grade_color)`.

---

## 13. Cores (`store_colors` & `product_variations`)

- **Tabela Mestra por Loja (`store_colors`):** `store_id`, `name`, `hex_color`, `is_active`.
- **Na Variação:** `product_variations.color` (nome textual) e `product_variations.hex_color` (código hexadecimal para renderização de botões/swatches).
- Uma mesma grade pode ser replicada para múltiplas cores selecionadas (gerando uma linha de `product_variations` para cada cor).

---

## 14. Tamanhos

O sistema suporta três famílias de tamanhos:
1. **Numéricos Adulto:** `"33"`, `"34"`, `"35"`, ..., `"45"`.
2. **Numéricos Infantis Duplos:** `"17/18"`, `"19/20"`, `"21/22"`, ..., `"32/33"`.
3. **Alfabéticos (Confecção/Vestuário):** `"PP"`, `"P"`, `"M"`, `"G"`, `"GG"`, `"XG"`.

Armazenados como strings dentro de arrays JSONB (`grade_sizes`) ou na coluna `size` (`TEXT`).

---

## 15. Comparativo dos Modelos Comerciais

| Modelo Comercial | Regra de Quantidade | Regra de Preço | Composição |
| :--- | :--- | :--- | :--- |
| **Varejo** | 1 unidade | `retail_price` | Produto avulso ou variação simples |
| **Atacado Simples** | $\ge \text{min\_wholesale\_qty}$ peças | `wholesale_price` | Mix livre de tamanhos/cores |
| **Atacado Gradativo** | Faixas (ex: 1–2, 3–5, 6+) | `product_price_tiers` | Mix livre por faixas |
| **Grade Fechada** | 1 caixa ($\times N$ pares) | `unit_price \times pares` ou `grade_price` | Proporção fixa de tamanhos |
| **Grade Flexível (Meia)** | $\sim 50\%$ da grade | Preço proporcional | Proporção recalculada |
| **Grade Flexível (Mix)** | $\ge \text{custom\_mix\_min\_pairs}$ | Preço customizado / unitário | Cliente escolhe tamanhos/cores |

---

## 16. Auditoria de Estoque & `stock_movements`

### Estrutura Real de `stock_movements`:
```sql
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  order_id UUID REFERENCES public.orders(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('reservation', 'sale', 'return', 'adjustment', 'release')),
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  notes TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Risco Crítico Identificado (Grade $\times$ Estoque):
1. **Ausência de `variation_id` em `stock_movements`:** A tabela `stock_movements` só referencia `product_id`. Não há registro individual por variação/tamanho no livro-razão de estoque.
2. **Divergência de Unidade:** Se uma loja tem 10 caixas de Grade Alta (13 pares cada = 130 pares):
   - `products.stock` registra `130` (pares) ou `10` (caixas);
   - `product_variations.stock` registra `10` ou `13`;
   - Se um cliente compra 1 grade e outro cliente compra 3 pares avulsos, ocorre desbalanceamento caso a baixa ocorra em unidades não equivalentes.

---

## 17. Classificação das Decisões Arquiteturais

| Componente | Classificação | Justificativa |
| :--- | :---: | :--- |
| `products.retail_price` | **KEEP** | Preço base de varejo canônico essencial para consulta rápida. |
| `products.wholesale_price` | **KEEP** | Preço base de atacado direto para integrações simples. |
| `products.min_wholesale_qty`| **KEEP** | Limiar de atacado simples amplamente consumido no frontend e APIs. |
| `product_price_tiers` | **EVOLVE** | Estrutura excelente para atacarejo/atacado gradativo; deve ser padronizada no MCP. |
| `store_grades` | **EVOLVE** | Modelagem correta de templates de loja; deve ser formalizada como `grade_templates`. |
| `store_colors` | **KEEP** | Tabela tenant-scoped sólida com suporte a HEX. |
| `product_variations` | **EVOLVE** | Deve manter retrocompatibilidade com `is_grade`, mas segregar dados normalizados. |
| `products.stock` | **EVOLVE** | Deve atuar como valor agregado/cache derivado do inventário real. |
| `stock_movements` | **EVOLVE** | Requer adição de `variation_id` e identificador de unidade (`unit` vs `pack`). |

---

## 18. Arquitetura Recomendada para o Domínio Futuro

### A. Formalização de Templates de Grade (`grade_templates`)
```text
grade_templates (Sistema & Customizados por Loja)
  ├── id: UUID
  ├── store_id: UUID (NULL = Template do Sistema / NOT NULL = Custom Loja)
  ├── name: TEXT (ex: "Grade Alta Feminina 13 Pares")
  ├── category_type: 'calcado' | 'roupa'
  ├── is_system: BOOLEAN
  └── items: JSONB / grade_template_items [ { size: "36", quantity: 1 }, ... ]
```

### B. Grade Snapshot no Produto
Ao aplicar uma grade a um produto:
- O produto grava um **snapshot** da composição da grade no momento do cadastro.
- Se o template da loja for editado posteriormente, produtos históricos **não sofrem mutação retroativa indesejada**.

### C. Faixas de Preço Normalizadas (`product_price_tiers`)
```text
Tier 1: Varejo     → min_qty: 1, max_qty: 2, price: R$ 129,90
Tier 2: Atacarejo  → min_qty: 3, max_qty: 5, price: R$ 109,00
Tier 3: Atacado    → min_qty: 6, max_qty: NULL, price: R$ 89,00
```

---

## 19. Catálogo Proposto de Ferramentas MCP (Futuro)

Para permitir que agentes de IA operem o catálogo de forma composável e previsível:

### Módulo de Templates de Grade
1. `listar_modelos_grade`: Lista templates de grade disponíveis (sistema e customizados da loja ativa).
2. `obter_modelo_grade`: Consulta detalhada de composição de tamanhos/quantidades de um template.
3. `criar_modelo_grade`: Cria um novo template de grade customizado para a loja ativa.

### Módulo de Precificação e Faixas
4. `configurar_faixas_preco`: Configura tiers de atacarejo/atacado (`product_price_tiers`) para um produto.
5. `obter_faixas_preco`: Consulta faixas ativas de preço de um produto.

### Módulo de Variações e Grades de Produto
6. `aplicar_grade_produto`: Aplica uma grade (template ou snapshot customizado) com cores associadas.
7. `listar_variacoes_produto`: Lista variações unitárias e caixas de grade do produto.
8. `configurar_grade_flexivel`: Define regras de meia grade e mesclagem personalizada.

---

## 20. Decomposição de Comandos Naturais (10 Exemplos de Orquestração)

### Exemplo 1: Cadastro Híbrido Completo (Varejo + Atacarejo + Atacado + Cores + Grade Alta)
> **Prompt:** *"Cadastre esse tênis no varejo a R$ 129,90, atacarejo a R$ 109 a partir de 3 pares e atacado a R$ 89 a partir de 6, nas cores preto e branco, usando grade alta."*
- **Decomposição do Agente:**
  1. `criar_produto({ name: "Tênis", retail_price: 129.90, wholesale_price: 89.00, min_wholesale_qty: 6 })`
  2. `configurar_faixas_preco({ product_id, tiers: [{ name: "Varejo", min: 1, price: 129.9 }, { name: "Atacarejo", min: 3, price: 109.0 }, { name: "Atacado", min: 6, price: 89.0 }] })`
  3. `obter_modelo_grade({ name: "Grade Alta" })`
  4. `aplicar_grade_produto({ product_id, grade_name: "Grade Alta", colors: ["Preto", "Branco"] })`

### Exemplo 2: Grade Personalizada por Quantidade de Peças
> **Prompt:** *"Cadastre esse conjunto com grade personalizada: P 2 peças, M 4, G 3 e GG 1 no atacado a R$ 45."*
- **Decomposição:**
  1. `criar_produto({ name: "Conjunto", retail_price: 65.0, wholesale_price: 45.0 })`
  2. `aplicar_grade_produto({ product_id, custom_distribution: [{ size: "P", qty: 2 }, { size: "M", qty: 4 }, { size: "G", qty: 3 }, { size: "GG", qty: 1 }] })`

### Exemplo 3: Replicação de Grade em Nova Cor
> **Prompt:** *"Crie a mesma grade do produto X na cor bege."*
- **Decomposição:**
  1. `obter_produto({ product_id: X })`
  2. `aplicar_grade_produto({ product_id: X, colors: ["Bege"] })`

### Exemplo 4: Atacado Simples por Quantidade Mínima
> **Prompt:** *"Coloque a sandália floral no varejo por R$ 89,90 e atacado por R$ 59,90 levando pelo menos 10 pares."*
- **Decomposição:**
  1. `atualizar_produto({ product_id, retail_price: 89.90, wholesale_price: 59.90, min_wholesale_qty: 10 })`

### Exemplo 5: Grade Baixa Infantil
> **Prompt:** *"Cadastre a botinha infantil com grade baixa nas cores rosa e azul."*
- **Decomposição:**
  1. `criar_produto({ name: "Botinha Infantil", ... })`
  2. `obter_modelo_grade({ name: "Grade Baixa Infantil" })`
  3. `aplicar_grade_produto({ product_id, grade_name: "Grade Baixa Infantil", colors: ["Rosa", "Azul"] })`

### Exemplo 6: Ativação de Grade Flexível (Meia Grade)
> **Prompt:** *"Permita que os clientes comprem meia grade dessa rasteirinha com 50% dos pares."*
- **Decomposição:**
  1. `configurar_grade_flexivel({ product_id, allow_half_grade: true, half_grade_percentage: 50 })`

### Exemplo 7: Configuração de Faixa de Atacarejo para Produto Existente
> **Prompt:** *"Adicione desconto de atacarejo de R$ 99 para quem levar 4 ou mais desse vestido."*
- **Decomposição:**
  1. `configurar_faixas_preco({ product_id, tiers: [{ name: "Atacarejo", min: 4, price: 99.0 }] })`

### Exemplo 8: Consulta de Composição de Grade pelo Agente
> **Prompt:** *"Quantos pares e quais tamanhos vêm na Grade Alta Masculina?"*
- **Decomposição:**
  1. `obter_modelo_grade({ name: "Grade Masculina" })`
  2. Resposta ao usuário: "A Grade Masculina contém 13 pares divididos em: 38 (1), 39 (2), 40 (3), 41 (3), 42 (2), 43 (1) e 44 (1)."

### Exemplo 9: Criação de Template Reutilizável de Grade para a Loja
> **Prompt:** *"Crie um modelo de grade chamado 'Grade Plus Size' com 44 (2), 46 (4), 48 (4) e 50 (2)."*
- **Decomposição:**
  1. `criar_modelo_grade({ name: "Grade Plus Size", items: [{ size: "44", qty: 2 }, { size: "46", qty: 4 }, { size: "48", qty: 4 }, { size: "50", qty: 2 }] })`

### Exemplo 10: Desativação Segura de Produto com Grade
> **Prompt:** *"Desative o sapato oxford preto sem perder o cadastro das grades."*
- **Decomposição:**
  1. `desativar_produto({ product_id: oxford_id })`

---

## 21. Estratégia de Migração & Compatibilidade

A evolução para o novo modelo de domínio deve seguir a estratégia **Additive First (Não Destrutiva)**:

1. **Fase 1 (Aditiva):** Adicionar tabelas normalizadas (`grade_templates`, `grade_template_items`) e coluna `variation_id` em `stock_movements`. Manter colunas legadas em `products` e `product_variations`.
2. **Fase 2 (Backfill):** Script automático que lê as grades JSONB existentes em `product_variations` e popula os snapshots normalizados.
3. **Fase 3 (Dual-Write / Compatibility Layer):** Repositories atualizam tanto as colunas legadas quanto as novas tabelas, garantindo que o frontend atual continue funcionando sem interrupções.
4. **Fase 4 (Cutover Gradual):** Migração das interfaces do frontend e tools MCP para os novos endpoints.

---

## 22. Roadmap Recomendado para Próximas Sprints

- **Sprint 7 — Inventory Ledger Foundations:** Adicionar `variation_id` em `stock_movements`, criar repository de estoque e tool `ajustar_estoque` tenant-scoped.
- **Sprint 8 — Normalized Grade Templates & Snapshots:** Implementar `grade_templates` e tools MCP para gerenciamento de modelos de grade.
- **Sprint 9 — Price Tiers & Multi-Level Commerce:** Implementar tools MCP para configuração de faixas de atacarejo/atacado (`product_price_tiers`).
- **Sprint 10 — Advanced Variation & Color Matrix:** Suporte completo a matriz de variantes e orquestração de catálogos complexos por IA.
