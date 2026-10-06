/**
 * catalogSearchService.ts
 *
 * Sprint 12 — FASE B: Advanced Catalog Search & Product Intelligence
 * Deterministic diagnostics, multi-facet filtering, unit vs pack stock awareness.
 */

export interface ProductSearchItem {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  category_id?: string | null;
  material?: string | null;
  product_gender?: string | null;
  product_category_type?: string | null;
  retail_price: number;
  wholesale_price?: number | null;
  min_wholesale_qty?: number | null;
  stock: number; // Physical total equivalent
  is_active: boolean;
  is_featured?: boolean | null;
  stock_alert_threshold?: number | null;
  images?: Array<{ id: string; image_url: string; is_primary?: boolean }>;
  variations?: Array<{
    id: string;
    name?: string | null;
    sku?: string | null;
    color?: string | null;
    size?: string | null;
    stock: number;
    unit_kind?: 'unit' | 'pack';
    pack_quantity?: number | null;
    is_grade?: boolean;
    grade_template_id?: string | null;
  }>;
  grade_snapshots?: Array<{
    id: string;
    template_name?: string | null;
    items?: Array<{ size: string; quantity: number }>;
  }>;
}

export type ProductDiagnosticCode =
  | 'sem_imagem'
  | 'sem_preco'
  | 'sem_estoque'
  | 'baixo_estoque'
  | 'sem_sku'
  | 'variacao_incompleta'
  | 'grade_sem_estoque';

export interface ProductDiagnostics {
  sem_imagem: boolean;
  sem_preco: boolean;
  sem_estoque: boolean;
  baixo_estoque: boolean;
  sem_sku: boolean;
  variacao_incompleta: boolean;
  grade_sem_estoque: boolean;
  hasIssues: boolean;
  issueCount: number;
  issueList: ProductDiagnosticCode[];
}

