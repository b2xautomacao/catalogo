import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVariationMatrix,
  resolveSnapshotComponentMapping,
} from '../variationMatrixService';
import { ProductVariation } from '@/types/product';

describe('FASE A — Variation Matrix & Component Mapping Service', () => {
  const mockProductId = 'prod-uuid-100';

  it('1. Matrix: Separa rigorosamente Unit Variations de Pack Variations', () => {
    const variations: ProductVariation[] = [
      {
        id: 'var-1',
        product_id: mockProductId,
        color: 'Preto',
        hex_color: '#000000',
        size: '38',
        sku: 'CALC-BLK-38',
        stock: 5,
        price_adjustment: 0,
        is_active: true,
        is_grade: false,
      },
      {
        id: 'var-2',
        product_id: mockProductId,
        color: 'Preto',
        hex_color: '#000000',
        size: '39',
        sku: 'CALC-BLK-39',
        stock: 3,
        price_adjustment: 0,
        is_active: true,
        is_grade: false,
      },
      {
        id: 'grade-pack-1',
        product_id: mockProductId,
        color: 'Preto',
        grade_name: 'Grade Alta',
        is_grade: true,
        variation_type: 'grade',
        stock: 2,
        is_active: true,
      },
    ] as any;

    const matrix = buildVariationMatrix(variations);

    assert.equal(matrix.unitVariations.length, 2);
    assert.equal(matrix.packVariations.length, 1);
    assert.equal(matrix.colors.length, 1);
    assert.equal(matrix.colors[0].color, 'Preto');
    assert.equal(matrix.colors[0].hexColor, '#000000');
    assert.deepEqual(matrix.sizes, ['38', '39']);

    const cell38 = matrix.cells['Preto']['38'];
    assert.ok(cell38);
    assert.equal(cell38.variationId, 'var-1');
    assert.equal(cell38.sku, 'CALC-BLK-38');
    assert.equal(cell38.stock, 5);
  });

  it('2. Matrix: Suporta produtos apenas com cor (sem tamanho ou Único)', () => {
    const variations: ProductVariation[] = [
      {
        id: 'var-cor-1',
        product_id: mockProductId,
        color: 'Azul Marinho',
        hex_color: '#000080',
        size: null,
        stock: 10,
        is_active: true,
        is_grade: false,
      },
    ] as any;

    const matrix = buildVariationMatrix(variations);
    assert.equal(matrix.colors.length, 1);
    assert.equal(matrix.colors[0].color, 'Azul Marinho');
    assert.deepEqual(matrix.sizes, ['Único']);
    assert.equal(matrix.cells['Azul Marinho']['Único'].variationId, 'var-cor-1');
  });

  it('3. Matrix: Suporta produtos apenas com tamanho (sem cor)', () => {
    const variations: ProductVariation[] = [
      {
        id: 'var-tam-1',
        product_id: mockProductId,
        color: null,
        size: 'GG',
        stock: 7,
        is_active: true,
        is_grade: false,
      },
    ] as any;

    const matrix = buildVariationMatrix(variations);
    assert.equal(matrix.colors.length, 1);
    assert.equal(matrix.colors[0].color, 'Sem Cor');
    assert.deepEqual(matrix.sizes, ['GG']);
    assert.equal(matrix.cells['Sem Cor']['GG'].variationId, 'var-tam-1');
  });

  it('4. Matrix: Identidade canônica e preservação de IDs', () => {
    const variations: ProductVariation[] = [
      {
        id: 'existing-id-55',
        product_id: mockProductId,
        color: 'Caramelo',
        size: '37',
        sku: 'CAR-37',
        stock: 12,
        is_active: false,
        is_grade: false,
      },
    ] as any;

    const matrix = buildVariationMatrix(variations);
    const cell = matrix.cells['Caramelo']['37'];
    assert.equal(cell.variationId, 'existing-id-55');
    assert.equal(cell.isActive, false);
    assert.equal(cell.sku, 'CAR-37');
  });

  it('5. Matching Grade Alta (13 pares): Mapeia de forma inequívoca cada tamanho para a Unit Variation correspondente', () => {
    const snapshotItems = [
      { size: '36', quantity: 1, position: 1 },
      { size: '37', quantity: 2, position: 2 },
      { size: '38', quantity: 2, position: 3 },
      { size: '39', quantity: 3, position: 4 },
      { size: '40', quantity: 2, position: 5 },
      { size: '41', quantity: 2, position: 6 },
      { size: '42', quantity: 1, position: 7 },
    ];

    const unitVariations = [
      { id: 'uv-36', product_id: mockProductId, color: 'Preto', size: '36', is_grade: false },
      { id: 'uv-37', product_id: mockProductId, color: 'Preto', size: '37', is_grade: false },
      { id: 'uv-38', product_id: mockProductId, color: 'Preto', size: '38', is_grade: false },
      { id: 'uv-39', product_id: mockProductId, color: 'Preto', size: '39', is_grade: false },
      { id: 'uv-40', product_id: mockProductId, color: 'Preto', size: '40', is_grade: false },
      { id: 'uv-41', product_id: mockProductId, color: 'Preto', size: '41', is_grade: false },
      { id: 'uv-42', product_id: mockProductId, color: 'Preto', size: '42', is_grade: false },
    ];

    const mapped = resolveSnapshotComponentMapping(snapshotItems, unitVariations, 'Preto', mockProductId);

    assert.equal(mapped.length, 7);
    assert.ok(mapped.every((m) => m.status === 'MATCHED'));
    assert.equal(mapped[0].variationId, 'uv-36');
    assert.equal(mapped[3].variationId, 'uv-39');
    assert.equal(mapped[6].variationId, 'uv-42');
  });

  it('6. Matching Grade Baixa (8 pares): Mapeia corretamente os tamanhos 34 a 39', () => {
    const snapshotItems = [
      { size: '34', quantity: 1, position: 1 },
      { size: '35', quantity: 2, position: 2 },
      { size: '36', quantity: 2, position: 3 },
      { size: '37', quantity: 1, position: 4 },
      { size: '38', quantity: 1, position: 5 },
      { size: '39', quantity: 1, position: 6 },
    ];

    const unitVariations = [
      { id: 'uv-34', product_id: mockProductId, color: 'Branco', size: '34', is_grade: false },
      { id: 'uv-35', product_id: mockProductId, color: 'Branco', size: '35', is_grade: false },
      { id: 'uv-36', product_id: mockProductId, color: 'Branco', size: '36', is_grade: false },
      { id: 'uv-37', product_id: mockProductId, color: 'Branco', size: '37', is_grade: false },
      { id: 'uv-38', product_id: mockProductId, color: 'Branco', size: '38', is_grade: false },
      { id: 'uv-39', product_id: mockProductId, color: 'Branco', size: '39', is_grade: false },
    ];

    const mapped = resolveSnapshotComponentMapping(snapshotItems, unitVariations, 'Branco', mockProductId);

    assert.equal(mapped.length, 6);
    assert.ok(mapped.every((m) => m.status === 'MATCHED'));
    assert.equal(mapped[0].variationId, 'uv-34');
    assert.equal(mapped[5].variationId, 'uv-39');
  });

  it('7. Missing Component: Se não existir Unit Variation para um tamanho, variationId DEVE ser null (não inventar componente)', () => {
    const snapshotItems = [
      { size: '38', quantity: 2, position: 1 },
      { size: '39', quantity: 3, position: 2 },
    ];

    const unitVariations = [
      { id: 'uv-38', product_id: mockProductId, color: 'Preto', size: '38', is_grade: false },
      // 39 não cadastrado
    ];

    const mapped = resolveSnapshotComponentMapping(snapshotItems, unitVariations, 'Preto', mockProductId);

    assert.equal(mapped[0].status, 'MATCHED');
    assert.equal(mapped[0].variationId, 'uv-38');

    assert.equal(mapped[1].status, 'MISSING');
    assert.equal(mapped[1].variationId, null);
    assert.ok(mapped[1].diagnostic?.includes('COMPONENT_NOT_FOUND'));
  });

  it('8. Ambiguous Component: Se houver duplicidade ou ambiguidade, variationId DEVE ser null e retornar AMBIGUOUS', () => {
    const snapshotItems = [
      { size: '38', quantity: 2, position: 1 },
    ];

    // Duas variações para a mesma cor e tamanho
    const unitVariations = [
      { id: 'uv-38-a', product_id: mockProductId, color: 'Preto', size: '38', is_grade: false },
      { id: 'uv-38-b', product_id: mockProductId, color: 'Preto', size: '38', is_grade: false },
    ];

    const mapped = resolveSnapshotComponentMapping(snapshotItems, unitVariations, 'Preto', mockProductId);

    assert.equal(mapped[0].status, 'AMBIGUOUS');
    assert.equal(mapped[0].variationId, null);
    assert.ok(mapped[0].diagnostic?.includes('AMBIGUOUS_COMPONENT_VARIATION'));
  });

  it('9. Wrong Color Guard: Grade Preto NUNCA mapeia para Unit Variation Branco', () => {
    const snapshotItems = [
      { size: '38', quantity: 2, position: 1 },
    ];

    const unitVariations = [
      { id: 'uv-branco-38', product_id: mockProductId, color: 'Branco', size: '38', is_grade: false },
    ];

    const mapped = resolveSnapshotComponentMapping(snapshotItems, unitVariations, 'Preto', mockProductId);

    assert.equal(mapped[0].status, 'MISSING');
    assert.equal(mapped[0].variationId, null);
  });

  it('10. Wrong Product / Cross-Tenant Guard: NUNCA associa variação de outro produto', () => {
    const snapshotItems = [
      { size: '38', quantity: 2, position: 1 },
    ];

    const unitVariations = [
      { id: 'uv-other-prod', product_id: 'prod-other-tenant', color: 'Preto', size: '38', is_grade: false },
    ];

    const mapped = resolveSnapshotComponentMapping(snapshotItems, unitVariations, 'Preto', mockProductId);

    assert.equal(mapped[0].status, 'MISSING');
    assert.equal(mapped[0].variationId, null);
  });

  it('11. Pack Variation Guard: NUNCA associa um item de snapshot a uma Pack Variation (is_grade = true)', () => {
    const snapshotItems = [
      { size: '38', quantity: 2, position: 1 },
    ];

    const variations = [
      { id: 'pack-var-38', product_id: mockProductId, color: 'Preto', size: '38', is_grade: true },
    ];

    const mapped = resolveSnapshotComponentMapping(snapshotItems, variations, 'Preto', mockProductId);

    assert.equal(mapped[0].status, 'MISSING');
    assert.equal(mapped[0].variationId, null);
  });
});
