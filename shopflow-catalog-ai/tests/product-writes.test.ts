import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentSession } from '../src/auth/agent-session.js';
import { CatalogService } from '../src/services/catalog.service.js';
import { ProductRepository } from '../src/repositories/product.repository.js';
import { CategoryRepository, CategoryRecord } from '../src/repositories/category.repository.js';
import { AuditService } from '../src/audit/audit.service.js';
import { CreateProductSchema, UpdateProductSchema, DeactivateProductSchema } from '../src/schemas/product.schema.js';
import {
  ForbiddenError,
  StoreContextRequiredError,
  ProductNotFoundError,
  CategoryNotFoundError,
  SkuAlreadyExistsError,
  NoChangesProvidedError,
} from '../src/domain/errors.js';

describe('Zod Schema Validation & Mass Assignment / Stock Guard', () => {
  it('CreateProductSchema accepts valid payload and rejects empty name or negative price', () => {
    const valid = CreateProductSchema.safeParse({
      name: 'Tênis Esportivo',
      retail_price: 199.9,
      sku: 'TENIS-01',
    });
    assert.equal(valid.success, true);

    const emptyName = CreateProductSchema.safeParse({
      name: '   ',
      retail_price: 199.9,
    });
    assert.equal(emptyName.success, false);

    const negativePrice = CreateProductSchema.safeParse({
      name: 'Tênis',
      retail_price: -10,
    });
    assert.equal(negativePrice.success, false);
  });

  it('CreateProductSchema STRICTLY REJECTS forbidden fields (stock, store_id, id, owner_id)', () => {
    // Attempting mass assignment with store_id
    const withStoreId = CreateProductSchema.safeParse({
      name: 'Tênis',
      retail_price: 100,
      store_id: '11111111-1111-4111-8111-111111111111',
    });
    assert.equal(withStoreId.success, false);

    // Attempting to pass stock
    const withStock = CreateProductSchema.safeParse({
      name: 'Tênis',
      retail_price: 100,
      stock: 50,
    });
    assert.equal(withStock.success, false);

    // Attempting to pass id or owner_id
    const withId = CreateProductSchema.safeParse({
      name: 'Tênis',
      retail_price: 100,
      id: 'custom-id',
    });
    assert.equal(withId.success, false);
  });

  it('UpdateProductSchema accepts partial patch and rejects empty patch or forbidden fields', () => {
    const validPatch = UpdateProductSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      name: 'Novo Nome',
      retail_price: 249.9,
    });
    assert.equal(validPatch.success, true);

    // Empty patch (only product_id) must fail with NO_CHANGES_PROVIDED
    const emptyPatch = UpdateProductSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
    });
    assert.equal(emptyPatch.success, false);

    // Attempting to update stock must fail
    const withStock = UpdateProductSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      stock: 100,
    });
    assert.equal(withStock.success, false);

    // Attempting to update store_id must fail
    const withStoreId = UpdateProductSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      store_id: 'other-store',
    });
    assert.equal(withStoreId.success, false);
  });

  it('DeactivateProductSchema accepts valid product_id and STRICTLY REJECTS any other fields', () => {
    const valid = DeactivateProductSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
    });
    assert.equal(valid.success, true);

    // Attempting to pass is_active, stock, store_id, delete, reason
    const withIsActive = DeactivateProductSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      is_active: false,
    });
    assert.equal(withIsActive.success, false);

    const withStock = DeactivateProductSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      stock: 0,
    });
    assert.equal(withStock.success, false);

    const withStoreId = DeactivateProductSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      store_id: '11111111-1111-4111-8111-111111111111',
    });
    assert.equal(withStoreId.success, false);

    const withDelete = DeactivateProductSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      delete: true,
    });
    assert.equal(withDelete.success, false);
  });
});

