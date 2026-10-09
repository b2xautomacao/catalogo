import { randomUUID } from 'node:crypto';
import type { CategoryRepository, CategoryRecord } from '../repositories/category.repository.js';
import type { ProductRepository } from '../repositories/product.repository.js';
import {
  CreateProductInput,
  MissingDecision,
  TenantIntakeDefaults,
  PreparedProductResult,
  FieldResolutionMeta,
  AnalyzeImportResult,
  BatchImportItemResult,
  GroupedDecision,
  PreparedInventoryAdjustment,
  ExecutablePayloads,
  ExecutableNextAction,
  CategorySuggestionInfo,
} from '../domain/types.js';
import { normalizeProductInput } from './import-column-normalizer.js';

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function generateSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function generateUniqueSlug(
  productRepo: ProductRepository,
  storeId: string,
  name: string
): Promise<string> {
  const baseSlug = generateSlug(name) || 'produto';
  let candidate = baseSlug;
  let counter = 1;

  if (typeof (productRepo as any)?.checkSlugExists === 'function') {
    while (await (productRepo as any).checkSlugExists(storeId, candidate)) {
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
  }

  return candidate;
}

export function generateDeterministicSku(name: string, category?: string): string {
  const normName = normalizeText(name).replace(/[^a-z0-9]/g, '').toUpperCase();
  const normCat = normalizeText(category || 'PRD').replace(/[^a-z0-9]/g, '').toUpperCase().slice(0, 3);
  const prefix = normCat || 'PRD';
  const nameSlice = normName.slice(0, 6) || 'ITEM';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${nameSlice}-${randomSuffix}`;
}

export interface CategoryMatchResult {
  status: 'exact' | 'normalized' | 'ambiguous' | 'not_found';
  category?: CategoryRecord;
  candidates?: CategoryRecord[];
}

export class ProductTaxonomyService {
  /**
   * Resolves category against the active store's existing categories.
   * Ensures tenant safety and handles exact, normalized, ambiguous and not_found states.
   * Supports in-memory categoriesCache for high performance in batch imports.
   */
  async resolveCategory(
    storeId: string,
    categoryRepo: CategoryRepository,
    input: { category?: string; category_id?: string },
    categoriesCache?: CategoryRecord[]
  ): Promise<CategoryMatchResult> {
    // 1. Direct ID lookup
    if (input.category_id) {
      if (categoriesCache) {
        const found = categoriesCache.find((c) => c.id === input.category_id && c.store_id === storeId);
        if (found) return { status: 'exact', category: found };
        return { status: 'not_found' };
      }
      const cat = await categoryRepo.findByIdAndStore(input.category_id, storeId);
      if (!cat) {
        return { status: 'not_found' };
      }
      return { status: 'exact', category: cat };
    }

    if (!input.category) {
      return { status: 'not_found' };
    }

    const queryRaw = input.category.trim();
    const queryNorm = normalizeText(queryRaw);

    // 2. Fetch categories belonging to active store
    let categories: CategoryRecord[] = [];
    if (categoriesCache) {
      categories = categoriesCache.filter((c) => c.store_id === storeId);
    } else if (typeof (categoryRepo as any)?.listByStore === 'function') {
      categories = await (categoryRepo as any).listByStore(storeId);
    } else if (typeof (categoryRepo as any)?.findByNameAndStore === 'function') {
      const cat = await (categoryRepo as any).findByNameAndStore(queryRaw, storeId);
      if (cat) return { status: 'exact', category: cat };
    }

    if (categories.length === 0) {
      if (!categoriesCache && typeof (categoryRepo as any)?.findByNameAndStore === 'function') {
        const cat = await (categoryRepo as any).findByNameAndStore(queryRaw, storeId);
        if (cat) return { status: 'exact', category: cat };
      }
      return { status: 'not_found' };
    }

    // Exact match (case-insensitive & trimmed)
    const exactMatches = categories.filter(
      (c) => c.name.trim().toLowerCase() === queryRaw.toLowerCase()
    );
    if (exactMatches.length === 1) {
      return { status: 'exact', category: exactMatches[0] };
    }

    // Normalized match (accents stripped)
    const normalizedMatches = categories.filter(
      (c) => normalizeText(c.name) === queryNorm
    );
    if (normalizedMatches.length === 1) {
      return { status: 'normalized', category: normalizedMatches[0] };
    }

    // Partial / substring matches
    const substringMatches = categories.filter((c) => {
      const nameNorm = normalizeText(c.name);
      return nameNorm.includes(queryNorm) || queryNorm.includes(nameNorm);
    });

    if (substringMatches.length === 1) {
      return { status: 'normalized', category: substringMatches[0] };
    }

    if (substringMatches.length > 1) {
      return { status: 'ambiguous', candidates: substringMatches };
    }

    return { status: 'not_found' };
  }

  /**
   * Safely infers product category type from category name and product name
   */
  inferProductCategoryType(
    categoryName?: string,
    productName?: string
  ): 'calcado' | 'roupa_superior' | 'roupa_inferior' | 'acessorio' | undefined {
    const combined = `${categoryName || ''} ${productName || ''}`.toLowerCase();
    const norm = normalizeText(combined);

    // accessory keywords (includes perfumes, cosmetics, accessories)
    const accessoryPatterns = [
      'perfume', 'colonia', 'fragrancia', 'cosmetico', 'maquiagem',
      'acessorio', 'bolsa', 'carteira', 'oculos', 'relogio', 'cinto',
      'joia', 'bijuteria', 'bone', 'chapeu', 'brinco', 'colar', 'pulseira'
    ];
    if (accessoryPatterns.some((pattern) => norm.includes(pattern))) {
      return 'acessorio';
    }

    // footwear keywords
    const footwearPatterns = [
      'calcado', 'tenis', 'sapato', 'sandalia', 'bota', 'chinelo',
      'chuteira', 'mocassim', 'sapatilha', 'coturno', 'rasteirinha', 'papete'
    ];
    if (footwearPatterns.some((pattern) => norm.includes(pattern))) {
      return 'calcado';
    }

    // upper wear keywords
    const upperPatterns = [
      'camisa', 'camiseta', 'regata', 'polo', 'blusa', 'top',
      'cropped', 'casaco', 'jaqueta', 'moletom', 'sueter', 'blazer', 'colete'
    ];
    if (upperPatterns.some((pattern) => norm.includes(pattern))) {
      return 'roupa_superior';
    }

    // lower wear keywords
    const lowerPatterns = [
      'calca', 'bermuda', 'short', 'saia', 'legging',
      'cueca', 'sunga', 'calcinha', 'pantacourt'
    ];
    if (lowerPatterns.some((pattern) => norm.includes(pattern))) {
      return 'roupa_inferior';
    }

    return undefined;
  }

  /**
   * Safely infers gender ONLY when explicitly stated in product or category name.
   * If ambiguous (like "Perfume Rose Noir"), returns undefined so agent asks user.
   */
  inferProductGender(
    productName?: string,
    categoryName?: string
  ): 'masculino' | 'feminino' | 'unissex' | 'infantil' | undefined {
    const combined = `${productName || ''} ${categoryName || ''}`;
    const norm = normalizeText(combined);

    if (/\b(masculino|masculina|homem|masc)\b/.test(norm)) {
      return 'masculino';
    }
    if (/\b(feminino|feminina|mulher|fem)\b/.test(norm)) {
      return 'feminino';
    }
    if (/\b(unissex|unisex)\b/.test(norm)) {
      return 'unissex';
    }
    if (/\b(infantil|crianca|kids|bebe)\b/.test(norm)) {
      return 'infantil';
    }

    return undefined;
  }

  /**
   * Safely generates factual SEO metadata without hallucinating attributes.
   */
  generateSeo(params: {
    name: string;
    category?: string;
    retailPrice: number;
    description?: string;
  }): { meta_title: string; meta_description: string; keywords: string } {
    const { name, category, retailPrice, description } = params;

    // SEO Title
    const meta_title = category
      ? `${name} | ${category} no Catálogo`
      : `${name} | Compre Online`;

    // SEO Description: factual, objective, no hallucinated specifications
    let meta_description = '';
    if (description && description.trim().length > 10) {
      meta_description = description.trim().slice(0, 155);
    } else {
      meta_description = `${name} disponível por R$ ${retailPrice.toFixed(2)}. Confira disponibilidade e faça seu pedido online.`;
    }

    // Safe keywords
    const keywords = [name.toLowerCase(), category?.toLowerCase()]
      .filter(Boolean)
      .join(', ');

    return { meta_title, meta_description, keywords };
  }

  /**
   * Evaluates product completeness preflight.
   * Integrates tenant defaults (e.g. default MOQ).
   */
  async evaluateCompleteness(
    storeId: string,
    input: CreateProductInput,
    categoryRepo: CategoryRepository,
    productRepo: ProductRepository,
    tenantDefaults?: TenantIntakeDefaults
  ): Promise<{
    isComplete: boolean;
    missing: MissingDecision[];
    questions: string[];
    derived: {
      category?: { id: string; name: string };
      product_category_type?: 'calcado' | 'roupa_superior' | 'roupa_inferior' | 'acessorio';
      product_gender?: 'masculino' | 'feminino' | 'unissex' | 'infantil';
      min_wholesale_qty?: number;
      seo_slug?: string;
      meta_title?: string;
      meta_description?: string;
      keywords?: string;
    };
  }> {
    const missing: MissingDecision[] = [];
    const questions: string[] = [];

    // 1. Resolve Category (if provided)
    let resolvedCategory: { id: string; name: string } | undefined;
    if (input.category || input.category_id) {
      const match = await this.resolveCategory(storeId, categoryRepo, {
        category: input.category,
        category_id: input.category_id,
      });

      if (match.status === 'exact' || match.status === 'normalized') {
        if (match.category) {
          resolvedCategory = { id: match.category.id, name: match.category.name };
        }
      } else if (match.status === 'ambiguous') {
        const candidateNames = (match.candidates || []).map((c) => `"${c.name}"`).join(', ');
        missing.push({
          field: 'category',
          question: `A categoria "${input.category}" é ambígua. Escolha uma das categorias existentes na loja: ${candidateNames}.`,
        });
        questions.push(
          `A categoria "${input.category}" é ambígua. Escolha uma das categorias existentes na loja: ${candidateNames}.`
        );
      } else {
        missing.push({
          field: 'category',
          question: `A categoria "${input.category || input.category_id}" não foi encontrada no catálogo da loja ativa. Informe uma categoria cadastrada.`,
        });
        questions.push(
          `A categoria "${input.category || input.category_id}" não foi encontrada no catálogo da loja ativa. Informe uma categoria cadastrada.`
        );
      }
    }

    // 2. Resolve Product Category Type
    let productCategoryType = input.product_category_type;
    if (!productCategoryType) {
      productCategoryType = this.inferProductCategoryType(
        resolvedCategory?.name || input.category,
        input.name
      );
    }

    // 3. Resolve Gender
    let productGender = input.product_gender;
    const normName = normalizeText(input.name || '');
    const normCategory = normalizeText(resolvedCategory?.name || input.category || '');
    const isPerfumeOrFragrance =
      normName.includes('perfume') ||
      normName.includes('colonia') ||
      normCategory.includes('perfume') ||
      normCategory.includes('fragrancia');

    if (!productGender) {
      productGender = this.inferProductGender(
        input.name,
        resolvedCategory?.name || input.category
      );
      if (!productGender && isPerfumeOrFragrance) {
        const q = 'Este perfume é feminino, masculino ou unissex?';
        missing.push({
          field: 'product_gender',
          question: q,
        });
        questions.push(q);
      }
    }

    // 4. Resolve Wholesale MOQ condition with Tenant Defaults
    let minWholesaleQty = input.min_wholesale_qty;
    if (input.wholesale_price !== undefined && input.wholesale_price !== null && input.wholesale_price > 0) {
      if (minWholesaleQty === undefined || minWholesaleQty === null) {
        // Apply tenant default if present
        if (tenantDefaults?.default_min_wholesale_qty && tenantDefaults.default_min_wholesale_qty >= 1) {
          minWholesaleQty = tenantDefaults.default_min_wholesale_qty;
        } else {
          const q = `Qual a quantidade mínima para aplicar o preço de atacado de R$ ${input.wholesale_price}?`;
          missing.push({
            field: 'min_wholesale_qty',
            question: q,
          });
          questions.push(q);
        }
      } else if (minWholesaleQty < 1) {
        missing.push({
          field: 'min_wholesale_qty',
          question: 'A quantidade mínima de atacado deve ser maior ou igual a 1.',
        });
        questions.push('A quantidade mínima de atacado deve ser maior ou igual a 1.');
      }
    }

    // 5. Derive Slug
    const seoSlug = input.seo_slug || (await generateUniqueSlug(productRepo, storeId, input.name));

    // 6. Derive SEO Metadata
    const seo = this.generateSeo({
      name: input.name,
      category: resolvedCategory?.name || input.category,
      retailPrice: input.retail_price,
      description: input.description,
    });

    const metaTitle = input.meta_title || seo.meta_title;
    const metaDescription = input.meta_description || seo.meta_description;
    const keywords = input.keywords || seo.keywords;

    return {
      isComplete: missing.length === 0,
      missing,
      questions,
      derived: {
        category: resolvedCategory,
        product_category_type: productCategoryType,
        product_gender: productGender,
        min_wholesale_qty: minWholesaleQty,
        seo_slug: seoSlug,
        meta_title: metaTitle,
        meta_description: metaDescription,
        keywords,
      },
    };
  }

  /**
   * Prepares a single product intake without persisting it.
   * Returns classification: ready, needs_input, or blocked.
   */
  async prepareProduct(
    storeId: string,
    rawInput: Record<string, any>,
    categoryRepo: CategoryRepository,
    productRepo: ProductRepository,
    tenantDefaults?: TenantIntakeDefaults,
    categoriesCache?: CategoryRecord[]
  ): Promise<PreparedProductResult> {
    const normalized = normalizeProductInput(rawInput);
    const preparationId = `prep_${randomUUID()}`;
    let unresolvedCategory: CategorySuggestionInfo | undefined;
    const decisions: FieldResolutionMeta[] = [];
    const issues: Array<{ field: string; code: string; message: string }> = [];

    // Validate Name
    if (!normalized.name || normalized.name.trim().length === 0) {
      issues.push({
        field: 'name',
        code: 'MISSING_NAME',
        message: 'O nome do produto é obrigatório.',
      });
      decisions.push({
        field: 'name',
        decision: 'block',
        source: 'unresolved',
        confidence: 0,
      });
    } else {
      decisions.push({
        field: 'name',
        decision: 'auto',
        source: 'explicit',
        confidence: 1.0,
        value: normalized.name,
      });
    }

    // Validate Retail Price
    if (normalized.retail_price === undefined || normalized.retail_price === null || normalized.retail_price <= 0) {
      issues.push({
        field: 'retail_price',
        code: 'INVALID_PRICE',
        message: 'O preço de varejo deve ser maior que zero.',
      });
      decisions.push({
        field: 'retail_price',
        decision: 'block',
        source: 'unresolved',
        confidence: 0,
      });
    } else {
      decisions.push({
        field: 'retail_price',
        decision: 'auto',
        source: 'explicit',
        confidence: 1.0,
        value: normalized.retail_price,
      });
    }

    // Resolve Category
    let resolvedCategory: CategoryRecord | undefined;
    if (normalized.category || normalized.category_id) {
      const catMatch = await this.resolveCategory(
        storeId,
        categoryRepo,
        { category: normalized.category, category_id: normalized.category_id },
        categoriesCache
      );

      if (catMatch.status === 'exact') {
        resolvedCategory = catMatch.category;
        decisions.push({
          field: 'category_id',
          decision: 'auto',
          source: 'exact_match',
          confidence: 1.0,
          value: resolvedCategory?.id,
        });
      } else if (catMatch.status === 'normalized') {
        resolvedCategory = catMatch.category;
        decisions.push({
          field: 'category_id',
          decision: 'auto',
          source: 'normalized_match',
          confidence: 0.99,
          value: resolvedCategory?.id,
        });
      } else if (catMatch.status === 'ambiguous') {
        const candidateNames = (catMatch.candidates || []).map((c) => c.name);
        decisions.push({
          field: 'category',
          decision: 'ask',
          source: 'unresolved',
          confidence: 0,
          question: `Categoria "${normalized.category}" é ambígua. Escolha uma das opções: ${candidateNames.join(', ')}`,
          allowed_values: candidateNames,
        });
      } else {
        const allStoreCats = categoriesCache || (await categoryRepo.listByStore(storeId));
        const rawCatNorm = normalizeText(normalized.category || '');
        const suggestions = allStoreCats
          .filter((c) => {
            const cNorm = normalizeText(c.name);
            return (
              cNorm.includes(rawCatNorm) ||
              rawCatNorm.includes(cNorm) ||
              (rawCatNorm.length >= 3 && cNorm.startsWith(rawCatNorm.slice(0, 3)))
            );
          })
          .map((c) => c.name);

        unresolvedCategory = {
          name: normalized.category || normalized.category_id || '',
          requested: normalized.category || normalized.category_id || '',
          suggestions,
          can_create: true,
          suggested_action: {
            tool: 'criar_categoria',
            input: {
              name: normalized.category || normalized.category_id || '',
            },
          },
        };

        issues.push({
          field: 'category',
          code: 'CATEGORY_NOT_FOUND',
          message: `Categoria "${normalized.category || normalized.category_id}" não encontrada no catálogo da loja ativa.`,
        });
        decisions.push({
          field: 'category',
          decision: 'block',
          source: 'unresolved',
          confidence: 0,
        });
      }
    } else {
      issues.push({
        field: 'category',
        code: 'MISSING_CATEGORY',
        message: 'A categoria do produto é obrigatória.',
      });
      decisions.push({
        field: 'category',
        decision: 'block',
        source: 'unresolved',
        confidence: 0,
      });
    }

    // Resolve Product Category Type
    let productType = normalized.product_category_type;
    if (productType) {
      decisions.push({
        field: 'product_category_type',
        decision: 'auto',
        source: 'explicit',
        confidence: 1.0,
        value: productType,
      });
    } else {
      productType = this.inferProductCategoryType(
        resolvedCategory?.name || normalized.category,
        normalized.name
      );
      if (productType) {
        decisions.push({
          field: 'product_category_type',
          decision: 'auto',
          source: 'safe_derivation',
          confidence: 1.0,
          value: productType,
        });
      } else {
        // Optional default
        productType = 'acessorio';
        decisions.push({
          field: 'product_category_type',
          decision: 'auto',
          source: 'safe_derivation',
          confidence: 0.9,
          value: productType,
        });
      }
    }

    // Resolve Gender
    let productGender = normalized.product_gender;
    const normName = normalizeText(normalized.name || '');
    const normCategory = normalizeText(resolvedCategory?.name || normalized.category || '');
    const isPerfumeOrFragrance =
      normName.includes('perfume') ||
      normName.includes('colonia') ||
      normCategory.includes('perfume') ||
      normCategory.includes('fragrancia');

    if (productGender) {
      decisions.push({
        field: 'product_gender',
        decision: 'auto',
        source: 'explicit',
        confidence: 1.0,
        value: productGender,
      });
    } else {
      productGender = this.inferProductGender(normalized.name, resolvedCategory?.name || normalized.category);
      if (productGender) {
        decisions.push({
          field: 'product_gender',
          decision: 'auto',
          source: 'safe_derivation',
          confidence: 1.0,
          value: productGender,
        });
      } else if (isPerfumeOrFragrance) {
        decisions.push({
          field: 'product_gender',
          decision: 'ask',
          source: 'unresolved',
          confidence: 0,
          question: 'Este perfume é feminino, masculino ou unissex?',
          allowed_values: ['masculino', 'feminino', 'unissex', 'infantil'],
        });
      }
    }

    // Resolve Wholesale & MOQ
    let wholesalePrice = normalized.wholesale_price;
    let minWholesaleQty = normalized.min_wholesale_qty;

    if (wholesalePrice !== undefined && wholesalePrice !== null && wholesalePrice > 0) {
      decisions.push({
        field: 'wholesale_price',
        decision: 'auto',
        source: 'explicit',
        confidence: 1.0,
        value: wholesalePrice,
      });

      if (minWholesaleQty !== undefined && minWholesaleQty !== null && minWholesaleQty >= 1) {
        decisions.push({
          field: 'min_wholesale_qty',
          decision: 'auto',
          source: 'explicit',
          confidence: 1.0,
          value: minWholesaleQty,
        });
      } else if (tenantDefaults?.default_min_wholesale_qty && tenantDefaults.default_min_wholesale_qty >= 1) {
        minWholesaleQty = tenantDefaults.default_min_wholesale_qty;
        decisions.push({
          field: 'min_wholesale_qty',
          decision: 'auto',
          source: 'tenant_default',
          confidence: 1.0,
          value: minWholesaleQty,
        });
      } else {
        decisions.push({
          field: 'min_wholesale_qty',
          decision: 'ask',
          source: 'unresolved',
          confidence: 0,
          question: `Qual a quantidade mínima para aplicar o preço de atacado de R$ ${wholesalePrice}?`,
        });
      }
    }

    // SKU
    let sku = normalized.sku;
    if (sku) {
      decisions.push({
        field: 'sku',
        decision: 'auto',
        source: 'explicit',
        confidence: 1.0,
        value: sku,
      });
    } else {
      sku = generateDeterministicSku(normalized.name || 'PRODUTO', resolvedCategory?.name || normalized.category);
      decisions.push({
        field: 'sku',
        decision: 'auto',
        source: 'generated',
        confidence: 1.0,
        value: sku,
      });
    }

    // Slug
    const slug = await generateUniqueSlug(productRepo, storeId, normalized.name || 'produto');
    decisions.push({
      field: 'seo_slug',
      decision: 'auto',
      source: 'generated',
      confidence: 1.0,
      value: slug,
    });

    // SEO
    const seo = this.generateSeo({
      name: normalized.name || '',
      category: resolvedCategory?.name || normalized.category,
      retailPrice: normalized.retail_price || 0,
      description: normalized.description,
    });
    decisions.push({
      field: 'meta_title',
      decision: 'auto',
      source: 'safe_derivation',
      confidence: 1.0,
      value: seo.meta_title,
    });
    decisions.push({
      field: 'meta_description',
      decision: 'auto',
      source: 'safe_derivation',
      confidence: 1.0,
      value: seo.meta_description,
    });

    // Inventory Intent (Canonical alignment with AdjustStockSchema)
    let inventoryIntent: PreparedInventoryAdjustment | undefined;
    if (normalized.stock !== undefined && normalized.stock !== null && normalized.stock > 0) {
      const initialReason = (tenantDefaults?.inventory_import_mode as any) || 'initial_balance';
      inventoryIntent = {
        operation: 'increase',
        reason: initialReason,
        quantity: normalized.stock,
        operation_id: `op_stock_${preparationId}`,
        notes: 'Saldo físico inicial de cadastro',
        mode: initialReason,
        reason_code: initialReason,
      } as any;
    }

    // Status Determination
    const hasBlock = decisions.some((d) => d.decision === 'block') || issues.length > 0;
    const hasAsk = decisions.some((d) => d.decision === 'ask');

    let status: 'ready' | 'needs_input' | 'blocked' = 'ready';
    if (hasBlock) {
      status = 'blocked';
    } else if (hasAsk) {
      status = 'needs_input';
    }

    const resolvedData: Record<string, any> = {
      name: normalized.name,
      retail_price: normalized.retail_price,
      wholesale_price: wholesalePrice ?? null,
      min_wholesale_qty: minWholesaleQty ?? null,
      category: resolvedCategory?.name || normalized.category,
      category_id: resolvedCategory?.id || normalized.category_id,
      product_category_type: productType,
      product_gender: productGender ?? null,
      sku,
      seo_slug: slug,
      meta_title: seo.meta_title,
      meta_description: seo.meta_description,
      keywords: seo.keywords,
      material: normalized.material ?? null,
      description: normalized.description ?? null,
      image_url: normalized.image_url ?? null,
      is_active: true,
    };

    let executablePayloads: ExecutablePayloads | undefined;
    let nextActions: ExecutableNextAction[] | undefined;

    if (status === 'ready') {
      executablePayloads = {
        criar_produto: {
          name: resolvedData.name,
          retail_price: resolvedData.retail_price,
          wholesale_price: resolvedData.wholesale_price ?? undefined,
          min_wholesale_qty: resolvedData.min_wholesale_qty ?? undefined,
          category: resolvedData.category ?? undefined,
          category_id: resolvedData.category_id ?? undefined,
          product_category_type: resolvedData.product_category_type ?? undefined,
          product_gender: resolvedData.product_gender ?? undefined,
          sku: resolvedData.sku ?? undefined,
          seo_slug: resolvedData.seo_slug ?? undefined,
          meta_title: resolvedData.meta_title ?? undefined,
          meta_description: resolvedData.meta_description ?? undefined,
          keywords: resolvedData.keywords ?? undefined,
          material: resolvedData.material ?? undefined,
          description: resolvedData.description ?? undefined,
          is_active: true,
        },
        ajustar_estoque: inventoryIntent
          ? {
              operation: inventoryIntent.operation,
              reason: inventoryIntent.reason,
              quantity: inventoryIntent.quantity,
              operation_id: inventoryIntent.operation_id,
              notes: inventoryIntent.notes,
            }
          : undefined,
      };

      nextActions = [
        {
          tool: 'criar_produto',
          required: true,
          reason: 'canonical_product_creation',
          prepared_input: executablePayloads.criar_produto,
        },
      ];

      if (inventoryIntent) {
        nextActions.push({
          tool: 'ajustar_estoque',
          required: true,
          reason: 'initial_inventory_pending',
          prepared_input: {
            operation: inventoryIntent.operation,
            reason: inventoryIntent.reason,
            quantity: inventoryIntent.quantity,
            operation_id: inventoryIntent.operation_id,
            notes: inventoryIntent.notes,
          },
        });
      }

      nextActions.push({
        tool: 'adicionar_imagem_produto',
        required: false,
        reason: 'product_has_no_image',
      });
    } else if (unresolvedCategory) {
      nextActions = [
        {
          tool: 'criar_categoria',
          required: true,
          reason: 'category_not_found_requires_creation_or_selection',
          prepared_input: unresolvedCategory.suggested_action?.input,
        },
      ];
    }

    return {
      preparation_id: preparationId,
      status,
      resolved_data: resolvedData,
      executable_payloads: executablePayloads,
      inventory_intent: inventoryIntent,
      unresolved_category: unresolvedCategory,
      next_actions: nextActions,
      decisions,
      issues: issues.length > 0 ? issues : undefined,
    };
  }

  /**
   * Analyzes a batch of products for import.
   * Loads categories and settings once, performs parallel/in-memory preflights,
   * groups repetitive decisions and summarizes results.
   */
  async analyzeBatch(
    storeId: string,
    rawProducts: Array<Record<string, any>>,
    categoryRepo: CategoryRepository,
    productRepo: ProductRepository,
    tenantDefaults?: TenantIntakeDefaults
  ): Promise<AnalyzeImportResult> {
    // Batch load categories for the active store once (FASE X1)
    let categoriesCache: CategoryRecord[] = [];
    if (typeof (categoryRepo as any)?.listByStore === 'function') {
      categoriesCache = await (categoryRepo as any).listByStore(storeId);
    }

    const items: BatchImportItemResult[] = [];
    const readyProducts: Record<string, any>[] = [];

    // Grouping trackers (FASE K)
    const missingMoqIndices: number[] = [];
    const missingGenderIndices: { index: number; name: string }[] = [];
    const unmappedCategoriesMap = new Map<string, number>();

    for (let i = 0; i < rawProducts.length; i++) {
      const raw = rawProducts[i];
      const prep = await this.prepareProduct(
        storeId,
        raw,
        categoryRepo,
        productRepo,
        tenantDefaults,
        categoriesCache
      );

      let itemStatus: 'ready' | 'needs_input' | 'invalid' = 'ready';
      if (prep.status === 'blocked') {
        itemStatus = 'invalid';
      } else if (prep.status === 'needs_input') {
        itemStatus = 'needs_input';
      }

      items.push({
        index: i + 1,
        raw_input: raw,
        status: itemStatus,
        resolved_data: prep.resolved_data,
        executable_payloads: prep.executable_payloads,
        inventory_intent: prep.inventory_intent,
        unresolved_category: prep.unresolved_category,
        next_actions: prep.next_actions,
        decisions: prep.decisions,
        issues: prep.issues,
      });

      if (itemStatus === 'ready') {
        readyProducts.push(prep.resolved_data);
      }

      // Collect decision patterns for grouping
      for (const d of prep.decisions) {
        if (d.field === 'min_wholesale_qty' && d.decision === 'ask') {
          missingMoqIndices.push(i + 1);
        }
        if (d.field === 'product_gender' && d.decision === 'ask') {
          missingGenderIndices.push({ index: i + 1, name: prep.resolved_data.name || `Produto #${i + 1}` });
        }
      }

      for (const issue of prep.issues || []) {
        if (issue.code === 'CATEGORY_NOT_FOUND') {
          const rawCat = raw.categoria || raw.category || 'Indefinida';
          unmappedCategoriesMap.set(rawCat, (unmappedCategoriesMap.get(rawCat) || 0) + 1);
        }
      }
    }

    // Build Grouped Decisions (FASE K)
    const groupedDecisions: GroupedDecision[] = [];

    if (missingMoqIndices.length > 0) {
      groupedDecisions.push({
        type: 'bulk_decision',
        field: 'min_wholesale_qty',
        affected_count: missingMoqIndices.length,
        question: `Existem ${missingMoqIndices.length} produtos com preço de atacado sem quantidade mínima. Deseja aplicar um padrão único (ex: ${tenantDefaults?.default_min_wholesale_qty ?? 6} peças)?`,
        suggested_default: tenantDefaults?.default_min_wholesale_qty ?? 6,
      });
    }

    if (missingGenderIndices.length > 0) {
      groupedDecisions.push({
        type: 'decision_group',
        field: 'product_gender',
        affected_count: missingGenderIndices.length,
        question: `${missingGenderIndices.length} produto(s) de perfumaria/vestuário exigem definição de gênero (masculino, feminino ou unissex).`,
        affected_products: missingGenderIndices.map((g) => g.name),
      });
    }

    if (unmappedCategoriesMap.size > 0) {
      const unmapped = Array.from(unmappedCategoriesMap.keys());
      const totalCount = Array.from(unmappedCategoriesMap.values()).reduce((a, b) => a + b, 0);
      groupedDecisions.push({
        type: 'category_mapping',
        field: 'category',
        affected_count: totalCount,
        question: `Categorias não encontradas no catálogo da loja: ${unmapped.join(', ')}. Vincule a categorias existentes antes de importar.`,
        unmapped_categories: unmapped,
      });
    }

    const summary = {
      total: items.length,
      ready: items.filter((i) => i.status === 'ready').length,
      needs_input: items.filter((i) => i.status === 'needs_input').length,
      invalid: items.filter((i) => i.status === 'invalid').length,
    };

    return {
      summary,
      grouped_decisions: groupedDecisions,
      items,
      ready_products: readyProducts,
    };
  }
}
