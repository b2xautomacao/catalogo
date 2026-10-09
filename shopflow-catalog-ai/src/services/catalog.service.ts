import { ProductRepository } from '../repositories/product.repository.js';
import { CategoryRepository } from '../repositories/category.repository.js';
import { ProductIntakeSettingsRepository } from '../repositories/product-intake-settings.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { ProductTaxonomyService } from './product-taxonomy.service.js';
import {
  ProductNotFoundError,
  CategoryNotFoundError,
  CategoryAmbiguousError,
  SkuAlreadyExistsError,
  NoChangesProvidedError,
  StoreContextRequiredError,
  ForbiddenError,
  ImportBatchTooLargeError,
} from '../domain/errors.js';
import {
  Product,
  DetailedProduct,
  ListProductsFilters,
  CreateProductInput,
  UpdateProductInput,
  DeactivateProductInput,
  DeactivateProductResult,
  SafeProductResult,
  CreateProductResult,
  CreatedProductResult,
  NeedsInputProductResult,
  ProductCompletenessPreflight,
  TenantIntakeDefaults,
  UpdateTenantIntakeDefaultsInput,
  ProductIntakePolicyResult,
  PreparedProductResult,
  AnalyzeImportResult,
} from '../domain/types.js';
import { requireScope, requireActiveStore } from '../auth/agent-context.js';
import { AgentSession } from '../auth/agent-session.js';

export interface CatalogHealthStatus {
  ok: boolean;
  database: 'reachable' | 'unreachable';
  authenticated: boolean;
  principalType: string;
  storeContext: boolean;
}

export class CatalogService {
  constructor(
    private session: AgentSession,
    private repository: ProductRepository = new ProductRepository(),
    private categoryRepo: CategoryRepository = new CategoryRepository(),
    private auditService: AuditService = new AuditService(),
    private taxonomyService: ProductTaxonomyService = new ProductTaxonomyService(),
    private intakeSettingsRepo: ProductIntakeSettingsRepository = new ProductIntakeSettingsRepository()
  ) {}

  async checkHealth(): Promise<CatalogHealthStatus> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:read');
    const isOk = await this.repository.checkHealth(context.activeStoreId);

