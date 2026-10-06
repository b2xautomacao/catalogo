# B2XCATALOGO — Product Pricing Architecture
**Documento Arquitetural — Sprint 10.3**
**Status:** IMPLEMENTED / VERIFIED
**Data:** 05/10/2026

---

## 1. Visão Geral e Estratégia de Precificação

O B2XCATALOGO suporta modelos comerciais híbridos que atendem operações de varejo, atacado e atacarejo progressivo na mesma plataforma:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                  Estrutura de Precificação por Produto                     │
├────────────────────────────────────────────────────────────────────────────┤
│ 1. Varejo Base (retail_price): Venda unitária ao consumidor final          │
│ 2. Atacado Simples (wholesale_price + min_wholesale_qty): Preço de lote   │
│ 3. Atacarejo / Níveis Graduais (product_price_tiers): Escala progressiva   │
│    ├── Faixa 1 (ex: 3+ un): R$ 89,90 (-10%)                                │
│    ├── Faixa 2 (ex: 6+ un): R$ 79,90 (-20%)                                │
│    └── Faixa 3 (ex: 12+ un): R$ 69,90 (-30%)                               │
│ 4. Preço por Grade (product_variations.grade_price): Valor fixo por caixa  │
│ 5. Ajuste por Variação (product_variations.price_adjustment): Delta R$     │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Schema Canônico de `product_price_tiers`

A tabela canônica no banco de dados armazena os níveis progressivos de preço:

```sql
CREATE TABLE product_price_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tier_name VARCHAR(50) NOT NULL,
  tier_order INTEGER NOT NULL, -- 1, 2, 3, 4
  tier_type VARCHAR(50) NOT NULL, -- 'retail', 'simple_wholesale', 'gradual_wholesale', 'custom'
  price DECIMAL(10,2) NOT NULL,
  min_quantity INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_tier_order CHECK (tier_order >= 1 AND tier_order <= 4),
  CONSTRAINT valid_min_quantity CHECK (min_quantity >= 1),
  CONSTRAINT unique_product_tier UNIQUE (product_id, tier_order)
);
```

---

## 3. Regras de Validação e Normalização (`priceTierDomainService.ts`)

O serviço [`priceTierDomainService.ts`](file:///e:/projetos/B2XCATALOGO/catalogo/src/lib/priceTierDomainService.ts) centraliza a lógica de validação:

1. **Limite de Faixas**: No máximo 4 faixas por produto (respeitando constraint `tier_order <= 4`).
2. **Quantidades Estritamente Crescentes**: `Faixa[N].min_quantity > Faixa[N-1].min_quantity`. Quantidades duplicadas ou sobrepostas (overlap) são rejeitadas.
3. **Preço Válido**: `price > 0`. Valores zero ou negativos são proibidos.
4. **Teto de Varejo**: O preço de uma faixa de atacarejo não pode ser superior ao preço base de varejo (`retail_price`).
5. **Consistência Comercial (Warning)**: O valor unitário deve ser decrescente conforme a quantidade aumenta.
6. **Último Tier Open-Ended**: A última faixa de preço atende todas as quantidades maiores ou iguais ao seu `min_quantity` (ex: 12+ unidades).

---

## 4. Reconciliação Não-Destrutiva

Ao salvar o produto pelo wizard (`usePremiumProductWizard.saveProduct`), o serviço de reconciliação:

1. Busca os registros persistidos em `product_price_tiers` para o `product_id`.
2. Mapeia os tiers informados no formulário:
   - Preserva o `id` existente caso seja uma edição (`UPDATE`).
   - Insere novos registros caso a faixa seja adicionada (`INSERT`).
   - Remove com segurança (`DELETE` ou `UPDATE is_active = false`) faixas excluídas pelo usuário.
3. Isola operações por `product_id` garantindo multi-tenancy e RLS.

---

## 5. Experiência do Usuário (Progressive Disclosure)

No [`PricingStep.tsx`](file:///e:/projetos/B2XCATALOGO/catalogo/src/components/products/wizard/premium/PricingStep.tsx):
- **Produtos Simples**: Permanece 100% limpo com os campos tradicionais de Varejo, Atacado e Estoque. Nenhuma configuração adicional é obrigatória.
- **Atacarejo Sob Demanda**: A seção "Faixas de Preço por Quantidade" pode ser expandida a qualquer momento para configurar de 1 a 4 faixas com cálculo de porcentagem de desconto em tempo real.
