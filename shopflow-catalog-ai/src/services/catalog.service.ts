import { ProductRepository } from '../repositories/product.repository.js';
import { CategoryRepository } from '../repositories/category.repository.js';
import { AuditService } from '../audit/audit.service.js';
import {
  ProductNotFoundError,
  CategoryNotFoundError,
  SkuAlreadyExistsError,
  NoChangesProvidedError,
  StoreContextRequiredError,
  ForbiddenError,
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
    private auditService: AuditService = new AuditService()
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

  async createProduct(input: CreateProductInput): Promise<SafeProductResult> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:write');
    const activeStoreId = requireActiveStore(context);

    let resolvedCategory: string | undefined = input.category;

    // Validate tenant-scoped category if category_id is provided
    if (input.category_id) {
      const cat = await this.categoryRepo.findByIdAndStore(input.category_id, activeStoreId);
      if (!cat) {
        throw new CategoryNotFoundError('CATEGORY_NOT_FOUND');
      }
      resolvedCategory = cat.name;
    }

    // Validate SKU uniqueness within the active store
    if (input.sku) {
      const skuExists = await this.repository.checkSkuExists(activeStoreId, input.sku);
      if (skuExists) {
        throw new SkuAlreadyExistsError('SKU_ALREADY_EXISTS');
      }
    }

    // Explicit payload allowlist (strictly excluding stock, store_id, id, etc.)
    const payload: Record<string, any> = {
      name: input.name,
      retail_price: input.retail_price,
    };

    if (input.description !== undefined) payload.description = input.description;
    if (input.sku !== undefined) payload.sku = input.sku;
    if (input.wholesale_price !== undefined) payload.wholesale_price = input.wholesale_price;
    if (input.min_wholesale_qty !== undefined) payload.min_wholesale_qty = input.min_wholesale_qty;
    if (resolvedCategory !== undefined) payload.category = resolvedCategory;
    if (input.material !== undefined) payload.material = input.material;
    if (input.product_gender !== undefined) payload.product_gender = input.product_gender;
    if (input.product_category_type !== undefined) {
      payload.product_category_type = input.product_category_type;
    }

    const createdProduct = await this.repository.createProduct(activeStoreId, payload);

    // Record audit event only after successful creation
    await this.auditService.logProductCreated(context, createdProduct.id, Object.keys(payload));

    return createdProduct;
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
}