    return {
      ok: isOk,
      database: isOk ? 'reachable' : 'unreachable',
      authenticated: true,
      principalType: context.principalType,
      storeContext: !!context.activeStoreId,
    };
  }

  async listProducts(filters: ListProductsFilters): Promise<Product[]> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:read');
    const activeStoreId = requireActiveStore(context);
    return this.repository.listProducts(activeStoreId, filters);
  }

  async getProduct(id: string): Promise<DetailedProduct> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:read');
    const activeStoreId = requireActiveStore(context);
    const product = await this.repository.getProductById(activeStoreId, id);

    if (!product) {
      throw new ProductNotFoundError();
    }

    return product;
  }

  async preflightProductCreation(input: CreateProductInput): Promise<ProductCompletenessPreflight> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:read');
    const activeStoreId = requireActiveStore(context);
    const result = await this.taxonomyService.evaluateCompleteness(
      activeStoreId,
      input,
      this.categoryRepo,
      this.repository
    );
    return {
      complete: result.isComplete,
      missing: result.missing,
      resolved: result.derived,
    };
  }

  async createProduct(input: CreateProductInput): Promise<CreateProductResult> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:write');
    const activeStoreId = requireActiveStore(context);

    // 1. Validate SKU uniqueness within the active store upfront
    if (input.sku) {
      const skuExists = await this.repository.checkSkuExists(activeStoreId, input.sku);
      if (skuExists) {
        throw new SkuAlreadyExistsError('SKU_ALREADY_EXISTS');
      }
    }

    // 2. Resolve Category against active store if provided
    let resolvedCategory: { id: string; name: string } | undefined;
    if (input.category || input.category_id) {
      const match = await this.taxonomyService.resolveCategory(activeStoreId, this.categoryRepo, {
        category: input.category,
        category_id: input.category_id,
      });

      if (match.status === 'not_found') {
        throw new CategoryNotFoundError('CATEGORY_NOT_FOUND');
      }
      if (match.status === 'ambiguous') {
        throw new CategoryAmbiguousError(
          `A categoria "${input.category}" é ambígua no catálogo da loja ativa.`,
          (match.candidates || []).map((c) => ({ id: c.id, name: c.name }))
        );
      }
      if (match.category) {
        resolvedCategory = { id: match.category.id, name: match.category.name };
      }
    }

    // 3. Run Completeness Preflight with Tenant Defaults
    const tenantDefaults = await this.intakeSettingsRepo.getSettings(activeStoreId);
    const completeness = await this.taxonomyService.evaluateCompleteness(
      activeStoreId,
      input,
      this.categoryRepo,
      this.repository,
      tenantDefaults
    );

    // If missing decisions, return structured needs_input without partial persistence
    if (!completeness.isComplete) {
      return {
        status: 'needs_input',
        created: false,
        missing_fields: completeness.missing.map((m) => m.field),
        questions: completeness.questions,
        preflight: {
          name: input.name,
          retail_price: input.retail_price,
          wholesale_price: input.wholesale_price,
          resolved_category: resolvedCategory?.name || completeness.derived.category?.name || input.category,
          resolved_category_id: resolvedCategory?.id || completeness.derived.category?.id || input.category_id,
          derived_product_category_type: completeness.derived.product_category_type,
          derived_product_gender: completeness.derived.product_gender,
          derived_slug: completeness.derived.seo_slug,
          derived_meta_title: completeness.derived.meta_title,
          derived_meta_description: completeness.derived.meta_description,
        },
      };
    }

    // Explicit payload allowlist with derived & resolved metadata
    const payload: Record<string, any> = {
      name: input.name,
      retail_price: input.retail_price,
      category: completeness.derived.category?.name || input.category,
      product_category_type: completeness.derived.product_category_type,
      product_gender: completeness.derived.product_gender,
      seo_slug: completeness.derived.seo_slug,
      meta_title: completeness.derived.meta_title,
      meta_description: completeness.derived.meta_description,
      keywords: completeness.derived.keywords,
    };

    if (completeness.derived.category?.id) {
      payload.category_id = completeness.derived.category.id;
    } else if (input.category_id) {
      payload.category_id = input.category_id;
    }

    if (input.description !== undefined) payload.description = input.description;
    if (input.sku !== undefined) payload.sku = input.sku;
    if (input.wholesale_price !== undefined) payload.wholesale_price = input.wholesale_price;
    if (completeness.derived.min_wholesale_qty !== undefined) {
      payload.min_wholesale_qty = completeness.derived.min_wholesale_qty;
    }
    if (input.material !== undefined) payload.material = input.material;

    const createdProduct = await this.repository.createProduct(activeStoreId, payload);

    // Record audit event only after successful creation
    await this.auditService.logProductCreated(context, createdProduct.id, Object.keys(payload));

    const result: CreatedProductResult = {
      ...createdProduct,
      status: 'created',
      created: true,
      product: createdProduct,
      next_actions: [
        'adicionar_imagem_produto',
        'ajustar_estoque',
      ],
      structured_next_actions: [
        {
          tool: 'ajustar_estoque',
          required: true,
          reason: 'initial_inventory_pending',
          prepared_input: {
            product_id: createdProduct.id,
            operation: 'increase',
            reason: 'initial_balance',
            notes: 'Saldo físico inicial de cadastro',
          },
        },
        {
          tool: 'adicionar_imagem_produto',
          required: false,
          reason: 'product_has_no_image',
          prepared_input: {
            product_id: createdProduct.id,
            is_primary: true,
          },
        },
      ],
    };

    return result;
  }

  async updateProduct(input: UpdateProductInput): Promise<SafeProductResult> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:write');
    const activeStoreId = requireActiveStore(context);

    // Build partial patch payload
    const payload: Record<string, any> = {};

    if (input.category_id !== undefined) {
      if (input.category_id === null) {
        payload.category = null;
      } else {
        const cat = await this.categoryRepo.findByIdAndStore(input.category_id, activeStoreId);
        if (!cat) {
          throw new CategoryNotFoundError('CATEGORY_NOT_FOUND');
        }
        payload.category = cat.name;
      }
    } else if (input.category !== undefined) {
      payload.category = input.category;
    }

    if (input.name !== undefined) payload.name = input.name;
    if (input.description !== undefined) payload.description = input.description;
    if (input.retail_price !== undefined) payload.retail_price = input.retail_price;
    if (input.wholesale_price !== undefined) payload.wholesale_price = input.wholesale_price;
    if (input.min_wholesale_qty !== undefined) payload.min_wholesale_qty = input.min_wholesale_qty;
    if (input.material !== undefined) payload.material = input.material;
    if (input.product_gender !== undefined) payload.product_gender = input.product_gender;
    if (input.product_category_type !== undefined) {
      payload.product_category_type = input.product_category_type;
    }
    if (input.seo_slug !== undefined) payload.seo_slug = input.seo_slug;
    if (input.meta_title !== undefined) payload.meta_title = input.meta_title;
    if (input.meta_description !== undefined) payload.meta_description = input.meta_description;
    if (input.keywords !== undefined) payload.keywords = input.keywords;

    if (input.sku !== undefined) {
      if (input.sku !== null) {
        const skuExists = await this.repository.checkSkuExists(
          activeStoreId,
          input.sku,
          input.product_id
        );
        if (skuExists) {
          throw new SkuAlreadyExistsError('SKU_ALREADY_EXISTS');
        }
      }
      payload.sku = input.sku;
    }

    const changedFields = Object.keys(payload);
    if (changedFields.length === 0) {
      throw new NoChangesProvidedError('NO_CHANGES_PROVIDED');
    }

    const updatedProduct = await this.repository.updateProduct(
      activeStoreId,
      input.product_id,
      payload
    );

    if (!updatedProduct) {
      throw new ProductNotFoundError('PRODUCT_NOT_FOUND');
    }

    // Record audit event only after successful update
    await this.auditService.logProductUpdated(context, updatedProduct.id, changedFields);

    return updatedProduct;
  }

  async deactivateProduct(input: DeactivateProductInput): Promise<DeactivateProductResult> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:write');
    const activeStoreId = requireActiveStore(context);

    // 1. TENANT GUARD LOOKUP: Locate product specifically in the active store
    const existing = await this.repository.getProductById(activeStoreId, input.product_id);
    if (!existing) {
      throw new ProductNotFoundError('PRODUCT_NOT_FOUND');
    }

    // 2. IDEMPOTENCY CHECK: If already inactive, return success without mutation
    if (!existing.is_active) {
      await this.auditService.logProductDeactivated(context, existing.id, true);
      return {
        deactivated: true,
        alreadyInactive: true,
        product: {
          id: existing.id,
          name: existing.name,
          sku: existing.sku,
          description: null,
          category: null,
          retail_price: existing.retail_price,
          wholesale_price: existing.wholesale_price,
          is_active: false,
        },
      };
    }

    // 3. DUAL TENANT GUARD MUTATION: Soft delete with WHERE id = product_id AND store_id = activeStoreId
    const deactivated = await this.repository.deactivateProduct(activeStoreId, input.product_id);
    if (!deactivated) {
      throw new ProductNotFoundError('PRODUCT_NOT_FOUND');
    }

    // 4. AUDIT: Record event only after successful mutation
    await this.auditService.logProductDeactivated(context, deactivated.id, false);

    return {
      deactivated: true,
      alreadyInactive: false,
      product: deactivated,
    };
  }

  async bulkUpdateProducts(input: {
    product_ids: string[];
    updates: Record<string, any>;
    operation_id: string;
  }): Promise<any> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:write');
    const activeStoreId = requireActiveStore(context);

    const result = await this.repository.bulkUpdateProducts(
      activeStoreId,
      input.product_ids,
      input.updates,
      input.operation_id
    );

    return result;
  }

  async searchCatalog(input: any): Promise<any> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:read');
    const activeStoreId = requireActiveStore(context);

    const rawProducts = await this.repository.searchCatalog(activeStoreId, input);
    
    // In-memory filter & diagnostics processing
    let filtered = Array.isArray(rawProducts) ? [...rawProducts] : [];

    // Text Query search
    if (input.query && input.query.trim().length > 0) {
      const q = input.query.toLowerCase().trim();
      filtered = filtered.filter((p: any) => {
        if (p.name?.toLowerCase().includes(q)) return true;
        if (p.sku?.toLowerCase().includes(q)) return true;
        if (p.category?.toLowerCase().includes(q)) return true;
        if (p.material?.toLowerCase().includes(q)) return true;
        if (p.description?.toLowerCase().includes(q)) return true;
        if (p.product_variations) {
          for (const v of p.product_variations) {
            if (v.sku?.toLowerCase().includes(q)) return true;
            if (v.color?.toLowerCase().includes(q)) return true;
            if (v.size?.toLowerCase().includes(q)) return true;
            if (v.name?.toLowerCase().includes(q)) return true;
          }
        }
        if (p.product_grade_snapshots) {
          for (const g of p.product_grade_snapshots) {
            if (g.template_name?.toLowerCase().includes(q)) return true;
          }
        }
        return false;
      });
    }

    // Has image
    if (typeof input.has_image === 'boolean') {
      filtered = filtered.filter((p: any) => {
        const hasImg = Boolean(p.product_images && p.product_images.length > 0 && p.product_images.some((i: any) => i.image_url));
        return hasImg === input.has_image;
      });
    }

    // Has grade
    if (typeof input.has_grade === 'boolean') {
      filtered = filtered.filter((p: any) => {
        const hasG = Boolean(
          (p.product_grade_snapshots && p.product_grade_snapshots.length > 0) ||
          (p.product_variations && p.product_variations.some((v: any) => v.is_grade))
        );
        return hasG === input.has_grade;
      });
    }

    // Stock Status
    if (input.stock_status && input.stock_status !== 'all') {
      filtered = filtered.filter((p: any) => {
        const stock = p.stock ?? 0;
        const threshold = p.stock_alert_threshold ?? 5;
        if (input.stock_status === 'in_stock') return stock > 0;
        if (input.stock_status === 'out_of_stock') return stock <= 0;
        if (input.stock_status === 'low_stock') return stock > 0 && stock <= threshold;
        return true;
      });
    }

    // Grade Type
    if (input.grade_type && input.grade_type !== 'all') {
      filtered = filtered.filter((p: any) => {
        if (!p.product_grade_snapshots || p.product_grade_snapshots.length === 0) return false;
        const names = p.product_grade_snapshots.map((g: any) => (g.template_name || '').toLowerCase());
        if (input.grade_type === 'alta') return names.some((n: string) => n.includes('alta'));
        if (input.grade_type === 'baixa') return names.some((n: string) => n.includes('baixa'));
        if (input.grade_type === 'custom') return names.some((n: string) => !n.includes('alta') && !n.includes('baixa') && n.length > 0);
        if (input.grade_type === 'legacy') return names.some((n: string) => n.includes('legado') || n.includes('legacy'));
        return true;
      });
    }

    // Sorting
    const sortBy = input.sort_by || 'name';
    const sortOrder = input.sort_order || 'asc';
    filtered.sort((a: any, b: any) => {
      let comp = 0;
      if (sortBy === 'name') comp = (a.name || '').localeCompare(b.name || '');
      else if (sortBy === 'price') comp = (a.retail_price ?? 0) - (b.retail_price ?? 0);
      else if (sortBy === 'stock') comp = (a.stock ?? 0) - (b.stock ?? 0);
      return sortOrder === 'desc' ? -comp : comp;
    });

    const page = input.page || 1;
    const pageSize = input.page_size || 20;
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const offset = (page - 1) * pageSize;
    const items = filtered.slice(offset, offset + pageSize);

    return {
      items,
      total_count: totalCount,
      page,
      page_size: pageSize,
      total_pages: totalPages,
    };
  }

  /**
   * Retrieves the comprehensive Product Intake Policy for the active store context.
   * Machine-readable contract defining required, conditional, derivable, resolvable and forbidden fields.
   */
  async getIntakePolicy(): Promise<ProductIntakePolicyResult> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:read');
    const activeStoreId = requireActiveStore(context);
    const tenantDefaults = await this.intakeSettingsRepo.getSettings(activeStoreId);

    return {
      required: ['name', 'retail_price', 'category'],
      conditional: {
        min_wholesale_qty:
          'Obrigatório se wholesale_price for informado (a menos que a loja possua default_min_wholesale_qty configurado)',
        product_gender:
          'Obrigatório se o produto for sensível a gênero (fragrâncias/perfumes, vestuário, calçados) e não for possível inferir do nome',
      },
      derivable: ['sku', 'seo_slug', 'meta_title', 'meta_description', 'product_category_type'],
      resolvable: [
        'category -> category_id no catálogo da loja ativa via correspondência exata ou normalizada',
      ],
      tenant_defaults: tenantDefaults,
      never_invent: [
        'brand',
        'volume',
        'technical_specifications',
        'material',
        'gender',
        'wholesale_minimum',
      ],
      decision_policy: {
        auto: [
          'slug generation (com resolução automática de colisão por tenant)',
          'SEO factual generation (sem inventar especificações não informadas)',
          'SKU generation (prefixo de categoria e sufixo determinístico)',
          'exact category resolution',
          'normalized exact category resolution',
          'tenant default MOQ application',
          'safe product category type derivation',
        ],
        ask: [
          'gender desconhecido em categorias sensíveis (ex: Perfumes sem indicador de gênero)',
          'categoria ambígua (múltiplas correspondências no catálogo)',
          'MOQ ausente sem default configurado no tenant',
        ],
        block: [
          'categoria inexistente no catálogo da loja ativa',
          'preço de varejo inválido (<= 0 ou ausente)',
          'referência cross-tenant não autorizada',
          'enum de categoria ou gênero não suportado',
        ],
      },
      stock_policy: {
        mode: 'ledger_only',
        rule: "Nunca gravar estoque diretamente em products.stock. Usar a ferramenta ajustar_estoque com reason_code = 'initial_balance' após a criação do produto.",
      },
      image_policy: {
        mode: 'post_creation',
        tool: 'adicionar_imagem_produto',
        rule: 'Criar o produto primeiro e em seguida associar a imagem via URL através da ferramenta adicionar_imagem_produto.',
      },
      summary:
        'Diretrizes canônicas de intake do B2X Catálogo: intake guiado, preflight determinístico e isolamento rigoroso por loja.',
    };
  }

  /**
   * Retrieves the configured Tenant Defaults for product intake.
   */
  async getIntakeDefaults(): Promise<TenantIntakeDefaults> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:read');
    const activeStoreId = requireActiveStore(context);
    return this.intakeSettingsRepo.getSettings(activeStoreId);
  }

  /**
   * Updates Tenant Defaults for product intake for the active store.
   */
  async updateIntakeDefaults(
    input: UpdateTenantIntakeDefaultsInput
  ): Promise<TenantIntakeDefaults> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:write');
    const activeStoreId = requireActiveStore(context);

    const updated = await this.intakeSettingsRepo.updateSettings(activeStoreId, input);

    await this.auditService.logTenantDefaultsUpdated(context, activeStoreId, Object.keys(input));

    return updated;
  }

  /**
   * Preflight preparation of a single product intake without persistence.
   * Normalizes fields, resolves category, applies tenant defaults, derives SKU/slug/SEO.
   */
  async prepareProduct(input: Record<string, any>): Promise<PreparedProductResult> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:read');
    const activeStoreId = requireActiveStore(context);
    const tenantDefaults = await this.intakeSettingsRepo.getSettings(activeStoreId);

    return this.taxonomyService.prepareProduct(
      activeStoreId,
      input,
      this.categoryRepo,
      this.repository,
      tenantDefaults
    );
  }

  /**
   * Analyzes a batch of products (e.g. from CSV/ERP intake) without persistence.
   * Classifies items into ready, needs_input and invalid, groups repetitive decisions.
   */
  async analyzeImport(input: {
    products: Array<Record<string, any>>;
    import_id?: string;
  }): Promise<AnalyzeImportResult> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:read');
    const activeStoreId = requireActiveStore(context);

    if (input.products.length > 100) {
      throw new ImportBatchTooLargeError('IMPORT_BATCH_TOO_LARGE: Máximo de 100 produtos por lote de análise.', 100);
    }

    const tenantDefaults = await this.intakeSettingsRepo.getSettings(activeStoreId);

    return this.taxonomyService.analyzeBatch(
      activeStoreId,
      input.products,
      this.categoryRepo,
      this.repository,
      tenantDefaults
    );
  }

  /**
   * Creates a new category for the active store safely, or returns existing if already present (idempotent).
   * Scope required: catalog:write
   */
  async createCategory(input: { name: string; description?: string }): Promise<{
    id: string;
    store_id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created: boolean;
    already_exists: boolean;
  }> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:write');
    const activeStoreId = requireActiveStore(context);

    const result = await this.categoryRepo.createCategory(
      activeStoreId,
      input.name,
      input.description
    );

    return {
      id: result.category.id,
      store_id: result.category.store_id,
      name: result.category.name,
      description: result.category.description,
      is_active: result.category.is_active,
      created: result.created,
      already_exists: !result.created,
    };
  }
}

