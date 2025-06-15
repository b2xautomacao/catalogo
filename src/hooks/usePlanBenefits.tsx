
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
    console.log(`🔄 Fetching plan benefits${planId ? ` for plan: ${planId}` : ' (all)'}`);
    
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

      if (error) {
        console.error('❌ Error fetching plan benefits:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} plan benefits`, data);

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
      console.error('💥 Error in fetchPlanBenefits:', error);
      toast.error('Erro ao carregar benefícios do plano');
    } finally {
      setLoading(false);
    }
  }, []);

  const addBenefitToPlan = useCallback(async (data: CreatePlanBenefitData) => {
    console.log('➕ Adding benefit to plan:', data);
    
    try {
      const { data: newBenefit, error } = await supabase
        .from('plan_benefits')
        .insert([data])
        .select(`
          *,
          benefit:system_benefits(*)
        `)
        .single();

      if (error) {
        console.error('❌ Error adding benefit to plan:', error);
        throw error;
      }

      console.log('✅ Benefit added successfully:', newBenefit);

      setPlanBenefits(prev => ({
        ...prev,
        [data.plan_id]: [...(prev[data.plan_id] || []), newBenefit]
      }));

      return { data: newBenefit, error: null };
    } catch (error) {
      console.error('💥 Error in addBenefitToPlan:', error);
      return { data: null, error };
    }
  }, []);

  const updatePlanBenefit = useCallback(async (id: string, data: UpdatePlanBenefitData) => {
    console.log(`🔄 Updating plan benefit ${id}:`, data);
    
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

      if (error) {
        console.error('❌ Error updating plan benefit:', error);
        throw error;
      }

      console.log('✅ Benefit updated successfully:', updatedBenefit);

      setPlanBenefits(prev => {
        const newBenefits = { ...prev };
        Object.keys(newBenefits).forEach(planId => {
          newBenefits[planId] = newBenefits[planId].map(b => 
            b.id === id ? updatedBenefit : b
          );
        });
        return newBenefits;
      });

      return { data: updatedBenefit, error: null };
    } catch (error) {
      console.error('💥 Error in updatePlanBenefit:', error);
      return { data: null, error };
    }
  }, []);

  const removeBenefitFromPlan = useCallback(async (id: string) => {
    console.log(`🗑️ Removing plan benefit: ${id}`);
    
    try {
      const { error } = await supabase
        .from('plan_benefits')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error removing plan benefit:', error);
        throw error;
      }

      console.log('✅ Benefit removed successfully');

      setPlanBenefits(prev => {
        const newBenefits = { ...prev };
        Object.keys(newBenefits).forEach(planId => {
          newBenefits[planId] = newBenefits[planId].filter(b => b.id !== id);
        });
        return newBenefits;
      });

      return { error: null };
    } catch (error) {
      console.error('💥 Error in removeBenefitFromPlan:', error);
      return { error };
    }
  }, []);

  const getPlanBenefits = useCallback((planId: string) => {
    const benefits = planBenefits[planId] || [];
    console.log(`📋 Getting benefits for plan ${planId}:`, benefits.length);
    return benefits;
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
