# B2XCATALOGO — Inventory Ledger Architecture & Foundations
**Documento Arquitetural — Sprint 7, 8, 8.1, 9 & 9.1**
**Status:** IMPLEMENTED / AUDITED / HARDENED
**Data:** 05/10/2026

---

## 1. Executive Summary

A **Sprint 9.1** consolida a integração do **Inventory Ledger** com a estrutura normalizada e relacionalmente endurecida de **Grades de Calçados e Vestuário** (**Grade Engine & Snapshots**).

Historicamente, o sistema tratava estoque de forma fragmentada: a tabela `products.stock` operava como saldo agregado escalar, `product_variations.stock` mantinha saldos locais por variação sem conciliação histórica, e `stock_movements` registrava apenas movimentações no nível de `product_id`.

Com a conclusão das Sprints 8, 8.1, 9 e 9.1:
1. **O schema de `stock_movements` e a RPC `apply_stock_adjustment` foram formalizados**, com cálculo de equivalência física canônica e detecção estrita de conflitos de idempotência.
2. **Semântica Canônica de `products.stock`**: Representa o **total equivalente em unidades físicas (pares)**. É calculado pela fórmula canônica:
   $$\text{products.stock} = \sum(\text{unit\_variations.stock}) + \sum(\text{pack\_variations.stock} \times \text{physical\_units\_per\_pack})$$
3. **Resolução de Grade no Inventário (Sprint 9.1)**:
   - Para uma pack variation (`is_grade = true`), o `InventoryRepository` consulta `product_grade_snapshots` onde `pack_variation_id = variation.id` e soma as quantidades em `product_grade_snapshot_items`.
   - Mantém fallback para `product_variations.grade_pairs` em grades legadas que ainda não possuem snapshot.
4. **Idempotência Obrigatória e Segura**:
   - O campo `operation_id` é **estritamente obrigatório** em todas as mutações de ajuste.
   - Chamadas repetidas com o mesmo `operation_id` e payload idêntico retornam o movimento original sem duplicar mutações (`duplicate: true`).
   - Reutilização do mesmo `operation_id` com payload conflitante é rejeitada com `IDEMPOTENCY_CONFLICT` (0 mutações).
5. **Separação Estrita de Escopos (Scopes)**:
   - `stock:read`: Requerido exclusivamente por `consultar_estoque`. Chaves apenas com `catalog:read` recebem `FORBIDDEN`.
   - `stock:adjust`: Requerido por `ajustar_estoque`. Chaves apenas com `catalog:write` recebem `FORBIDDEN`.
   - `stock:adjust` realiza leitura interna necessária sem exigir simultaneamente `stock:read`.
6. **Status de Child Movements**: **IMPLEMENTED (Sprint 11 Consolidada)**: A decomposição física de caixas/packs gera movimentos filhos em `stock_movements` vinculados por `parent_movement_id` com `unit_kind = 'unit'`, `reason_code = 'grade_component_trace'` sem alterar o saldo operacional `product_variations.stock` de loose units (preservando o Modelo A de pools independentes e zero double counting).

---

## 2. Inventory Domain Model: Independent Pools (Modelo A)

A auditoria de domínio confirmou que o B2XCATALOGO adota o **Modelo A (Pools Independentes)**:
- **Variações de Grade (`is_grade = true`)**: Representam caixas fechadas físicas no depósito. Seu estoque comercial (`stock`) é a quantidade de caixas.
- **Variações Unitárias (`is_grade = false`)**: Representam pares/unidades físicas avulsas vendidas separadamente.
- Ambos os tipos de variações coexistem no mesmo produto sem que a venda de uma caixa fechada desconte automaticamente pares do estoque avulso em tempo real.

---

## 3. Canonical Physical Aggregation

### Fórmula Canônica:
Para cada variação vendável do produto:
- Se `is_grade = false`: $\text{physical\_stock} = \text{variation.stock}$
- Se `is_grade = true`: $\text{physical\_stock} = \text{variation.stock} \times \text{units\_per\_pack}$ (onde `units_per_pack` é 13 na Grade Alta e 8 na Grade Baixa)

