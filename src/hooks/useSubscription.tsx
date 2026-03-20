import { useState, useEffect, useCallback, useMemo } from "react";
import { useStoreSubscription } from "./useStoreSubscription";
import { useAuth } from "./useAuth";

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: "basic" | "premium" | "enterprise";
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

export const useSubscription = () => {
  const { profile } = useAuth();
  const {
    subscription,
    loading: subscriptionLoading,
    error: subscriptionError,
    getTrialDaysLeft,
  } = useStoreSubscription();
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(subscriptionLoading);
    setError(subscriptionError);
  }, [subscriptionLoading, subscriptionError]);

  const hasFeature = useCallback((featureType: string): boolean => {
    if (profile?.role === "superadmin") return true;
    if (!subscription?.plan) return false;

    const planType = subscription.plan.type;
    const featureMatrix: Record<string, string[]> = {
      basic: ["max_images_per_product", "basic_support"],
      premium: [
        "max_images_per_product",
        "ai_agent",
        "whatsapp_integration",
        "payment_pix",
        "payment_credit_card",
        "discount_coupons",
        "shipping_calculator",
        "dedicated_support",
      ],
      enterprise: ["*"],
    };

    if (planType === "enterprise") return true;
    return featureMatrix[planType]?.includes(featureType) || false;
  }, [profile?.role, subscription?.plan?.type]);

  const getFeatureLimit = useCallback((featureType: string): number => {
    if (profile?.role === "superadmin") return 0;
    if (!subscription?.plan) return 0;

    if (featureType === "max_images_per_product") return 10;

    const planType = subscription.plan.type;
    const limitMatrix: Record<string, Record<string, number>> = {
      basic: { max_team_members: 1 },
      premium: { max_team_members: 5 },
      enterprise: { max_team_members: 0 },
    };

    return limitMatrix[planType]?.[featureType] || 0;
  }, [profile?.role, subscription?.plan?.type]);

  const canUseFeature = useCallback((featureType: string, currentUsage?: number): boolean => {
    if (!hasFeature(featureType)) return false;
    const limit = getFeatureLimit(featureType);
    if (limit === 0) return true;
    const usage = currentUsage || featureUsage.find((u) => u.feature_type === featureType)?.current_usage || 0;
    return usage < limit;
  }, [hasFeature, getFeatureLimit, featureUsage]);

  return useMemo(() => ({
    subscription,
    featureUsage,
    loading,
    error,
    hasFeature,
    getFeatureLimit,
    canUseFeature,
    isTrialing: () => subscription?.status === "trialing",
    isActive: () => subscription?.status === "active",
    getTrialDaysLeft,
    getPlanDisplayName: () => {
      if (profile?.role === "superadmin") return "Superadmin";
      if (!subscription?.plan) return "Sem Plano";
      const planLabels = { basic: "Básico", premium: "Premium", enterprise: "Enterprise" };
      return planLabels[subscription.plan.type as keyof typeof planLabels] || "Básico";
    },
    getPlanValue: () => subscription?.plan?.price_monthly || 0,
    getExpirationDate: () => {
      if (!subscription) return null;
      if (subscription.status === "trialing" && subscription.trial_ends_at) return new Date(subscription.trial_ends_at);
      if (subscription.ends_at) return new Date(subscription.ends_at);
      return null;
    },
    refetch: () => {},
  }), [subscription, featureUsage, loading, error, hasFeature, getFeatureLimit, canUseFeature, getTrialDaysLeft, profile?.role]);
};
