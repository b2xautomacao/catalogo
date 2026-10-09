import { normalizeText } from './product-taxonomy.service.js';

export interface NormalizedProductRawInput {
  name?: string;
  retail_price?: number;
  wholesale_price?: number | null;
  min_wholesale_qty?: number | null;
  stock?: number;
  category?: string;
  category_id?: string;
  product_category_type?: 'calcado' | 'roupa_superior' | 'roupa_inferior' | 'acessorio';
  product_gender?: 'masculino' | 'feminino' | 'unissex' | 'infantil';
  sku?: string;
  description?: string;
  material?: string;
  image_url?: string;
  [key: string]: any;
}

/**
 * Normalizes input keys and common spreadsheet/CSV/ERP aliases into canonical fields.
 */
export function normalizeProductInput(raw: Record<string, any>): NormalizedProductRawInput {
  const result: NormalizedProductRawInput = {};

  for (const [key, rawValue] of Object.entries(raw)) {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      continue;
    }

    const normKey = normalizeText(key).replace(/[\s_-]+/g, '');

    // Name aliases
    if (['name', 'nome', 'produto', 'product', 'titulo', 'title'].includes(normKey)) {
      result.name = String(rawValue).trim();
    }
    // Retail price aliases
    else if (['retailprice', 'price', 'preco', 'precovarejo', 'valor', 'retail', 'precovenda'].includes(normKey)) {
      const parsed = parseNumeric(rawValue);
      if (parsed !== undefined) result.retail_price = parsed;
    }
    // Wholesale price aliases
    else if (['wholesaleprice', 'atacado', 'precoatacado', 'wholesale'].includes(normKey)) {
      const parsed = parseNumeric(rawValue);
      if (parsed !== undefined) result.wholesale_price = parsed;
    }
    // MOQ aliases
    else if (['minwholesaleqty', 'minatacado', 'qtdatacado', 'moq', 'quantidademinimaatacado'].includes(normKey)) {
      const parsed = parseInt(String(rawValue), 10);
      if (!isNaN(parsed)) result.min_wholesale_qty = parsed;
    }
    // Stock / Inventory intent aliases
    else if (['stock', 'estoque', 'qty', 'quantidade', 'qtd'].includes(normKey)) {
      const parsed = parseInt(String(rawValue), 10);
      if (!isNaN(parsed)) result.stock = parsed;
    }
    // Category aliases
    else if (['category', 'categoria', 'depto', 'departamento', 'secao'].includes(normKey)) {
      result.category = String(rawValue).trim();
    }
    else if (['categoryid', 'idcategoria'].includes(normKey)) {
      result.category_id = String(rawValue).trim();
    }
    // Product category type aliases
    else if (['productcategorytype', 'tipo', 'type', 'tipoproduto'].includes(normKey)) {
      const val = normalizeText(String(rawValue));
      if (['calcado', 'roupa_superior', 'roupa_inferior', 'acessorio'].includes(val)) {
        result.product_category_type = val as any;
      }
    }
    // Product gender aliases
    else if (['productgender', 'genero', 'gender', 'sexo'].includes(normKey)) {
      const val = normalizeText(String(rawValue));
      if (['masculino', 'feminino', 'unissex', 'infantil'].includes(val)) {
        result.product_gender = val as any;
      }
    }
    // SKU aliases
    else if (['sku', 'codigo', 'cod'].includes(normKey)) {
      result.sku = String(rawValue).trim();
    }
    // Description aliases
    else if (['description', 'descricao', 'detalhes'].includes(normKey)) {
      result.description = String(rawValue).trim();
    }
    // Material aliases
    else if (['material', 'composicao'].includes(normKey)) {
      result.material = String(rawValue).trim();
    }
    // Image URL aliases
    else if (['imageurl', 'image', 'imagem', 'foto', 'foto1', 'urlfoto'].includes(normKey)) {
      result.image_url = String(rawValue).trim();
    }
    else {
      result[key] = rawValue;
    }
  }

  return result;
}

function parseNumeric(val: any): number | undefined {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    // Handle Brazilian currency formatting: R$ 259,00 or 259.00
    const cleaned = val.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) return num;
    const directNum = parseFloat(val);
    if (!isNaN(directNum)) return directNum;
  }
  return undefined;
}
