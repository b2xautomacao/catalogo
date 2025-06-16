import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  type: 'basic' | 'premium' | 'enterprise';
  price_monthly: number;
  price_yearly: number | null;
  is_active: boolean;
  trial_days: number | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionPlanData {
  name: string;
  description?: string | null;
  type: 'basic' | 'premium' | 'enterprise';
  price_monthly: number;
  price_yearly?: number | null;
  is_active: boolean;
  trial_days?: number | null;
  sort_order?: number | null;
}

export type UpdateSubscriptionPlanData = Partial<CreateSubscriptionPlanData> & { id: string };

export const useSubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      setPlans(data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao buscar planos');
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (plan: CreateSubscriptionPlanData) => {
    const { data, error } = await supabase.from('subscription_plans').insert([plan]);
    if (error) throw error;
    await fetchPlans();
    return data;
  };

  const updatePlan = async (id: string, updates: UpdateSubscriptionPlanData) => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    await fetchPlans();
    return data;
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase
      .from('subscription_plans')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchPlans();
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
    createPlan,
    updatePlan,
    deletePlan
  };
};