export interface CatalogSearchFilterOptions {
  query?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  hasImage?: boolean;
  hasGrade?: boolean;
  hasVariations?: boolean;
  stockStatus?: 'all' | 'in_stock' | 'out_of_stock' | 'low_stock';
  category?: string;
  productGender?: string;
  material?: string;
  minPrice?: number;
  maxPrice?: number;
  gradeType?: 'all' | 'alta' | 'baixa' | 'custom' | 'legacy';
  diagnostics?: ProductDiagnosticCode[];
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'price' | 'stock';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CatalogSearchResult {
  items: ProductSearchItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  diagnosticsSummary: {
    totalSemImagem: number;
    totalSemPreco: number;
    totalSemEstoque: number;
    totalBaixoEstoque: number;
    totalSemSku: number;
    totalVariacaoIncompleta: number;
    totalGradeSemEstoque: number;
  };
}

/**
 * Computes deterministic operational diagnostics for a single product.
 */
export function computeProductDiagnostics(product: ProductSearchItem): ProductDiagnostics {
  const sem_imagem = !product.images || product.images.length === 0 || !product.images.some(img => img.image_url);
  const sem_preco = typeof product.retail_price !== 'number' || product.retail_price <= 0;
  
  // Physical stock calculation
  const physicalStock = product.stock ?? 0;
  const threshold = product.stock_alert_threshold ?? 5;
  
  const sem_estoque = physicalStock <= 0;
  const baixo_estoque = physicalStock > 0 && physicalStock <= threshold;
  const sem_sku = !product.sku || product.sku.trim().length === 0;

  let variacao_incompleta = false;
  let grade_sem_estoque = false;

  if (product.variations && product.variations.length > 0) {
    for (const v of product.variations) {
      if (!v.is_grade && (!v.size || !v.color)) {
        variacao_incompleta = true;
      }
      if (v.is_grade && (v.stock ?? 0) <= 0) {
        grade_sem_estoque = true;
      }
    }
  }

  const issueList: ProductDiagnosticCode[] = [];
  if (sem_imagem) issueList.push('sem_imagem');
  if (sem_preco) issueList.push('sem_preco');
  if (sem_estoque) issueList.push('sem_estoque');
  if (baixo_estoque) issueList.push('baixo_estoque');
  if (sem_sku) issueList.push('sem_sku');
  if (variacao_incompleta) issueList.push('variacao_incompleta');
  if (grade_sem_estoque) issueList.push('grade_sem_estoque');

  return {
    sem_imagem,
    sem_preco,
    sem_estoque,
    baixo_estoque,
    sem_sku,
    variacao_incompleta,
    grade_sem_estoque,
    hasIssues: issueList.length > 0,
    issueCount: issueList.length,
    issueList,
  };
}

/**
 * Filter and search products in-memory deterministically.
 */
export function searchCatalogProducts(
  products: ProductSearchItem[],
  options: CatalogSearchFilterOptions = {}
): CatalogSearchResult {
  const {
    query,
    isActive,
    isFeatured,
    hasImage,
    hasGrade,
    hasVariations,
    stockStatus,
    category,
    productGender,
    material,
    minPrice,
    maxPrice,
    gradeType,
    diagnostics,
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    pageSize = 50,
  } = options;

  let filtered = [...products];

  // Text Query Search across multiple fields
  if (query && query.trim().length > 0) {
    const q = query.toLowerCase().trim();
    filtered = filtered.filter(p => {
      if (p.name.toLowerCase().includes(q)) return true;
      if (p.sku?.toLowerCase().includes(q)) return true;
      if (p.category?.toLowerCase().includes(q)) return true;
      if (p.material?.toLowerCase().includes(q)) return true;
      if (p.description?.toLowerCase().includes(q)) return true;
      
      // Check variations (SKU, color, size)
      if (p.variations) {
        for (const v of p.variations) {
          if (v.sku?.toLowerCase().includes(q)) return true;
          if (v.color?.toLowerCase().includes(q)) return true;
          if (v.size?.toLowerCase().includes(q)) return true;
          if (v.name?.toLowerCase().includes(q)) return true;
        }
      }

      // Check grade template names
      if (p.grade_snapshots) {
        for (const g of p.grade_snapshots) {
          if (g.template_name?.toLowerCase().includes(q)) return true;
        }
      }

      return false;
    });
  }

  // Active / Inactive
  if (typeof isActive === 'boolean') {
    filtered = filtered.filter(p => p.is_active === isActive);
  }

  // Featured
  if (typeof isFeatured === 'boolean') {
    filtered = filtered.filter(p => Boolean(p.is_featured) === isFeatured);
  }

  // Has Image
  if (typeof hasImage === 'boolean') {
    filtered = filtered.filter(p => {
      const hasImg = Boolean(p.images && p.images.length > 0 && p.images.some(i => i.image_url));
      return hasImg === hasImage;
    });
  }

  // Has Grade
  if (typeof hasGrade === 'boolean') {
    filtered = filtered.filter(p => {
      const hasG = Boolean(
        (p.grade_snapshots && p.grade_snapshots.length > 0) ||
        (p.variations && p.variations.some(v => v.is_grade))
      );
      return hasG === hasGrade;
    });
  }

  // Has Variations
  if (typeof hasVariations === 'boolean') {
    filtered = filtered.filter(p => {
      const hasV = Boolean(p.variations && p.variations.length > 0);
      return hasV === hasVariations;
    });
  }

  // Stock Status
  if (stockStatus && stockStatus !== 'all') {
    filtered = filtered.filter(p => {
      const stock = p.stock ?? 0;
      const threshold = p.stock_alert_threshold ?? 5;
      if (stockStatus === 'in_stock') return stock > 0;
      if (stockStatus === 'out_of_stock') return stock <= 0;
      if (stockStatus === 'low_stock') return stock > 0 && stock <= threshold;
      return true;
    });
  }

  // Category
  if (category) {
    filtered = filtered.filter(p => p.category?.toLowerCase() === category.toLowerCase());
  }

  // Gender
  if (productGender) {
    filtered = filtered.filter(p => p.product_gender?.toLowerCase() === productGender.toLowerCase());
  }

  // Material
  if (material) {
    filtered = filtered.filter(p => p.material?.toLowerCase() === material.toLowerCase());
  }

  // Price Range
  if (typeof minPrice === 'number') {
    filtered = filtered.filter(p => p.retail_price >= minPrice);
  }
  if (typeof maxPrice === 'number') {
    filtered = filtered.filter(p => p.retail_price <= maxPrice);
  }

  // Grade Type
  if (gradeType && gradeType !== 'all') {
    filtered = filtered.filter(p => {
      if (!p.grade_snapshots || p.grade_snapshots.length === 0) return false;
      const names = p.grade_snapshots.map(g => (g.template_name || '').toLowerCase());
      if (gradeType === 'alta') return names.some(n => n.includes('alta'));
      if (gradeType === 'baixa') return names.some(n => n.includes('baixa'));
      if (gradeType === 'custom') return names.some(n => !n.includes('alta') && !n.includes('baixa') && n.length > 0);
      if (gradeType === 'legacy') return names.some(n => n.includes('legado') || n.includes('legacy'));
      return true;
    });
  }

  // Diagnostics Filter
  if (diagnostics && diagnostics.length > 0) {
    filtered = filtered.filter(p => {
      const diag = computeProductDiagnostics(p);
      return diagnostics.some(d => diag[d]);
    });
  }

  // Global Diagnostics Summary over all initial products
  let totalSemImagem = 0;
  let totalSemPreco = 0;
  let totalSemEstoque = 0;
  let totalBaixoEstoque = 0;
  let totalSemSku = 0;
  let totalVariacaoIncompleta = 0;
  let totalGradeSemEstoque = 0;

  for (const p of products) {
    const d = computeProductDiagnostics(p);
    if (d.sem_imagem) totalSemImagem++;
    if (d.sem_preco) totalSemPreco++;
    if (d.sem_estoque) totalSemEstoque++;
    if (d.baixo_estoque) totalBaixoEstoque++;
    if (d.sem_sku) totalSemSku++;
    if (d.variacao_incompleta) totalVariacaoIncompleta++;
    if (d.grade_sem_estoque) totalGradeSemEstoque++;
  }

  // Sorting
  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'price') {
      comparison = (a.retail_price ?? 0) - (b.retail_price ?? 0);
    } else if (sortBy === 'stock') {
      comparison = (a.stock ?? 0) - (b.stock ?? 0);
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const totalCount = filtered.length;
  const validPageSize = Math.max(1, Math.min(pageSize, 200));
  const totalPages = Math.ceil(totalCount / validPageSize) || 1;
  const validPage = Math.max(1, Math.min(page, totalPages));
  const offset = (validPage - 1) * validPageSize;
  const paginatedItems = filtered.slice(offset, offset + validPageSize);

  return {
    items: paginatedItems,
    totalCount,
    page: validPage,
    pageSize: validPageSize,
    totalPages,
    diagnosticsSummary: {
      totalSemImagem,
      totalSemPreco,
      totalSemEstoque,
      totalBaixoEstoque,
      totalSemSku,
      totalVariacaoIncompleta,
      totalGradeSemEstoque,
    },
  };
}
