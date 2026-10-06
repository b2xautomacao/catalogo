import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InventoryService } from '../src/services/inventory.service.js';
import { InventoryRepository } from '../src/repositories/inventory.repository.js';
import { AgentSession } from '../src/auth/agent-session.js';
import { AgentContext } from '../src/auth/agent-context.js';
import { AdjustStockSchema, ConsultarEstoqueSchema } from '../src/schemas/inventory.schema.js';
import {
  ForbiddenError,
  StoreContextRequiredError,
  InventoryTargetNotFoundError,
  InsufficientStockError,
  InvalidStockOperationError,
  IdempotencyConflictError,
  InvalidArgumentError,
} from '../src/domain/errors.js';
import {
  AdjustStockResult,
  ProductStockState,
  VariationStockState,
  StockReconciliationResult,
} from '../src/domain/inventory.types.js';

describe('Sprint 8.1: AdjustStockSchema & Idempotency / Mass Assignment Guard', () => {
  it('AdjustStockSchema accepts valid increase, decrease, and count payloads with operation_id', () => {
    const validIncrease = AdjustStockSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      operation: 'increase',
      quantity: 5,
      reason: 'found_stock',
      operation_id: 'op-increase-001',
      notes: 'Achado no depósito',
    });
    assert.equal(validIncrease.success, true);

    const validDecrease = AdjustStockSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      variation_id: '22222222-2222-4222-8222-222222222222',
      operation: 'decrease',
      quantity: 2,
      reason: 'damage',
      operation_id: 'op-decrease-001',
    });
    assert.equal(validDecrease.success, true);

    const validCount = AdjustStockSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      operation: 'count',
      counted_quantity: 15,
      reason: 'inventory_count',
      operation_id: 'op-count-001',
    });
    assert.equal(validCount.success, true);
  });

  it('AdjustStockSchema STRICTLY REJECTS missing operation_id or operation_id shorter than 8 chars', () => {
    const missingOpId = AdjustStockSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      operation: 'increase',
      quantity: 5,
      reason: 'found_stock',
    });
    assert.equal(missingOpId.success, false);

    const shortOpId = AdjustStockSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      operation: 'increase',
      quantity: 5,
      reason: 'found_stock',
      operation_id: 'short',
    });
    assert.equal(shortOpId.success, false);
  });

  it('AdjustStockSchema STRICTLY REJECTS forbidden fields (store_id, unit_kind, physical_quantity, movement_type, source_type, previous_stock, new_stock)', () => {
    const forbiddenFields = [
      { store_id: '11111111-1111-4111-8111-111111111111' },
      { unit_kind: 'pack' },
      { physical_quantity: 26 },
      { movement_type: 'sale' },
      { source_type: 'system' },
      { previous_stock: 10 },
      { new_stock: 15 },
    ];

    for (const forbidden of forbiddenFields) {
      const parsed = AdjustStockSchema.safeParse({
        product_id: '11111111-1111-4111-8111-111111111111',
        operation: 'increase',
        quantity: 5,
        reason: 'found_stock',
        operation_id: 'op-valid-001',
        ...forbidden,
      });
      assert.equal(parsed.success, false, `Expected rejection for forbidden field: ${JSON.stringify(forbidden)}`);
    }
  });

  it('AdjustStockSchema rejects negative/zero quantities for increase/decrease and missing counted_quantity for count', () => {
    const invalidQty = AdjustStockSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      operation: 'increase',
      quantity: -5,
      reason: 'found_stock',
      operation_id: 'op-valid-001',
    });
    assert.equal(invalidQty.success, false);

    const zeroQty = AdjustStockSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      operation: 'decrease',
      quantity: 0,
      reason: 'damage',
      operation_id: 'op-valid-001',
    });
    assert.equal(zeroQty.success, false);

    const missingCount = AdjustStockSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      operation: 'count',
      reason: 'inventory_count',
      operation_id: 'op-valid-001',
    });
    assert.equal(missingCount.success, false);
  });

  it('ConsultarEstoqueSchema accepts valid payload and rejects extra fields', () => {
    const valid = ConsultarEstoqueSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      variation_id: '22222222-2222-4222-8222-222222222222',
    });
    assert.equal(valid.success, true);

    const invalidExtra = ConsultarEstoqueSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      store_id: '11111111-1111-4111-8111-111111111111',
    });
    assert.equal(invalidExtra.success, false);
  });
});

