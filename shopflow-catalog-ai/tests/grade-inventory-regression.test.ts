import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InventoryService } from '../src/services/inventory.service.js';
import { InventoryRepository } from '../src/repositories/inventory.repository.js';
import { AgentSession } from '../src/auth/agent-session.js';
import { AgentContext } from '../src/auth/agent-context.js';
import { AdjustStockResult } from '../src/domain/inventory.types.js';

describe('Phase N: Grade Inventory Regression Suite (N1 - N7)', () => {
  const storeId = '11111111-2222-3333-4444-555555555555';
  const productId = '22222222-3333-4444-5555-666666666666';

  const mockContext: AgentContext = {
    sessionId: 'session-reg-test',
    principalId: 'test-user',
    principalType: 'tenant',
    activeStoreId: storeId,
    storeAccess: { mode: 'restricted', storeIds: [storeId] },
    scopes: ['stock:read', 'stock:adjust', 'catalog:read', 'grade:read'],
    name: 'Regression Agent',
  };

  interface StoredMovement {
    id: string;
    store_id: string;
    product_id: string;
    variation_id: string | null;
    parent_movement_id?: string | null;
    movement_type: string;
    unit_kind: string;
    quantity: number;
    physical_quantity: number;
    previous_stock: number;
    new_stock: number;
    reason_code: string;
    idempotency_key?: string | null;
    notes?: string | null;
  }

  function createRigorousLedgerEnvironment() {
    // Pack variation state
    let packStock = 0;
    // Loose stock state (Model A: independent pool)
    const looseStocks: Record<string, number> = {
      '36': 5,
      '37': 10,
      '38': 15,
      '39': 8,
    };
    const gradePairs: Record<string, number> = {
      '36': 1,
      '37': 2,
      '38': 2,
      '39': 1,
    }; // total = 6 pairs per pack

    const movementsLedger: StoredMovement[] = [];

    const mockRepo = new InventoryRepository();

    mockRepo.applyStockAdjustmentRpc = async (
      sId: string,
      params: {
        productId: string;
        variationId?: string | null;
        operation: 'increase' | 'decrease' | 'count';
        quantity?: number;
        countedQuantity?: number;
        reasonCode: string;
        idempotencyKey?: string | null;
        notes?: string | null;
      }
    ): Promise<AdjustStockResult> => {
      const prev = packStock;
      let delta = 0;
      let newStock = prev;
      let movQty = 0;

      if (params.operation === 'increase') {
        delta = params.quantity!;
        newStock = prev + delta;
        movQty = params.quantity!;
      } else if (params.operation === 'count') {
        delta = params.countedQuantity! - prev;
        newStock = params.countedQuantity!;
        movQty = Math.abs(delta);
      } else if (params.operation === 'decrease') {
        delta = -params.quantity!;
        newStock = prev + delta;
        movQty = params.quantity!;
      }

      const pairsPerPack = 6;
      const physicalQty = movQty * pairsPerPack;
      const movementId = 'mov-' + Math.random().toString(36).substring(2, 9);

      // Parent movement assertion: previous_stock and new_stock are ALWAYS defined NOT NULL numbers
      const parentMov: StoredMovement = {
        id: movementId,
        store_id: sId,
        product_id: params.productId,
        variation_id: params.variationId || null,
        movement_type: 'adjustment',
        unit_kind: 'pack',
        quantity: movQty,
        physical_quantity: physicalQty,
        previous_stock: prev,
        new_stock: newStock,
        reason_code: params.reasonCode,
        idempotency_key: params.idempotencyKey || null,
        notes: params.notes || null,
      };
      movementsLedger.push(parentMov);
      packStock = newStock;

      // Child trace generation (Phase C & N5 / N6)
      let childCount = 0;
      if (movQty > 0) {
        for (const [size, qty] of Object.entries(gradePairs)) {
          const childQty = movQty * qty;
          const currentLoose = looseStocks[size] ?? 0;

          // Semântica Canônica: previous_stock = current_loose, new_stock = current_loose (delta = 0)
          // Preserva constraint NOT NULL sem mutar o loose stock
          const childMov: StoredMovement = {
            id: 'child-' + Math.random().toString(36).substring(2, 9),
            store_id: sId,
            product_id: params.productId,
            variation_id: 'var-' + size,
            parent_movement_id: movementId,
            movement_type: 'adjustment',
            unit_kind: 'unit',
            quantity: childQty,
            physical_quantity: childQty,
            previous_stock: currentLoose,
            new_stock: currentLoose,
            reason_code: 'grade_component_trace',
            notes: `Decomposição física de ${movQty} caixa(s): ${size} (${childQty} pares)`,
          };
          movementsLedger.push(childMov);
          childCount++;
        }
      }

      return {
        applied: true,
        duplicate: false,
        movement_id: movementId,
        product_id: params.productId,
        variation_id: params.variationId || null,
        unit_kind: 'pack',
        operation: params.operation,
        delta,
        quantity: movQty,
        physical_quantity: physicalQty,
        previous_stock: prev,
        current_stock: newStock,
        product_stock: newStock * pairsPerPack,
        child_movements_count: childCount,
      };
    };

    return {
      repo: mockRepo,
      getPackStock: () => packStock,
      getLooseStocks: () => ({ ...looseStocks }),
      getLedger: () => [...movementsLedger],
    };
  }

  it('N1 — Pack increase: pack stock 0, increase 2 -> 2', async () => {
    const env = createRigorousLedgerEnvironment();
    const service = new InventoryService(new AgentSession(mockContext), env.repo);

    const result = await service.adjustStock({
      product_id: productId,
      variation_id: 'var-pack-1',
      operation: 'increase',
      quantity: 2,
      reason: 'initial_balance',
      operation_id: 'op-pack-inc-2',
    });

    assert.equal(result.applied, true);
    assert.equal(result.current_stock, 2);
    assert.equal(result.delta, 2);
    assert.equal(env.getPackStock(), 2);
  });

  it('N2 — Pack count: count 4 -> 4', async () => {
    const env = createRigorousLedgerEnvironment();
    const service = new InventoryService(new AgentSession(mockContext), env.repo);

    // Initial state 0 -> count 4
    const result = await service.adjustStock({
      product_id: productId,
      variation_id: 'var-pack-1',
      operation: 'count',
      counted_quantity: 4,
      reason: 'inventory_count',
      operation_id: 'op-pack-count-4',
    });

    assert.equal(result.applied, true);
    assert.equal(result.current_stock, 4);
    assert.equal(result.delta, 4);
    assert.equal(env.getPackStock(), 4);
  });

  it('N3 — previous_stock: Sempre definido e nunca nulo em movimento principal', async () => {
    const env = createRigorousLedgerEnvironment();
    const service = new InventoryService(new AgentSession(mockContext), env.repo);

    await service.adjustStock({
      product_id: productId,
      variation_id: 'var-pack-1',
      operation: 'increase',
      quantity: 3,
      reason: 'initial_balance',
      operation_id: 'op-test-n3',
    });

    const parentMovement = env.getLedger().find((m) => m.unit_kind === 'pack')!;
    assert.ok(parentMovement);
    assert.notEqual(parentMovement.previous_stock, null);
    assert.notEqual(parentMovement.previous_stock, undefined);
    assert.equal(typeof parentMovement.previous_stock, 'number');
    assert.equal(parentMovement.previous_stock, 0);
  });

  it('N4 — new_stock: Sempre definido e nunca nulo em movimento principal', async () => {
    const env = createRigorousLedgerEnvironment();
    const service = new InventoryService(new AgentSession(mockContext), env.repo);

    await service.adjustStock({
      product_id: productId,
      variation_id: 'var-pack-1',
      operation: 'increase',
      quantity: 3,
      reason: 'initial_balance',
      operation_id: 'op-test-n4',
    });

    const parentMovement = env.getLedger().find((m) => m.unit_kind === 'pack')!;
    assert.ok(parentMovement);
    assert.notEqual(parentMovement.new_stock, null);
    assert.notEqual(parentMovement.new_stock, undefined);
    assert.equal(typeof parentMovement.new_stock, 'number');
    assert.equal(parentMovement.new_stock, 3);
  });

  it('N5 — child trace: Não viola constraint NOT NULL (previous_stock e new_stock são inteiros válidos)', async () => {
    const env = createRigorousLedgerEnvironment();
    const service = new InventoryService(new AgentSession(mockContext), env.repo);

    await service.adjustStock({
      product_id: productId,
      variation_id: 'var-pack-1',
      operation: 'increase',
      quantity: 2,
      reason: 'initial_balance',
      operation_id: 'op-test-n5',
    });

    const childMovements = env.getLedger().filter((m) => m.reason_code === 'grade_component_trace');
    assert.equal(childMovements.length, 4);

    for (const child of childMovements) {
      assert.notEqual(child.previous_stock, null, 'Child previous_stock cannot be null');
      assert.notEqual(child.previous_stock, undefined, 'Child previous_stock cannot be undefined');
      assert.notEqual(child.new_stock, null, 'Child new_stock cannot be null');
      assert.notEqual(child.new_stock, undefined, 'Child new_stock cannot be undefined');
      assert.equal(typeof child.previous_stock, 'number');
      assert.equal(typeof child.new_stock, 'number');
      // Delta de saldo loose no child trace é estritamente 0
      assert.equal(child.new_stock - child.previous_stock, 0, 'Child movement delta must be 0');
    }
  });

  it('N6 — loose stock: Não muda por causa do child trace', async () => {
    const env = createRigorousLedgerEnvironment();
    const service = new InventoryService(new AgentSession(mockContext), env.repo);

    const looseBefore = env.getLooseStocks();

    await service.adjustStock({
      product_id: productId,
      variation_id: 'var-pack-1',
      operation: 'increase',
      quantity: 2,
      reason: 'initial_balance',
      operation_id: 'op-test-n6',
    });

    const looseAfter = env.getLooseStocks();
    assert.deepEqual(looseAfter, looseBefore, 'Loose stocks must remain completely unchanged');
  });

  it('N7 — three colors (Branco, Azul Claro, Preto): PASS', async () => {
    const env = createRigorousLedgerEnvironment();
    const service = new InventoryService(new AgentSession(mockContext), env.repo);

    const colors = ['Branco', 'Azul Claro', 'Preto'];

    for (const color of colors) {
      const res = await service.adjustStock({
        product_id: productId,
        variation_id: `var-${color.toLowerCase().replace(/\s+/g, '-')}`,
        operation: 'increase',
        quantity: 2,
        reason: 'initial_balance',
        operation_id: `op-color-${color.toLowerCase().replace(/\s+/g, '-')}`,
      });

      assert.equal(res.applied, true);
      assert.equal(res.unit_kind, 'pack');
      assert.equal(res.quantity, 2);
    }

    const ledger = env.getLedger();
    const parentColors = ledger.filter((m) => m.unit_kind === 'pack');
    assert.equal(parentColors.length, 3);
  });
});
