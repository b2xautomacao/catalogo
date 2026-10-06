import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculatePairsPerPack,
  calculateEquivalentUnits,
  generateOperationId,
  mapInventoryError,
  applyStockAdjustment,
  StockAdjustmentInput,
} from "../inventoryDomainService.js";

describe("InventoryDomainService — Domain & Frontend Logic Tests", () => {
  it("1. calculatePairsPerPack e calculateEquivalentUnits: resolve unidades físicas de calçados e grades", () => {
    // Produto simples ou variação unitária
    assert.equal(calculatePairsPerPack(false), 1);
    assert.equal(calculateEquivalentUnits(12, false), 12);

    // Grade Alta: 13 pares por caixa
    const gradeAltaPairs = [1, 2, 2, 3, 2, 2, 1];
    assert.equal(calculatePairsPerPack(true, gradeAltaPairs), 13);
    assert.equal(calculateEquivalentUnits(4, true, gradeAltaPairs), 52); // 4 caixas = 52 pares
    assert.equal(calculateEquivalentUnits(6, true, gradeAltaPairs), 78); // 6 caixas = 78 pares

    // Grade Baixa: 8 pares por caixa
    const gradeBaixaPairs = [1, 2, 2, 2, 1];
    assert.equal(calculatePairsPerPack(true, gradeBaixaPairs), 8);
    assert.equal(calculateEquivalentUnits(3, true, gradeBaixaPairs), 24); // 3 caixas = 24 pares
  });

  it("2. generateOperationId: produz UUIDs válidos e únicos para idempotência", () => {
    const id1 = generateOperationId();
    const id2 = generateOperationId();
    assert.ok(id1);
    assert.ok(id2);
    assert.notEqual(id1, id2);
  });

  it("3. mapInventoryError: converte códigos técnicos em mensagens amigáveis em Português", () => {
    assert.equal(
      mapInventoryError(new Error("INSUFFICIENT_STOCK")),
      "Saldo insuficiente para realizar esta retirada de estoque."
    );
    assert.equal(
      mapInventoryError(new Error("INVENTORY_TARGET_NOT_FOUND")),
      "Produto ou variação não encontrado para esta loja."
    );
    assert.equal(
      mapInventoryError(new Error("IDEMPOTENCY_CONFLICT: payload mismatch")),
      "Conflito de operação: Esta ação já foi executada com parâmetros diferentes."
    );
  });

  it("4. applyStockAdjustment (increase): invoca RPC com payload correto e source_type = manual_adjustment", async () => {
    let rpcCalledWith: any = null;
    const mockSupabase = {
      rpc: (fnName: string, args: any) => {
        if (fnName === "apply_stock_adjustment") {
          rpcCalledWith = args;
          return Promise.resolve({
            data: {
              applied: true,
              movement_id: "mov-123",
              product_id: args.p_product_id,
              variation_id: args.p_variation_id,
              unit_kind: "unit",
              operation: "increase",
              delta: 5,
              quantity: 5,
              physical_quantity: 5,
              previous_stock: 10,
              current_stock: 15,
              product_stock: 15,
            },
            error: null,
          });
        }
        return Promise.reject(new Error("Unknown function"));
      },
    };

    const input: StockAdjustmentInput = {
      store_id: "store-uuid-1",
      product_id: "prod-uuid-1",
      variation_id: "var-uuid-1",
      operation: "increase",
      quantity: 5,
      reason_code: "found_stock",
      operation_id: "op-uuid-123",
      source_type: "manual_adjustment",
      notes: "Encontrado no depósito A",
    };

    const result = await applyStockAdjustment(mockSupabase, input);
    assert.equal(result.applied, true);
    assert.equal(result.delta, 5);
    assert.equal(result.current_stock, 15);

    assert.equal(rpcCalledWith.p_store_id, "store-uuid-1");
    assert.equal(rpcCalledWith.p_product_id, "prod-uuid-1");
    assert.equal(rpcCalledWith.p_variation_id, "var-uuid-1");
    assert.equal(rpcCalledWith.p_operation, "increase");
    assert.equal(rpcCalledWith.p_quantity, 5);
    assert.equal(rpcCalledWith.p_reason_code, "found_stock");
    assert.equal(rpcCalledWith.p_idempotency_key, "op-uuid-123");
    assert.equal(rpcCalledWith.p_source_type, "manual_adjustment");
    assert.equal(rpcCalledWith.p_notes, "Encontrado no depósito A");
  });

  it("5. applyStockAdjustment (count): converte contagem física em delta canônico", async () => {
    let rpcCalledWith: any = null;
    const mockSupabase = {
      rpc: (fnName: string, args: any) => {
        rpcCalledWith = args;
        return Promise.resolve({
          data: {
            applied: true,
            movement_id: "mov-456",
            product_id: args.p_product_id,
            variation_id: null,
            unit_kind: "unit",
            operation: "count",
            delta: 3,
            quantity: 3,
            physical_quantity: 3,
            previous_stock: 11,
            current_stock: 14,
            product_stock: 14,
          },
          error: null,
        });
      },
    };

    const input: StockAdjustmentInput = {
      store_id: "store-uuid-1",
      product_id: "prod-uuid-1",
      operation: "count",
      counted_quantity: 14,
      reason_code: "inventory_count",
      operation_id: "op-uuid-count-1",
    };

    const result = await applyStockAdjustment(mockSupabase, input);
    assert.equal(result.applied, true);
    assert.equal(result.current_stock, 14);
    assert.equal(result.delta, 3);
    assert.equal(rpcCalledWith.p_counted_quantity, 14);
    assert.equal(rpcCalledWith.p_operation, "count");
  });

  it("6. Grade Alta Adjustment (4 caixas + 2 = 6 caixas / 78 pares físicos)", async () => {
    const mockSupabase = {
      rpc: () =>
        Promise.resolve({
          data: {
            applied: true,
            movement_id: "mov-pack-1",
            product_id: "prod-1",
            variation_id: "pack-var-1",
            unit_kind: "pack",
            operation: "increase",
            delta: 2,
            quantity: 2,
            physical_quantity: 26, // 2 caixas * 13 pares
            previous_stock: 4, // 4 caixas
            current_stock: 6, // 6 caixas
            product_stock: 78, // 6 * 13 = 78 pares
          },
          error: null,
        }),
    };

    const input: StockAdjustmentInput = {
      store_id: "store-1",
      product_id: "prod-1",
      variation_id: "pack-var-1",
      operation: "increase",
      quantity: 2,
      reason_code: "initial_balance",
      operation_id: "op-grade-1",
    };

    const result = await applyStockAdjustment(mockSupabase, input);
    assert.equal(result.unit_kind, "pack");
    assert.equal(result.previous_stock, 4);
    assert.equal(result.current_stock, 6);
    assert.equal(result.physical_quantity, 26);
    assert.equal(result.product_stock, 78);
  });

  it("7. Validações de entrada: rejeita quantidade <= 0 para increase/decrease", async () => {
    const mockSupabase = { rpc: () => Promise.resolve({ data: null, error: null }) };

    await assert.rejects(
      () =>
        applyStockAdjustment(mockSupabase, {
          store_id: "store-1",
          product_id: "prod-1",
          operation: "increase",
          quantity: 0,
          reason_code: "correction",
          operation_id: "op-1",
        }),
      /INVALID_STOCK_OPERATION/
    );

    await assert.rejects(
      () =>
        applyStockAdjustment(mockSupabase, {
          store_id: "store-1",
          product_id: "prod-1",
          operation: "count",
          counted_quantity: -1,
          reason_code: "correction",
          operation_id: "op-2",
        }),
      /INVALID_STOCK_OPERATION/
    );
  });
});