Produto pai:
$$\text{products.stock} = \sum_{\text{variations}} \text{physical\_stock}$$

### Exemplo Misto Obrigatório:
- Sapato Social 38: **5 unidades**
- Sapato Social 39: **7 unidades**
- Grade Alta Preto: **3 caixas** (Grade Alta: $[1, 2, 2, 3, 2, 2, 1] \implies 13\text{ pares/caixa} = 39\text{ pares}$)
- **Estoque Físico Agregado (`products.stock`):**
  $$5 + 7 + (3 \times 13) = 5 + 7 + 39 = 51\text{ pares equivalentes}$$
  *(Nunca a soma ingênua $5 + 7 + 3 = 15$)*

---

## 4. Idempotency & Conflict Detection Architecture

```text
                               ┌──────────────────────────────┐
                               │       ajustar_estoque        │
                               │  (com operation_id obrig.)   │
                               └──────────────┬───────────────┘
                                              │
                                              ▼
                             ┌──────────────────────────────────┐
                             │ Existe movimento para store_id + │
                             │        operation_id ?            │
                             └───────┬──────────────────┬───────┘
                                    SIM                NÃO
                                     │                  │
                ┌────────────────────┴──────────┐       ▼
                ▼                               ▼  Executa mutação atômica
   Payload idêntico ao gravado?       Payload diferente?
                │                               │
                ▼                               ▼
       Retorna sucesso duplicado       Lança IDEMPOTENCY_CONFLICT
        (applied: false, dup: true)        (0 mutações geradas)
```

1. **Campos do Fingerprint**: `product_id`, `variation_id`, `operation`, `quantity` (ou `counted_quantity`) e `reason_code`.
2. **Campo `notes`**: Não participa da identidade operacional do fingerprint por se tratar de anotação descritiva livre.

---

## 5. Scope Separation Matrix

| Operação | MCP Tool | Scope Obrigatório | `catalog:read` | `catalog:write` | `stock:read` | `stock:adjust` |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| Leitura de Catálogo | `listar_produtos`, `obter_produto` | `catalog:read` | ✅ OK | ❌ | ❌ | ❌ |
| Escrita de Catálogo | `criar_produto`, `atualizar_produto` | `catalog:write` | ❌ | ✅ OK | ❌ | ❌ |
| Consulta de Inventário | `consultar_estoque` | `stock:read` | ❌ FORBIDDEN | ❌ FORBIDDEN | ✅ OK | ❌ |
| Ajuste de Inventário | `ajustar_estoque` | `stock:adjust` | ❌ FORBIDDEN | ❌ FORBIDDEN | ❌ | ✅ OK |

---

## 6. Child Movements Status

- **Status Atual:** `NOT IMPLEMENTED`
- **Justificativa Técnica:** As movimentações de estoque em nível de grade registram perfeitamente o movimento comercial da caixa (`unit_kind = 'pack'`) e seu volume físico global (`physical_quantity`). A decomposição detalhada em movimentos filhos (`parent_movement_id`) para cada tamanho individual da grade aguarda a implementação da Variation Matrix.

---

## 7. Migrations Log

1. `20261005000002_evolve_inventory_ledger.sql`: Evolução do schema de `stock_movements`, colunas `unit_kind`, `physical_quantity`, `idempotency_key`, `reason_code`, `source_type`, `parent_movement_id`.
2. `20261005000003_apply_stock_adjustment_rpc.sql`: RPC atômica inicial `apply_stock_adjustment`.
3. `20261005000004_fix_stock_aggregation_and_idempotency.sql`: Função canônica `calculate_product_physical_stock`, detecção de `IDEMPOTENCY_CONFLICT` e agregação física exata de packs + unidades.
4. `20261005000005_grade_templates_and_snapshots.sql`: Modelos normalizados de grade e snapshots imutáveis.
5. `20261005000006_fix_grade_snapshot_variation_relationship.sql`: Vínculo `pack_variation_id` 1:1 entre snapshot e pack variation, com trigger de proteção relacional.

