
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlanBenefit {
  id: string;
  plan_id: string;
  benefit_id: string;
  limit_value: string | null;
  is_enabled: boolean;
  created_at: string;
  benefit: {
    id: string;
    name: string;
    description: string | null;
    benefit_key: string;
    category: string;
    is_active: boolean;
  };
}

export interface CreatePlanBenefitData {
  plan_id: string;
  benefit_id: string;
  limit_value?: string;
  is_enabled?: boolean;
}

export interface UpdatePlanBenefitData {
  limit_value?: string;
  is_enabled?: boolean;
}

export const usePlanBenefits = () => {
  const [planBenefits, setPlanBenefits] = useState<Record<string, PlanBenefit[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchPlanBenefits = useCallback(async (planId?: string) => {
    try {
      let query = supabase
        .from('plan_benefits')
        .select(`
          *,
          benefit:system_benefits(*)
        `)
        .order('created_at', { ascending: true });

      if (planId) {
        query = query.eq('plan_id', planId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (planId) {
        setPlanBenefits(prev => ({
          ...prev,
          [planId]: data || []
        }));
      } else {
        // Agrupar por plan_id
        const groupedBenefits = (data || []).reduce((acc, benefit) => {
          if (!acc[benefit.plan_id]) {
            acc[benefit.plan_id] = [];
          }
          acc[benefit.plan_id].push(benefit);
          return acc;
        }, {} as Record<string, PlanBenefit[]>);

        setPlanBenefits(groupedBenefits);
      }
    } catch (error) {
      console.error('Erro ao buscar benefícios do plano:', error);
      toast.error('Erro ao carregar benefícios do plano');
    } finally {
      setLoading(false);
    }
  }, []);

  const addBenefitToPlan = useCallback(async (data: CreatePlanBenefitData) => {
    try {
      const { data: newBenefit, error } = await supabase
        .from('plan_benefits')
        .insert([data])
        .select(`
          *,
          benefit:system_benefits(*)
        `)
        .single();

      if (error) throw error;

      setPlanBenefits(prev => ({
        ...prev,
        [data.plan_id]: [...(prev[data.plan_id] || []), newBenefit]
      }));

      toast.success('Benefício adicionado ao plano');
      return { data: newBenefit, error: null };
    } catch (error) {
      console.error('Erro ao adicionar benefício ao plano:', error);
      toast.error('Erro ao adicionar benefício ao plano');
      return { data: null, error };
    }
  }, []);

  const updatePlanBenefit = useCallback(async (id: string, data: UpdatePlanBenefitData) => {
    try {
      const { data: updatedBenefit, error } = await supabase
        .from('plan_benefits')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          benefit:system_benefits(*)
        `)
        .single();

      if (error) throw error;

      setPlanBenefits(prev => {
        const newBenefits = { ...prev };
        Object.keys(newBenefits).forEach(planId => {
          newBenefits[planId] = newBenefits[planId].map(b => 
            b.id === id ? updatedBenefit : b
          );
        });
        return newBenefits;
      });

      toast.success('Benefício atualizado');
      return { data: updatedBenefit, error: null };
    } catch (error) {
      console.error('Erro ao atualizar benefício do plano:', error);
      toast.error('Erro ao atualizar benefício');
      return { data: null, error };
    }
  }, []);

  const removeBenefitFromPlan = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('plan_benefits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPlanBenefits(prev => {
        const newBenefits = { ...prev };
        Object.keys(newBenefits).forEach(planId => {
          newBenefits[planId] = newBenefits[planId].filter(b => b.id !== id);
        });
        return newBenefits;
      });

      toast.success('Benefício removido do plano');
      return { error: null };
    } catch (error) {
      console.error('Erro ao remover benefício do plano:', error);
      toast.error('Erro ao remover benefício');
      return { error };
    }
  }, []);

  const getPlanBenefits = useCallback((planId: string) => {
    return planBenefits[planId] || [];
  }, [planBenefits]);

  useEffect(() => {
    fetchPlanBenefits();
  }, [fetchPlanBenefits]);

  return {
    planBenefits,
    loading,
    addBenefitToPlan,
    updatePlanBenefit,
    removeBenefitFromPlan,
    getPlanBenefits,
    refetch: fetchPlanBenefits
  };
};
