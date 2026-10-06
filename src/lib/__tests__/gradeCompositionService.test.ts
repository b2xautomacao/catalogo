import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  decomposePackMovement,
  calculateCanonicalPhysicalStock,
} from '../gradeCompositionService';

describe('FASE B — Grade Component Mapping & Child Movements (Ledger Trace)', () => {
  const gradeAltaSnapshotItems = [
    { size: '36', quantityPerPack: 1, variationId: 'uv-36' },
    { size: '37', quantityPerPack: 2, variationId: 'uv-37' },
    { size: '38', quantityPerPack: 2, variationId: 'uv-38' },
    { size: '39', quantityPerPack: 3, variationId: 'uv-39' },
    { size: '40', quantityPerPack: 2, variationId: 'uv-40' },
    { size: '41', quantityPerPack: 2, variationId: 'uv-41' },
    { size: '42', quantityPerPack: 1, variationId: 'uv-42' },
  ];

  const gradeBaixaSnapshotItems = [
    { size: '34', quantityPerPack: 1, variationId: 'uv-34' },
    { size: '35', quantityPerPack: 2, variationId: 'uv-35' },
    { size: '36', quantityPerPack: 2, variationId: 'uv-36' },
    { size: '37', quantityPerPack: 1, variationId: 'uv-37' },
    { size: '38', quantityPerPack: 1, variationId: 'uv-38' },
    { size: '39', quantityPerPack: 1, variationId: 'uv-39' },
  ];

  it('1. Grade Alta 1 Pack: Decompõe perfeitamente em 13 pares individuais', () => {
    const result = decomposePackMovement(1, gradeAltaSnapshotItems);

    assert.equal(result.totalPacks, 1);
    assert.equal(result.totalPhysicalUnits, 13);
    assert.equal(result.childMovements.length, 7);
    assert.equal(result.isComplete, true);
    assert.equal(result.missingMappingsCount, 0);

    assert.equal(result.childMovements[0].size, '36');
    assert.equal(result.childMovements[0].quantity, 1);
    assert.equal(result.childMovements[0].unitKind, 'unit');
    assert.equal(result.childMovements[0].reasonCode, 'grade_component_trace');

    assert.equal(result.childMovements[3].size, '39');
    assert.equal(result.childMovements[3].quantity, 3);
  });

  it('2. Grade Alta 2 Packs: Decompõe perfeitamente em 26 pares individuais com proporções exatas', () => {
    const result = decomposePackMovement(2, gradeAltaSnapshotItems);

    assert.equal(result.totalPacks, 2);
    assert.equal(result.totalPhysicalUnits, 26);
    assert.equal(result.childMovements.length, 7);

    // Verificação de cada tamanho:
    // 36 -> 2*1 = 2
    // 37 -> 2*2 = 4
    // 38 -> 2*2 = 4
    // 39 -> 2*3 = 6
    // 40 -> 2*2 = 4
    // 41 -> 2*2 = 4
    // 42 -> 2*1 = 2
    const quantities = result.childMovements.map((c) => ({ size: c.size, qty: c.quantity }));
    assert.deepEqual(quantities, [
      { size: '36', qty: 2 },
      { size: '37', qty: 4 },
      { size: '38', qty: 4 },
      { size: '39', qty: 6 },
      { size: '40', qty: 4 },
      { size: '41', qty: 4 },
      { size: '42', qty: 2 },
    ]);
  });

  it('3. Grade Baixa (8 pares): Decompõe perfeitamente em 8 pares por caixa', () => {
    const result = decomposePackMovement(1, gradeBaixaSnapshotItems);

    assert.equal(result.totalPacks, 1);
    assert.equal(result.totalPhysicalUnits, 8);
    assert.equal(result.childMovements.length, 6);

    const quantities = result.childMovements.map((c) => ({ size: c.size, qty: c.quantity }));
    assert.deepEqual(quantities, [
      { size: '34', qty: 1 },
      { size: '35', qty: 2 },
      { size: '36', qty: 2 },
      { size: '37', qty: 1 },
      { size: '38', qty: 1 },
      { size: '39', qty: 1 },
    ]);
  });

  it('4. Missing Component Mapping: Gera trace físico mesmo se alguma Unit Variation não estiver mapeada (variationId = null)', () => {
    const itemsWithMissing = [
      { size: '38', quantityPerPack: 2, variationId: 'uv-38' },
      { size: '39', quantityPerPack: 3, variationId: null }, // não mapeado
    ];

    const result = decomposePackMovement(2, itemsWithMissing);

    assert.equal(result.totalPacks, 2);
    assert.equal(result.totalPhysicalUnits, 10);
    assert.equal(result.isComplete, false);
    assert.equal(result.missingMappingsCount, 1);

    assert.equal(result.childMovements[1].size, '39');
    assert.equal(result.childMovements[1].quantity, 6);
    assert.equal(result.childMovements[1].variationId, null);
  });

  it('5. CRÍTICO — Zero Double Count & Independent Pools: Loose Unit Stock e Pack Stock não se contaminam', () => {
    // Produto com:
    // - 5 pares avulsos tamanho 38
    // - 7 pares avulsos tamanho 39
    // - 3 caixas de Grade Alta (13 pares/caixa) = 39 pares
    const looseUnits = [
      { stock: 5 },
      { stock: 7 },
    ];
    const packs = [
      { stock: 3, pairsPerPack: 13 },
    ];

    const stockSummary = calculateCanonicalPhysicalStock(looseUnits, packs);

    assert.equal(stockSummary.totalLooseStock, 12);
    assert.equal(stockSummary.totalPackStock, 3);
    assert.equal(stockSummary.totalPackPhysicalUnits, 39);
    assert.equal(stockSummary.totalPhysicalStock, 51); // 12 + 39 = 51 (NUNCA 15 ou 51 + 39)
  });

  it('6. Decrease / Ajuste Negativo: Decompõe quantidade absoluta com trace correspondente', () => {
    const result = decomposePackMovement(-2, gradeAltaSnapshotItems);

    assert.equal(result.totalPacks, 2);
    assert.equal(result.totalPhysicalUnits, 26);
    assert.equal(result.childMovements[3].quantity, 6);
  });
});
