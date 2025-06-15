
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'basic' | 'premium' | 'enterprise';
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  is_active: boolean;
  trial_days: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionPlanData {
  name: string;
  type: 'basic' | 'premium' | 'enterprise';
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  is_active?: boolean;
  trial_days?: number;
  sort_order?: number;
}

export interface UpdateSubscriptionPlanData {
  name?: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  is_active?: boolean;
  trial_days?: number;
  sort_order?: number;
}

export const useSubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast.error('Erro ao carregar planos de assinatura');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlan = useCallback(async (data: CreateSubscriptionPlanData) => {
    try {
      const { data: newPlan, error } = await supabase
        .from('subscription_plans')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => [...prev, newPlan]);
      toast.success('Plano criado com sucesso');
      return { data: newPlan, error: null };
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      toast.error('Erro ao criar plano de assinatura');
      return { data: null, error };
    }
  }, []);

  const updatePlan = useCallback(async (id: string, data: UpdateSubscriptionPlanData) => {
    try {
      const { data: updatedPlan, error } = await supabase
        .from('subscription_plans')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => prev.map(p => p.id === id ? updatedPlan : p));
      toast.success('Plano atualizado com sucesso');
      return { data: updatedPlan, error: null };
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast.error('Erro ao atualizar plano');
      return { data: null, error };
    }
  }, []);

  const deletePlan = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success('Plano removido com sucesso');
      return { error: null };
    } catch (error) {
      console.error('Erro ao remover plano:', error);
      toast.error('Erro ao remover plano');
      return { error };
    }
  }, []);

  const getPlanById = useCallback((id: string) => {
    return plans.find(p => p.id === id);
  }, [plans]);

  const getActivePlans = useCallback(() => {
    return plans.filter(p => p.is_active);
  }, [plans]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    loading,
    createPlan,
    updatePlan,
    deletePlan,
    getPlanById,
    getActivePlans,
    refetch: fetchPlans
  };
};
