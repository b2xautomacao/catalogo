import test from 'node:test';
import assert from 'node:assert/strict';
import { InventoryService } from '../src/services/inventory.service.js';
import { InventoryRepository } from '../src/repositories/inventory.repository.js';
import { AgentSession } from '../src/auth/agent-session.js';
import { AgentContext } from '../src/auth/agent-context.js';
import {
  ProductNotFoundError,
  VariationNotFoundError,
  StockTargetMismatchError,
  DuplicateIdempotencyKeyError,
  InsufficientStockError,
  StoreContextRequiredError,
  ForbiddenError,
} from '../src/domain/errors.js';
import {
  StockMovementRecord,
  CreateStockMovementRecord,
  ProductStockState,
  VariationStockState,
  StockReconciliationResult,
} from '../src/domain/inventory.types.js';

// Mock InMemory Inventory Repository
class MockInventoryRepository extends InventoryRepository {
  public products: Map<string, ProductStockState & { storeId: string; stock: number }> = new Map();
  public variations: Map<string, VariationStockState> = new Map();
  public movements: StockMovementRecord[] = [];

  async getProductStockState(storeId: string, productId: string): Promise<ProductStockState | null> {
    const prod = this.products.get(productId);
    if (!prod || prod.storeId !== storeId) return null;
    return prod;
  }

  async getVariationStockState(
    storeId: string,
    productId: string,
    variationId: string
  ): Promise<VariationStockState | null> {
    const v = this.variations.get(variationId);
    if (!v || v.storeId !== storeId || v.productId !== productId) return null;
    return v;
  }

  async getMovementByIdempotencyKey(
    storeId: string,
    idempotencyKey: string
  ): Promise<StockMovementRecord | null> {
    const found = this.movements.find(
      (m) => m.store_id === storeId && m.idempotency_key === idempotencyKey
    );
    return found || null;
  }

  async recordMovement(record: CreateStockMovementRecord): Promise<StockMovementRecord> {
    const movement: StockMovementRecord = {
      id: `mov-${this.movements.length + 1}`,
      store_id: record.store_id,
      product_id: record.product_id,
      variation_id: record.variation_id || null,
      order_id: record.order_id || null,
      movement_type: record.movement_type,
      unit_kind: record.unit_kind || 'unit',
      quantity: record.quantity,
      physical_quantity: record.physical_quantity ?? record.quantity,
      previous_stock: record.previous_stock,
      new_stock: record.new_stock,
      idempotency_key: record.idempotency_key || null,
      reason_code: record.reason_code || null,
      source_type: record.source_type || 'system',
      source_id: record.source_id || null,
      parent_movement_id: record.parent_movement_id || null,
      notes: record.notes || null,
      created_at: new Date().toISOString(),
      expires_at: record.expires_at || null,
    };

    this.movements.push(movement);
    return movement;
  }

  async listMovements(storeId: string, filter: any = {}): Promise<StockMovementRecord[]> {
    return this.movements.filter((m) => {
      if (m.store_id !== storeId) return false;
      if (filter.productId && m.product_id !== filter.productId) return false;
      if (filter.variationId && m.variation_id !== filter.variationId) return false;
      if (filter.movementType && m.movement_type !== filter.movementType) return false;
      return true;
    });
  }

  async reconcileProductStock(storeId: string, productId: string): Promise<StockReconciliationResult> {
    const prod = await this.getProductStockState(storeId, productId);
    if (!prod) throw new Error('Product not found');

    const vars = Array.from(this.variations.values()).filter(
      (v) => v.storeId === storeId && v.productId === productId
    );

    const hasVars = vars.length > 0;
    const varsTotal = hasVars ? vars.reduce((acc, v) => acc + v.stock, 0) : null;

    let status: StockReconciliationResult['status'] = 'synced';
    if (hasVars && varsTotal !== null && varsTotal !== prod.stock) {
      status = 'mismatch';
    }

    return {
      productId,
      storeId,
      productStock: prod.stock,
      variationsTotalStock: varsTotal,
      ledgerNetMovement: 0,
      status,
      variationsBreakdown: vars.map((v) => ({
        variationId: v.variationId,
        sku: v.sku,
        isGrade: v.isGrade,
        stock: v.stock,
      })),
    };
  }
}

// Mock Audit Service
class MockAuditService {
  public events: any[] = [];
  async logStockMovement(context: any, movementId: string, details: any) {
    this.events.push({ context, movementId, details });
  }
  async logEvent(event: any) {
    this.events.push(event);
  }
}

