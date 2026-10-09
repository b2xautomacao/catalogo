import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentSession } from '../src/auth/agent-session.js';
import { CatalogService } from '../src/services/catalog.service.js';
import type { ProductRepository } from '../src/repositories/product.repository.js';
import type { CategoryRepository, CategoryRecord } from '../src/repositories/category.repository.js';
import type { AuditService } from '../src/audit/audit.service.js';
import { ProductTaxonomyService } from '../src/services/product-taxonomy.service.js';

describe('Sprint Complete Product Creation — Domain Completeness & Guided Intake', () => {
  const storeA = '11111111-1111-1111-1111-111111111111';
  const storeB = '22222222-2222-2222-2222-222222222222';

  const categoryPerfumesStoreA: CategoryRecord = {
    id: 'cat-perfumes-a',
    store_id: storeA,
    name: 'Perfumes',
    description: 'Fragrâncias e colônias',
    is_active: true,
  };

  const categoryCalcadosStoreA: CategoryRecord = {
    id: 'cat-calcados-a',
    store_id: storeA,
    name: 'Calçados',
    description: 'Sapatos e tênis',
    is_active: true,
  };

  const categoryPerfumesImportadosStoreA: CategoryRecord = {
    id: 'cat-perf-imp-a',
    store_id: storeA,
    name: 'Perfumes Importados',
    description: 'Fragrâncias importadas',
    is_active: true,
  };

  const categoryPerfumesNacionaisStoreA: CategoryRecord = {
    id: 'cat-perf-nac-a',
    store_id: storeA,
    name: 'Perfumes Nacionais',
    description: 'Fragrâncias nacionais',
    is_active: true,
  };

  const categoryStoreBOnly: CategoryRecord = {
    id: 'cat-b-exclusive',
    store_id: storeB,
    name: 'Cosméticos Store B',
    description: 'Exclusivo Store B',
    is_active: true,
  };

  // In-memory product & category tables
  const productsDb = new Map<string, any>();
  const categoriesDb = new Map<string, CategoryRecord>([
    [categoryPerfumesStoreA.id, categoryPerfumesStoreA],
    [categoryCalcadosStoreA.id, categoryCalcadosStoreA],
    [categoryStoreBOnly.id, categoryStoreBOnly],
  ]);

  const mockProductRepo = {
    async checkSkuExists(storeId: string, sku: string, excludeProductId?: string) {
      for (const p of productsDb.values()) {
        if (p.store_id === storeId && p.sku === sku && p.id !== excludeProductId) {
          return true;
        }
      }
      return false;
    },
    async checkSlugExists(storeId: string, slug: string, excludeProductId?: string) {
      for (const p of productsDb.values()) {
        if (p.store_id === storeId && p.seo_slug === slug && p.id !== excludeProductId) {
          return true;
        }
      }
      return false;
    },
    async createProduct(storeId: string, payload: any) {
      const id = `prod-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const record = {
        id,
        store_id: storeId,
        stock: 0, // Canonical ledger invariant: zero on initial insert
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
        category_id: record.category_id || null,
        retail_price: record.retail_price,
        wholesale_price: record.wholesale_price || null,
        min_wholesale_qty: record.min_wholesale_qty || null,
        material: record.material || null,
        product_gender: record.product_gender || null,
        product_category_type: record.product_category_type || null,
        seo_slug: record.seo_slug || null,
        meta_title: record.meta_title || null,
        meta_description: record.meta_description || null,
        is_active: record.is_active,
      };
    },
  } as unknown as ProductRepository;

  const mockCategoryRepo = {
    async findByIdAndStore(categoryId: string, storeId: string) {
      const cat = categoriesDb.get(categoryId);
      if (!cat || cat.store_id !== storeId) return null;
      return cat;
    },
    async listByStore(storeId: string) {
      return Array.from(categoriesDb.values()).filter((c) => c.store_id === storeId);
    },
    async findByNameAndStore(name: string, storeId: string) {
      return (
        Array.from(categoriesDb.values()).find(
          (c) => c.store_id === storeId && c.name.toLowerCase() === name.trim().toLowerCase()
        ) || null
      );
    },
  } as unknown as CategoryRepository;

  const mockAuditService = {
    async logProductCreated() {},
    async logProductUpdated() {},
    async logProductDeactivated() {},
  } as unknown as AuditService;

  function createSession(storeId: string = storeA) {
    return new AgentSession({
      principalType: 'tenant',
      principalId: storeId,
      storeAccess: { mode: 'restricted', storeIds: [storeId] },
      activeStoreId: storeId,
      scopes: ['catalog:read', 'catalog:write', 'store:list'],
      sessionId: `sess-${Date.now()}`,
    });
  }

  it('1. Rose Noir Guided Intake: Detects missing gender and missing MOQ without saving shallow record', async () => {
    const session = createSession();
    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    // Initial partial user intent:
    // Perfume Rose Noir, Varejo: 259, Atacado: 189, Estoque: 10, Categoria: Perfumes
    const result = await service.createProduct({
      name: 'Perfume Rose Noir',
      retail_price: 259,
      wholesale_price: 189,
      category: 'Perfumes',
    });

    assert.equal(result.status, 'needs_input');
    assert.equal(result.created, false);
    assert.ok(result.missing_fields.includes('product_gender'));
    assert.ok(result.missing_fields.includes('min_wholesale_qty'));

    // Verify precise questions formulated
    assert.ok(
      result.questions.some((q) => q.toLowerCase().includes('feminino, masculino ou unissex'))
    );
    assert.ok(
      result.questions.some((q) => q.includes('189') && q.toLowerCase().includes('quantidade mínima'))
    );

    // Assert NO record was written to the database
    let createdRoseNoir = Array.from(productsDb.values()).find((p) => p.name === 'Perfume Rose Noir');
    assert.equal(createdRoseNoir, undefined, 'Must not persist partial record in database');
  });

  it('2. Rose Noir Completion: When gender and MOQ are supplied, product is created completely', async () => {
    const session = createSession();
    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    const result = await service.createProduct({
      name: 'Perfume Rose Noir',
      retail_price: 259,
      wholesale_price: 189,
      category: 'Perfumes',
      product_gender: 'unissex',
      min_wholesale_qty: 6,
    });

    assert.equal(result.status, 'created');
    assert.equal(result.created, true);
    assert.ok(result.product);

    // Resolved category
    assert.equal(result.product.category, 'Perfumes');
    assert.equal(result.product.category_id, categoryPerfumesStoreA.id);

    // Inferred product category type for perfume
    assert.equal(result.product.product_category_type, 'acessorio');

    // Confirmed gender and MOQ
    assert.equal(result.product.product_gender, 'unissex');
    assert.equal(result.product.min_wholesale_qty, 6);

    // Derived slug
    assert.equal(result.product.seo_slug, 'perfume-rose-noir');

    // Derived SEO metadata without hallucinated claims
    assert.ok(result.product.meta_title?.includes('Perfume Rose Noir'));
    assert.ok(result.product.meta_description?.includes('259.00'));
    assert.ok(!result.product.meta_description?.includes('12 horas')); // No hallucinated specifications

    // Ledger invariant: Stock is NOT written directly into product
    const persisted = productsDb.get(result.product.id);
    assert.equal(persisted.stock, 0);

    // Next actions suggest image upload and inventory adjustment
    assert.deepEqual(result.next_actions, ['adicionar_imagem_produto', 'ajustar_estoque']);
  });

  it('3. Category Resolution: Exact match resolves category_id automatically', async () => {
    const taxonomy = new ProductTaxonomyService();
    const match = await taxonomy.resolveCategory(storeA, mockCategoryRepo, {
      category: 'Perfumes',
    });
    assert.equal(match.status, 'exact');
    assert.equal(match.category?.id, categoryPerfumesStoreA.id);
  });

  it('4. Category Resolution: Normalized match handles case and accents', async () => {
    const taxonomy = new ProductTaxonomyService();
    const match = await taxonomy.resolveCategory(storeA, mockCategoryRepo, {
      category: 'calcados', // no accent, lowercase
    });
    assert.equal(match.status, 'normalized');
    assert.equal(match.category?.id, categoryCalcadosStoreA.id);
  });

  it('5. Category Resolution: Ambiguous match returns candidates and requires choice', async () => {
    // Add multiple perfume subcategories to storeA
    categoriesDb.set(categoryPerfumesImportadosStoreA.id, categoryPerfumesImportadosStoreA);
    categoriesDb.set(categoryPerfumesNacionaisStoreA.id, categoryPerfumesNacionaisStoreA);
    // Remove the exact "Perfumes" category to simulate ambiguity on generic input "perfume"
    categoriesDb.delete(categoryPerfumesStoreA.id);

    const taxonomy = new ProductTaxonomyService();
    const match = await taxonomy.resolveCategory(storeA, mockCategoryRepo, {
      category: 'Perfume',
    });

    assert.equal(match.status, 'ambiguous');
    assert.ok(match.candidates && match.candidates.length >= 2);

    // Restore exact category for remaining tests
    categoriesDb.set(categoryPerfumesStoreA.id, categoryPerfumesStoreA);
    categoriesDb.delete(categoryPerfumesImportadosStoreA.id);
    categoriesDb.delete(categoryPerfumesNacionaisStoreA.id);
  });

  it('6. Category Resolution: Missing category returns not_found and does NOT create fake category', async () => {
    const taxonomy = new ProductTaxonomyService();
    const match = await taxonomy.resolveCategory(storeA, mockCategoryRepo, {
      category: 'Eletrônicos Inexistentes',
    });
    assert.equal(match.status, 'not_found');
  });

  it('7. Multi-Tenant Category Isolation: Store A cannot resolve Store B category', async () => {
    const taxonomy = new ProductTaxonomyService();
    // Querying category belonging to Store B from Store A context
    const match = await taxonomy.resolveCategory(storeA, mockCategoryRepo, {
      category_id: categoryStoreBOnly.id,
    });
    assert.equal(match.status, 'not_found');
  });

  it('8. Slug Generation & Collision Handling: Generates unique tenant slug with counter suffix', async () => {
    const session = createSession();
    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    // Create first product
    const first = await service.createProduct({
      name: 'Perfume Floral Elegance',
      retail_price: 199,
      category: 'Perfumes',
      product_gender: 'feminino',
    });
    assert.equal(first.product.seo_slug, 'perfume-floral-elegance');

    // Create duplicate name product in same store
    const second = await service.createProduct({
      name: 'Perfume Floral Elegance',
      retail_price: 199,
      category: 'Perfumes',
      product_gender: 'feminino',
    });
    assert.equal(second.product.seo_slug, 'perfume-floral-elegance-2');

    // Create third duplicate
    const third = await service.createProduct({
      name: 'Perfume Floral Elegance',
      retail_price: 199,
      category: 'Perfumes',
      product_gender: 'feminino',
    });
    assert.equal(third.product.seo_slug, 'perfume-floral-elegance-3');
  });

  it('9. Wholesale MOQ Validation: Rejects zero or negative MOQ when wholesale price is active', async () => {
    const session = createSession();
    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    const result = await service.createProduct({
      name: 'Perfume Rose Noir',
      retail_price: 259,
      wholesale_price: 189,
      min_wholesale_qty: 0, // Invalid MOQ
      category: 'Perfumes',
      product_gender: 'unissex',
    });

    assert.equal(result.status, 'needs_input');
    assert.ok(result.missing_fields.includes('min_wholesale_qty'));
  });

  it('10. Preflight method: Allows validating without creating product', async () => {
    const session = createSession();
    const service = new CatalogService(session, mockProductRepo, mockCategoryRepo, mockAuditService);

    const preflight = await service.preflightProductCreation({
      name: 'Perfume Rose Noir',
      retail_price: 259,
      wholesale_price: 189,
      category: 'Perfumes',
    });

    assert.equal(preflight.complete, false);
    assert.ok(preflight.missing.some((m) => m.field === 'product_gender'));
    assert.ok(preflight.missing.some((m) => m.field === 'min_wholesale_qty'));
    assert.equal(preflight.resolved.category?.name, 'Perfumes');
    assert.equal(preflight.resolved.product_category_type, 'acessorio');
  });
});
