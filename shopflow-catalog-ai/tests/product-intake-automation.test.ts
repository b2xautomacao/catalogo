import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentSession } from '../src/auth/agent-session.js';
import { CatalogService } from '../src/services/catalog.service.js';
import type { ProductRepository } from '../src/repositories/product.repository.js';
import type { CategoryRepository, CategoryRecord } from '../src/repositories/category.repository.js';
import { ProductIntakeSettingsRepository } from '../src/repositories/product-intake-settings.repository.js';
import type { AuditService } from '../src/audit/audit.service.js';
import { ProductTaxonomyService } from '../src/services/product-taxonomy.service.js';
import { ImportBatchTooLargeError } from '../src/domain/errors.js';

describe('Sprint Product Intake Automation — Policy, Preflight & Tenant Defaults', () => {
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

  const categoryBolsasStoreA: CategoryRecord = {
    id: 'cat-bolsas-a',
    store_id: storeA,
    name: 'Bolsas',
    description: 'Bolsas e malas',
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

  const categoriesDb = new Map<string, CategoryRecord>([
    [categoryPerfumesStoreA.id, categoryPerfumesStoreA],
    [categoryCalcadosStoreA.id, categoryCalcadosStoreA],
    [categoryBolsasStoreA.id, categoryBolsasStoreA],
    [categoryStoreBOnly.id, categoryStoreBOnly],
  ]);

  const mockCategoryRepo: CategoryRepository = {
    findByIdAndStore: async (id: string, storeId: string) => {
      const cat = categoriesDb.get(id);
      return cat && cat.store_id === storeId ? cat : null;
    },
    listByStore: async (storeId: string) => {
      return Array.from(categoriesDb.values()).filter((c) => c.store_id === storeId);
    },
    findByNameAndStore: async (name: string, storeId: string) => {
      const found = Array.from(categoriesDb.values()).find(
        (c) => c.store_id === storeId && c.name.toLowerCase() === name.toLowerCase().trim()
      );
      return found || null;
    },
  } as any;

  const productsDb = new Map<string, any>();

  const mockProductRepo: ProductRepository = {
    checkSlugExists: async (storeId: string, slug: string) => {
      return Array.from(productsDb.values()).some(
        (p) => p.store_id === storeId && p.seo_slug === slug
      );
    },
    checkSkuExists: async (storeId: string, sku: string) => {
      return Array.from(productsDb.values()).some(
        (p) => p.store_id === storeId && p.sku === sku
      );
    },
    createProduct: async (storeId: string, payload: any) => {
      const id = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const saved = { id, store_id: storeId, ...payload, is_active: true };
      productsDb.set(id, saved);
      return saved;
    },
  } as any;

  const mockAuditService: AuditService = {
    logProductCreated: async () => {},
    logProductUpdated: async () => {},
    logProductDeactivated: async () => {},
    logTenantDefaultsUpdated: async () => {},
  } as any;

  function createServiceForStore(storeId: string, intakeSettingsRepo: ProductIntakeSettingsRepository) {
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeId,
      storeAccess: { mode: 'restricted', storeIds: [storeId] },
      activeStoreId: storeId,
      scopes: ['catalog:read', 'catalog:write', 'stock:read', 'stock:adjust', 'store:list'],
    });

    return new CatalogService(
      session,
      mockProductRepo,
      mockCategoryRepo,
      mockAuditService,
      new ProductTaxonomyService(),
      intakeSettingsRepo
    );
  }

  // 1. Product Intake Policy Test
  it('1. Product Intake Policy: Returns machine-readable contract and domain rules', async () => {
    const intakeRepo = new ProductIntakeSettingsRepository();
    const service = createServiceForStore(storeA, intakeRepo);

    const policy = await service.getIntakePolicy();

    assert.ok(Array.isArray(policy.required), 'Required fields must be array');
    assert.ok(policy.required.includes('name'));
    assert.ok(policy.required.includes('retail_price'));
    assert.ok(policy.required.includes('category'));

    assert.ok(policy.conditional.min_wholesale_qty, 'Conditional wholesale MOQ must be specified');
    assert.ok(policy.conditional.product_gender, 'Conditional gender must be specified');

    assert.ok(policy.derivable.includes('sku'));
    assert.ok(policy.derivable.includes('seo_slug'));
    assert.ok(policy.derivable.includes('meta_title'));

    assert.ok(policy.never_invent.includes('gender'));
    assert.ok(policy.never_invent.includes('brand'));
    assert.ok(policy.never_invent.includes('wholesale_minimum'));

    assert.equal(policy.stock_policy.mode, 'ledger_only');
    assert.equal(policy.image_policy.mode, 'post_creation');
    assert.ok(policy.decision_policy.auto.length > 0);
    assert.ok(policy.decision_policy.ask.length > 0);
    assert.ok(policy.decision_policy.block.length > 0);
  });

  // 2. Tenant Defaults Isolation Test
  it('2. Tenant Defaults Isolation: Store A MOQ = 6 vs Store B MOQ = 12 on identical product', async () => {
    const intakeRepo = new ProductIntakeSettingsRepository();
    intakeRepo.setInMemorySettings(storeA, { default_min_wholesale_qty: 6 });
    intakeRepo.setInMemorySettings(storeB, { default_min_wholesale_qty: 12 });

    const serviceA = createServiceForStore(storeA, intakeRepo);
    const serviceB = createServiceForStore(storeB, intakeRepo);

    const defaultsA = await serviceA.getIntakeDefaults();
    const defaultsB = await serviceB.getIntakeDefaults();

    assert.equal(defaultsA.default_min_wholesale_qty, 6);
    assert.equal(defaultsB.default_min_wholesale_qty, 12);

    // Prepare identical input for Store A and Store B
    const prepA = await serviceA.prepareProduct({
      name: 'Tênis Running',
      retail_price: 299,
      wholesale_price: 199,
      category: 'Calçados',
      product_gender: 'unissex',
    });

    const prepB = await serviceB.prepareProduct({
      name: 'Tênis Running',
      retail_price: 299,
      wholesale_price: 199,
      category: 'Cosméticos Store B',
      product_gender: 'unissex',
    });

    assert.equal(prepA.status, 'ready');
    assert.equal(prepA.resolved_data.min_wholesale_qty, 6, 'Store A must apply default MOQ 6');
    const moqDecA = prepA.decisions.find((d) => d.field === 'min_wholesale_qty');
    assert.equal(moqDecA?.source, 'tenant_default');

    assert.equal(prepB.status, 'ready');
    assert.equal(prepB.resolved_data.min_wholesale_qty, 12, 'Store B must apply default MOQ 12');
    const moqDecB = prepB.decisions.find((d) => d.field === 'min_wholesale_qty');
    assert.equal(moqDecB?.source, 'tenant_default');
  });

  // 3. Rose Noir with Tenant Default MOQ
  it('3. Rose Noir Case 1: With tenant default MOQ = 6, resolves MOQ automatically without asking', async () => {
    const intakeRepo = new ProductIntakeSettingsRepository();
    intakeRepo.setInMemorySettings(storeA, { default_min_wholesale_qty: 6 });
    const service = createServiceForStore(storeA, intakeRepo);

    const prep = await service.prepareProduct({
      name: 'Perfume Rose Noir',
      retail_price: 259,
      wholesale_price: 189,
      category: 'Perfumes',
      stock: 10,
    });

    // MOQ was resolved by tenant_default, but gender is still missing because it's perfume!
    assert.equal(prep.status, 'needs_input');
    const moqDec = prep.decisions.find((d) => d.field === 'min_wholesale_qty');
    assert.equal(moqDec?.decision, 'auto');
    assert.equal(moqDec?.source, 'tenant_default');
    assert.equal(prep.resolved_data.min_wholesale_qty, 6);

    // Gender should be asked
    const genderDec = prep.decisions.find((d) => d.field === 'product_gender');
    assert.equal(genderDec?.decision, 'ask');
    assert.ok(genderDec?.question?.includes('feminino, masculino ou unissex'));

    // Stock intent should be captured as initial_balance without touching database
    assert.equal(prep.inventory_intent?.quantity, 10);
    assert.equal(prep.inventory_intent?.mode, 'initial_balance');
    assert.equal(productsDb.size, 0, 'Must NOT persist product in database during preparation');
  });

  // 4. Rose Noir Full Completion
  it('4. Rose Noir Full Completion: Gender supplied -> READY with zero human questions', async () => {
    const intakeRepo = new ProductIntakeSettingsRepository();
    intakeRepo.setInMemorySettings(storeA, { default_min_wholesale_qty: 6 });
    const service = createServiceForStore(storeA, intakeRepo);

    const prep = await service.prepareProduct({
      name: 'Perfume Rose Noir',
      retail_price: 259,
      wholesale_price: 189,
      category: 'Perfumes',
      product_gender: 'unissex',
      stock: 10,
    });

    assert.equal(prep.status, 'ready');
    assert.equal(prep.resolved_data.product_gender, 'unissex');
    assert.equal(prep.resolved_data.min_wholesale_qty, 6);
    assert.equal(prep.resolved_data.category_id, categoryPerfumesStoreA.id);
    assert.equal(prep.resolved_data.product_category_type, 'acessorio');
    assert.ok(prep.resolved_data.seo_slug.includes('perfume-rose-noir'));
    assert.ok(prep.resolved_data.sku.length > 5);
    assert.ok(prep.resolved_data.meta_title.includes('Perfume Rose Noir'));
  });

  // 5. Categoria Ambígua e Inexistente
  it('5. Category Edge Cases: Ambiguous returns ASK; missing returns BLOCKED', async () => {
    // Add ambiguous categories and remove exact "Perfumes"
    categoriesDb.set(categoryPerfumesImportadosStoreA.id, categoryPerfumesImportadosStoreA);
    categoriesDb.set(categoryPerfumesNacionaisStoreA.id, categoryPerfumesNacionaisStoreA);
    categoriesDb.delete(categoryPerfumesStoreA.id);

    const intakeRepo = new ProductIntakeSettingsRepository();
    const service = createServiceForStore(storeA, intakeRepo);

    // Ambiguous query for "Perfume" matching both Importados and Nacionais
    const prepAmbiguous = await service.prepareProduct({
      name: 'Colônia Frescor',
      retail_price: 120,
      category: 'Perfume',
      product_gender: 'unissex',
    });

    assert.equal(prepAmbiguous.status, 'needs_input');
    const catDec = prepAmbiguous.decisions.find((d) => d.field === 'category');
    assert.equal(catDec?.decision, 'ask');
    assert.ok(catDec?.allowed_values && catDec.allowed_values.length > 1);

    // Missing category
    const prepMissing = await service.prepareProduct({
      name: 'Notebook Gamer',
      retail_price: 4500,
      category: 'Eletrônicos Inexistentes',
    });

    assert.equal(prepMissing.status, 'blocked');
    assert.ok(prepMissing.issues?.some((i) => i.code === 'CATEGORY_NOT_FOUND'));

    // Clean up
    categoriesDb.set(categoryPerfumesStoreA.id, categoryPerfumesStoreA);
    categoriesDb.delete(categoryPerfumesImportadosStoreA.id);
    categoriesDb.delete(categoryPerfumesNacionaisStoreA.id);
  });

  // 6. CSV Column Normalization
  it('6. CSV Column Normalization: Supports Portuguese and colloquial aliases', async () => {
    const intakeRepo = new ProductIntakeSettingsRepository();
    const service = createServiceForStore(storeA, intakeRepo);

    const prep = await service.prepareProduct({
      produto: 'Bolsa Couro Clássica',
      preco: '159,90',
      atacado: '119,00',
      qtd_atacado: '5',
      categoria: 'Bolsas',
      estoque: '15',
    });

    assert.equal(prep.status, 'ready');
    assert.equal(prep.resolved_data.name, 'Bolsa Couro Clássica');
    assert.equal(prep.resolved_data.retail_price, 159.9);
    assert.equal(prep.resolved_data.wholesale_price, 119.0);
    assert.equal(prep.resolved_data.min_wholesale_qty, 5);
    assert.equal(prep.resolved_data.product_category_type, 'acessorio');
    assert.equal(prep.inventory_intent?.quantity, 15);
  });

  // 7. Batch Analysis: 12 Realistic Products with Grouped Decisions
  it('7. Batch Analysis: Classifies lote and consolidates repetitive decisions into grouped groups', async () => {
    const intakeRepo = new ProductIntakeSettingsRepository();
    // No tenant MOQ default set on purpose to test MOQ grouping
    const service = createServiceForStore(storeA, intakeRepo);

    const batch = [
      // 1. Ready
      { produto: 'Bolsa Executiva', preco: 250, categoria: 'Bolsas' },
      // 2. Ready
      { produto: 'Sapato Social', preco: 180, categoria: 'Calçados', genero: 'masculino' },
      // 3. Needs input: Wholesale without MOQ (Item A)
      { produto: 'Mochila Urbana', preco: 120, atacado: 90, categoria: 'Bolsas' },
      // 4. Needs input: Wholesale without MOQ (Item B)
      { produto: 'Pasta Carteiro', preco: 140, atacado: 100, categoria: 'Bolsas' },
      // 5. Needs input: Perfume without gender (Item A)
      { produto: 'Perfume Elegance', preco: 210, categoria: 'Perfumes' },
      // 6. Needs input: Perfume without gender (Item B)
      { produto: 'Colônia Citrus', preco: 130, categoria: 'Perfumes' },
      // 7. Invalid: Unknown category
      { produto: 'Camisa Polo', preco: 99, categoria: 'Roupas Desconhecidas' },
      // 8. Invalid: Price <= 0
      { produto: 'Cinto Couro', preco: 0, categoria: 'Bolsas' },
      // 9. Ready
      { produto: 'Tênis Casual', preco: 199, categoria: 'Calçados', genero: 'unissex' },
      // 10. Ready
      { produto: 'Carteira Slim', preco: 79, categoria: 'Bolsas' },
      // 11. Needs input: Wholesale without MOQ (Item C)
      { produto: 'Bolsa Térmica', preco: 85, atacado: 60, categoria: 'Bolsas' },
      // 12. Invalid: Unknown category
      { produto: 'Smartphone Pro', preco: 3000, categoria: 'Smartphones' },
    ];

    const result = await service.analyzeImport({ products: batch, import_id: 'lote-teste-12' });

    assert.equal(result.summary.total, 12);
    assert.equal(result.summary.ready, 4);
    assert.equal(result.summary.needs_input, 5);
    assert.equal(result.summary.invalid, 3);

    assert.equal(result.ready_products.length, 4);

    // Check Grouped Decisions (FASE K)
    const bulkMoq = result.grouped_decisions.find((g) => g.field === 'min_wholesale_qty');
    assert.ok(bulkMoq, 'Must group MOQ decisions');
    assert.equal(bulkMoq.affected_count, 3, 'Must identify exactly 3 items with missing MOQ');

    const bulkGender = result.grouped_decisions.find((g) => g.field === 'product_gender');
    assert.ok(bulkGender, 'Must group gender decisions');
    assert.equal(bulkGender.affected_count, 2, 'Must identify 2 perfumes needing gender');

    const bulkCat = result.grouped_decisions.find((g) => g.field === 'category');
    assert.ok(bulkCat, 'Must group missing category decisions');
    assert.equal(bulkCat.affected_count, 2, 'Must group 2 unmapped categories');
  });

  // 8. Batch Limit Guard (> 100 items rejected)
  it('8. Batch Limit Guard: Rejects more than 100 items with ImportBatchTooLargeError', async () => {
    const intakeRepo = new ProductIntakeSettingsRepository();
    const service = createServiceForStore(storeA, intakeRepo);

    const bigBatch = Array.from({ length: 101 }, (_, i) => ({
      name: `Produto ${i + 1}`,
      retail_price: 10,
      category: 'Bolsas',
    }));

    await assert.rejects(
      async () => {
        await service.analyzeImport({ products: bigBatch });
      },
      (err: any) => {
        return err instanceof ImportBatchTooLargeError && err.maxItems === 100;
      }
    );
  });

  // 9. Update Tenant Defaults
  it('9. Update Tenant Defaults: Updates settings and emits audit log', async () => {
    const intakeRepo = new ProductIntakeSettingsRepository();
    const service = createServiceForStore(storeA, intakeRepo);

    const updated = await service.updateIntakeDefaults({
      default_min_wholesale_qty: 10,
      auto_generate_sku: true,
      auto_generate_slug: true,
      inventory_import_mode: 'initial_balance',
    });

    assert.equal(updated.default_min_wholesale_qty, 10);
    assert.equal(updated.inventory_import_mode, 'initial_balance');

    const retrieved = await service.getIntakeDefaults();
    assert.equal(retrieved.default_min_wholesale_qty, 10);
  });

  // 10. Multi-Tenant Category Isolation in Preparation
  it('10. Multi-Tenant Category Isolation: Store A cannot resolve Store B category in prepareProduct', async () => {
    const intakeRepo = new ProductIntakeSettingsRepository();
    const serviceA = createServiceForStore(storeA, intakeRepo);

    const prep = await serviceA.prepareProduct({
      name: 'Produto B',
      retail_price: 100,
      category: 'Cosméticos Store B',
    });

    assert.equal(prep.status, 'blocked');
    assert.ok(prep.issues?.some((i) => i.code === 'CATEGORY_NOT_FOUND'));
  });
});
