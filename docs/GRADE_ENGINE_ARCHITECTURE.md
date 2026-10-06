# B2XCATALOGO — Grade Engine & Snapshot Architecture
**Documento Arquitetural — Sprint 9 & 9.1**
**Status:** IMPLEMENTED / AUDITED / HARDENED
**Data:** 05/10/2026

---

## 1. Executive Summary

A **Sprint 9 & 9.1** estabelece a normalização canônica e o endurecimento relacional do domínio de **Grades de Calçados e Vestuário** (**Grade Engine & Snapshots**) para o ecossistema B2XCATALOGO.

Historicamente, as grades eram representadas por constantes no frontend e arrays JSON paralelos desnormalizados (`grade_sizes` e `grade_pairs`) armazenados diretamente no registro da variação do produto (`product_variations`). Não havia separação formal entre a definição reutilizável de um modelo de grade (**Template**) e a composição imutável de uma grade aplicada a um produto específico (**Snapshot**).

Com a conclusão da Sprint 9 e 9.1:
1. **Separação Canônica entre Template e Snapshot**:
   - `grade_templates` & `grade_template_items`: Modelos reutilizáveis canônicos da plataforma (`is_system = true`) e customizados por loja (`store_id = activeStoreId`).
   - `product_grade_snapshots` & `product_grade_snapshot_items`: Snapshots imutáveis gerados no momento em que uma grade é associada a um produto.
2. **Separação Canônica das Relações Pack vs Component (Sprint 9.1)**:
   - **Relação A (Pack Level)**: `product_grade_snapshots.pack_variation_id -> product_variations.id` (1:1 com a variação que representa a caixa fechada `is_grade = true`).
   - **Relação B (Component Level)**: `product_grade_snapshot_items.variation_id -> product_variations.id` (variação unitária correspondente ao tamanho específico `is_grade = false`, mantida como `NULL` até a futura Variation Matrix).
3. **Trigger de Proteção Relacional**: `trg_validate_snapshot_item_variation` impede a nível de banco que qualquer item do snapshot aponte para variações com `is_grade = true`.
4. **Imutabilidade Garantida**: Se um template for alterado no futuro, os produtos existentes mantêm sua composição original congelada no snapshot, preservando a exatidão contábil e física do estoque.
5. **Projeção de Compatibilidade**: A aplicação de grade gera atomicamente o snapshot normalizado e a variação correspondente em `product_variations` (`is_grade = true`, `stock = 0`), garantindo funcionamento ininterrupto do frontend atual e do checkout.
6. **Integração com o Inventory Ledger**: `consultar_estoque` e `ajustar_estoque` resolvem a equivalência física da caixa a partir de `pack_variation_id` no snapshot normalizado.
7. **Segurança de Escopos (Scopes)**: Introdução dos escopos independentes `grade:read` e `grade:write`.

---

## 2. Legacy Grade Model

Antes da Sprint 9, a estrutura de grades no banco de dados e no frontend era composta por:

```text
┌────────────────────────────────────────────────────────┐
│                      store_grades                      │
│  id, store_id, name, sizes (jsonb),                    │
│  default_quantities (jsonb), is_active                 │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   product_variations                   │
│  id, product_id, sku, color, size, is_grade,           │
│  grade_name, grade_sizes (jsonb), grade_pairs (jsonb), │
│  stock                                                 │
└────────────────────────────────────────────────────────┘
```

---

## 3. Semântica Canônica e Relações (Sprint 9.1)

Existem duas relações estruturalmente distintas que nunca devem ser misturadas:

### Relação A — Grade Snapshot → Pack Variation
Vincula o snapshot à variação que representa a caixa fechada comercial:
```text
product_grade_snapshots
├── id: UUID
├── product_id: UUID
├── pack_variation_id: UUID (FK -> product_variations.id)
└── total_units: INTEGER (ex: 13)
        │
        ▼
product_variations
├── id: UUID (Pack ID)
├── sku: "SAP-001-PRETO-GRADE-ALTA"
├── is_grade: true
└── stock: INTEGER (quantidade de caixas)
```

