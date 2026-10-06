import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateBulkUpdates,
  previewBulkUpdate,
  ALLOWED_BULK_FIELDS,
  PROHIBITED_BULK_FIELDS,
} from '../bulkCatalogService';

describe('FASE A — Bulk Catalog Operations Service & Security Guards', () => {
  it('1. Valida com sucesso campos legítimos da allowlist', () => {
    const updates = {
      is_active: true,
      category: 'Calçados',
      material: 'Couro Legítimo',
      gender: 'masculino',
      featured: true,
      retail_price: 189.9,
      wholesale_price: 120.0,
      min_wholesale_qty: 6,
    };

    const validation = validateBulkUpdates(updates);

    assert.equal(validation.valid, true);
    assert.equal(validation.errors.length, 0);
    assert.equal(validation.allowedUpdates.category, 'Calçados');
    assert.equal(validation.allowedUpdates.retail_price, 189.9);
    assert.equal(validation.allowedUpdates.min_wholesale_qty, 6);
  });

  it('2. Rejeita estritamente campos proibidos (stock, ledger, variations, credentials, etc.)', () => {
    for (const prohibited of PROHIBITED_BULK_FIELDS) {
      const updates = { [prohibited]: 100 };
      const validation = validateBulkUpdates(updates);

      assert.equal(validation.valid, false);
      assert.ok(
        validation.errors.some((e) => e.includes('estritamente proibido')),
        `Deveria rejeitar o campo proibido: ${prohibited}`
      );
    }
  });

  it('3. Rejeita campos desconhecidos fora da allowlist (Mass Assignment Guard)', () => {
    const updates = {
      malicious_field: 'drop table products;',
      category: 'Roupas',
    };

    const validation = validateBulkUpdates(updates);

    assert.equal(validation.valid, false);
    assert.ok(validation.errors.some((e) => e.includes('não é permitido')));
  });

  it('4. Validação de tipos e restrições: rejeita preços negativos ou qtd mínima < 1', () => {
    const invalidPrice = validateBulkUpdates({ retail_price: -50 });
    assert.equal(invalidPrice.valid, false);
    assert.ok(invalidPrice.errors.some((e) => e.includes('maior ou igual a zero')));

    const invalidQty = validateBulkUpdates({ min_wholesale_qty: 0 });
    assert.equal(invalidQty.valid, false);
    assert.ok(invalidQty.errors.some((e) => e.includes('maior ou igual a 1')));
  });

  it('5. Preview: Gera resumo estruturado das alterações antes da confirmação', () => {
    const products = [
      { id: 'p-1', name: 'Tênis Running' },
      { id: 'p-2', name: 'Sapato Social' },
    ];

    const updates = {
      category: 'Calçados',
      is_active: false,
      retail_price: 199.9,
    };

    const preview = previewBulkUpdate(products, updates);

    assert.equal(preview.totalSelected, 2);
    assert.equal(preview.fieldsToUpdate.length, 3);
    assert.deepEqual(preview.fieldsToUpdate.sort(), ['category', 'is_active', 'retail_price'].sort());

    const catSummary = preview.summary.find((s) => s.field === 'category');
    assert.equal(catSummary?.newValue, 'Calçados');
    assert.equal(catSummary?.label, 'Categoria');
  });

  it('6. Rejeita payload vazio', () => {
    const validation = validateBulkUpdates({});
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.some((e) => e.includes('Nenhum campo')));
  });
});
