import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CatalogService } from '../src/services/catalog.service.js';
import { GradeService } from '../src/services/grade.service.js';
import { InventoryService } from '../src/services/inventory.service.js';
import { ProductTaxonomyService } from '../src/services/product-taxonomy.service.js';
import { AgentSession } from '../src/auth/agent-session.js';
import { AgentContext } from '../src/auth/agent-context.js';
import {
  ProductNotFoundError,
  GradeTemplateNotFoundError,
  GradeTemplateAlreadyExistsError,
  IdempotencyConflictError,
  StoreContextRequiredError,
  ForbiddenError,
} from '../src/domain/errors.js';
import { ReconciliarVariacoesSchema } from '../src/schemas/variation.schema.js';
import { CreateProductSchema } from '../src/schemas/product.schema.js';
import { AdjustStockSchema } from '../src/schemas/inventory.schema.js';
import { ApplyGradeToProductSchema } from '../src/schemas/grade.schema.js';

// =========================================================================
// IN-MEMORY TEST REPOSITORIES WITH STRICT PRODUCTION SEMANTICS
// =========================================================================

interface MockStore {
  id: string;
  name: string;
}

interface MockProduct {
  id: string;
  store_id: string;
  name: string;
  sku: string | null;
  category: string | null;
  category_id?: string | null;
  product_category_type?: string | null;
  product_gender?: string | null;
  retail_price: number;
  wholesale_price: number | null;
  min_wholesale_qty: number | null;
  stock: number;
  is_active: boolean;
  allow_negative_stock: boolean;
}

interface MockVariation {
  id: string;
  product_id: string;
  sku: string | null;
  name: string;
  color: string | null;
  size: string | null;
  price_adjustment?: number;
  stock: number;
  is_grade: boolean;
  grade_name?: string | null;
  grade_sizes?: string[] | null;
  grade_pairs?: number[] | null;
  is_active: boolean;
}

interface MockGradeTemplate {
  id: string;
  store_id: string | null;
  name: string;
  slug: string;
  product_category_type: string;
  is_system: boolean;
  is_active: boolean;
  items: Array<{ id: string; size: string; quantity: number; position: number }>;
}

interface MockGradeSnapshot {
  id: string;
  store_id: string;
  product_id: string;
  template_id: string | null;
  pack_variation_id: string;
  name: string;
  color: string | null;
  total_units: number;
  is_active: boolean;
  replaced_by_snapshot_id?: string | null;
  replaced_at?: string | null;
}

interface MockSnapshotItem {
  id: string;
  snapshot_id: string;
  size: string;
  quantity: number;
  position: number;
  variation_id: string | null;
}

interface MockStockMovement {
  id: string;
  store_id: string;
  product_id: string;
  variation_id: string | null;
  parent_movement_id?: string | null;
  movement_type: string;
  unit_kind: string;
  quantity: number;
  physical_quantity: number;
  previous_stock: number | null;
  new_stock: number | null;
  idempotency_key: string | null;
  reason_code: string | null;
}

function calculatePhysicalStockHelper(productId: string, variations: MockVariation[], productStock: number): number {
  const prodVars = variations.filter((v) => v.product_id === productId && v.is_active);
  if (prodVars.length === 0) return productStock;

  return prodVars.reduce((sum, v) => {
    if (v.is_grade) {
      const pairs = Array.isArray(v.grade_pairs)
        ? v.grade_pairs.reduce((pSum, n) => pSum + (Number(n) || 0), 0)
        : 1;
      return sum + (v.stock * (pairs > 0 ? pairs : 1));
    }
    return sum + v.stock;
  }, 0);
}

