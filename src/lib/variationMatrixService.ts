import { ProductVariation } from '@/types/product';

export interface MatrixCell {
  variationId: string | null;
  sku: string | null;
  isActive: boolean;
  stock: number;
  priceAdjustment: number;
  variation?: ProductVariation;
}

export interface VariationMatrix {
  colors: { color: string; hexColor: string | null }[];
  sizes: string[];
  cells: Record<string, Record<string, MatrixCell>>; // color -> size -> MatrixCell
  unitVariations: ProductVariation[];
  packVariations: ProductVariation[];
}

export type SnapshotMappingStatus = 'MATCHED' | 'MISSING' | 'AMBIGUOUS';

export interface SnapshotComponentMappingResult {
  size: string;
  quantity: number;
  position: number;
  variationId: string | null;
  status: SnapshotMappingStatus;
  diagnostic?: string;
}

/**
 * Constrói a Matriz Canônica de Variações a partir da lista de variações do produto.
 * Separa rigorosamente Unit Variations (is_grade = false) de Pack Variations (is_grade = true).
 */
export function buildVariationMatrix(variations: ProductVariation[]): VariationMatrix {
  const colorsMap = new Map<string, string | null>();
  const sizesSet = new Set<string>();
  const cells: Record<string, Record<string, MatrixCell>> = {};
  const unitVariations: ProductVariation[] = [];
  const packVariations: ProductVariation[] = [];

  for (const v of variations) {
    const isGrade = Boolean(v.is_grade || v.variation_type === 'grade');
    if (isGrade) {
      packVariations.push(v);
      continue;
    }

    unitVariations.push(v);

    const colorKey = (v.color || 'Sem Cor').trim();
    if (!colorsMap.has(colorKey)) {
      colorsMap.set(colorKey, v.hex_color || null);
    }

    const sizeKey = (v.size || 'Único').trim();
    sizesSet.add(sizeKey);

    if (!cells[colorKey]) {
      cells[colorKey] = {};
    }

    cells[colorKey][sizeKey] = {
      variationId: v.id || null,
      sku: v.sku || null,
      isActive: v.is_active !== false,
      stock: typeof v.stock === 'number' ? v.stock : 0,
      priceAdjustment: typeof v.price_adjustment === 'number' ? v.price_adjustment : 0,
      variation: v,
    };
  }

  const colors = Array.from(colorsMap.entries()).map(([color, hexColor]) => ({
    color,
    hexColor,
  }));

  const sizes = Array.from(sizesSet);

  return {
    colors,
    sizes,
    cells,
    unitVariations,
    packVariations,
  };
}

/**
 * Mapeia de forma inequívoca itens de snapshot de grade para Unit Variations do mesmo produto e cor.
 * 
 * Regras:
 * - Apenas busca entre Unit Variations (is_grade = false).
 * - Exatamente 1 correspondência exata de (product_id, color, size) -> MATCHED (variationId preenchido).
 * - 0 correspondências -> MISSING (variationId = null, NÃO inventa variação).
 * - >1 correspondências -> AMBIGUOUS (variationId = null, status = AMBIGUOUS_COMPONENT_VARIATION).
 */
export function resolveSnapshotComponentMapping(
  snapshotItems: { size: string; quantity: number; position: number }[],
  unitVariations: Array<{ id: string; product_id?: string; color?: string | null; size?: string | null; is_grade?: boolean | null; variation_type?: string | null }>,
  expectedColor: string | null,
  expectedProductId?: string
): SnapshotComponentMappingResult[] {
  const normColor = (expectedColor || '').trim().toLowerCase();

  return snapshotItems.map((item) => {
    const normSize = (item.size || '').trim().toLowerCase();

    // Filtrar apenas Unit Variations candidatas
    const candidates = unitVariations.filter((uv) => {
      // Rejeitar Pack Variations
      if (uv.is_grade) return false;

      // Tenant / Product Guard
      if (expectedProductId && uv.product_id && uv.product_id !== expectedProductId) {
        return false;
      }

      // Color Guard
      const uvColor = (uv.color || '').trim().toLowerCase();
      if (normColor !== '' && uvColor !== normColor) {
        return false;
      }

      // Size Guard
      const uvSize = (uv.size || '').trim().toLowerCase();
      return uvSize === normSize;
    });

    if (candidates.length === 1) {
      return {
        size: item.size,
        quantity: item.quantity,
        position: item.position,
        variationId: candidates[0].id,
        status: 'MATCHED',
      };
    }

    if (candidates.length > 1) {
      return {
        size: item.size,
        quantity: item.quantity,
        position: item.position,
        variationId: null,
        status: 'AMBIGUOUS',
        diagnostic: `AMBIGUOUS_COMPONENT_VARIATION: ${candidates.length} variações encontradas para o tamanho ${item.size} e cor ${expectedColor}.`,
      };
    }

    // 0 candidates
    return {
      size: item.size,
      quantity: item.quantity,
      position: item.position,
      variationId: null,
      status: 'MISSING',
      diagnostic: `COMPONENT_NOT_FOUND: Nenhuma Unit Variation encontrada para o tamanho ${item.size} e cor ${expectedColor}.`,
    };
  });
}
