import { useState, useEffect, useCallback, useMemo } from 'react';
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

export const useStoreSubscription = (storeId?: string) => {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<StoreSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetStoreId = storeId || profile?.store_id;

  const fetchSubscription = useCallback(async () => {
    if (!targetStoreId) {
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
        .eq('store_id', targetStoreId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      setSubscription(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar assinatura:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [targetStoreId]);

  const getTrialDaysLeft = useCallback((): number => {
    if (!subscription?.trial_ends_at || subscription.status !== 'trialing') return 0;
    
    const trialEnd = new Date(subscription.trial_ends_at);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }, [subscription]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return useMemo(() => ({
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
    getTrialDaysLeft
  }), [subscription, loading, error, fetchSubscription, getTrialDaysLeft]);
};