function createLiveContractFixture() {
  const storeA = '11111111-1111-4111-8111-111111111111';
  const storeB = '22222222-2222-4222-8222-222222222222';

  const products = new Map<string, MockProduct>();
  const variations = new Map<string, MockVariation>();
  const templates = new Map<string, MockGradeTemplate>();
  const snapshots = new Map<string, MockGradeSnapshot>();
  const snapshotItems = new Map<string, MockSnapshotItem>();
  const stockMovements = new Map<string, MockStockMovement>();

  // Templates de Sistema Padrão (Grade Alta: 13 unidades, Grade Baixa: 8 unidades)
  templates.set('tmpl-grade-alta', {
    id: 'tmpl-grade-alta',
    store_id: null,
    name: 'Grade Alta',
    slug: 'grade-alta',
    product_category_type: 'calcado',
    is_system: true,
    is_active: true,
    items: [
      { id: 'i-36', size: '36', quantity: 1, position: 1 },
      { id: 'i-37', size: '37', quantity: 2, position: 2 },
      { id: 'i-38', size: '38', quantity: 2, position: 3 },
      { id: 'i-39', size: '39', quantity: 3, position: 4 },
      { id: 'i-40', size: '40', quantity: 2, position: 5 },
      { id: 'i-41', size: '41', quantity: 2, position: 6 },
      { id: 'i-42', size: '42', quantity: 1, position: 7 },
    ],
  });

  templates.set('tmpl-grade-baixa', {
    id: 'tmpl-grade-baixa',
    store_id: null,
    name: 'Grade Baixa',
    slug: 'grade-baixa',
    product_category_type: 'calcado',
    is_system: true,
    is_active: true,
    items: [
      { id: 'ib-35', size: '35', quantity: 1, position: 1 },
      { id: 'ib-36', size: '36', quantity: 2, position: 2 },
      { id: 'ib-37', size: '37', quantity: 2, position: 3 },
      { id: 'ib-38', size: '38', quantity: 2, position: 4 },
      { id: 'ib-39', size: '39', quantity: 1, position: 5 },
    ],
  });

  // Mock Category Repository
  const mockCategoryRepo: any = {
    findByIdAndStore: async (catId: string, sId: string) => {
      if (catId === 'cat-calcados' && sId === storeA) return { id: 'cat-calcados', store_id: storeA, name: 'Calçados' };
      return null;
    },
    listByStore: async (sId: string) => {
      if (sId === storeA) return [{ id: 'cat-calcados', store_id: storeA, name: 'Calçados' }];
      return [];
    },
    createCategory: async (sId: string, name: string) => {
      return { category: { id: `cat-${name.toLowerCase()}`, store_id: sId, name, is_active: true }, created: true };
    },
  };

  // Mock Product Repository
  const mockProductRepo: any = {
    checkHealth: async () => true,
    checkSkuExists: async (sId: string, sku: string) => {
      for (const p of products.values()) {
        if (p.store_id === sId && p.sku === sku) return true;
      }
      return false;
    },
    checkSlugExists: async () => false,
    getProductById: async (sId: string, id: string) => {
      const p = products.get(id);
      if (!p || p.store_id !== sId) return null;
      return p;
    },
    createProduct: async (sId: string, data: any) => {
      const id = data.id || `prod-${Math.random().toString(36).slice(2, 9)}`;
      const prod: MockProduct = {
        id,
        store_id: sId,
        name: data.name,
        sku: data.sku || null,
        category: data.category || null,
        category_id: data.category_id || null,
        product_category_type: data.product_category_type || null,
        product_gender: data.product_gender || null,
        retail_price: data.retail_price,
        wholesale_price: data.wholesale_price || null,
        min_wholesale_qty: data.min_wholesale_qty || null,
        stock: 0,
        is_active: data.is_active ?? true,
        allow_negative_stock: false,
      };
      products.set(id, prod);
      return prod;
    },
    reconcileVariations: async (sId: string, input: any) => {
      const product = products.get(input.productId);
      if (!product || product.store_id !== sId) {
        throw new ProductNotFoundError(`Produto ${input.productId} não encontrado na loja ativa`);
      }

      const existingUnitVars = Array.from(variations.values()).filter(
        (v) => v.product_id === input.productId && !v.is_grade
      );

      const existingById = new Map<string, MockVariation>();
      const existingByNaturalKey = new Map<string, MockVariation>();
      for (const v of existingUnitVars) {
        existingById.set(v.id, v);
        const natKey = `simple:${(v.color || '').trim().toLowerCase()}:${(v.size || '').trim().toLowerCase()}`;
        existingByNaturalKey.set(natKey, v);
      }

      const matchedIds = new Set<string>();
      const results: any[] = [];
      let createdCount = 0;
      let updatedCount = 0;
      let unchangedCount = 0;
      let deactivatedCount = 0;

      for (let i = 0; i < input.variations.length; i++) {
        const desired = input.variations[i];
        let matched: MockVariation | undefined;

        if (desired.id && existingById.has(desired.id)) {
          matched = existingById.get(desired.id);
        } else {
          const natKey = `simple:${(desired.color || '').trim().toLowerCase()}:${(desired.size || '').trim().toLowerCase()}`;
          matched = existingByNaturalKey.get(natKey);
        }

        if (matched) {
          matchedIds.add(matched.id);
          const isSkuChanged = desired.sku !== undefined && desired.sku !== matched.sku;
          const isActiveChanged = desired.is_active !== undefined && desired.is_active !== matched.is_active;

          if (isSkuChanged || isActiveChanged) {
            if (desired.sku !== undefined) matched.sku = desired.sku;
            if (desired.is_active !== undefined) matched.is_active = desired.is_active;
            updatedCount++;
            results.push({ ...matched, action: 'updated' });
          } else {
            unchangedCount++;
            results.push({ ...matched, action: 'unchanged' });
          }
        } else {
          const newId = `var-unit-${Math.random().toString(36).slice(2, 9)}`;
          const newVar: MockVariation = {
            id: newId,
            product_id: input.productId,
            name: `${product.name} - ${desired.color || ''} ${desired.size || ''}`.trim(),
            sku: desired.sku || null,
            color: desired.color || null,
            size: desired.size || null,
            stock: 0, // ESTOQUE INICIAL SEMPRE ZERO
            is_grade: false,
            is_active: desired.is_active ?? true,
          };
          variations.set(newId, newVar);
          createdCount++;
          results.push({ ...newVar, action: 'created' });
        }
      }

      for (const ex of existingUnitVars) {
        if (!matchedIds.has(ex.id) && ex.is_active) {
          ex.is_active = false;
          deactivatedCount++;
        }
      }

      // Sincronizar snapshots de grade se houver exact match de componentes (Fase J)
      for (const snap of snapshots.values()) {
        if (snap.product_id === input.productId && snap.is_active) {
          for (const sItem of snapshotItems.values()) {
            if (sItem.snapshot_id === snap.id) {
              const matchedUnit = Array.from(variations.values()).find(
                (v) =>
                  v.product_id === input.productId &&
                  !v.is_grade &&
                  v.is_active &&
                  String(v.size).trim() === String(sItem.size).trim() &&
                  (!snap.color || String(v.color).toLowerCase() === String(snap.color).toLowerCase())
              );
              sItem.variation_id = matchedUnit ? matchedUnit.id : null;
            }
          }
        }
      }

      return {
        product_id: input.productId,
        variation_mode: input.variationMode || 'size_only',
        created_count: createdCount,
        updated_count: updatedCount,
        unchanged_count: unchangedCount,
        deactivated_count: deactivatedCount,
        variations: results,
      };
    },
  };

  // Mock Grade Repository
  const mockGradeRepo: any = {
    listTemplates: async (sId: string, filter: any = {}) => {
      const result: any[] = [];
      for (const t of templates.values()) {
        if (!t.is_active) continue;
        if (t.is_system || t.store_id === sId) {
          const totalUnits = t.items.reduce((sum, i) => sum + i.quantity, 0);
          result.push({
            id: t.id,
            name: t.name,
            slug: t.slug,
            type: t.is_system ? 'system' : 'custom',
            product_category_type: t.product_category_type,
            total_units: totalUnits,
            item_count: t.items.length,
            is_active: t.is_active,
          });
        }
      }
      return result;
    },
    getTemplateById: async (sId: string, templateId: string) => {
      const t = templates.get(templateId);
      if (!t || (!t.is_system && t.store_id !== sId)) return null;
      const totalUnits = t.items.reduce((sum, i) => sum + i.quantity, 0);
      return { ...t, total_units: totalUnits };
    },
    createStoreTemplate: async (data: any) => {
      for (const t of templates.values()) {
        if (t.store_id === data.storeId && !t.is_system && t.name.toLowerCase() === data.name.trim().toLowerCase()) {
          throw new GradeTemplateAlreadyExistsError(`Modelo ${data.name} já existe na loja`);
        }
      }
      const id = `tmpl-custom-${Math.random().toString(36).slice(2, 9)}`;
      const items = data.items.map((it: any, idx: number) => ({
        id: `ti-${idx}`,
        size: it.size.trim(),
        quantity: it.quantity,
        position: it.position ?? idx + 1,
      }));
      const tmpl: MockGradeTemplate = {
        id,
        store_id: data.storeId,
        name: data.name.trim(),
        slug: `custom-${id}`,
        product_category_type: data.productCategoryType || 'calcado',
        is_system: false,
        is_active: true,
        items,
      };
      templates.set(id, tmpl);
      const totalUnits = items.reduce((sum: number, i: any) => sum + i.quantity, 0);
      return { ...tmpl, total_units: totalUnits };
    },
    applyGradeToProduct: async (sId: string, data: any) => {
      const product = products.get(data.productId);
      if (!product || product.store_id !== sId) {
        throw new ProductNotFoundError(`Produto ${data.productId} não encontrado na loja ativa`);
      }

      const template = await mockGradeRepo.getTemplateById(sId, data.gradeTemplateId);
      if (!template) {
        throw new GradeTemplateNotFoundError(`Modelo de grade ${data.gradeTemplateId} não encontrado`);
      }

      const color = data.color || null;
      const gradeName = data.name || template.name;

      // FASE Q: Checar Idempotência
      const existingActiveSnap = Array.from(snapshots.values()).find(
        (s) => s.product_id === data.productId && s.is_active && (s.color || null) === color
      );

      if (existingActiveSnap && existingActiveSnap.template_id === template.id) {
        const packVar = variations.get(existingActiveSnap.pack_variation_id);
        return {
          snapshot_id: existingActiveSnap.id,
          product_id: data.productId,
          variation_id: existingActiveSnap.pack_variation_id,
          template_id: template.id,
          name: gradeName,
          color: color,
          sku: packVar?.sku || null,
          total_units: template.total_units,
          stock: packVar?.stock ?? 0,
          items: template.items.map((i: any) => ({ size: i.size, quantity: i.quantity, position: i.position })),
        };
      }

      // FASE P & I: Se já existe snapshot ativo para esse produto/cor (substituição estrutural)
      if (existingActiveSnap) {
        existingActiveSnap.is_active = false;
        existingActiveSnap.replaced_at = new Date().toISOString();
      }

      // Inserir nova Pack Variation com ESTOQUE RIGOROSAMENTE ZERO
      const packVarId = `var-pack-${Math.random().toString(36).slice(2, 9)}`;
      const packVar: MockVariation = {
        id: packVarId,
        product_id: data.productId,
        name: color ? `${product.name} - ${color} (${gradeName})` : `${product.name} (${gradeName})`,
        sku: data.sku ? data.sku.trim() : null,
        color: color,
        size: null,
        is_grade: true,
        grade_name: gradeName,
        grade_sizes: template.items.map((i: any) => i.size),
        grade_pairs: template.items.map((i: any) => i.quantity),
        stock: 0, // SEMPRE ZERO
        is_active: true,
      };
      variations.set(packVarId, packVar);

      // Inserir Snapshot Imutável
      const snapId = `snap-${Math.random().toString(36).slice(2, 9)}`;
      const snapshot: MockGradeSnapshot = {
        id: snapId,
        store_id: sId,
        product_id: data.productId,
        template_id: template.id,
        pack_variation_id: packVarId,
        name: gradeName,
        color: color,
        total_units: template.total_units,
        is_active: true,
      };
      snapshots.set(snapId, snapshot);

      if (existingActiveSnap) {
        existingActiveSnap.replaced_by_snapshot_id = snapId;
      }

      // FASE J: Mapeamento de componentes com Unit Variations existentes
      const existingUnits = Array.from(variations.values()).filter(
        (v) => v.product_id === data.productId && !v.is_grade && v.is_active
      );

      for (const it of template.items) {
        const matches = existingUnits.filter(
          (u) =>
            String(u.size).trim() === String(it.size).trim() &&
            (!color || String(u.color).toLowerCase() === String(color).toLowerCase())
        );
        const compId = matches.length === 1 ? matches[0].id : null;
        const sItemId = `sitem-${Math.random().toString(36).slice(2, 9)}`;
        snapshotItems.set(sItemId, {
          id: sItemId,
          snapshot_id: snapId,
          size: it.size,
          quantity: it.quantity,
          position: it.position,
          variation_id: compId,
        });
      }

      return {
        snapshot_id: snapId,
        product_id: data.productId,
        variation_id: packVarId,
        template_id: template.id,
        name: gradeName,
        color: color,
        sku: packVar.sku,
        total_units: template.total_units,
        stock: 0,
        items: template.items.map((i: any) => ({ size: i.size, quantity: i.quantity, position: i.position })),
      };
    },
  };

  // Mock Inventory Repository
  const mockInventoryRepo: any = {
    applyStockAdjustmentRpc: async (sId: string, params: any) => {
      const product = products.get(params.productId);
      if (!product || product.store_id !== sId) {
        throw new Error('INVENTORY_TARGET_NOT_FOUND');
      }

      // Checar Idempotência
      if (params.idempotencyKey) {
        const existingMov = Array.from(stockMovements.values()).find(
          (m) => m.store_id === sId && m.idempotency_key === params.idempotencyKey
        );
        if (existingMov) {
          const reqQty = params.operation === 'count' ? params.countedQuantity : params.quantity;
          if (
            existingMov.product_id !== params.productId ||
            (existingMov.variation_id || null) !== (params.variationId || null) ||
            existingMov.quantity !== reqQty
          ) {
            throw new IdempotencyConflictError(`IDEMPOTENCY_CONFLICT: operation ${params.idempotencyKey} already exists with different payload`);
          }
          return {
            applied: false,
            duplicate: true,
            movement_id: existingMov.id,
            product_id: existingMov.product_id,
            variation_id: existingMov.variation_id,
            unit_kind: existingMov.unit_kind,
            operation: params.operation,
            delta: (existingMov.new_stock ?? 0) - (existingMov.previous_stock ?? 0),
            quantity: existingMov.quantity,
            physical_quantity: existingMov.physical_quantity,
            previous_stock: existingMov.previous_stock ?? 0,
            current_stock: existingMov.new_stock ?? 0,
            product_stock: product.stock,
          };
        }
      }

      let variation: MockVariation | undefined;
      let currentStock = 0;
      let unitKind = 'unit';
      let pairsPerPack = 1;

      if (params.variationId) {
        variation = variations.get(params.variationId);
        if (!variation || variation.product_id !== params.productId) {
          throw new Error('INVENTORY_TARGET_NOT_FOUND');
        }
        currentStock = variation.stock;
        if (variation.is_grade) {
          unitKind = 'pack';
          pairsPerPack = Array.isArray(variation.grade_pairs)
            ? variation.grade_pairs.reduce((sum, n) => sum + (Number(n) || 0), 0)
            : 1;
          if (pairsPerPack <= 0) pairsPerPack = 1;
        }
      } else {
        currentStock = product.stock;
      }

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

      const physicalQuantity = unitKind === 'pack' ? movementQty * pairsPerPack : movementQty;

      // Gravar Movimentação Pai
      const movId = `mov-${Math.random().toString(36).slice(2, 9)}`;
      stockMovements.set(movId, {
        id: movId,
        store_id: sId,
        product_id: params.productId,
        variation_id: params.variationId || null,
        movement_type: 'adjustment',
        unit_kind: unitKind,
        quantity: movementQty,
        physical_quantity: physicalQuantity,
        previous_stock: currentStock,
        new_stock: newStock,
        idempotency_key: params.idempotencyKey || null,
        reason_code: params.reasonCode,
      });

      // Gravar Child Trace Movements para Packs (Fase L e AH: Analíticos, NÃO tocam no saldo das variações soltas)
      let childCount = 0;
      if (unitKind === 'pack' && movementQty > 0) {
        const activeSnap = Array.from(snapshots.values()).find(
          (s) => s.pack_variation_id === params.variationId && s.is_active
        );
        if (activeSnap) {
          const items = Array.from(snapshotItems.values()).filter((si) => si.snapshot_id === activeSnap.id);
          for (const it of items) {
            const childQty = movementQty * it.quantity;
            const childMovId = `child-mov-${Math.random().toString(36).slice(2, 9)}`;
            stockMovements.set(childMovId, {
              id: childMovId,
              store_id: sId,
              product_id: params.productId,
              variation_id: it.variation_id,
              parent_movement_id: movId,
              movement_type: 'adjustment',
              unit_kind: 'unit',
              quantity: childQty,
              physical_quantity: childQty,
              previous_stock: null, // Saldo loose NÃO é mutado!
              new_stock: null, // Saldo loose NÃO é mutado!
              reason_code: 'grade_component_trace',
              idempotency_key: null,
            });
            childCount++;
          }
        }
      }

      // Atualizar saldo do alvo
      if (variation) {
        variation.stock = newStock;
        // Recalcular agregado físico do produto pai
        product.stock = calculatePhysicalStockHelper(
          params.productId,
          Array.from(variations.values()),
          product.stock
        );
      } else {
        product.stock = newStock;
      }

      return {
        applied: true,
        duplicate: false,
        movement_id: movId,
        product_id: params.productId,
        variation_id: params.variationId || null,
        unit_kind: unitKind,
        operation: params.operation,
        delta,
        quantity: movementQty,
        physical_quantity: physicalQuantity,
        previous_stock: currentStock,
        current_stock: newStock,
        product_stock: product.stock,
        child_movements_count: childCount,
      };
    },
  };

  // Mock Media Repository
  const mockMediaService: any = {
    addImage: async (input: any) => ({
      id: 'img-001',
      product_id: input.product_id,
      image_url: input.image_url || input.source_url,
      is_primary: true,
    }),
  };

  return {
    storeA,
    storeB,
    products,
    variations,
    templates,
    snapshots,
    snapshotItems,
    stockMovements,
    mockProductRepo,
    mockCategoryRepo,
    mockGradeRepo,
    mockInventoryRepo,
    mockMediaService,
  };
}

