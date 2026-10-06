import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  templateToWizardGrade,
  wizardGradeToTemplateItems,
  calculateTemplateTotal,
  calculateWizardGradeTotal,
} from '../gradeDomainAdapter.js';
import { GradeTemplate } from '../../types/grade.js';

describe('GradeDomainAdapter — Unit & Domain Tests', () => {
  it('51/52. Deve converter Grade Alta do backend derivando 13 pares totais', () => {
    const gradeAltaTemplate: GradeTemplate = {
      id: 'system-tmpl-grade-alta',
      store_id: null,
      name: 'Grade Alta',
      slug: 'grade-alta',
      product_category_type: 'calcado',
      is_system: true,
      is_active: true,
      total_units: 13,
      items: [
        { id: '1', grade_template_id: 'system-tmpl-grade-alta', size: '36', quantity: 1, position: 1 },
        { id: '2', grade_template_id: 'system-tmpl-grade-alta', size: '37', quantity: 2, position: 2 },
        { id: '3', grade_template_id: 'system-tmpl-grade-alta', size: '38', quantity: 2, position: 3 },
        { id: '4', grade_template_id: 'system-tmpl-grade-alta', size: '39', quantity: 3, position: 4 },
        { id: '5', grade_template_id: 'system-tmpl-grade-alta', size: '40', quantity: 2, position: 5 },
        { id: '6', grade_template_id: 'system-tmpl-grade-alta', size: '41', quantity: 2, position: 6 },
        { id: '7', grade_template_id: 'system-tmpl-grade-alta', size: '42', quantity: 1, position: 7 },
      ],
    };

    const wizardConfigs = templateToWizardGrade(gradeAltaTemplate);

    assert.equal(wizardConfigs.length, 7);
    assert.deepEqual(
      wizardConfigs.map((c) => ({ size: c.size, pairs: c.pairs })),
      [
        { size: '36', pairs: 1 },
        { size: '37', pairs: 2 },
        { size: '38', pairs: 2 },
        { size: '39', pairs: 3 },
        { size: '40', pairs: 2 },
        { size: '41', pairs: 2 },
        { size: '42', pairs: 1 },
      ]
    );

    const totalDerived = calculateWizardGradeTotal(wizardConfigs);
    assert.equal(totalDerived, 13);
    assert.equal(calculateTemplateTotal(gradeAltaTemplate.items), 13);
  });

  it('53. Deve converter Grade Baixa do backend derivando 8 pares totais', () => {
    const gradeBaixaTemplate: GradeTemplate = {
      id: 'system-tmpl-grade-baixa',
      store_id: null,
      name: 'Grade Baixa',
      slug: 'grade-baixa',
      product_category_type: 'calcado',
      is_system: true,
      is_active: true,
      total_units: 8,
      items: [
        { id: '1', grade_template_id: 'system-tmpl-grade-baixa', size: '35', quantity: 1, position: 1 },
        { id: '2', grade_template_id: 'system-tmpl-grade-baixa', size: '36', quantity: 2, position: 2 },
        { id: '3', grade_template_id: 'system-tmpl-grade-baixa', size: '37', quantity: 2, position: 3 },
        { id: '4', grade_template_id: 'system-tmpl-grade-baixa', size: '38', quantity: 2, position: 4 },
        { id: '5', grade_template_id: 'system-tmpl-grade-baixa', size: '39', quantity: 1, position: 5 },
      ],
    };

    const wizardConfigs = templateToWizardGrade(gradeBaixaTemplate);

    assert.equal(wizardConfigs.length, 5);
    assert.deepEqual(
      wizardConfigs.map((c) => ({ size: c.size, pairs: c.pairs })),
      [
        { size: '35', pairs: 1 },
        { size: '36', pairs: 2 },
        { size: '37', pairs: 2 },
        { size: '38', pairs: 2 },
        { size: '39', pairs: 1 },
      ]
    );

    const totalDerived = calculateWizardGradeTotal(wizardConfigs);
    assert.equal(totalDerived, 8);
  });

  it('54. Teste de No Hardcode: se backend alterar composição, total e pares refletem dinamicamente sem mudar código', () => {
    // Template custom ou modificado dinamicamente
    const dynamicTemplate: GradeTemplate = {
      id: 'custom-tmpl-verao',
      store_id: 'store-123',
      name: 'Grade Verão Especial',
      is_system: false,
      is_active: true,
      total_units: 20,
      items: [
        { id: '10', grade_template_id: 'custom-tmpl-verao', size: '34', quantity: 5, position: 1 },
        { id: '11', grade_template_id: 'custom-tmpl-verao', size: '35', quantity: 5, position: 2 },
        { id: '12', grade_template_id: 'custom-tmpl-verao', size: '36', quantity: 10, position: 3 },
      ],
    };

    const wizardConfigs = templateToWizardGrade(dynamicTemplate);
    assert.equal(calculateWizardGradeTotal(wizardConfigs), 20);
    assert.equal(wizardConfigs[0].size, '34');
    assert.equal(wizardConfigs[0].pairs, 5);
    assert.equal(wizardConfigs[2].size, '36');
    assert.equal(wizardConfigs[2].pairs, 10);
  });

  it('56. Deve converter wizard state em itens de template para persistência com posições sequenciais', () => {
    const wizardInputs = [
      { size: '35', pairs: 1 },
      { size: '36', pairs: 2 },
      { size: '37', pairs: 3 },
    ];

    const templateItems = wizardGradeToTemplateItems(wizardInputs);

    assert.equal(templateItems.length, 3);
    assert.deepEqual(templateItems, [
      { size: '35', quantity: 1, position: 1 },
      { size: '36', quantity: 2, position: 2 },
      { size: '37', quantity: 3, position: 3 },
    ]);
  });

  it('Respeita ordenação por position mesmo se o array de entrada vier desordenado', () => {
    const unorderedTemplate: GradeTemplate = {
      id: 'unordered-1',
      store_id: null,
      name: 'Desordenada',
      is_system: true,
      is_active: true,
      total_units: 6,
      items: [
        { id: '3', grade_template_id: 'unordered-1', size: '39', quantity: 3, position: 3 },
        { id: '1', grade_template_id: 'unordered-1', size: '37', quantity: 1, position: 1 },
        { id: '2', grade_template_id: 'unordered-1', size: '38', quantity: 2, position: 2 },
      ],
    };

    const sortedConfigs = templateToWizardGrade(unorderedTemplate);
    assert.equal(sortedConfigs[0].size, '37');
    assert.equal(sortedConfigs[1].size, '38');
    assert.equal(sortedConfigs[2].size, '39');
  });
});