describe('CatalogService Safe Writes (createProduct & updateProduct & deactivateProduct)', () => {
  const storeA = '11111111-1111-1111-1111-111111111111';
  const storeB = '22222222-2222-2222-2222-222222222222';

  const categoryStoreA: CategoryRecord = {
    id: 'cat-a-1',
    store_id: storeA,
    name: 'Calçados',
    description: null,
    is_active: true,
  };

  const categoryStoreB: CategoryRecord = {
    id: 'cat-b-1',
    store_id: storeB,
    name: 'Roupas',
    description: null,
    is_active: true,
  };

  // Mock database tables in memory
  const productsDb = new Map<string, any>([
    [
      'prod-a-1',
      {
        id: 'prod-a-1',
        store_id: storeA,
        name: 'Sapato Social',
        sku: 'SAP-01',
        description: 'Sapato de couro',
        category: 'Calçados',
        retail_price: 299.9,
        wholesale_price: 220.0,
        stock: 15,
        is_active: true,
      },
    ],
    [
      'prod-b-1',
      {
        id: 'prod-b-1',
        store_id: storeB,
        name: 'Camiseta Store B',
        sku: 'CAM-01',
        description: 'Algodão',
        category: 'Roupas',
        retail_price: 89.9,
        wholesale_price: 60.0,
        stock: 30,
        is_active: true,
      },
    ],
    [
      'prod-a-inactive',
      {
        id: 'prod-a-inactive',
        store_id: storeA,
        name: 'Chinelo Inativo',
        sku: 'CHI-01',
        description: 'Inativo',
        category: 'Calçados',
        retail_price: 49.9,
        wholesale_price: 30.0,
        stock: 5,
        is_active: false,
      },
    ],
  ]);

  const categoriesDb = new Map<string, CategoryRecord>([
    [`${categoryStoreA.id}_${storeA}`, categoryStoreA],
    [`${categoryStoreB.id}_${storeB}`, categoryStoreB],
  ]);

  const recordedAuditEvents: any[] = [];

  const mockProductRepo = {
    async checkSkuExists(storeId: string, sku: string, excludeProductId?: string) {
      for (const p of productsDb.values()) {
        if (p.store_id === storeId && p.sku === sku && p.id !== excludeProductId) {
          return true;
        }
      }
      return false;
    },
    async getProductById(storeId: string, productId: string) {
      const p = productsDb.get(productId);
      if (!p || p.store_id !== storeId) {
        return null;
      }
      return {
        id: p.id,
        name: p.name,
        sku: p.sku || null,
        retail_price: p.retail_price,
        wholesale_price: p.wholesale_price || null,
        stock: p.stock,
        is_active: p.is_active,
        images: [],
        variations: [],
      };
    },
    async createProduct(storeId: string, payload: any) {
      const id = `prod-new-${Date.now()}-${Math.random()}`;
      const record = {
        id,
        store_id: storeId,
        stock: 0, // Canonical default
        is_active: true,
        ...payload,
      };
      productsDb.set(id, record);
      return {
        id: record.id,
        name: record.name,
        sku: record.sku || null,
        description: record.description || null,
        category: record.category || null,
        retail_price: record.retail_price,
        wholesale_price: record.wholesale_price || null,
        is_active: record.is_active,
      };
    },
    async updateProduct(storeId: string, productId: string, payload: any) {
      const existing = productsDb.get(productId);
      // DUAL TENANT GUARD: must match both productId AND storeId
      if (!existing || existing.store_id !== storeId) {
        return null;
      }
      const updated = {
        ...existing,
        ...payload,
      };
      productsDb.set(productId, updated);
      return {
        id: updated.id,
        name: updated.name,
        sku: updated.sku || null,
        description: updated.description || null,
        category: updated.category || null,
        retail_price: updated.retail_price,
        wholesale_price: updated.wholesale_price || null,
        is_active: updated.is_active,
      };
    },
    async deactivateProduct(storeId: string, productId: string) {
      const existing = productsDb.get(productId);
      // DUAL TENANT GUARD: must match both productId AND storeId
      if (!existing || existing.store_id !== storeId) {
        return null;
      }
      existing.is_active = false;
      return {
        id: existing.id,
        name: existing.name,
        sku: existing.sku || null,
        description: existing.description || null,
        category: existing.category || null,
        retail_price: existing.retail_price,
        wholesale_price: existing.wholesale_price || null,
        is_active: false,
      };
    },
    async checkHealth() {
      return true;
    },
  } as unknown as ProductRepository;

  const mockCategoryRepo = {
    async findByIdAndStore(categoryId: string, storeId: string) {
      return categoriesDb.get(`${categoryId}_${storeId}`) || null;
    },
  } as unknown as CategoryRepository;

  const mockAuditService = {
    async logProductCreated(context: any, productId: string, fields: string[]) {
      recordedAuditEvents.push({ type: 'product_created', store_id: context.activeStoreId, productId, fields });
    },
    async logProductUpdated(context: any, productId: string, changedFields: string[]) {
      recordedAuditEvents.push({ type: 'product_updated', store_id: context.activeStoreId, productId, changedFields });
    },
    async logProductDeactivated(context: any, productId: string, alreadyInactive: boolean) {
      recordedAuditEvents.push({ type: 'product_deactivated', store_id: context.activeStoreId, productId, alreadyInactive });
    },
  } as unknown as AuditService;

  it('Tenant writer creates product in active store and injects store_id', async () => {
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeA,
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['catalog:read', 'catalog:write', 'store:list'],
      sessionId: 'sess-tw-1',
    });

    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    const created = await service.createProduct({
      name: 'Tênis Esportivo Running',
      retail_price: 349.9,
      sku: 'RUN-99',
      description: 'Super confortável',
      category_id: categoryStoreA.id,
    });

    assert.ok(created.id);
    assert.equal(created.name, 'Tênis Esportivo Running');
    assert.equal(created.category, 'Calçados');

    const storedInDb = productsDb.get(created.id);
    assert.equal(storedInDb.store_id, storeA);
    assert.equal(storedInDb.stock, 0); // Untouched stock
  });

  it('Read-only tenant without catalog:write is rejected with FORBIDDEN', async () => {
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeA,
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['catalog:read', 'store:list'], // Missing catalog:write
      sessionId: 'sess-ro-1',
    });

    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    await assert.rejects(
      async () =>
        await service.createProduct({
          name: 'Tentativa sem permissao',
          retail_price: 100,
        }),
      (err: Error) => err instanceof ForbiddenError
    );

    await assert.rejects(
      async () =>
        await service.updateProduct({
          product_id: 'prod-a-1',
          name: 'Tentativa sem permissao',
        }),
      (err: Error) => err instanceof ForbiddenError
    );
  });

  it('Superadmin without active store is rejected with STORE_CONTEXT_REQUIRED', async () => {
    const session = new AgentSession({
      principalType: 'superadmin',
      principalId: 'admin-1',
      storeAccess: { mode: 'all' },
      activeStoreId: null,
      scopes: ['catalog:read', 'catalog:write', 'store:list', 'store:select'],
      sessionId: 'sess-sa-write-1',
    });

    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    await assert.rejects(
      async () =>
        await service.createProduct({
          name: 'Produto Admin',
          retail_price: 150,
        }),
      (err: Error) => err instanceof StoreContextRequiredError && err.message === 'STORE_CONTEXT_REQUIRED'
    );
  });

  it('Category cross-tenant validation: passing Category ID of Store B for Store A product is rejected with CATEGORY_NOT_FOUND', async () => {
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeA,
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['catalog:read', 'catalog:write'],
      sessionId: 'sess-cat-1',
    });

    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    // Attempting to assign categoryStoreB (which belongs to Store B) while active store is Store A
    await assert.rejects(
      async () =>
        await service.createProduct({
          name: 'Produto Categoria Invalida',
          retail_price: 120,
          category_id: categoryStoreB.id,
        }),
      (err: Error) => err instanceof CategoryNotFoundError && err.message === 'CATEGORY_NOT_FOUND'
    );
  });

  it('Duplicate SKU in same store is rejected with SKU_ALREADY_EXISTS', async () => {
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeA,
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['catalog:read', 'catalog:write'],
      sessionId: 'sess-sku-1',
    });

    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    // 'SAP-01' already exists in Store A
    await assert.rejects(
      async () =>
        await service.createProduct({
          name: 'Outro Sapato',
          retail_price: 250,
          sku: 'SAP-01',
        }),
      (err: Error) => err instanceof SkuAlreadyExistsError && err.message === 'SKU_ALREADY_EXISTS'
    );
  });

  it('CRITICAL CROSS-TENANT UPDATE: Principal of Store A updating Product of Store B returns PRODUCT_NOT_FOUND and Store B product remains unchanged', async () => {
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeA,
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['catalog:read', 'catalog:write'],
      sessionId: 'sess-ct-update-1',
    });

    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    const initialProductB = { ...productsDb.get('prod-b-1') };

    // Store A principal attempts to update prod-b-1 (which belongs to Store B)
    await assert.rejects(
      async () =>
        await service.updateProduct({
          product_id: 'prod-b-1',
          name: 'Hacked Name',
          retail_price: 1.0,
        }),
      (err: Error) => err instanceof ProductNotFoundError && err.message === 'PRODUCT_NOT_FOUND'
    );

    // Verify Store B product was untouched
    const currentProductB = productsDb.get('prod-b-1');
    assert.deepEqual(currentProductB, initialProductB);
    assert.equal(currentProductB.name, 'Camiseta Store B');
  });

  it('Tenant writer updates own product and records audit log', async () => {
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeA,
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['catalog:read', 'catalog:write'],
      sessionId: 'sess-update-ok-1',
    });

    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    const updated = await service.updateProduct({
      product_id: 'prod-a-1',
      name: 'Sapato Social Italiano',
      retail_price: 329.9,
    });

    assert.equal(updated.name, 'Sapato Social Italiano');
    assert.equal(updated.retail_price, 329.9);

    // Stock was not altered
    const dbRecord = productsDb.get('prod-a-1');
    assert.equal(dbRecord.stock, 15);
  });

  it('Tenant writer deactivates own product (soft delete: is_active = false) and logs audit event', async () => {
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeA,
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['catalog:read', 'catalog:write'],
      sessionId: 'sess-deact-ok-1',
    });

    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    // Initial state: prod-a-1 is_active = true, stock = 15
    const before = productsDb.get('prod-a-1');
    assert.equal(before.is_active, true);
    assert.equal(before.stock, 15);

    const result = await service.deactivateProduct({ product_id: 'prod-a-1' });

    assert.equal(result.deactivated, true);
    assert.equal(result.alreadyInactive, false);
    assert.equal(result.product.is_active, false);

    // Database state: is_active is false, stock remains 15
    const after = productsDb.get('prod-a-1');
    assert.equal(after.is_active, false);
    assert.equal(after.stock, 15);

    // Audit log recorded
    const lastAudit = recordedAuditEvents[recordedAuditEvents.length - 1];
    assert.equal(lastAudit.type, 'product_deactivated');
    assert.equal(lastAudit.productId, 'prod-a-1');
    assert.equal(lastAudit.alreadyInactive, false);
  });

  it('Read-only tenant without catalog:write cannot deactivate product (returns FORBIDDEN)', async () => {
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeA,
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['catalog:read'], // No catalog:write
      sessionId: 'sess-ro-deact-1',
    });

    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    await assert.rejects(
      async () => await service.deactivateProduct({ product_id: 'prod-a-1' }),
      (err: Error) => err instanceof ForbiddenError
    );
  });

  it('Superadmin without active store cannot deactivate product (returns STORE_CONTEXT_REQUIRED)', async () => {
    const session = new AgentSession({
      principalType: 'superadmin',
      principalId: 'admin-1',
      storeAccess: { mode: 'all' },
      activeStoreId: null, // No active store selected
      scopes: ['catalog:read', 'catalog:write', 'store:list', 'store:select'],
      sessionId: 'sess-sa-deact-no-store',
    });

    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    await assert.rejects(
      async () => await service.deactivateProduct({ product_id: 'prod-a-1' }),
      (err: Error) => err instanceof StoreContextRequiredError && err.message === 'STORE_CONTEXT_REQUIRED'
    );
  });

  it('Superadmin with active store successfully deactivates product in that store', async () => {
    const session = new AgentSession({
      principalType: 'superadmin',
      principalId: 'admin-1',
      storeAccess: { mode: 'all' },
      activeStoreId: storeB, // Explicitly switched to Store B
      scopes: ['catalog:read', 'catalog:write', 'store:list', 'store:select'],
      sessionId: 'sess-sa-deact-store-b',
    });

    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    const result = await service.deactivateProduct({ product_id: 'prod-b-1' });

    assert.equal(result.deactivated, true);
    assert.equal(result.alreadyInactive, false);
    assert.equal(result.product.is_active, false);

    const after = productsDb.get('prod-b-1');
    assert.equal(after.is_active, false);
  });

  it('CRITICAL CROSS-TENANT DEACTIVATION: Principal of Store A attempting to deactivate Product of Store B returns PRODUCT_NOT_FOUND and Store B product remains active', async () => {
    // Reset prod-b-1 to active
    productsDb.get('prod-b-1').is_active = true;

    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeA,
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['catalog:read', 'catalog:write'],
      sessionId: 'sess-ct-deact-1',
    });

    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    // Attempting to deactivate prod-b-1 belonging to Store B
    await assert.rejects(
      async () => await service.deactivateProduct({ product_id: 'prod-b-1' }),
      (err: Error) => err instanceof ProductNotFoundError && err.message === 'PRODUCT_NOT_FOUND'
    );

    // Verify prod-b-1 in Store B was not changed
    assert.equal(productsDb.get('prod-b-1').is_active, true);
  });

  it('Idempotency: deactivating an already inactive product returns alreadyInactive: true without errors', async () => {
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeA,
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['catalog:read', 'catalog:write'],
      sessionId: 'sess-idempotent-deact',
    });

    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    // prod-a-inactive is already inactive
    assert.equal(productsDb.get('prod-a-inactive').is_active, false);

    const result = await service.deactivateProduct({ product_id: 'prod-a-inactive' });

    assert.equal(result.deactivated, true);
    assert.equal(result.alreadyInactive, true);
    assert.equal(result.product.is_active, false);

    // Still inactive in DB
    assert.equal(productsDb.get('prod-a-inactive').is_active, false);

    // Audit log logged with alreadyInactive: true
    const lastAudit = recordedAuditEvents[recordedAuditEvents.length - 1];
    assert.equal(lastAudit.type, 'product_deactivated');
    assert.equal(lastAudit.productId, 'prod-a-inactive');
    assert.equal(lastAudit.alreadyInactive, true);
  });
});