test('Inventory Ledger Foundations Suite', async (t) => {
  const STORE_A = 'store-uuid-aaaa-1111';
  const STORE_B = 'store-uuid-bbbb-2222';

  const mockRepo = new MockInventoryRepository();
  const mockAudit = new MockAuditService();

  // Setup initial products & variations
  mockRepo.products.set('prod-simple-1', {
    productId: 'prod-simple-1',
    storeId: STORE_A,
    productName: 'Camiseta Basica',
    stock: 20,
    reservedStock: 0,
    availableStock: 20,
    allowNegativeStock: false,
    hasVariations: false,
  });

  mockRepo.products.set('prod-shoes-1', {
    productId: 'prod-shoes-1',
    storeId: STORE_A,
    productName: 'Tenis Runner Pro',
    stock: 30,
    reservedStock: 2,
    availableStock: 28,
    allowNegativeStock: false,
    hasVariations: true,
  });

  // Unit variations
  mockRepo.variations.set('var-38-black', {
    variationId: 'var-38-black',
    productId: 'prod-shoes-1',
    storeId: STORE_A,
    name: 'Tenis Runner Pro Preto 38',
    sku: 'TRP-BLK-38',
    color: 'Preto',
    size: '38',
    isGrade: false,
    stock: 10,
  });

  // Grade closed pack variation (Grade Alta = 13 pairs)
  mockRepo.variations.set('var-grade-alta-black', {
    variationId: 'var-grade-alta-black',
    productId: 'prod-shoes-1',
    storeId: STORE_A,
    name: 'Grade Alta Tenis Runner Pro Preto',
    sku: 'TRP-BLK-GA',
    color: 'Preto',
    size: null,
    isGrade: true,
    gradeSizes: [36, 37, 38, 39, 40, 41, 42],
    gradePairs: [1, 2, 2, 3, 2, 2, 1], // sum = 13
    stock: 2, // 2 boxes
  });

  // Product belonging to Store B
  mockRepo.products.set('prod-store-b', {
    productId: 'prod-store-b',
    storeId: STORE_B,
    productName: 'Produto Exclusivo Loja B',
    stock: 50,
    reservedStock: 0,
    availableStock: 50,
    allowNegativeStock: false,
    hasVariations: false,
  });

  const tenantContext: AgentContext = {
    principalId: 'agent-tenant-a',
    principalType: 'tenant',
    storeAccess: { mode: 'restricted', storeIds: [STORE_A] },
    activeStoreId: STORE_A,
    scopes: ['catalog:read', 'catalog:write'],
    sessionId: 'sess-inv-1',
  };

  const readOnlyContext: AgentContext = {
    principalId: 'agent-read-only',
    principalType: 'tenant',
    storeAccess: { mode: 'restricted', storeIds: [STORE_A] },
    activeStoreId: STORE_A,
    scopes: ['catalog:read'],
    sessionId: 'sess-inv-ro',
  };

  const superadminNoStoreContext: AgentContext = {
    principalId: 'agent-superadmin',
    principalType: 'superadmin',
    storeAccess: { mode: 'all' },
    activeStoreId: null,
    scopes: ['catalog:read', 'catalog:write', 'store:select'],
    sessionId: 'sess-inv-admin',
  };

  await t.test('1. Simple product stock inspection and movement recording', async () => {
    const session = new AgentSession(tenantContext);
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    const state = await service.getProductStock('prod-simple-1');
    assert.equal(state.productId, 'prod-simple-1');
    assert.equal(state.stock, 20);
    assert.equal(state.hasVariations, false);

    const result = await service.recordSafeMovement({
      productId: 'prod-simple-1',
      movementType: 'sale',
      quantity: 5,
      unitKind: 'unit',
      reasonCode: 'order_fulfillment',
    });

    assert.equal(result.isDuplicate, false);
    assert.equal(result.movement.quantity, 5);
    assert.equal(result.movement.physical_quantity, 5);
    assert.equal(result.movement.unit_kind, 'unit');
    assert.equal(result.movement.variation_id, null);
  });

  await t.test('2. Unit variation movement (Product + Size + Color)', async () => {
    const session = new AgentSession(tenantContext);
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    const varState = await service.getVariationStock('prod-shoes-1', 'var-38-black');
    assert.equal(varState.sku, 'TRP-BLK-38');
    assert.equal(varState.stock, 10);

    const result = await service.recordSafeMovement({
      productId: 'prod-shoes-1',
      variationId: 'var-38-black',
      movementType: 'adjustment',
      quantity: 3, // +3 units
      unitKind: 'unit',
      reasonCode: 'inventory_count',
      notes: 'Contagem física revelou 3 pares a mais',
    });

    assert.equal(result.isDuplicate, false);
    assert.equal(result.movement.variation_id, 'var-38-black');
    assert.equal(result.movement.quantity, 3);
    assert.equal(result.movement.physical_quantity, 3);
    assert.equal(result.movement.reason_code, 'inventory_count');
  });

  await t.test('3. Grade pack movement: quantity = 2 boxes equals 26 physical pairs', async () => {
    const session = new AgentSession(tenantContext);
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    const result = await service.recordSafeMovement({
      productId: 'prod-shoes-1',
      variationId: 'var-grade-alta-black',
      movementType: 'sale',
      quantity: 2, // 2 packs
      unitKind: 'pack',
      reasonCode: 'order_fulfillment',
    });

    assert.equal(result.isDuplicate, false);
    assert.equal(result.movement.unit_kind, 'pack');
    assert.equal(result.movement.quantity, 2);
    // Grade Alta has [1, 2, 2, 3, 2, 2, 1] = 13 pairs per pack. 2 packs = 26 pairs.
    assert.equal(result.movement.physical_quantity, 26);
  });

  await t.test('4. Target mismatch: variation belonging to another product is rejected', async () => {
    const session = new AgentSession(tenantContext);
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    await assert.rejects(
      async () => {
        await service.recordSafeMovement({
          productId: 'prod-simple-1', // Does not match var-38-black's parent
          variationId: 'var-38-black',
          movementType: 'adjustment',
          quantity: 1,
        });
      },
      (err: any) => {
        assert(err instanceof StockTargetMismatchError);
        return true;
      }
    );
  });

  await t.test('5. Cross-tenant isolation: querying Store B product from Store A session is rejected', async () => {
    const session = new AgentSession(tenantContext);
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    await assert.rejects(
      async () => {
        await service.getProductStock('prod-store-b');
      },
      (err: any) => {
        assert(err instanceof ProductNotFoundError);
        return true;
      }
    );
  });

  await t.test('6. Idempotency guard: duplicate idempotency key returns existing movement without duplication', async () => {
    const session = new AgentSession(tenantContext);
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    const first = await service.recordSafeMovement({
      productId: 'prod-simple-1',
      movementType: 'return',
      quantity: 2,
      idempotencyKey: 'refund-order-999-item-1',
      reasonCode: 'cancellation',
    });

    assert.equal(first.isDuplicate, false);
    assert.equal(first.movement.idempotency_key, 'refund-order-999-item-1');

    // Second call with same idempotency key
    const second = await service.recordSafeMovement({
      productId: 'prod-simple-1',
      movementType: 'return',
      quantity: 2,
      idempotencyKey: 'refund-order-999-item-1',
      reasonCode: 'cancellation',
    });

    assert.equal(second.isDuplicate, true);
    assert.equal(second.movement.id, first.movement.id);
  });

  await t.test('7. Scope enforcement: catalog:read cannot record movement (ForbiddenError)', async () => {
    const session = new AgentSession(readOnlyContext);
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    await assert.rejects(
      async () => {
        await service.recordSafeMovement({
          productId: 'prod-simple-1',
          movementType: 'adjustment',
          quantity: 1,
        });
      },
      (err: any) => {
        assert(err instanceof ForbiddenError);
        return true;
      }
    );
  });

  await t.test('8. Superadmin without active store is rejected with StoreContextRequiredError', async () => {
    const session = new AgentSession(superadminNoStoreContext);
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    await assert.rejects(
      async () => {
        await service.getProductStock('prod-simple-1');
      },
      (err: any) => {
        assert(err instanceof StoreContextRequiredError);
        return true;
      }
    );
  });

  await t.test('9. Stock reconciliation: detects synced and mismatch states', async () => {
    const session = new AgentSession(tenantContext);
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    // Simple product (no variations) is synced
    const recSimple = await service.reconcileStock('prod-simple-1');
    assert.equal(recSimple.status, 'synced');
    assert.equal(recSimple.productStock, 20);

    // Product with mismatch: productStock is 30, but variations sum is 10 + 2 = 12
    const recShoes = await service.reconcileStock('prod-shoes-1');
    assert.equal(recShoes.status, 'mismatch');
    assert.equal(recShoes.productStock, 30);
    assert.equal(recShoes.variationsTotalStock, 12);
  });
});
