
import { useState, useEffect } from 'react';
import { useStoreSubscription } from './useStoreSubscription';
import { useAuth } from './useAuth';

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'basic' | 'premium' | 'enterprise';
  description: string;
  price_monthly: number;
  price_yearly: number;
  is_active: boolean;
  trial_days: number;
}

export interface FeatureUsage {
  feature_type: string;
  current_usage: number;
  limit: string;
  percentage: number;
}

// Plano padrão para usuários sem assinatura
const DEFAULT_FREE_PLAN = {
  id: 'free',
  name: 'Gratuito',
  type: 'basic' as const,
  description: 'Plano básico gratuito',
  price_monthly: 0,
  price_yearly: 0,
  is_active: true,
  trial_days: 0
};

export const useSubscription = () => {
  const { profile } = useAuth();
  const { subscription, loading: subscriptionLoading, error: subscriptionError } = useStoreSubscription();
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(subscriptionLoading);
    setError(subscriptionError);
  }, [subscriptionLoading, subscriptionError]);

  const hasFeature = (featureType: string): boolean => {
    if (profile?.role === 'superadmin') return true;
    if (!subscription?.plan) return false;
    
    // Verificação básica por tipo de plano
    const planType = subscription.plan.type;
    
    const featureMatrix: Record<string, string[]> = {
      'basic': ['max_images_per_product', 'basic_support'],
      'premium': ['max_images_per_product', 'ai_agent', 'whatsapp_integration', 'payment_pix', 'payment_credit_card'],
      'enterprise': ['*'] // Todas as features
    };

    if (planType === 'enterprise') return true;
    return featureMatrix[planType]?.includes(featureType) || false;
  };

  const getFeatureLimit = (featureType: string): number => {
    if (profile?.role === 'superadmin') return 0; // Ilimitado
    if (!subscription?.plan) return 0;
    
    const planType = subscription.plan.type;
    
    const limitMatrix: Record<string, Record<string, number>> = {
      'basic': { 'max_images_per_product': 3, 'max_team_members': 1 },
      'premium': { 'max_images_per_product': 10, 'max_team_members': 5 },
      'enterprise': { 'max_images_per_product': 0, 'max_team_members': 0 } // Ilimitado
    };

    return limitMatrix[planType]?.[featureType] || 0;
  };

  const canUseFeature = (featureType: string, currentUsage?: number): boolean => {
    if (!hasFeature(featureType)) return false;
    
    const limit = getFeatureLimit(featureType);
    if (limit === 0) return true; // Ilimitado
    
    const usage = currentUsage || featureUsage.find(u => u.feature_type === featureType)?.current_usage || 0;
    return usage < limit;
  };

  const isTrialing = (): boolean => {
    return subscription?.status === 'trialing';
  };

  const getTrialDaysLeft = (): number => {
    if (!subscription?.trial_ends_at || subscription.status !== 'trialing') return 0;
    
    const trialEnd = new Date(subscription.trial_ends_at);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  // Retornar plano atual ou plano gratuito como fallback
  const currentSubscription = subscription || {
    ...DEFAULT_FREE_PLAN,
    id: 'free-default',
    store_id: profile?.store_id || '',
    plan_id: 'free',
    status: 'active' as const,
    starts_at: new Date().toISOString(),
    ends_at: null,
    trial_ends_at: null,
    canceled_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    plan: DEFAULT_FREE_PLAN
  };

  return {
    subscription: currentSubscription,
    featureUsage,
    loading,
    error,
    hasFeature,
    getFeatureLimit,
    canUseFeature,
    isTrialing,
    getTrialDaysLeft,
    refetch: () => {} // Implementar se necessário
  };
};
