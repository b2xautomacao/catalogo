
import { useCallback } from 'react';
import { usePlanBenefits } from '@/hooks/usePlanBenefits';
import { toast } from 'sonner';

export const usePlanBenefitsAutoSave = (planId: string) => {
  const { addBenefitToPlan, removeBenefitFromPlan, updatePlanBenefit, refetch } = usePlanBenefits();

  const toggleBenefit = useCallback(async (
    benefitId: string, 
    isEnabled: boolean, 
    existingPlanBenefitId?: string
  ) => {
    console.log(`🔄 Toggling benefit: ${benefitId}, enabled: ${isEnabled}, existingId: ${existingPlanBenefitId}`);
    
    try {
      if (isEnabled && !existingPlanBenefitId) {
        // Adicionar novo benefício
        console.log(`➕ Adding new benefit to plan ${planId}`);
        const result = await addBenefitToPlan({
          plan_id: planId,
          benefit_id: benefitId,
          is_enabled: true
        });
        
        if (result.data) {
          console.log('✅ Benefit added successfully:', result.data);
          toast.success('Benefício adicionado ao plano');
          await refetch(planId); // Refresh data
        } else {
          console.error('❌ Failed to add benefit:', result.error);
          throw new Error('Falha ao adicionar benefício');
        }
      } else if (!isEnabled && existingPlanBenefitId) {
        // Desativar benefício existente
        console.log(`🔄 Disabling existing benefit: ${existingPlanBenefitId}`);
        const result = await updatePlanBenefit(existingPlanBenefitId, { is_enabled: false });
        
        if (result.data) {
          console.log('✅ Benefit disabled successfully:', result.data);
          toast.success('Benefício desativado');
          await refetch(planId); // Refresh data
        } else {
          console.error('❌ Failed to disable benefit:', result.error);
          throw new Error('Falha ao desativar benefício');
        }
      } else if (isEnabled && existingPlanBenefitId) {
        // Reativar benefício existente
        console.log(`🔄 Enabling existing benefit: ${existingPlanBenefitId}`);
        const result = await updatePlanBenefit(existingPlanBenefitId, { is_enabled: true });
        
        if (result.data) {
          console.log('✅ Benefit enabled successfully:', result.data);
          toast.success('Benefício ativado');
          await refetch(planId); // Refresh data
        } else {
          console.error('❌ Failed to enable benefit:', result.error);
          throw new Error('Falha ao ativar benefício');
        }
      }
    } catch (error) {
      console.error('💥 Error in toggleBenefit:', error);
      toast.error(`Erro ao atualizar benefício: ${error.message || 'Erro desconhecido'}`);
    }
  }, [planId, addBenefitToPlan, removeBenefitFromPlan, updatePlanBenefit, refetch]);

  const updateBenefitLimit = useCallback(async (
    planBenefitId: string,
    limitValue: string | null
  ) => {
    console.log(`🔄 Updating limit for benefit ${planBenefitId}: ${limitValue}`);
    
    try {
      const result = await updatePlanBenefit(planBenefitId, { 
        limit_value: limitValue 
      });
      
      if (result.data) {
        console.log('✅ Limit updated successfully:', result.data);
        toast.success('Limite atualizado');
        await refetch(planId); // Refresh data
      } else {
        console.error('❌ Failed to update limit:', result.error);
        throw new Error('Falha ao atualizar limite');
      }
    } catch (error) {
      console.error('💥 Error in updateBenefitLimit:', error);
      toast.error(`Erro ao atualizar limite: ${error.message || 'Erro desconhecido'}`);
    }
  }, [updatePlanBenefit, refetch, planId]);

  return {
    toggleBenefit,
    updateBenefitLimit
  };
};
