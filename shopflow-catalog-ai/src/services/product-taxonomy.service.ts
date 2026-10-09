import type { CategoryRepository, CategoryRecord } from '../repositories/category.repository.js';
import type { ProductRepository } from '../repositories/product.repository.js';
import {
  CreateProductInput,
  MissingDecision,
} from '../domain/types.js';

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

export interface CategoryMatchResult {
  status: 'exact' | 'normalized' | 'ambiguous' | 'not_found';
  category?: CategoryRecord;
  candidates?: CategoryRecord[];
}

export class ProductTaxonomyService {
  /**
   * Resolves category against the active store's existing categories.
   * Ensures tenant safety and handles exact, normalized, ambiguous and not_found states.
   */
  async resolveCategory(
    storeId: string,
    categoryRepo: CategoryRepository,
    input: { category?: string; category_id?: string }
  ): Promise<CategoryMatchResult> {
    // 1. Direct ID lookup
    if (input.category_id) {
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
    if (typeof (categoryRepo as any)?.listByStore === 'function') {
      categories = await (categoryRepo as any).listByStore(storeId);
    } else if (typeof (categoryRepo as any)?.findByNameAndStore === 'function') {
      const cat = await (categoryRepo as any).findByNameAndStore(queryRaw, storeId);
      if (cat) return { status: 'exact', category: cat };
    }

    if (categories.length === 0) {
      if (typeof (categoryRepo as any)?.findByNameAndStore === 'function') {
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
   * Checks required, conditional, derivable and missing decisions.
   */
  async evaluateCompleteness(
    storeId: string,
    input: CreateProductInput,
    categoryRepo: CategoryRepository,
    productRepo: ProductRepository
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

    // 3. Resolve Gender (FASE E1: Rose Noir cannot guess; FASE E2: Do not ask if not applicable)
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

    // 4. Resolve Wholesale MOQ condition (FASE F)
    let minWholesaleQty = input.min_wholesale_qty;
    if (input.wholesale_price !== undefined && input.wholesale_price > 0) {
      if (minWholesaleQty === undefined || minWholesaleQty === null) {
        const q = `Qual a quantidade mínima para aplicar o preço de atacado de R$ ${input.wholesale_price}?`;
        missing.push({
          field: 'min_wholesale_qty',
          question: q,
        });
        questions.push(q);
      } else if (minWholesaleQty < 1) {
        missing.push({
          field: 'min_wholesale_qty',
          question: 'A quantidade mínima de atacado deve ser maior ou igual a 1.',
        });
        questions.push('A quantidade mínima de atacado deve ser maior ou igual a 1.');
      }
    }

    // 5. Derive Slug (FASE G)
    const seoSlug = input.seo_slug || (await generateUniqueSlug(productRepo, storeId, input.name));

    // 6. Derive SEO Metadata (FASE H & I)
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
}
