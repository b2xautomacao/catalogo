# B2XCATALOGO — Product Stock UX Architecture
**Documento Arquitetural — Sprint 10.4**
**Status:** IMPLEMENTED / VERIFIED
**Data:** 05/10/2026

---

## 1. Visão Geral e Princípio Fundamental

A **Sprint 10.4** elimina do fluxo administrativo web qualquer mutação direta de estoque (`UPDATE product_variations.stock` ou `UPDATE products.stock`), transferindo a autoridade de saldo para o **Ledger de Inventário Canônico** via RPC `apply_stock_adjustment`.

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                    Fluxo Canônico de Gestão de Estoque                     │
├────────────────────────────────────────────────────────────────────────────┤
│ 1. Usuário seleciona Ação no Modal (Entrada, Saída ou Contagem)            │
│ 2. Frontend resolve unit_kind (unit vs pack) e equivalência física         │
│ 3. Frontend gera operation_id único para idempotência                      │
│ 4. Invoca RPC apply_stock_adjustment com source_type = 'manual_adjustment' │
│ 5. RPC valida tenant (store_id), produto, variação, saldo negativo         │
│ 6. Grava registro imutável em stock_movements                              │
│ 7. Atualiza caches de variação/produto e retorna saldo confirmado          │
│ 8. Frontend refaz fetch do saldo confirmado (Pessimistic UI)               │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Modal de Gestão de Estoque (`ProductStockManagerModal.tsx`)

O modal existente foi preservado e enriquecido para suportar tanto produtos simples quanto produtos com variações/grades:

### 2.1 Produto Simples (sem variações)
- Apresenta o produto como alvo único de estoque.
- Exibe saldo atual em unidades.
- Permite Entrada (`increase`), Saída (`decrease`) ou Contagem (`count`).

### 2.2 Variação Unitária (Cor / Tamanho)
- Exibe a variação (ex: `Preto / 38`).
- Saldo comercial: `12 pares`.
- Operações de entrada, saída ou contagem com motivo e observações.

### 2.3 Variação de Grade / Pack
- Exibe a grade (ex: `Grade Alta · Preto`).
- Saldo comercial: `4 caixas`.
- Equivalente físico derivado automaticamente: `52 pares` (4 caixas × 13 pares/caixa).
- **Grade Alta**: 13 pares/caixa (ex: Entrada de 2 caixas → Novo saldo: 6 caixas / 78 pares).
- **Grade Baixa**: 8 pares/caixa (ex: 3 caixas = 24 pares).

---

## 3. Motivos Canônicos de Ajuste (`reason_code`)

| Código Canônico | Label na Interface |
| :--- | :--- |
| `inventory_count` | Contagem física / Balanço |
| `damage` | Avaria / Danificado |
| `loss` | Perda / Extravio |
| `found_stock` | Estoque encontrado |
| `correction` | Correção operacional |
| `initial_balance` | Saldo inicial |
| `other` | Outro motivo |

---

## 4. Idempotência e Concorrência

- **`operation_id` Obrigatório**: Cada intenção do usuário gera um UUID estável.
- **Detecção de Reenvio Idêntico**: A RPC detecta reenvio da mesma chave com mesmos parâmetros e retorna o saldo original sem duplicar mutações.
- **Detecção de Conflito (`IDEMPOTENCY_CONFLICT`)**: Se a mesma chave for reutilizada com parâmetros diferentes, a RPC rejeita a mutação com erro explícito.

---

## 5. Auditoria de Mutations Diretas no Frontend

| Arquivo | Trecho Auditado | Classificação | Ação Realizada na Sprint 10.4 |
| :--- | :--- | :--- | :--- |
| `ProductStockManagerModal.tsx` | `.update({ stock: variation.newStock })` | **MUST_MIGRATE** | **Migrado 100% para RPC `apply_stock_adjustment`** |
| `variationReconciliationService.ts` | `stock: matchedExisting.stock` | **CANONICAL** | Preservação de saldo no banco durante edição de metadados |
| `variationReconciliationService.ts` | `stock: 0` (novas pack variations) | **CANONICAL** | Grade nova nasce com saldo 0 |
| `useProducts.tsx` | `select("stock")` | **CANONICAL** | Leitura de saldo para catálogo |