describe('Sprint 8.1: Inventory Service, Physical Aggregation, Scope & Idempotency Hardening', () => {
  const storeA = '11111111-1111-1111-1111-111111111111';
  const storeB = '22222222-2222-2222-2222-222222222222';

  interface MockProduct {
    id: string;
    store_id: string;
    name: string;
    stock: number;
    reserved_stock: number;
    allow_negative_stock: boolean;
  }

  interface MockVariation {
    id: string;
    product_id: string;
    store_id: string;
    sku: string;
    name: string;
    color: string;
    size: string | null;
    is_grade: boolean;
    grade_pairs: number[] | null;
    stock: number;
  }

  const createMockEnvironment = () => {
    const products = new Map<string, MockProduct>([
      [
        'prod-simple-1',
        {
          id: 'prod-simple-1',
          store_id: storeA,
          name: 'Camiseta Simples',
          stock: 10,
          reserved_stock: 0,
          allow_negative_stock: false,
        },
      ],
      [
        'prod-shoes-1',
        {
          id: 'prod-shoes-1',
          store_id: storeA,
          name: 'Tênis Runner Pro',
          // 4 (var-38) + 5*13 (var-grade-alta) = 4 + 65 = 69 physical units
          stock: 69,
          reserved_stock: 0,
          allow_negative_stock: false,
        },
      ],
      [
        'prod-mixed-shoes',
        {
          id: 'prod-mixed-shoes',
          store_id: storeA,
          name: 'Sapato Social Misto',
          // 5 (38) + 7 (39) + 3*13 (Grade Alta) = 5 + 7 + 39 = 51 physical units
          stock: 51,
          reserved_stock: 0,
          allow_negative_stock: false,
        },
      ],
      [
        'prod-store-b',
        {
          id: 'prod-store-b',
          store_id: storeB,
          name: 'Produto Loja B',
          stock: 50,
          reserved_stock: 0,
          allow_negative_stock: false,
        },
      ],
    ]);

    const variations = new Map<string, MockVariation>([
      [
        'var-38-black',
        {
          id: 'var-38-black',
          product_id: 'prod-shoes-1',
          store_id: storeA,
          sku: 'TRP-BLK-38',
          name: 'Tênis Runner Pro Preto 38',
          color: 'Preto',
          size: '38',
          is_grade: false,
          grade_pairs: null,
          stock: 4,
        },
      ],
      [
        'var-grade-alta-black',
        {
          id: 'var-grade-alta-black',
          product_id: 'prod-shoes-1',
          store_id: storeA,
          sku: 'TRP-BLK-GA',
          name: 'Grade Alta Tênis Runner Pro Preto',
          color: 'Preto',
          size: null,
          is_grade: true,
          grade_pairs: [1, 2, 2, 3, 2, 2, 1], // 13 pairs per pack
          stock: 5,
        },
      ],
      // Variações do produto misto: 5 units (38), 7 units (39), 3 packs (Grade Alta 13 pairs)
      [
        'var-mix-38',
        {
          id: 'var-mix-38',
          product_id: 'prod-mixed-shoes',
          store_id: storeA,
          sku: 'MIX-38',
          name: 'Sapato Social 38',
          color: 'Preto',
          size: '38',
          is_grade: false,
          grade_pairs: null,
          stock: 5,
        },
      ],
      [
        'var-mix-39',
        {
          id: 'var-mix-39',
          product_id: 'prod-mixed-shoes',
          store_id: storeA,
          sku: 'MIX-39',
          name: 'Sapato Social 39',
          color: 'Preto',
          size: '39',
          is_grade: false,
          grade_pairs: null,
          stock: 7,
        },
      ],
      [
        'var-mix-grade-alta',
        {
          id: 'var-mix-grade-alta',
          product_id: 'prod-mixed-shoes',
          store_id: storeA,
          sku: 'MIX-GA',
          name: 'Grade Alta Sapato Social',
          color: 'Preto',
          size: null,
          is_grade: true,
          grade_pairs: [1, 2, 2, 3, 2, 2, 1], // 13 pairs per pack
          stock: 3,
        },
      ],
      [
        'var-store-b',
        {
          id: 'var-store-b',
          product_id: 'prod-store-b',
          store_id: storeB,
          sku: 'SB-01',
          name: 'Variação Loja B',
          color: 'Azul',
          size: 'M',
          is_grade: false,
          grade_pairs: null,
          stock: 50,
        },
      ],
    ]);

    const movements = new Map<string, any>();
    const auditLogs: any[] = [];

    const calculatePhysicalStock = (productId: string) => {
      const vars = Array.from(variations.values()).filter((v) => v.product_id === productId);
      if (vars.length === 0) {
        return products.get(productId)?.stock || 0;
      }
      return vars.reduce((sum, v) => {
        let multiplier = 1;
        if (v.is_grade) {
          multiplier = (v.grade_pairs || []).reduce((acc, n) => acc + n, 0) || 1;
        }
        return sum + v.stock * multiplier;
      }, 0);
    };

    const mockRepo = {
      async getProductStockState(storeId: string, productId: string): Promise<ProductStockState | null> {
        const p = products.get(productId);
        if (!p || p.store_id !== storeId) return null;
        return {
          productId: p.id,
          storeId: p.store_id,
          productName: p.name,
          stock: p.stock,
          reservedStock: p.reserved_stock,
          availableStock: p.stock - p.reserved_stock,
          allowNegativeStock: p.allow_negative_stock,
          hasVariations: Array.from(variations.values()).some((v) => v.product_id === productId),
        };
      },

      async getVariationStockState(storeId: string, productId: string, variationId: string): Promise<VariationStockState | null> {
        const v = variations.get(variationId);
        if (!v || v.store_id !== storeId || v.product_id !== productId) return null;
        return {
          variationId: v.id,
          productId: v.product_id,
          storeId: v.store_id,
          name: v.name,
          sku: v.sku,
          color: v.color,
          size: v.size,
          isGrade: v.is_grade,
          gradePairs: v.grade_pairs,
          stock: v.stock,
        };
      },

      async reconcileProductStock(storeId: string, productId: string): Promise<StockReconciliationResult> {
        const p = products.get(productId);
        if (!p || p.store_id !== storeId) throw new Error('Not found');

        const vars = Array.from(variations.values()).filter((v) => v.product_id === productId && v.store_id === storeId);
        const hasVars = vars.length > 0;
        const physicalTotal = hasVars ? calculatePhysicalStock(productId) : null;

        return {
          productId,
          storeId,
          productStock: p.stock,
          variationsTotalStock: physicalTotal,
          ledgerNetMovement: 0,
          status: hasVars && physicalTotal !== p.stock ? 'mismatch' : 'synced',
          variationsBreakdown: vars.map((v) => ({
            variationId: v.id,
            sku: v.sku,
            isGrade: v.is_grade,
            stock: v.stock,
          })),
        };
      },

      async applyStockAdjustmentRpc(storeId: string, params: any): Promise<AdjustStockResult> {
        if (!params.idempotencyKey || String(params.idempotencyKey).trim() === '') {
          throw new InvalidArgumentError('INVALID_ARGUMENT: operation_id is required');
        }

        // Idempotency check with Conflict Detection
        const existing = movements.get(`${storeId}_${params.idempotencyKey}`);
        if (existing) {
          const reqQty = params.operation === 'count' ? params.countedQuantity : params.quantity;
          const isConflict =
            existing.product_id !== params.productId ||
            (existing.variation_id || null) !== (params.variationId || null) ||
            existing.reason_code !== params.reasonCode ||
            (params.operation !== 'count' && existing.quantity !== reqQty);

          if (isConflict) {
            throw new IdempotencyConflictError(
              `IDEMPOTENCY_CONFLICT: An operation with operation_id ${params.idempotencyKey} already exists with different payload`
            );
          }

          const currentStock = existing.variation_id
            ? variations.get(existing.variation_id)!.stock
            : products.get(existing.product_id)!.stock;

          return {
            applied: false,
            duplicate: true,
            movement_id: existing.id,
            product_id: existing.product_id,
            variation_id: existing.variation_id,
            unit_kind: existing.unit_kind,
            operation: params.operation,
            delta: existing.delta,
            quantity: existing.quantity,
            physical_quantity: existing.physical_quantity,
            previous_stock: existing.previous_stock,
            current_stock: currentStock,
            product_stock: products.get(existing.product_id)!.stock,
          };
        }

        // Product validation
        const product = products.get(params.productId);
        if (!product || product.store_id !== storeId) {
          throw new InventoryTargetNotFoundError();
        }

        // Variation validation
        let variation: MockVariation | null = null;
        let unitKind: 'unit' | 'pack' = 'unit';
        let pairsPerPack = 1;

        if (params.variationId) {
          variation = variations.get(params.variationId) || null;
          if (!variation || variation.product_id !== params.productId || variation.store_id !== storeId) {
            throw new InventoryTargetNotFoundError();
          }
          if (variation.is_grade) {
            unitKind = 'pack';
            pairsPerPack = (variation.grade_pairs || []).reduce((sum, n) => sum + n, 0) || 1;
          }
        }

        const currentStock = variation ? variation.stock : product.stock;
        let delta = 0;
        let newStock = currentStock;
        let movementQty = 0;

        if (params.operation === 'increase') {
          delta = params.quantity;
          newStock = currentStock + delta;
          movementQty = params.quantity;
        } else if (params.operation === 'decrease') {
          delta = -params.quantity;
          newStock = currentStock + delta;
          movementQty = params.quantity;
        } else if (params.operation === 'count') {
          delta = params.countedQuantity - currentStock;
          newStock = params.countedQuantity;
          movementQty = Math.abs(delta);
        }

        if (newStock < 0 && !product.allow_negative_stock) {
          throw new InsufficientStockError();
        }

        const physicalQty = unitKind === 'pack' ? movementQty * pairsPerPack : movementQty;
        const movementId = `mov-${Date.now()}-${Math.random()}`;

        const movementRecord = {
          id: movementId,
          store_id: storeId,
          product_id: params.productId,
          variation_id: params.variationId || null,
          unit_kind: unitKind,
          operation: params.operation,
          delta,
          quantity: movementQty,
          physical_quantity: physicalQty,
          previous_stock: currentStock,
          new_stock: newStock,
          idempotency_key: params.idempotencyKey,
          reason_code: params.reasonCode,
        };

        movements.set(`${storeId}_${params.idempotencyKey}`, movementRecord);

        // Update Operational Caches with CANONICAL PHYSICAL AGGREGATION
        if (variation) {
          variation.stock = newStock;
          product.stock = calculatePhysicalStock(params.productId);
        } else {
          product.stock = newStock;
        }

        return {
          applied: true,
          duplicate: false,
          movement_id: movementId,
          product_id: params.productId,
          variation_id: params.variationId || null,
          unit_kind: unitKind,
          operation: params.operation,
          delta,
          quantity: movementQty,
          physical_quantity: physicalQty,
          previous_stock: currentStock,
          current_stock: newStock,
          product_stock: product.stock,
        };
      },
    };

    const mockAudit = {
      async logStockAdjusted(context: any, movementId: string, details: any) {
        auditLogs.push({ context, movementId, details });
      },
    };

    return { products, variations, movements, auditLogs, mockRepo, mockAudit, calculatePhysicalStock };
  };

  it('1. Simple product increase: stock 10 + 5 -> 15 (ledger delta +5, physical 5)', async () => {
    const { products, mockRepo, mockAudit } = createMockEnvironment();
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-1',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['stock:adjust'],
      sessionId: 'sess-1',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    const result = await service.adjustStock({
      product_id: 'prod-simple-1',
      operation: 'increase',
      quantity: 5,
      reason: 'found_stock',
      operation_id: 'op-increase-sim-001',
    });

    assert.equal(result.applied, true);
    assert.equal(result.duplicate, false);
    assert.equal(result.delta, 5);
    assert.equal(result.previous_stock, 10);
    assert.equal(result.current_stock, 15);
    assert.equal(result.product_stock, 15);
    assert.equal(result.unit_kind, 'unit');
    assert.equal(result.physical_quantity, 5);
    assert.equal(products.get('prod-simple-1')!.stock, 15);
  });

  it('2. Simple product decrease: stock 15 - 4 -> 11 (ledger delta -4)', async () => {
    const { products, mockRepo, mockAudit } = createMockEnvironment();
    products.get('prod-simple-1')!.stock = 15;

    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-1',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['stock:adjust'],
      sessionId: 'sess-1',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    const result = await service.adjustStock({
      product_id: 'prod-simple-1',
      operation: 'decrease',
      quantity: 4,
      reason: 'damage',
      operation_id: 'op-decrease-sim-001',
    });

    assert.equal(result.applied, true);
    assert.equal(result.delta, -4);
    assert.equal(result.previous_stock, 15);
    assert.equal(result.current_stock, 11);
    assert.equal(result.product_stock, 11);
    assert.equal(products.get('prod-simple-1')!.stock, 11);
  });

  it('3. Simple product count: system = 11, counted = 14 -> delta +3, stock 14', async () => {
    const { products, mockRepo, mockAudit } = createMockEnvironment();
    products.get('prod-simple-1')!.stock = 11;

    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-1',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['stock:adjust'],
      sessionId: 'sess-1',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    const result = await service.adjustStock({
      product_id: 'prod-simple-1',
      operation: 'count',
      counted_quantity: 14,
      reason: 'inventory_count',
      operation_id: 'op-count-sim-001',
    });

    assert.equal(result.applied, true);
    assert.equal(result.delta, 3);
    assert.equal(result.previous_stock, 11);
    assert.equal(result.current_stock, 14);
    assert.equal(products.get('prod-simple-1')!.stock, 14);
  });

  it('4. Unit variation adjustment: Preto 38 (stock 4 + 3 -> 7) updates variation and recomputes parent product physical aggregate (7 + 65 = 72)', async () => {
    const { products, variations, mockRepo, mockAudit } = createMockEnvironment();
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-1',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['stock:adjust'],
      sessionId: 'sess-1',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    const result = await service.adjustStock({
      product_id: 'prod-shoes-1',
      variation_id: 'var-38-black',
      operation: 'increase',
      quantity: 3,
      reason: 'found_stock',
      operation_id: 'op-var-38-001',
    });

    assert.equal(result.applied, true);
    assert.equal(result.unit_kind, 'unit');
    assert.equal(result.previous_stock, 4);
    assert.equal(result.current_stock, 7);
    assert.equal(variations.get('var-38-black')!.stock, 7);
    // Parent product physical stock: 7 (var-38) + (5 * 13 = 65) = 72 physical units! (NOT 7 + 5 = 12)
    assert.equal(result.product_stock, 72);
    assert.equal(products.get('prod-shoes-1')!.stock, 72);
  });

  it('5. Grade pack adjustment: Grade Alta (13 pairs/pack, stock 5 + 2 -> 7 boxes, physical_quantity = 26, parent stock 4 + 7*13 = 95)', async () => {
    const { products, variations, mockRepo, mockAudit } = createMockEnvironment();
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-1',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['stock:adjust'],
      sessionId: 'sess-1',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    const result = await service.adjustStock({
      product_id: 'prod-shoes-1',
      variation_id: 'var-grade-alta-black',
      operation: 'increase',
      quantity: 2,
      reason: 'found_stock',
      operation_id: 'op-var-ga-001',
    });

    assert.equal(result.applied, true);
    assert.equal(result.unit_kind, 'pack');
    assert.equal(result.quantity, 2); // 2 boxes
    assert.equal(result.physical_quantity, 26); // 2 * 13 pairs
    assert.equal(result.previous_stock, 5);
    assert.equal(result.current_stock, 7); // 7 boxes
    assert.equal(variations.get('var-grade-alta-black')!.stock, 7);
    // Parent product physical stock: 4 (var-38) + (7 * 13 = 91) = 95 physical units!
    assert.equal(result.product_stock, 95);
    assert.equal(products.get('prod-shoes-1')!.stock, 95);
  });

  it('6. Mixed Product Test (CRITICAL): 5 units (38) + 7 units (39) + 3 packs (Grade Alta 13 pairs) = 51 physical units (NEVER 15)', async () => {
    const { products, mockRepo, mockAudit, calculatePhysicalStock } = createMockEnvironment();
    const initialAgg = calculatePhysicalStock('prod-mixed-shoes');
    assert.equal(initialAgg, 51, 'Initial physical stock must be 5 + 7 + (3 * 13) = 51, never 15');
    assert.equal(products.get('prod-mixed-shoes')!.stock, 51);

    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-1',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['stock:adjust'],
      sessionId: 'sess-1',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    // Increase Grade Alta by 1 pack (13 pairs): 3 -> 4 packs
    const result = await service.adjustStock({
      product_id: 'prod-mixed-shoes',
      variation_id: 'var-mix-grade-alta',
      operation: 'increase',
      quantity: 1,
      reason: 'found_stock',
      operation_id: 'op-mix-ga-plus-1',
    });

    assert.equal(result.applied, true);
    assert.equal(result.unit_kind, 'pack');
    assert.equal(result.physical_quantity, 13);
    assert.equal(result.current_stock, 4); // 4 boxes
    // New total physical: 5 + 7 + (4 * 13 = 52) = 64 physical units
    assert.equal(result.product_stock, 64);
    assert.equal(products.get('prod-mixed-shoes')!.stock, 64);
  });

  it('7. Grade Pack Count Test: before 2 packs, count 4 packs -> delta +2 packs, physical delta +26, total 4 packs / 52 physical units', async () => {
    const { variations, mockRepo, mockAudit } = createMockEnvironment();
    variations.get('var-grade-alta-black')!.stock = 2; // Start with 2 packs

    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-1',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['stock:adjust'],
      sessionId: 'sess-1',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    const result = await service.adjustStock({
      product_id: 'prod-shoes-1',
      variation_id: 'var-grade-alta-black',
      operation: 'count',
      counted_quantity: 4, // 4 boxes
      reason: 'inventory_count',
      operation_id: 'op-count-pack-001',
    });

    assert.equal(result.applied, true);
    assert.equal(result.unit_kind, 'pack');
    assert.equal(result.delta, 2); // +2 boxes
    assert.equal(result.quantity, 2); // delta magnitude 2
    assert.equal(result.physical_quantity, 26); // 2 * 13 pairs delta
    assert.equal(result.previous_stock, 2);
    assert.equal(result.current_stock, 4); // 4 boxes
    // Total physical equivalent for this pack variation is 4 * 13 = 52
    assert.equal(result.current_stock * 13, 52);
  });

  it('8. Idempotency Retry: same operation_id with IDENTICAL payload returns duplicate: true without applying second mutation', async () => {
    const { products, mockRepo, mockAudit } = createMockEnvironment();
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-1',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['stock:adjust'],
      sessionId: 'sess-1',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    const first = await service.adjustStock({
      product_id: 'prod-simple-1',
      operation: 'increase',
      quantity: 5,
      reason: 'found_stock',
      operation_id: 'idem-uuid-repeat-01',
    });

    assert.equal(first.applied, true);
    assert.equal(first.duplicate, false);
    assert.equal(first.current_stock, 15);
    assert.equal(products.get('prod-simple-1')!.stock, 15);

    // Second call with same operation_id and identical payload
    const second = await service.adjustStock({
      product_id: 'prod-simple-1',
      operation: 'increase',
      quantity: 5,
      reason: 'found_stock',
      operation_id: 'idem-uuid-repeat-01',
    });

    assert.equal(second.applied, false);
    assert.equal(second.duplicate, true);
    assert.equal(second.current_stock, 15); // MUST NOT become 20
    assert.equal(products.get('prod-simple-1')!.stock, 15);
  });

  it('9. Idempotency Conflict (CRITICAL): same operation_id reused with DIFFERENT payload throws IDEMPOTENCY_CONFLICT with 0 mutations', async () => {
    const { products, mockRepo, mockAudit } = createMockEnvironment();
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-1',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['stock:adjust'],
      sessionId: 'sess-1',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    // First call: increase 5
    const first = await service.adjustStock({
      product_id: 'prod-simple-1',
      operation: 'increase',
      quantity: 5,
      reason: 'found_stock',
      operation_id: 'idem-uuid-conflict-01',
    });
    assert.equal(first.applied, true);
    assert.equal(products.get('prod-simple-1')!.stock, 15);

    // Second call: same operation_id but quantity = 10 (conflicting payload)
    await assert.rejects(
      async () => {
        await service.adjustStock({
          product_id: 'prod-simple-1',
          operation: 'increase',
          quantity: 10,
          reason: 'found_stock',
          operation_id: 'idem-uuid-conflict-01',
        });
      },
      (err: any) => {
        assert(err instanceof IdempotencyConflictError);
        assert.match(err.message, /IDEMPOTENCY_CONFLICT/);
        return true;
      }
    );

    assert.equal(products.get('prod-simple-1')!.stock, 15); // Untouched after rejected conflict
  });

  it('10. Scope Separation: catalog:read ONLY attempting consultar_estoque throws FORBIDDEN', async () => {
    const { mockRepo, mockAudit } = createMockEnvironment();
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-cat-reader-only',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['catalog:read', 'catalog:write'], // NO stock:read
      sessionId: 'sess-cat-reader',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    await assert.rejects(
      async () => {
        await service.consultarEstoque({
          product_id: 'prod-simple-1',
        });
      },
      (err: any) => {
        assert(err instanceof ForbiddenError);
        assert.match(err.message, /Missing required scope: stock:read/);
        return true;
      }
    );
  });

  it('11. Scope Separation: stock:read allows consultar_estoque without catalog scopes', async () => {
    const { mockRepo, mockAudit } = createMockEnvironment();
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-stock-reader-only',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['stock:read'], // ONLY stock:read
      sessionId: 'sess-stock-reader',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    const querySimple = await service.consultarEstoque({
      product_id: 'prod-simple-1',
    });
    assert.equal(querySimple.current_stock, 10);
    assert.equal(querySimple.unit_kind, 'unit');
    assert.equal(querySimple.physical_stock, 10);
    assert.equal(querySimple.reconciliation_status, 'synced');
    assert.deepEqual(querySimple.stock, {
      commercial_quantity: 10,
      unit_kind: 'unit',
      physical_quantity: 10,
    });

    const queryGrade = await service.consultarEstoque({
      product_id: 'prod-shoes-1',
      variation_id: 'var-grade-alta-black',
    });
    assert.equal(queryGrade.current_stock, 5); // 5 packs
    assert.equal(queryGrade.unit_kind, 'pack');
    assert.equal(queryGrade.physical_quantity_per_unit, 13);
    assert.equal(queryGrade.physical_stock, 65); // 5 * 13 = 65 physical units
    assert.deepEqual(queryGrade.stock, {
      commercial_quantity: 5,
      unit_kind: 'pack',
      physical_quantity: 65,
    });
  });

  it('12. Scope Separation: catalog:write alone attempting ajustar_estoque throws FORBIDDEN', async () => {
    const { mockRepo, mockAudit } = createMockEnvironment();
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-writer-only',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['catalog:read', 'catalog:write'], // NO stock:adjust
      sessionId: 'sess-writer',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    await assert.rejects(
      async () => {
        await service.adjustStock({
          product_id: 'prod-simple-1',
          operation: 'increase',
          quantity: 5,
          reason: 'found_stock',
          operation_id: 'op-no-adjust-scope-01',
        });
      },
      (err: any) => {
        assert(err instanceof ForbiddenError);
        assert.match(err.message, /Missing required scope: stock:adjust/);
        return true;
      }
    );
  });

  it('13. Scope Separation: stock:adjust alone allows adjustStock without requiring stock:read', async () => {
    const { mockRepo, mockAudit } = createMockEnvironment();
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-adjuster-only',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['stock:adjust'], // ONLY stock:adjust
      sessionId: 'sess-adjuster',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    const result = await service.adjustStock({
      product_id: 'prod-simple-1',
      operation: 'increase',
      quantity: 5,
      reason: 'found_stock',
      operation_id: 'op-adjust-only-001',
    });

    assert.equal(result.applied, true);
    assert.equal(result.current_stock, 15);
  });

  it('14. Insufficient stock: decrease 5 on stock 3 with allow_negative_stock = false throws INSUFFICIENT_STOCK with 0 mutations', async () => {
    const { products, mockRepo, mockAudit } = createMockEnvironment();
    products.get('prod-simple-1')!.stock = 3;

    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-1',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['stock:adjust'],
      sessionId: 'sess-1',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    await assert.rejects(
      async () => {
        await service.adjustStock({
          product_id: 'prod-simple-1',
          operation: 'decrease',
          quantity: 5,
          reason: 'damage',
          operation_id: 'op-insufficient-001',
        });
      },
      (err: any) => {
        assert(err instanceof InsufficientStockError);
        return true;
      }
    );

    assert.equal(products.get('prod-simple-1')!.stock, 3);
  });

  it('15. Cross-tenant isolation: Store A adjusting Store B product/variation throws INVENTORY_TARGET_NOT_FOUND', async () => {
    const { products, mockRepo, mockAudit } = createMockEnvironment();
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-1',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['stock:adjust'],
      sessionId: 'sess-1',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    await assert.rejects(
      async () => {
        await service.adjustStock({
          product_id: 'prod-store-b',
          operation: 'increase',
          quantity: 10,
          reason: 'found_stock',
          operation_id: 'op-cross-tenant-001',
        });
      },
      (err: any) => {
        assert(err instanceof InventoryTargetNotFoundError);
        return true;
      }
    );

    assert.equal(products.get('prod-store-b')!.stock, 50);
  });

  it('16. Superadmin context: adjustStock requires activeStoreId (STORE_CONTEXT_REQUIRED)', async () => {
    const { mockRepo, mockAudit } = createMockEnvironment();
    const session = new AgentSession({
      principalType: 'superadmin',
      principalId: 'agent-admin',
      storeAccess: { mode: 'all' },
      activeStoreId: null, // No store selected
      scopes: ['stock:adjust', 'store:select'],
      sessionId: 'sess-admin',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    await assert.rejects(
      async () => {
        await service.adjustStock({
          product_id: 'prod-simple-1',
          operation: 'increase',
          quantity: 5,
          reason: 'found_stock',
          operation_id: 'op-superadmin-no-store-001',
        });
      },
      (err: any) => {
        assert(err instanceof StoreContextRequiredError);
        return true;
      }
    );
  });

  it('17. Audit logging: successful adjustment records stock_adjusted event with metadata', async () => {
    const { auditLogs, mockRepo, mockAudit } = createMockEnvironment();
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-auditor',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['stock:adjust'],
      sessionId: 'sess-audit-1',
    });
    const service = new InventoryService(session, mockRepo as any, mockAudit as any);

    await service.adjustStock({
      product_id: 'prod-simple-1',
      operation: 'increase',
      quantity: 5,
      reason: 'found_stock',
      operation_id: 'op-audit-test-001',
    });

    assert.equal(auditLogs.length, 1);
    assert.equal(auditLogs[0].details.operation, 'increase');
    assert.equal(auditLogs[0].details.reason, 'found_stock');
    assert.equal(auditLogs[0].details.delta, 5);
    assert.equal(auditLogs[0].details.unitKind, 'unit');
  });

  it('18. Reconciliation Engine: accurately compares physical variation equivalent against product stock', async () => {
    const { mockRepo, variations, products } = createMockEnvironment();
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-reconciler',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['catalog:read'],
      sessionId: 'sess-rec-1',
    });
    const service = new InventoryService(session, mockRepo as any);

    // Product shoes 1 has 4 (unit) + 5*13 (pack) = 69 physical units.
    // When product.stock = 69, reconciliation is synced.
    const recSynced = await service.reconcileStock('prod-shoes-1');
    assert.equal(recSynced.status, 'synced');
    assert.equal(recSynced.variationsTotalStock, 69);
    assert.equal(recSynced.productStock, 69);

    // If product.stock had naive sum (4 + 5 = 9), reconciliation detects mismatch!
    products.get('prod-shoes-1')!.stock = 9;
    const recMismatch = await service.reconcileStock('prod-shoes-1');
    assert.equal(recMismatch.status, 'mismatch');
    assert.equal(recMismatch.variationsTotalStock, 69);
    assert.equal(recMismatch.productStock, 9);
  });
});
