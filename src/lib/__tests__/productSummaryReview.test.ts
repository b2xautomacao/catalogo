import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildVariationMatrix } from '../variationMatrixService';
import { calculateCanonicalPhysicalStock } from '../gradeCompositionService';
import { ProductVariation } from '@/types/product';

describe('FASE D — Premium Wizard Polish & Domain Review Logic', () => {
  it('1. Deve computar resumo de produto misto com pares avulsos e caixas de grade', () => {
    const variations: ProductVariation[] = [
      {
        id: 'var-1',
        product_id: 'prod-1',
        color: 'Preto',
        size: '38',
        stock: 4,
        is_grade: false,
      },
      {
        id: 'var-2',
        product_id: 'prod-1',
        color: 'Preto',
        size: '39',
        stock: 6,
        is_grade: false,
      },
      {
        id: 'grade-pack-1',
        product_id: 'prod-1',
        color: 'Preto',
        grade_name: 'Grade Alta',
        grade_sizes: ['36', '37', '38', '39', '40', '41', '42'],
        grade_pairs: [1, 2, 2, 3, 2, 2, 1], // 13 pares
        stock: 3, // 3 caixas
        is_grade: true,
        variation_type: 'grade',
      },
    ] as any;

    const matrix = buildVariationMatrix(variations);
    assert.equal(matrix.unitVariations.length, 2);
    assert.equal(matrix.packVariations.length, 1);

    const looseUnits = matrix.unitVariations.map((v) => ({ stock: v.stock || 0 }));
    const packs = matrix.packVariations.map((v) => {
      const pairs = Array.isArray(v.grade_pairs) ? v.grade_pairs : [];
      const pairsPerPack = pairs.reduce((sum, p) => sum + Number(p), 0) || v.grade_quantity || 1;
      return { stock: v.stock || 0, pairsPerPack };
    });

    const summary = calculateCanonicalPhysicalStock(looseUnits, packs);

    assert.equal(summary.totalLooseStock, 10);
    assert.equal(summary.totalPackStock, 3);
    assert.equal(summary.totalPackPhysicalUnits, 39);
    assert.equal(summary.totalPhysicalStock, 49); // 10 + 39 = 49
  });

  it('2. Deve computar resumo de produto simples sem variações', () => {
    const variations: ProductVariation[] = [];
    const matrix = buildVariationMatrix(variations);

    const looseUnits = matrix.unitVariations.map((v) => ({ stock: v.stock || 0 }));
    const packs = matrix.packVariations.map((v) => ({ stock: v.stock || 0, pairsPerPack: 1 }));

    const summary = calculateCanonicalPhysicalStock(looseUnits, packs);

    assert.equal(summary.totalLooseStock, 0);
    assert.equal(summary.totalPackStock, 0);
    assert.equal(summary.totalPhysicalStock, 0);
  });
});
