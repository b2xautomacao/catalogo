import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentSession } from '../src/auth/agent-session.js';
import { CatalogService } from '../src/services/catalog.service.js';
import { ProductTaxonomyService } from '../src/services/product-taxonomy.service.js';
import { StoreService } from '../src/services/store.service.js';
import { CreateProductSchema, GetProductSchema } from '../src/schemas/product.schema.js';
import { AdjustStockSchema } from '../src/schemas/inventory.schema.js';
import { CreateCategorySchema } from '../src/schemas/category.schema.js';
import type { CategoryRepository, CategoryRecord } from '../src/repositories/category.repository.js';
import type { ProductRepository } from '../src/repositories/product.repository.js';
import { ProductIntakeSettingsRepository } from '../src/repositories/product-intake-settings.repository.js';
import type { AuditService } from '../src/audit/audit.service.js';

describe('Sprint Agent Fluidity & Protocol Alignment — Contract & Flow Tests', () => {
  const storeA = '11111111-1111-1111-1111-111111111111';
  const storeB = '22222222-2222-2222-2222-222222222222';

  const catPerfumesId = 'a1111111-1111-4111-8111-111111111111';
  const catCosmeticosId = 'a2222222-2222-4222-8222-222222222222';
  const catPerfumesStoreBId = 'b1111111-1111-4111-8111-111111111111';

  const mockCategories: CategoryRecord[] = [
    {
      id: catPerfumesId,
      store_id: storeA,
      name: 'Perfumes',
      description: 'Fragrâncias e colônias',
      is_active: true,
    },
    {
      id: catCosmeticosId,
      store_id: storeA,
      name: 'Cosméticos',
      description: 'Produtos de beleza e cosméticos',
      is_active: true,
    },
    {
      id: catPerfumesStoreBId,
      store_id: storeB,
      name: 'Perfumes Store B',
      description: 'Exclusivo Store B',
      is_active: true,
    },
  ];

  class InMemoryCategoryRepo implements CategoryRepository {
    public items = [...mockCategories];

    async listByStore(storeId: string): Promise<CategoryRecord[]> {
      return this.items.filter((c) => c.store_id === storeId && c.is_active);
    }

    async findByIdAndStore(categoryId: string, storeId: string): Promise<CategoryRecord | null> {
      return this.items.find((c) => c.id === categoryId && c.store_id === storeId) ?? null;
    }

    async findByNameAndStore(name: string, storeId: string): Promise<CategoryRecord | null> {
      const normalized = name.trim().toLowerCase();
      return this.items.find((c) => c.store_id === storeId && c.name.trim().toLowerCase() === normalized) ?? null;
    }

    async createCategory(
      storeId: string,
      name: string,
      description?: string
    ): Promise<{ category: CategoryRecord; created: boolean }> {
      const existing = await this.findByNameAndStore(name, storeId);
      if (existing) {
        return { category: existing, created: false };
      }
      const created: CategoryRecord = {
        id: 'c' + Math.random().toString(16).substring(2, 9) + '-0000-4000-8000-000000000000',
        store_id: storeId,
        name: name.trim(),
        description: description ?? null,
        is_active: true,
      };
      this.items.push(created);
      return { category: created, created: true };
    }
  }

  const dummyProductRepo = {
    checkSlugExists: async () => false,
    checkSkuExists: async () => false,
    findBySkuAndStore: async () => null,
    findBySlugAndStore: async () => null,
    createProduct: async (storeId: string, p: any) => ({
      id: 'prod-fluid-123',
      store_id: storeId,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      category_id: p.category_id,
      retail_price: p.retail_price,
      wholesale_price: p.wholesale_price,
      min_wholesale_quantity: p.min_wholesale_quantity,
      is_active: p.is_active ?? true,
    }),
    findByIdAndStore: async (id: string, sId: string) => ({
      id,
      store_id: sId,
      name: 'Produto Teste',
      sku: 'SKU-TEST',
      category_id: 'cat-perfumes-a',
    }),
    findManyByStore: async () => ({ items: [], total: 0 }),
  } as unknown as ProductRepository;

  const dummyAudit = {
    log: async () => {},
    logProductCreated: async () => {},
    logProductUpdated: async () => {},
    logProductDeactivated: async () => {},
    logTenantDefaultsUpdated: async () => {},
    logStoreSelected: async () => {},
  } as unknown as AuditService;

  const dummyStoreRepo = {
    getStoreById: async (id: string) => ({
      id,
      name: 'Loja de Teste A',
      slug: 'loja-a',
      is_active: true,
    }),
    listStoresByOwner: async () => [],
    listStoresByAgentCredential: async () => [],
  } as any;

  function createCatalogService(
    storeId: string,
    catRepo = new InMemoryCategoryRepo(),
    scopes: string[] = ['catalog:read', 'catalog:write', 'inventory:write']
  ) {
    const session = new AgentSession({
      sessionId: 'session-fluidity',
      agentId: 'agent-1',
      principalType: 'agent',
      principalId: 'agent-1',
      storeAccess: { mode: 'restricted', storeIds: [storeId] },
      activeStoreId: storeId,
      scopes,
    });

    const intakeSettingsRepo = new ProductIntakeSettingsRepository();
    // Configure default MOQ to 6 for storeId in-memory
    intakeSettingsRepo.setInMemorySettings(storeId, {
      default_min_wholesale_qty: 6,
      unknown_category_policy: 'ask',
    });

    const service = new CatalogService(
      session,
      dummyProductRepo,
      catRepo,
      dummyAudit,
      new ProductTaxonomyService(),
      intakeSettingsRepo
    );

    return { service, session, catRepo, intakeSettingsRepo };
  }

  // =========================================================================
  // FASE C & D: CANONICAL CONTRACTS & EXECUTABLE PAYLOADS
  // =========================================================================
  it('Fase C & D: preparar_produto deve emitir executable_payloads válidos para criar_produto e ajustar_estoque', async () => {
    const { service } = createCatalogService(storeA);

    const result = await service.prepareProduct({
      name: 'Perfume Sabah Al Ward 100ml',
      retail_price: 259.0,
      wholesale_price: 189.0,
      stock: 10,
      category_name: 'Perfumes',
      gender: 'feminino',
    });

    assert.equal(result.status, 'ready');
    assert.ok(result.preparation_id, 'Deve conter preparation_id canônico');
    assert.ok(result.preparation_id.startsWith('prep_'), 'preparation_id deve iniciar com prep_');

    // 1. Validar executable_payloads.criar_produto contra CreateProductSchema
    assert.ok(result.executable_payloads?.criar_produto, 'Deve gerar payload executável para criar_produto');
    const parsedCreate = CreateProductSchema.parse(result.executable_payloads.criar_produto);
    assert.equal(parsedCreate.name, 'Perfume Sabah Al Ward 100ml');
    assert.equal(parsedCreate.retail_price, 259.0);
    assert.equal(parsedCreate.wholesale_price, 189.0);
    assert.equal(parsedCreate.category_id, catPerfumesId);
    assert.equal(parsedCreate.is_active, true);

    // 2. Validar executable_payloads.ajustar_estoque contra AdjustStockSchema (após preencher product_id)
    assert.ok(result.executable_payloads?.ajustar_estoque, 'Deve gerar payload executável para ajustar_estoque');
    const stockPayload = {
      product_id: 'a0000000-0000-4000-8000-000000000001',
      ...result.executable_payloads.ajustar_estoque,
    };
    const parsedStock = AdjustStockSchema.parse(stockPayload);
    assert.equal(parsedStock.operation, 'increase');
    assert.equal(parsedStock.quantity, 10);
    assert.equal(parsedStock.reason, 'initial_balance');
    assert.ok(parsedStock.operation_id?.startsWith('op_stock_'));

    // 3. Validar payload de ajuste de estoque canônico (sem mode ou reason_code)
    assert.equal((result.executable_payloads?.ajustar_estoque as any).mode, undefined, 'Não deve conter mode legado');
    assert.equal((result.executable_payloads?.ajustar_estoque as any).reason_code, undefined, 'Não deve conter reason_code legado');
  });

  // =========================================================================
  // FASE F: STRUCTURED NEXT ACTIONS
  // =========================================================================
  it('Fase F: next_actions deve ser um array estruturado e machine-readable', async () => {
    const { service } = createCatalogService(storeA);

    const result = await service.prepareProduct({
      name: 'Perfume Teste Machine Readable',
      retail_price: 150,
      stock: 5,
      category_name: 'Perfumes',
      gender: 'unissex',
    });

    assert.equal(result.status, 'ready');
    assert.ok(Array.isArray(result.next_actions), 'next_actions deve ser array');
    assert.ok(result.next_actions.length >= 2, 'deve ter pelo menos criar_produto e ajustar_estoque');

    const createAction = result.next_actions.find((a) => a.tool === 'criar_produto');
    assert.ok(createAction, 'Deve existir ação criar_produto');
    assert.equal(createAction.required, true);
    assert.ok(createAction.prepared_input, 'Deve carregar prepared_input');

    const stockAction = result.next_actions.find((a) => a.tool === 'ajustar_estoque');
    assert.ok(stockAction, 'Deve existir ação ajustar_estoque');
    assert.equal(stockAction.required, true);
    assert.equal(stockAction.reason, 'initial_inventory_pending');

    const imageAction = result.next_actions.find((a) => a.tool === 'adicionar_imagem_produto');
    assert.ok(imageAction, 'Deve sugerir adicionar imagem opcional');
    assert.equal(imageAction.required, false);
  });

  // =========================================================================
  // FASE J & K: CATEGORY CREATION & DETERMINISTIC SUGGESTIONS
  // =========================================================================
  it('Fase J & K: categoria não encontrada deve gerar unresolved_category com sugestões e ação sugerida', async () => {
    const { service } = createCatalogService(storeA);

    // Categoria desconhecida "Cosmetologia Facial" (não é substring, mas prefixo 'cos' sugere 'Cosméticos')
    const result = await service.prepareProduct({
      name: 'Creme Hidratante Premium',
      retail_price: 89.9,
      category_name: 'Cosmetologia Facial',
      gender: 'unissex',
    });

    assert.equal(result.status, 'blocked');
    assert.ok(result.issues?.some((i) => i.code === 'CATEGORY_NOT_FOUND'));
    assert.ok(result.unresolved_category, 'Deve emitir bloco unresolved_category');
    assert.equal(result.unresolved_category.can_create, true);
    assert.equal(result.unresolved_category.suggested_action.tool, 'criar_categoria');
    assert.ok(Array.isArray(result.unresolved_category.suggestions));
    // 'Cosméticos' é sugerido por prefixo determinístico
    assert.ok(result.unresolved_category.suggestions.includes('Cosméticos'));
  });

  it('Fase J: criar_categoria deve criar de forma idempotente e segura para o tenant', async () => {
    const catRepo = new InMemoryCategoryRepo();
    const { service: serviceA } = createCatalogService(storeA, catRepo);

    // 1. Cria nova categoria
    const cat1 = await serviceA.createCategory({
      name: 'Perfumes Árabes',
      description: 'Fragrâncias orientais refinadas',
    });
    assert.equal(cat1.name, 'Perfumes Árabes');
    assert.equal(cat1.store_id, storeA);
    assert.equal(cat1.created, true);

    // 2. Cria novamente com mesmo nome normalizado (idempotência)
    const cat2 = await serviceA.createCategory({
      name: '  perfumes árabes  ',
    });
    assert.equal(cat2.id, cat1.id, 'Deve retornar a categoria existente idempotentemente');
    assert.equal(cat2.already_exists, true);

    // 3. Valida isolamento tenant: storeB cria mesma categoria mas recebe seu próprio registro
    const { service: serviceB } = createCatalogService(storeB, catRepo);
    const catStoreB = await serviceB.createCategory({
      name: 'Perfumes Árabes',
    });
    assert.notEqual(catStoreB.id, cat1.id, 'Store B deve ter sua própria categoria');
    assert.equal(catStoreB.store_id, storeB);
  });

  // =========================================================================
  // FASE I: STORE CONTEXT WITH catalog:read
  // =========================================================================
  it('Fase I: obter_loja_ativa deve funcionar para agente single-store com apenas catalog:read', async () => {
    const session = new AgentSession({
      sessionId: 'session-catalog-only',
      agentId: 'agent-cat-only',
      principalType: 'agent',
      principalId: 'agent-cat-only',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['catalog:read', 'catalog:write'], // Sem store:list e sem store:read
    });
    const storeService = new StoreService(session, dummyStoreRepo, dummyAudit);

    const activeStore = await storeService.getActiveStore();
    assert.ok(activeStore);
    assert.equal(activeStore.id, storeA);
    assert.equal(activeStore.name, 'Loja de Teste A');
  });

  // =========================================================================
  // FASE L: PRODUCT LOOKUP ID ALIAS
  // =========================================================================
  it('Fase L: GetProductSchema deve aceitar id como alias de product_id', () => {
    // Via product_id com UUID RFC 4122 válido
    const res1 = GetProductSchema.parse({ product_id: 'a0000000-0000-4000-8000-000000000001' });
    assert.equal(res1.product_id, 'a0000000-0000-4000-8000-000000000001');

    // Via id alias (normalizado para product_id via transform) com UUID RFC 4122 válido
    const res2 = GetProductSchema.parse({ id: 'b0000000-0000-4000-8000-000000000002' });
    assert.equal(res2.product_id, 'b0000000-0000-4000-8000-000000000002');
  });

  // =========================================================================
  // FASE E: is_active NO CreateProductSchema
  // =========================================================================
  it('Fase E: CreateProductSchema deve aceitar is_active opcionalmente', () => {
    const payload = {
      name: 'Perfume Teste Ativo',
      retail_price: 199.9,
      is_active: true,
    };
    const parsed = CreateProductSchema.parse(payload);
    assert.equal(parsed.is_active, true);
  });

  // =========================================================================
  // FASE T: SIMULAÇÃO NOMINAL COMPLETA DE AGENTE
  // =========================================================================
  it('Fase T: Fluxo Nominal Completo de Agente (prepare -> create -> adjust_stock) sem retries nem erros de schema', async () => {
    const { service } = createCatalogService(storeA);

    // 1. Preparar Produto
    const prepareOutput = await service.prepareProduct({
      name: 'Perfume Sabah Al Ward 100ml',
      retail_price: 259.0,
      wholesale_price: 189.0,
      stock: 10,
      category_name: 'Perfumes',
      gender: 'feminino',
    });

    assert.equal(prepareOutput.status, 'ready');
    assert.ok(prepareOutput.executable_payloads);

    // 2. Executar criar_produto com o payload fornecido diretamente
    const createPayload = prepareOutput.executable_payloads.criar_produto;
    // Validação estrita do schema do tool criar_produto
    const validatedCreateInput = CreateProductSchema.parse(createPayload);
    assert.ok(validatedCreateInput);

    // Simula a criação downstream
    const createdProduct = await dummyProductRepo.createProduct(storeA, validatedCreateInput);
    assert.equal(createdProduct.id, 'prod-fluid-123');

    // 3. Executar ajustar_estoque apenas complementando o product_id gerado
    const stockPayload = {
      product_id: 'a0000000-0000-4000-8000-000000000001', // UUID RFC válido para AdjustStockSchema
      ...prepareOutput.executable_payloads.ajustar_estoque,
    };
    const validatedStockInput = AdjustStockSchema.parse(stockPayload);
    assert.equal(validatedStockInput.operation, 'increase');
    assert.equal(validatedStockInput.quantity, 10);
    assert.equal(validatedStockInput.reason, 'initial_balance');
    assert.ok(validatedStockInput.operation_id?.startsWith('op_stock_'));

    // Sucesso total sem nenhum retry ou erro de validação
    assert.ok(true, 'Fluxo nominal completado com 0 retries');
  });
});
