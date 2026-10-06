import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizePriceTiers,
  validatePriceTiers,
  reconcileProductPriceTiers,
  PriceTierItem,
} from "../priceTierDomainService.js";

describe("PriceTierDomainService — Domain & Validation Tests", () => {
  it("1. Produto sem faixas (array vazio): retorna valid=true e zero erros", () => {
    const res = validatePriceTiers([]);
    assert.equal(res.valid, true);
    assert.equal(res.errors.length, 0);

    const normalized = normalizePriceTiers([]);
    assert.deepEqual(normalized, []);
  });

  it("2. Produto com 1 faixa válida: valida quantidade mínima e preço", () => {
    const tiers: PriceTierItem[] = [
      { min_quantity: 3, price: 89.9, tier_name: "Atacado 3+", tier_order: 1, tier_type: "gradual_wholesale" },
    ];

    const res = validatePriceTiers(tiers, 100);
    assert.equal(res.valid, true);
    assert.equal(res.errors.length, 0);

    const normalized = normalizePriceTiers(tiers);
    assert.equal(normalized.length, 1);
    assert.equal(normalized[0].tier_order, 1);
    assert.equal(normalized[0].min_quantity, 3);
    assert.equal(normalized[0].price, 89.9);
  });

  it("3. Múltiplas faixas com quantidades crescentes: normaliza e ordena corretamente", () => {
    const inputTiers: PriceTierItem[] = [
      { min_quantity: 10, price: 70.0, tier_name: "Lote 10+", tier_order: 3, tier_type: "gradual_wholesale" },
      { min_quantity: 3, price: 90.0, tier_name: "Lote 3+", tier_order: 1, tier_type: "gradual_wholesale" },
      { min_quantity: 6, price: 80.0, tier_name: "Lote 6+", tier_order: 2, tier_type: "gradual_wholesale" },
    ];

    const normalized = normalizePriceTiers(inputTiers);
    assert.equal(normalized.length, 3);
    assert.equal(normalized[0].min_quantity, 3);
    assert.equal(normalized[0].tier_order, 1);
    assert.equal(normalized[1].min_quantity, 6);
    assert.equal(normalized[1].tier_order, 2);
    assert.equal(normalized[2].min_quantity, 10);
    assert.equal(normalized[2].tier_order, 3);

    const res = validatePriceTiers(normalized, 100);
    assert.equal(res.valid, true);
    assert.equal(res.errors.length, 0);
  });

  it("4. Rejeita quantidades não-crescentes ou sobrepostas (overlap)", () => {
    const invalidTiers: PriceTierItem[] = [
      { min_quantity: 5, price: 90.0, tier_name: "Tier 1", tier_order: 1, tier_type: "gradual_wholesale" },
      { min_quantity: 5, price: 80.0, tier_name: "Tier 2", tier_order: 2, tier_type: "gradual_wholesale" },
    ];

    const res = validatePriceTiers(invalidTiers, 100);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes("estritamente maior que a faixa anterior")));
  });

  it("5. Rejeita preços menores ou iguais a zero ou preço maior que o varejo", () => {
    const invalidPriceTiers: PriceTierItem[] = [
      { min_quantity: 3, price: 0, tier_name: "Tier 1", tier_order: 1, tier_type: "gradual_wholesale" },
    ];
    const res1 = validatePriceTiers(invalidPriceTiers, 100);
    assert.equal(res1.valid, false);
    assert.ok(res1.errors.some((e) => e.includes("maior que zero")));

    const higherThanRetail: PriceTierItem[] = [
      { min_quantity: 3, price: 150, tier_name: "Tier 1", tier_order: 1, tier_type: "gradual_wholesale" },
    ];
    const res2 = validatePriceTiers(higherThanRetail, 100);
    assert.equal(res2.valid, false);
    assert.ok(res2.errors.some((e) => e.includes("não pode ser superior ao preço de varejo")));
  });

  it("6. Limita rigorosamente a no máximo 4 faixas (respeitando constraint de banco)", () => {
    const fiveTiers: PriceTierItem[] = [
      { min_quantity: 2, price: 95, tier_name: "T1", tier_order: 1, tier_type: "gradual_wholesale" },
      { min_quantity: 4, price: 90, tier_name: "T2", tier_order: 2, tier_type: "gradual_wholesale" },
      { min_quantity: 6, price: 85, tier_name: "T3", tier_order: 3, tier_type: "gradual_wholesale" },
      { min_quantity: 8, price: 80, tier_name: "T4", tier_order: 4, tier_type: "gradual_wholesale" },
      { min_quantity: 10, price: 75, tier_name: "T5", tier_order: 5, tier_type: "gradual_wholesale" },
    ];

    const normalized = normalizePriceTiers(fiveTiers);
    assert.equal(normalized.length, 4); // Normalizador trunca em 4
    assert.equal(normalized[3].tier_order, 4);
  });

  it("7. Reconciliação não-destrutiva: preserva IDs existentes em UPDATE e insere novos em CREATE", async () => {
    const existingDb = [
      { id: "tier-uuid-1", product_id: "prod-1", tier_name: "Faixa 1", tier_order: 1, min_quantity: 3, price: 90.0, is_active: true },
      { id: "tier-uuid-2", product_id: "prod-1", tier_name: "Faixa 2", tier_order: 2, min_quantity: 6, price: 80.0, is_active: true },
    ];

    const updatesExecuted: any[] = [];
    const insertsExecuted: any[] = [];
    const deletesExecuted: any[] = [];

    const mockSupabase = {
      from: (table: string) => ({
        select: () => ({
          eq: (col: string, val: string) => Promise.resolve({ data: existingDb, error: null }),
        }),
        update: (payload: any) => ({
          eq: (col: string, val: string) => {
            updatesExecuted.push({ id: val, payload });
            return Promise.resolve({ error: null });
          },
        }),
        insert: (payload: any) => {
          insertsExecuted.push(payload);
          return Promise.resolve({ error: null });
        },
        delete: () => ({
          eq: (col: string, val: string) => {
            deletesExecuted.push(val);
            return Promise.resolve({ error: null });
          },
        }),
      }),
    };

    // Desired: Atualizar Faixa 1 (novo preço 88), Preservar Faixa 2 (sem alteração), Criar Faixa 3 (10+ un, R$ 70)
    const desired: PriceTierItem[] = [
      { id: "tier-uuid-1", min_quantity: 3, price: 88.0, tier_name: "Faixa 1 Atualizada", tier_order: 1, tier_type: "gradual_wholesale" },
      { id: "tier-uuid-2", min_quantity: 6, price: 80.0, tier_name: "Faixa 2", tier_order: 2, tier_type: "gradual_wholesale" },
      { min_quantity: 10, price: 70.0, tier_name: "Faixa 3 Nova", tier_order: 3, tier_type: "gradual_wholesale" },
    ];

    const result = await reconcileProductPriceTiers(mockSupabase, "prod-1", desired);
    assert.equal(result.success, true);
    assert.equal(result.updated, 1); // Apenas Faixa 1 mudou
    assert.equal(result.created, 1); // Faixa 3 foi inserida
    assert.equal(result.removed, 0);

    assert.equal(updatesExecuted.length, 1);
    assert.equal(updatesExecuted[0].id, "tier-uuid-1");
    assert.equal(updatesExecuted[0].payload.price, 88.0);

    assert.equal(insertsExecuted.length, 1);
    assert.equal(insertsExecuted[0].product_id, "prod-1");
    assert.equal(insertsExecuted[0].price, 70.0);
    assert.equal(insertsExecuted[0].min_quantity, 10);
  });

  it("8. Reconciliação segura de remoção: remove faixas que não estão mais no formulário", async () => {
    const existingDb = [
      { id: "tier-uuid-1", product_id: "prod-1", tier_name: "Faixa 1", tier_order: 1, min_quantity: 3, price: 90.0, is_active: true },
      { id: "tier-uuid-2", product_id: "prod-1", tier_name: "Faixa 2", tier_order: 2, min_quantity: 6, price: 80.0, is_active: true },
    ];

    const deletesExecuted: any[] = [];
    const mockSupabase = {
      from: (table: string) => ({
        select: () => ({
          eq: () => Promise.resolve({ data: existingDb, error: null }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
        insert: () => Promise.resolve({ error: null }),
        delete: () => ({
          eq: (col: string, val: string) => {
            deletesExecuted.push(val);
            return Promise.resolve({ error: null });
          },
        }),
      }),
    };

    // Desired: Apenas Faixa 1 (Faixa 2 removida)
    const desired: PriceTierItem[] = [
      { id: "tier-uuid-1", min_quantity: 3, price: 90.0, tier_name: "Faixa 1", tier_order: 1, tier_type: "gradual_wholesale" },
    ];

    const result = await reconcileProductPriceTiers(mockSupabase, "prod-1", desired);
    assert.equal(result.success, true);
    assert.equal(result.removed, 1);
    assert.equal(deletesExecuted.length, 1);
    assert.equal(deletesExecuted[0], "tier-uuid-2");
  });
});