### Relação B — Snapshot Item → Unit Variation (Componente)
Vincula cada linha da grade ao SKU unitário de venda avulsa do respectivo tamanho (ex: Tamanho 38):
```text
product_grade_snapshot_items
├── id: UUID
├── snapshot_id: UUID
├── size: "38"
├── quantity: 2
└── variation_id: UUID NULL (FK -> product_variations.id onde is_grade = false)
```
> [!NOTE]
> Como a **Variation Matrix** ainda não foi implementada, `product_grade_snapshot_items.variation_id` permanece estritamente **`NULL`** nesta fase. É proibido apontar o item para a pack variation.

---

## 4. DDL & Constraints

Implementado nas migrations `20261005000005_grade_templates_and_snapshots.sql` e `20261005000006_fix_grade_snapshot_variation_relationship.sql`:

```sql
-- Snapshots com vínculo explícito à Pack Variation
CREATE TABLE public.product_grade_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  pack_variation_id UUID NULL REFERENCES public.product_variations(id) ON DELETE SET NULL,
  template_id UUID NULL REFERENCES public.grade_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  color TEXT NULL,
  color_ref UUID NULL,
  total_units INTEGER NOT NULL CHECK (total_units > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_product_grade_snapshots_pack_variation_id
ON public.product_grade_snapshots(pack_variation_id)
WHERE pack_variation_id IS NOT NULL;

-- Itens do Snapshot
CREATE TABLE public.product_grade_snapshot_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES public.product_grade_snapshots(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  position INTEGER NOT NULL DEFAULT 0,
  variation_id UUID NULL REFERENCES public.product_variations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_grade_snapshot_items_size UNIQUE (snapshot_id, size)
);

-- Trigger de guarda: impede snapshot item de apontar para pack variation
CREATE OR REPLACE FUNCTION public.validate_snapshot_item_variation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.variation_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.product_variations
      WHERE id = NEW.variation_id AND is_grade = true
    ) THEN
      RAISE EXCEPTION 'SNAPSHOT_ITEM_VARIATION_CANNOT_BE_GRADE: Snapshot item variation_id cannot point to a pack variation (is_grade = true). It must point to a unit variation.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. System Templates Canônicos

1. **Grade Alta (13 pares)**:
   - $36 \to 1$, $37 \to 2$, $38 \to 2$, $39 \to 3$, $40 \to 2$, $41 \to 2$, $42 \to 1$. Total: **13 unidades**.
2. **Grade Baixa (8 pares)**:
   - $35 \to 1$, $36 \to 2$, $37 \to 2$, $38 \to 2$, $39 \to 1$. Total: **8 unidades**.

---

## 6. Fluxo de `aplicar_grade_produto` (Sprint 9.1)

```text
1. Validação de Escopo (grade:write) & Tenant Guard (store_id)
2. Validação do Produto & Modelo de Grade
3. Início da Transação Atômica
4. INSERT em product_grade_snapshots (inicialmente com pack_variation_id = NULL)
5. INSERT em product_grade_snapshot_items (todos com variation_id = NULL)
6. INSERT em product_variations (Pack Variation: is_grade = true, stock = 0)
7. UPDATE em product_grade_snapshots SET pack_variation_id = variation.id
8. Registro de Auditoria (grade_applied_to_product)
9. Commit da Transação
```

---

## 7. Inventory Integration & Equivalência Física

A resolução de estoque no `InventoryRepository` navega:
$$\text{Pack Variation} \xrightarrow{\text{pack\_variation\_id}} \text{Product Grade Snapshot} \longrightarrow \text{Snapshot Items}$$

Exemplo:
- **1 caixa de Grade Alta** = 13 pares físicos equivalentes.
- **Ajuste de +2 caixas** $\implies$ `quantity = 2`, `physical_quantity = 26`.

---

## 8. Verification & Test Coverage

- **Total de Testes:** **103 testes automatizados** passando (`103/103 pass`, `0 fail`).
- **Suítes de Teste:** 13 suítes (`auth`, `guards`, `env`, `store-resolution`, `product-writes`, `inventory-ledger`, `stock-adjustments`, `grade-templates`).
- **Build TypeScript:** Compilação limpa via `tsc` (exit code 0).
- **Zero Mutações Destrutivas de Saldo:** Backfill seguro executado sem alterações em saldos reais.
