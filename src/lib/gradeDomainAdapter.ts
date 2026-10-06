import { GradeTemplate, GradeTemplateItem, SizePairConfig } from '@/types/grade';

/**
 * Converte um template normalizado de grade vindo do backend em configuração
 * de pares consumível pelo formulário do wizard (SizePairConfig[]).
 * 
 * Regra: Sem lógica de negócio hardcoded (sem switches por nome de grade).
 * Os itens são ordenados rigorosamente pelo campo `position`.
 */
export function templateToWizardGrade(template: GradeTemplate): SizePairConfig[] {
  if (!template || !Array.isArray(template.items)) {
    return [];
  }

  return [...template.items]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((item) => ({
      size: item.size,
      pairs: Number(item.quantity) || 0,
    }));
}

/**
 * Converte a configuração de pares do wizard em itens de template para persistência.
 */
export function wizardGradeToTemplateItems(
  configs: SizePairConfig[]
): Array<Omit<GradeTemplateItem, 'id' | 'grade_template_id' | 'created_at'>> {
  if (!Array.isArray(configs)) {
    return [];
  }

  return configs
    .filter((config) => config.size && config.size.trim() !== '')
    .map((config, index) => ({
      size: config.size.trim(),
      quantity: Math.max(0, Number(config.pairs) || 0),
      position: index + 1,
    }));
}

/**
 * Calcula o total de unidades/pares de uma lista de itens de template.
 */
export function calculateTemplateTotal(items: Array<{ quantity: number }>): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

/**
 * Calcula o total de unidades/pares de uma configuração de wizard.
 */
export function calculateWizardGradeTotal(configs: SizePairConfig[]): number {
  if (!Array.isArray(configs)) return 0;
  return configs.reduce((sum, config) => sum + (Number(config.pairs) || 0), 0);
}
