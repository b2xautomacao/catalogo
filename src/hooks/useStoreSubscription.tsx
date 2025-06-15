
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface StoreSubscription {
  id: string;
  store_id: string;
  plan_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive';
  starts_at: string;
  ends_at: string | null;
  trial_ends_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  plan?: {
    id: string;
    name: string;
    type: string;
    price_monthly: number;
    price_yearly?: number;
    description?: string;
    is_active?: boolean;
    trial_days?: number;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
}

export const useStoreSubscription = () => {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<StoreSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!profile?.store_id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('store_subscriptions')
        .select(`
          *,
          plan:subscription_plans(
            id,
            name,
            type,
            price_monthly,
            price_yearly,
            description,
            is_active,
            trial_days,
            sort_order,
            created_at,
            updated_at
          )
        `)
        .eq('store_id', profile.store_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
    } catch (err) {
      console.error('Erro ao buscar assinatura:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [profile?.store_id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription
  };
};
