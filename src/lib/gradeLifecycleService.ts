import { ProductVariation } from '@/types/product';
import { isGradeCompositionEqual } from './variationReconciliationService';

export type GradeChangeType = 'NO_CHANGE' | 'METADATA_ONLY' | 'STRUCTURAL_COMPOSITION_CHANGE';

export interface GradeReplacementPlan {
  changeType: GradeChangeType;
  requiresNewSnapshot: boolean;
  preserveOldSnapshotId: string | null;
  deactivateOldSnapshot: boolean;
  initialNewPackStock: number;
  auditEventType: string | null;
  warningMessage: string | null;
}

/**
 * Determina o tipo de alteração em uma grade aplicada.
 */
export function determineGradeChangeType(
  desired: Partial<ProductVariation>,
  existing: Partial<ProductVariation> & { id: string }
): GradeChangeType {
  const isGrade = Boolean(desired.is_grade || desired.variation_type === 'grade');
  const wasGrade = Boolean(existing.is_grade || existing.variation_type === 'grade');

  if (!isGrade && !wasGrade) {
    return 'NO_CHANGE';
  }

  // Se a composição estrutural (tamanhos, pares, modelo) for idêntica
  const compositionEqual = isGradeCompositionEqual(desired, existing as any);

  if (compositionEqual) {
    // Verificar se houve mudança apenas de metadados não estruturais (preço da grade, cor, display_order)
    if (
      desired.price_adjustment !== existing.price_adjustment ||
      desired.grade_price !== existing.grade_price ||
      desired.is_active !== existing.is_active ||
      desired.sku !== existing.sku
    ) {
      return 'METADATA_ONLY';
    }
    return 'NO_CHANGE';
  }

  return 'STRUCTURAL_COMPOSITION_CHANGE';
}

/**
 * Planeja a substituição segura de uma grade respeitando o ciclo de vida e a imutabilidade do snapshot.
 * 
 * Regras Canônicas:
 * 1. Snapshot histórico é IMUTÁVEL.
 * 2. Se a composição mudou estruturalmente:
 *    - O snapshot antigo é mantido e marcado com is_active = false, replaced_by_snapshot_id.
 *    - O novo snapshot é criado com is_active = true.
 *    - O estoque existente (ex: 5 caixas) NUNCA é transferido silenciosamente para a nova composição.
 *    - A nova variação/composição inicia com stock = 0.
 */
export function planGradeReplacement(params: {
  desired: Partial<ProductVariation>;
  existing?: (Partial<ProductVariation> & { id: string }) | null;
  existingActiveSnapshotId?: string | null;
  existingPackStock?: number;
}): GradeReplacementPlan {
  const { desired, existing, existingActiveSnapshotId, existingPackStock = 0 } = params;

  if (!existing) {
    // Nova Grade criada do zero
    return {
      changeType: 'STRUCTURAL_COMPOSITION_CHANGE',
      requiresNewSnapshot: true,
      preserveOldSnapshotId: null,
      deactivateOldSnapshot: false,
      initialNewPackStock: 0,
      auditEventType: 'grade_created',
      warningMessage: null,
    };
  }

  const changeType = determineGradeChangeType(desired, existing);

  if (changeType === 'NO_CHANGE') {
    return {
      changeType: 'NO_CHANGE',
      requiresNewSnapshot: false,
      preserveOldSnapshotId: existingActiveSnapshotId || null,
      deactivateOldSnapshot: false,
      initialNewPackStock: existingPackStock,
      auditEventType: null,
      warningMessage: null,
    };
  }

  if (changeType === 'METADATA_ONLY') {
    return {
      changeType: 'METADATA_ONLY',
      requiresNewSnapshot: false,
      preserveOldSnapshotId: existingActiveSnapshotId || null,
      deactivateOldSnapshot: false,
      initialNewPackStock: existingPackStock,
      auditEventType: 'grade_metadata_updated',
      warningMessage: null,
    };
  }

  // STRUCTURAL_COMPOSITION_CHANGE:
  let warningMessage: string | null = null;
  if (existingPackStock > 0) {
    warningMessage = `A grade anterior possui ${existingPackStock} caixa(s) em estoque. A nova composição será criada com estoque zero (0) para evitar inconsistência física no inventário.`;
  }

  return {
    changeType: 'STRUCTURAL_COMPOSITION_CHANGE',
    requiresNewSnapshot: true,
    preserveOldSnapshotId: existingActiveSnapshotId || null,
    deactivateOldSnapshot: Boolean(existingActiveSnapshotId),
    initialNewPackStock: 0, // NUNCA transferir estoque entre composições incompatíveis
    auditEventType: 'grade_replaced',
    warningMessage,
  };
}
