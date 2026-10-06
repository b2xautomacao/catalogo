import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  determineGradeChangeType,
  planGradeReplacement,
} from '../gradeLifecycleService';

describe('FASE C — Grade Editing & Replacement Lifecycle', () => {
  const existingGrade = {
    id: 'var-pack-1',
    product_id: 'prod-10',
    is_grade: true,
    variation_type: 'grade',
    grade_name: 'Grade Alta',
    color: 'Preto',
    grade_color: 'Preto',
    grade_sizes: ['36', '37', '38', '39', '40', '41', '42'],
    grade_pairs: [1, 2, 2, 3, 2, 2, 1],
    grade_price: 150,
    sku: 'PACK-ALT-BLK',
    stock: 5,
  };

  it('1. Unchanged Save: Salvar produto sem mexer na grade NÃO cria novo snapshot (zero migração redundante)', () => {
    const desired = { ...existingGrade };

    const changeType = determineGradeChangeType(desired, existingGrade);
    assert.equal(changeType, 'NO_CHANGE');

    const plan = planGradeReplacement({
      desired,
      existing: existingGrade,
      existingActiveSnapshotId: 'snap-old-1',
      existingPackStock: 5,
    });

    assert.equal(plan.requiresNewSnapshot, false);
    assert.equal(plan.deactivateOldSnapshot, false);
    assert.equal(plan.initialNewPackStock, 5);
    assert.equal(plan.auditEventType, null);
  });

  it('2. Metadata-only Change: Alterar preço ou SKU não gera novo snapshot estrutural', () => {
    const desired = {
      ...existingGrade,
      grade_price: 165,
      sku: 'PACK-ALT-BLK-PROMO',
    };

    const changeType = determineGradeChangeType(desired, existingGrade);
    assert.equal(changeType, 'METADATA_ONLY');

    const plan = planGradeReplacement({
      desired,
      existing: existingGrade,
      existingActiveSnapshotId: 'snap-old-1',
      existingPackStock: 5,
    });

    assert.equal(plan.requiresNewSnapshot, false);
    assert.equal(plan.deactivateOldSnapshot, false);
    assert.equal(plan.auditEventType, 'grade_metadata_updated');
  });

  it('3. Structural Change (Grade Alta -> Grade Baixa): Gera novo snapshot, planeja desativação do antigo e NÃO move estoque silenciosamente', () => {
    const desired = {
      ...existingGrade,
      grade_name: 'Grade Baixa',
      grade_sizes: ['34', '35', '36', '37', '38', '39'],
      grade_pairs: [1, 2, 2, 1, 1, 1],
    };

    const changeType = determineGradeChangeType(desired, existingGrade);
    assert.equal(changeType, 'STRUCTURAL_COMPOSITION_CHANGE');

    const plan = planGradeReplacement({
      desired,
      existing: existingGrade,
      existingActiveSnapshotId: 'snap-old-1',
      existingPackStock: 5, // 5 caixas na grade antiga
    });

    assert.equal(plan.requiresNewSnapshot, true);
    assert.equal(plan.deactivateOldSnapshot, true);
    assert.equal(plan.preserveOldSnapshotId, 'snap-old-1');
    assert.equal(plan.initialNewPackStock, 0); // REGRA CRÍTICA: Nova composição inicia com estoque 0
    assert.equal(plan.auditEventType, 'grade_replaced');
    assert.ok(plan.warningMessage?.includes('A grade anterior possui 5 caixa(s)'));
  });

  it('4. Structural Change com Estoque Zero: Permite transição limpa sem aviso de estoque residual', () => {
    const desired = {
      ...existingGrade,
      grade_pairs: [1, 2, 2, 2, 2, 2, 1], // mudou proporção
    };

    const plan = planGradeReplacement({
      desired,
      existing: existingGrade,
      existingActiveSnapshotId: 'snap-old-1',
      existingPackStock: 0,
    });

    assert.equal(plan.requiresNewSnapshot, true);
    assert.equal(plan.initialNewPackStock, 0);
    assert.equal(plan.warningMessage, null);
  });

  it('5. Nova Grade (Criação): Inicializa novo snapshot ativo com estoque inicial = 0', () => {
    const desired = {
      grade_name: 'Grade Personalizada',
      color: 'Branco',
      grade_sizes: ['38', '39'],
      grade_pairs: [5, 5],
      is_grade: true,
    };

    const plan = planGradeReplacement({
      desired,
      existing: null,
      existingActiveSnapshotId: null,
      existingPackStock: 0,
    });

    assert.equal(plan.requiresNewSnapshot, true);
    assert.equal(plan.deactivateOldSnapshot, false);
    assert.equal(plan.initialNewPackStock, 0);
    assert.equal(plan.auditEventType, 'grade_created');
  });
});