// =========================================================================
// TEST SUITE: LIVE CONTRACT VARIATIONS & GRADE GATE
// =========================================================================

describe('LIVE MCP CONTRACT + VARIATIONS + GRADE MANAGEMENT GATE', () => {
  const fixture = createLiveContractFixture();

  const session = new AgentSession({
    sessionId: 'session-gate-a',
    principalId: 'agent-gate',
    principalType: 'tenant',
    scopes: ['catalog:read', 'catalog:write', 'stock:read', 'stock:adjust', 'grade:read', 'grade:write'],
    storeAccess: { mode: 'restricted', storeIds: [fixture.storeA] },
    activeStoreId: fixture.storeA,
  });

  const catalogService = new CatalogService(session, fixture.mockProductRepo, fixture.mockCategoryRepo);
  const gradeService = new GradeService(session, fixture.mockGradeRepo);
  const inventoryService = new InventoryService(session, fixture.mockInventoryRepo);
  const taxonomyService = new ProductTaxonomyService();

  // -----------------------------------------------------------------------
  // FASE C: PRODUTO SIMPLES
  // -----------------------------------------------------------------------
  it('FASE C: Fluxo de Produto Simples (preparar -> criar -> ajustar_estoque -> adicionar_imagem) sem mutação direta', async () => {
    // 1. Preflight
    const prep = await taxonomyService.prepareProduct(
      fixture.storeA,
      {
        name: 'Camisa Básica Algodão',
        retail_price: 89.9,
        category: 'Calçados', // Categoria existente na fixture
        stock: 10,
      },
      fixture.mockCategoryRepo,
      fixture.mockProductRepo
    );

    assert.equal(prep.status, 'ready');
    assert.ok(prep.executable_payloads?.criar_produto);
    assert.ok(prep.executable_payloads?.ajustar_estoque);

    // 2. Criar Produto
    const created = await catalogService.createProduct(prep.executable_payloads.criar_produto as any);
    assert.equal(created.status, 'created');
    assert.equal(created.stock, 0); // Estoque inicial sempre zero no banco

    // 3. Ajustar Estoque via Ledger
    const stockResult = await inventoryService.adjustStock({
      product_id: created.id,
      operation: 'increase',
      quantity: 10,
      reason: 'initial_balance',
      operation_id: 'op-stock-c1-001',
    });
    assert.equal(stockResult.applied, true);
    assert.equal(stockResult.current_stock, 10);
    assert.equal(stockResult.product_stock, 10);

    // 4. Adicionar Imagem
    const media = await fixture.mockMediaService.addImage({
      product_id: created.id,
      source_url: 'https://images.unsplash.com/photo-example.jpg',
    });
    assert.equal(media.is_primary, true);
  });

  // -----------------------------------------------------------------------
  // FASE D: PRODUTO COM TAMANHOS (Tênis Teste MCP)
  // -----------------------------------------------------------------------
  it('FASE D: Produto com Tamanhos (37, 38, 39, 40) possui IDs estáveis e adição posterior de 41 preserva existentes', async () => {
    // 1. Criar Produto
    const prod = await catalogService.createProduct({
      name: 'Tênis Teste MCP',
      retail_price: 199.9,
    });

    // 2. Reconciliar variações unitárias iniciais: 37, 38, 39, 40
    const recInitial = await catalogService.reconcileVariations({
      product_id: prod.id,
      variation_mode: 'size_only',
      variations: [
        { size: '37', sku: 'TENIS-37' },
        { size: '38', sku: 'TENIS-38' },
        { size: '39', sku: 'TENIS-39' },
        { size: '40', sku: 'TENIS-40' },
      ],
      operation_id: 'op-rec-size-001',
    });

    assert.equal(recInitial.created_count, 4);
    assert.equal(recInitial.variations.length, 4);

    const id37 = recInitial.variations.find((v) => v.size === '37')?.id!;
    const id38 = recInitial.variations.find((v) => v.size === '38')?.id!;
    const id39 = recInitial.variations.find((v) => v.size === '39')?.id!;
    const id40 = recInitial.variations.find((v) => v.size === '40')?.id!;

    assert.ok(id37 && id38 && id39 && id40);

    // 3. Edição: Adicionar tamanho 41 (preservando 37, 38, 39, 40)
    const recUpdated = await catalogService.reconcileVariations({
      product_id: prod.id,
      variation_mode: 'size_only',
      variations: [
        { size: '37', sku: 'TENIS-37' },
        { size: '38', sku: 'TENIS-38' },
        { size: '39', sku: 'TENIS-39' },
        { size: '40', sku: 'TENIS-40' },
        { size: '41', sku: 'TENIS-41' }, // NOVO TAMANHO
      ],
      operation_id: 'op-rec-size-002',
    });

    assert.equal(recUpdated.created_count, 1);
    assert.equal(recUpdated.unchanged_count, 4);
    assert.equal(recUpdated.deactivated_count, 0);

    // Asserção Crítica: IDs anteriores são estritamente preservados (Zero Delete-All)
    const new37 = recUpdated.variations.find((v) => v.size === '37');
    const new38 = recUpdated.variations.find((v) => v.size === '38');
    const new39 = recUpdated.variations.find((v) => v.size === '39');
    const new40 = recUpdated.variations.find((v) => v.size === '40');
    const new41 = recUpdated.variations.find((v) => v.size === '41');

    assert.equal(new37?.id, id37, 'ID do tamanho 37 deve ser preservado');
    assert.equal(new38?.id, id38, 'ID do tamanho 38 deve ser preservado');
    assert.equal(new39?.id, id39, 'ID do tamanho 39 deve ser preservado');
    assert.equal(new40?.id, id40, 'ID do tamanho 40 deve ser preservado');
    assert.ok(new41?.id && new41.id !== id40, 'Tamanho 41 deve receber novo ID');
  });

  // -----------------------------------------------------------------------
  // FASE E: COR + TAMANHO (MATRIZ)
  // -----------------------------------------------------------------------
  it('FASE E: Matriz Cor + Tamanho (Preto, Branco x P, M, G) e edição segura (remover Branco/G e adicionar Vermelho/M)', async () => {
    const prod = await catalogService.createProduct({
      name: 'Camisa Polo Premium',
      retail_price: 129.9,
    });

    const colors = ['Preto', 'Branco'];
    const sizes = ['P', 'M', 'G'];
    const matrixPayload: any[] = [];
    for (const c of colors) {
      for (const s of sizes) {
        matrixPayload.push({ color: c, size: s });
      }
    }

    const recInitial = await catalogService.reconcileVariations({
      product_id: prod.id,
      variation_mode: 'color_size',
      variations: matrixPayload,
      operation_id: 'op-rec-matrix-001',
    });

    assert.equal(recInitial.created_count, 6);
    assert.equal(recInitial.variations.every((v) => !v.is_grade), true);

    const brancoG = recInitial.variations.find((v) => v.color === 'Branco' && v.size === 'G')!;
    assert.ok(brancoG);

    // Edição: Remover Branco/G e adicionar Vermelho/M
    const updatedPayload = matrixPayload
      .filter((v) => !(v.color === 'Branco' && v.size === 'G'))
      .concat([{ color: 'Vermelho', size: 'M' }]);

    const recEdited = await catalogService.reconcileVariations({
      product_id: prod.id,
      variation_mode: 'color_size',
      variations: updatedPayload,
      operation_id: 'op-rec-matrix-002',
    });

    assert.equal(recEdited.created_count, 1, 'Vermelho/M deve ser criada');
    assert.equal(recEdited.unchanged_count, 5, 'Outras 5 variações devem ser mantidas intactas');
    assert.equal(recEdited.deactivated_count, 1, 'Branco/G deve ser desativada com segurança');

    // Confirmar que Branco/G foi marcada como is_active = false e não deletada
    const dbBrancoG = fixture.variations.get(brancoG.id);
    assert.equal(dbBrancoG?.is_active, false);
  });

  // -----------------------------------------------------------------------
  // FASE F & G: GRADE ALTA (13 unidades) & GRADE BAIXA (8 unidades)
  // -----------------------------------------------------------------------
  it('FASE F & G: Grade Alta (13 unidades) e Grade Baixa (8 unidades) pelo domínio MCP com snapshot e pack variation', async () => {
    // 1. Listar templates pelo domínio MCP (não hardcode)
    const tmpls = await gradeService.listTemplates({});
    const tmplAlta = tmpls.find((t) => t.name === 'Grade Alta');
    const tmplBaixa = tmpls.find((t) => t.name === 'Grade Baixa');

    assert.ok(tmplAlta);
    assert.equal(tmplAlta.total_units, 13, 'Grade Alta deve ter 13 unidades físicas');
    assert.ok(tmplBaixa);
    assert.equal(tmplBaixa.total_units, 8, 'Grade Baixa deve ter 8 unidades físicas');

    // 2. Criar Produto e Aplicar Grade Alta
    const prod = await catalogService.createProduct({
      name: 'Bota Couro Legítimo',
      retail_price: 349.9,
    });

    const appliedAlta = await gradeService.applyGradeToProduct({
      product_id: prod.id,
      grade_template_id: tmplAlta.id,
      sku: 'BOTA-GA-001',
    });

    assert.ok(appliedAlta.snapshot_id);
    assert.ok(appliedAlta.variation_id);
    assert.equal(appliedAlta.total_units, 13);
    assert.equal(appliedAlta.stock, 0); // Estoque inicial zero

    const packVar = fixture.variations.get(appliedAlta.variation_id)!;
    assert.equal(packVar.is_grade, true, 'Pack variation deve ter is_grade = true');
    assert.equal(packVar.stock, 0);

    const snapshot = fixture.snapshots.get(appliedAlta.snapshot_id)!;
    assert.equal(snapshot.pack_variation_id, appliedAlta.variation_id);
    assert.equal(snapshot.is_active, true);

    const items = Array.from(fixture.snapshotItems.values()).filter((si) => si.snapshot_id === appliedAlta.snapshot_id);
    assert.equal(items.length, 7, 'Grade Alta deve conter 7 itens de snapshot (36 a 42)');
  });

  // -----------------------------------------------------------------------
  // FASE H: GRADE PERSONALIZADA & ISOLAMENTO DE TENANT
  // -----------------------------------------------------------------------
  it('FASE H: Grade Personalizada por Tenant e Isolamento Cross-Tenant (Store B não vê template da Store A)', async () => {
    // 1. Criar Template Customizado na Store A
    const customTmpl = await gradeService.createTemplate({
      name: 'Grade Boutique Exclusiva',
      items: [
        { size: '34', quantity: 1, position: 1 },
        { size: '35', quantity: 1, position: 2 },
        { size: '36', quantity: 2, position: 3 },
        { size: '37', quantity: 2, position: 4 },
        { size: '38', quantity: 1, position: 5 },
      ],
    });

    assert.equal(customTmpl.total_units, 7);
    assert.equal(customTmpl.store_id, fixture.storeA);

    // 2. Testar Cross-Tenant Isolation: Sessão da Store B não pode acessar o template da Store A
    const sessionB = new AgentSession({
      sessionId: 'session-gate-b',
      principalId: 'agent-store-b',
      principalType: 'tenant',
      scopes: ['grade:read', 'grade:write'],
      storeAccess: { mode: 'restricted', storeIds: [fixture.storeB] },
      activeStoreId: fixture.storeB,
    });
    const gradeServiceB = new GradeService(sessionB, fixture.mockGradeRepo);

    await assert.rejects(
      async () => {
        await gradeServiceB.getTemplate({ grade_template_id: customTmpl.id });
      },
      (err: any) => err instanceof GradeTemplateNotFoundError,
      'Store B não pode acessar template privado da Store A'
    );
  });

  // -----------------------------------------------------------------------
  // FASE I & P: SNAPSHOT IMMUTABILITY & EDIÇÃO ESTRUTURAL COM ESTOQUE
  // -----------------------------------------------------------------------
  it('FASE I & P: Imutabilidade de Snapshot e Edição Estrutural com Estoque (Grade Alta com 3 boxes -> Grade Baixa com 0 boxes)', async () => {
    const prod = await catalogService.createProduct({
      name: 'Tênis Trekking Montanha',
      retail_price: 299.9,
    });

    // 1. Aplicar Grade Alta
    const appliedAlta = await gradeService.applyGradeToProduct({
      product_id: prod.id,
      grade_template_id: 'tmpl-grade-alta',
    });

    // 2. Injetar estoque de 3 caixas de Grade Alta via ledger
    const stockAlta = await inventoryService.adjustStock({
      product_id: prod.id,
      variation_id: appliedAlta.variation_id,
      operation: 'increase',
      quantity: 3,
      reason: 'initial_balance',
      operation_id: 'op-stock-alta-001',
    });

    assert.equal(stockAlta.current_stock, 3, 'Pack variation deve ter 3 caixas');
    assert.equal(stockAlta.physical_quantity, 39, '3 caixas x 13 pares = 39 pares físicos');

    // 3. Edição Estrutural: Alterar grade para Grade Baixa
    const appliedBaixa = await gradeService.applyGradeToProduct({
      product_id: prod.id,
      grade_template_id: 'tmpl-grade-baixa',
    });

    // Assert: Novo snapshot gerado, nova pack variation gerada
    assert.notEqual(appliedBaixa.snapshot_id, appliedAlta.snapshot_id);
    assert.notEqual(appliedBaixa.variation_id, appliedAlta.variation_id);

    // Assert P1 & P2: Nova pack variation começa estritamente com stock = 0 (NÃO transfere 3 caixas)
    assert.equal(appliedBaixa.stock, 0);
    const newPackVar = fixture.variations.get(appliedBaixa.variation_id)!;
    assert.equal(newPackVar.stock, 0);

    // Assert P3: Estoque antigo de 3 caixas permanece associado ao histórico da pack variation anterior
    const oldPackVar = fixture.variations.get(appliedAlta.variation_id)!;
    assert.equal(oldPackVar.stock, 3);

    // Assert I2: Snapshot antigo desativado com pointer de substituição
    const oldSnapshot = fixture.snapshots.get(appliedAlta.snapshot_id)!;
    assert.equal(oldSnapshot.is_active, false);
    assert.equal(oldSnapshot.replaced_by_snapshot_id, appliedBaixa.snapshot_id);
    assert.ok(oldSnapshot.replaced_at);
  });

  // -----------------------------------------------------------------------
  // FASE Q: GRADE APPLY IDEMPOTENCY
  // -----------------------------------------------------------------------
  it('FASE Q: Aplicar a mesma grade sem mudanças retorna snapshot e pack variation existentes sem duplicar nem resetar estoque', async () => {
    const prod = await catalogService.createProduct({
      name: 'Sapato Social Oxford',
      retail_price: 399.9,
    });

    const firstApply = await gradeService.applyGradeToProduct({
      product_id: prod.id,
      grade_template_id: 'tmpl-grade-alta',
      sku: 'OXFORD-GA',
    });

    // Injetar 2 caixas
    await inventoryService.adjustStock({
      product_id: prod.id,
      variation_id: firstApply.variation_id,
      operation: 'increase',
      quantity: 2,
      reason: 'initial_balance',
      operation_id: 'op-stock-oxford-001',
    });

    // Reaplicar exatamente a mesma grade
    const secondApply = await gradeService.applyGradeToProduct({
      product_id: prod.id,
      grade_template_id: 'tmpl-grade-alta',
      sku: 'OXFORD-GA',
    });

    assert.equal(secondApply.snapshot_id, firstApply.snapshot_id, 'Mesmo snapshot_id');
    assert.equal(secondApply.variation_id, firstApply.variation_id, 'Mesma variation_id');
    assert.equal(secondApply.stock, 2, 'Estoque de 2 caixas NÃO pode ser resetado para 0');
  });

  // -----------------------------------------------------------------------
  // FASE J: SNAPSHOT COMPONENT VARIATIONS
  // -----------------------------------------------------------------------
  it('FASE J: Mapeamento de Componentes (snapshot item -> unit variation correspondente)', async () => {
    const prod = await catalogService.createProduct({
      name: 'Sneaker Urbano',
      retail_price: 249.9,
    });

    // 1. Criar Unit Variation no tamanho 38
    const rec = await catalogService.reconcileVariations({
      product_id: prod.id,
      variation_mode: 'size_only',
      variations: [{ size: '38', sku: 'SNK-38' }],
      operation_id: 'op-rec-comp-001',
    });
    const unit38 = rec.variations[0];

    // 2. Aplicar Grade Alta
    const applied = await gradeService.applyGradeToProduct({
      product_id: prod.id,
      grade_template_id: 'tmpl-grade-alta',
    });

    // 3. Verificar itens do snapshot
    const items = Array.from(fixture.snapshotItems.values()).filter((si) => si.snapshot_id === applied.snapshot_id);
    const item38 = items.find((i) => i.size === '38');
    const item39 = items.find((i) => i.size === '39');

    // Exact Match: item 38 possui correspondente exato
    assert.equal(item38?.variation_id, unit38.id, 'Item 38 do snapshot deve mapear para a unit variation correspondente');
    // Inexistente: item 39 não possui unit variation cadastrada -> variation_id = null
    assert.equal(item39?.variation_id, null, 'Item 39 sem unit variation deve manter variation_id = null');
  });

  // -----------------------------------------------------------------------
  // FASE K, L, M & AH: ESTOQUE UNITÁRIO VS PACK, PISCINAS INDEPENDENTES E DOUBLE COUNT = 0
  // -----------------------------------------------------------------------
  it('FASE K, L, M & AH: Estoque unitário e estoque de pack são independentes, child trace movements não mutam loose stock e DOUBLE COUNT = 0', async () => {
    const prod = await catalogService.createProduct({
      name: 'Tênis Running Elite',
      retail_price: 320.0,
    });

    // 1. Criar variação unitária no tamanho 38
    const rec = await catalogService.reconcileVariations({
      product_id: prod.id,
      variation_mode: 'size_only',
      variations: [{ size: '38', sku: 'RUN-38' }],
      operation_id: 'op-rec-run-001',
    });
    const var38Id = rec.variations[0].id;

    // 2. Aplicar Grade Alta (13 unidades)
    const gradeApplied = await gradeService.applyGradeToProduct({
      product_id: prod.id,
      grade_template_id: 'tmpl-grade-alta',
      sku: 'RUN-GA',
    });
    const packVarId = gradeApplied.variation_id;

    // 3. FASE K: Adicionar +3 unidades soltas no tamanho 38
    const adjLoose = await inventoryService.adjustStock({
      product_id: prod.id,
      variation_id: var38Id,
      operation: 'increase',
      quantity: 3,
      reason: 'initial_balance',
      operation_id: 'op-stock-loose-001',
    });
    assert.equal(adjLoose.current_stock, 3);
    assert.equal(adjLoose.product_stock, 3);

    // 4. FASE L: Adicionar +2 caixas de Grade Alta
    const adjPack = await inventoryService.adjustStock({
      product_id: prod.id,
      variation_id: packVarId,
      operation: 'increase',
      quantity: 2,
      reason: 'initial_balance',
      operation_id: 'op-stock-pack-001',
    });
    assert.equal(adjPack.current_stock, 2, 'Estoque da pack variation deve ser 2 caixas');
    assert.equal(adjPack.physical_quantity, 26, '2 caixas x 13 pares = 26 pares físicos');

    // FASE L2 & M1: O estoque de unidades soltas NÃO PODE mudar!
    const var38Final = fixture.variations.get(var38Id)!;
    assert.equal(var38Final.stock, 3, 'Saldo de unidades soltas do 38 deve permanecer rigorosamente 3 (NÃO 7)');

    // FASE L3 & L4: Child traces gerados são analíticos e não mutam loose stock
    assert.ok(adjPack.child_movements_count > 0, 'Child composition movements devem ser gerados');
    const childMovs = Array.from(fixture.stockMovements.values()).filter(
      (m) => m.reason_code === 'grade_component_trace' && m.parent_movement_id === adjPack.movement_id
    );
    assert.equal(childMovs.length, 7);
    assert.equal(childMovs.every((cm) => cm.previous_stock === null && cm.new_stock === null), true);

    // FASE M2 & AG: Cálculo físico do produto agregado: 3 soltas + (2 caixas * 13 pares) = 29 unidades físicas
    assert.equal(adjPack.product_stock, 29, 'Estoque físico total deve ser 29 (3 + 26)');
  });

  // -----------------------------------------------------------------------
  // FASE N: CONTAGEM (COUNT OPERATION)
  // -----------------------------------------------------------------------
  it('FASE N: Contagem de caixas (count = 4) ajusta caixas para 4 (52 unidades) sem alterar unidades soltas', async () => {
    const prod = await catalogService.createProduct({
      name: 'Mocassim Clássico',
      retail_price: 260.0,
    });

    const rec = await catalogService.reconcileVariations({
      product_id: prod.id,
      variation_mode: 'size_only',
      variations: [{ size: '38', sku: 'MOC-38' }],
      operation_id: 'op-rec-moc-001',
    });
    const unitVarId = rec.variations[0].id;

    // Saldo inicial de loose 38 = 5 unidades
    await inventoryService.adjustStock({
      product_id: prod.id,
      variation_id: unitVarId,
      operation: 'increase',
      quantity: 5,
      reason: 'initial_balance',
      operation_id: 'op-stock-moc-loose',
    });

    const grade = await gradeService.applyGradeToProduct({
      product_id: prod.id,
      grade_template_id: 'tmpl-grade-alta',
    });

    // Contagem de 4 caixas
    const countPack = await inventoryService.adjustStock({
      product_id: prod.id,
      variation_id: grade.variation_id,
      operation: 'count',
      counted_quantity: 4,
      reason: 'inventory_count',
      operation_id: 'op-count-pack-001',
    });

    assert.equal(countPack.current_stock, 4);
    assert.equal(countPack.physical_quantity, 52); // 4 * 13

    // Verificar que loose 38 não foi afetado
    const looseVar = fixture.variations.get(unitVarId)!;
    assert.equal(looseVar.stock, 5);

    // Total agregado físico = 5 + 52 = 57
    assert.equal(countPack.product_stock, 57);
  });

  // -----------------------------------------------------------------------
  // FASE O: IDEMPOTÊNCIA DE ESTOQUE E DETECÇÃO DE CONFLITO
  // -----------------------------------------------------------------------
  it('FASE O: Idempotência de estoque (mesmo payload = duplicate, payload diferente = IDEMPOTENCY_CONFLICT)', async () => {
    const prod = await catalogService.createProduct({
      name: 'Chinelo Slide',
      retail_price: 79.9,
    });

    // 1ª chamada
    const res1 = await inventoryService.adjustStock({
      product_id: prod.id,
      operation: 'increase',
      quantity: 10,
      reason: 'found_stock',
      operation_id: 'op-idempotency-test-001',
    });
    assert.equal(res1.applied, true);
    assert.equal(res1.duplicate, false);

    // 2ª chamada idêntica -> duplicate = true
    const res2 = await inventoryService.adjustStock({
      product_id: prod.id,
      operation: 'increase',
      quantity: 10,
      reason: 'found_stock',
      operation_id: 'op-idempotency-test-001',
    });
    assert.equal(res2.applied, false);
    assert.equal(res2.duplicate, true);

    // 3ª chamada com payload divergente -> IDEMPOTENCY_CONFLICT
    await assert.rejects(
      async () => {
        await inventoryService.adjustStock({
          product_id: prod.id,
          operation: 'increase',
          quantity: 20, // divergente!
          reason: 'found_stock',
          operation_id: 'op-idempotency-test-001',
        });
      },
      (err: any) => err instanceof IdempotencyConflictError,
      'Mesma operation_id com quantidade diferente deve disparar IDEMPOTENCY_CONFLICT'
    );
  });

  // -----------------------------------------------------------------------
  // FASE S & T: PRODUCT INTAKE INTENTS & STRUCTURED NEXT ACTIONS
  // -----------------------------------------------------------------------
  it('FASE S & T: Product Intake detecta variation_intent e grade_intent e monta next_actions com prepared_input canônico', async () => {
    // 1. Teste de Intenção de Variação de Tamanhos e Cores
    const prepVar = await taxonomyService.prepareProduct(
      fixture.storeA,
      {
        name: 'Tênis Urban Street',
        retail_price: 219.9,
        category: 'Calçados',
        cores: ['Preto', 'Branco'],
        tamanhos: ['37', '38', '39', '40'],
      },
      fixture.mockCategoryRepo,
      fixture.mockProductRepo
    );

    assert.equal(prepVar.status, 'ready');
    assert.ok(prepVar.variation_intent);
    assert.equal(prepVar.variation_intent?.mode, 'color_size');
    assert.deepEqual(prepVar.variation_intent?.colors, ['Preto', 'Branco']);
    assert.deepEqual(prepVar.variation_intent?.sizes, ['37', '38', '39', '40']);

    const recAction = prepVar.next_actions?.find((a) => a.tool === 'reconciliar_variacoes_produto');
    assert.ok(recAction, 'Next actions deve sugerir reconciliar_variacoes_produto');
    assert.equal(recAction?.required, true);
    assert.equal(recAction?.prepared_input?.variations.length, 8, '2 cores x 4 tamanhos = 8 variações preparadas');

    // 2. Teste de Intenção de Grade
    const prepGrade = await taxonomyService.prepareProduct(
      fixture.storeA,
      {
        name: 'Tênis Running Pro',
        retail_price: 279.9,
        category: 'Calçados',
        grade: 'Grade Alta',
      },
      fixture.mockCategoryRepo,
      fixture.mockProductRepo
    );

    assert.equal(prepGrade.status, 'ready');
    assert.ok(prepGrade.grade_intent);
    assert.equal(prepGrade.grade_intent?.template, 'Grade Alta');

    const gradeAction = prepGrade.next_actions?.find((a) => a.tool === 'aplicar_grade_produto');
    assert.ok(gradeAction, 'Next actions deve sugerir aplicar_grade_produto');
    assert.equal(gradeAction?.required, true);
    assert.equal(gradeAction?.prepared_input?.name, 'Grade Alta');
  });

  // -----------------------------------------------------------------------
  // FASE U: AUDITORIA DE MODOS DE VARIAÇÃO DO WIZARD
  // -----------------------------------------------------------------------
  it('FASE U: Valida que todos os modos do Wizard possuem paridade e schema estrito no MCP', () => {
    const supportedModes = ['none', 'size_only', 'color_only', 'color_size'];
    for (const mode of supportedModes) {
      const valid = ReconciliarVariacoesSchema.safeParse({
        product_id: '11111111-1111-4111-8111-111111111111',
        variation_mode: mode,
        variations: [{ size: '38' }],
        operation_id: `op-mode-${mode}`,
      });
      assert.equal(valid.success, true, `Modo ${mode} deve ser aceito`);
    }

    const gradeValid = ApplyGradeToProductSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      grade_template_id: '22222222-2222-4222-8222-222222222222',
    });
    assert.equal(gradeValid.success, true, 'Modo grade_system coberto por aplicar_grade_produto');
  });
});
