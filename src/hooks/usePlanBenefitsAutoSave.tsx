
import { useCallback } from 'react';
import { usePlanBenefits } from '@/hooks/usePlanBenefits';
import { toast } from 'sonner';

export const usePlanBenefitsAutoSave = (planId: string) => {
  const { addBenefitToPlan, removeBenefitFromPlan, updatePlanBenefit } = usePlanBenefits();

  const toggleBenefit = useCallback(async (
    benefitId: string, 
    isEnabled: boolean, 
    existingPlanBenefitId?: string
  ) => {
    try {
      if (isEnabled && !existingPlanBenefitId) {
        // Adicionar benefício
        const result = await addBenefitToPlan({
          plan_id: planId,
          benefit_id: benefitId,
          is_enabled: true
        });
        
        if (result.data) {
          toast.success('Benefício adicionado ao plano');
        }
      } else if (!isEnabled && existingPlanBenefitId) {
        // Remover benefício
        const result = await removeBenefitFromPlan(existingPlanBenefitId);
        if (!result.error) {
          toast.success('Benefício removido do plano');
        }
      } else if (isEnabled && existingPlanBenefitId) {
        // Reativar benefício
        const result = await updatePlanBenefit(existingPlanBenefitId, { is_enabled: true });
        if (result.data) {
          toast.success('Benefício reativado');
        }
      } else if (!isEnabled && existingPlanBenefitId) {
        // Desativar benefício
        const result = await updatePlanBenefit(existingPlanBenefitId, { is_enabled: false });
        if (result.data) {
          toast.success('Benefício desativado');
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar benefício:', error);
      toast.error('Erro ao atualizar benefício');
    }
  }, [planId, addBenefitToPlan, removeBenefitFromPlan, updatePlanBenefit]);

  const updateBenefitLimit = useCallback(async (
    planBenefitId: string,
    limitValue: string | null
  ) => {
    try {
      const result = await updatePlanBenefit(planBenefitId, { 
        limit_value: limitValue 
      });
      
      if (result.data) {
        toast.success('Limite atualizado');
      }
    } catch (error) {
      console.error('Erro ao atualizar limite:', error);
      toast.error('Erro ao atualizar limite');
    }
  }, [updatePlanBenefit]);

  return {
    toggleBenefit,
    updateBenefitLimit
  };
};
