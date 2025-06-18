
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStoreSubscription } from '@/hooks/useStoreSubscription';
import { usePlanBenefits } from '@/hooks/usePlanBenefits';

interface PermissionCheck {
  hasAccess: boolean;
  loading: boolean;
  message?: string;
}

export const usePlanPermissions = () => {
  const { profile, isSuperadmin } = useAuth();
  const { subscription, loading: subscriptionLoading } = useStoreSubscription();
  const { planBenefits, loading: benefitsLoading } = usePlanBenefits();

  // Extrair benefits do planBenefits
  const benefits = planBenefits[subscription?.plan?.id || ''] || [];

  // Superadmins sempre têm acesso total
  if (isSuperadmin) {
    return {
      // Funções específicas
      hasFeatureAccess: () => ({ hasAccess: true, loading: false }),
      hasBenefitAccess: () => ({ hasAccess: true, loading: false }),
      checkProductLimit: () => ({ hasAccess: true, loading: false }),
      checkImageLimit: () => ({ hasAccess: true, loading: false }),
      checkVariationLimit: () => ({ hasAccess: true, loading: false }),
      checkAIUsage: () => ({ hasAccess: true, loading: false }),
      
      // Propriedades de compatibilidade
      checkFeatureAccess: () => true,
      hasBenefit: () => true,
      subscription,
      isTrialing: () => false,
      isSuperadmin: true,
      getPlanBadgeInfo: () => ({ label: 'Superadmin', variant: 'default' as const }),
      getFeatureDisplayInfo: () => ({ name: 'Acesso Total', isEnabled: true }),
      loading: false
    };
  }

  const loading = subscriptionLoading || benefitsLoading;

  const hasFeatureAccess = (featureKey: string): PermissionCheck => {
    if (loading) return { hasAccess: false, loading: true };
    
    if (!subscription || !subscription.plan) {
      return { 
        hasAccess: false, 
        loading: false, 
        message: "Nenhum plano ativo encontrado" 
      };
    }

    // Verificar se o benefício está habilitado para o plano atual
    const benefit = benefits.find(b => b.benefit?.benefit_key === featureKey);
    
    if (!benefit || !benefit.is_enabled) {
      return { 
        hasAccess: false, 
        loading: false, 
        message: `Recurso '${featureKey}' não disponível no seu plano atual` 
      };
    }

    return { hasAccess: true, loading: false };
  };

  const hasBenefitAccess = (benefitKey: string): PermissionCheck => {
    return hasFeatureAccess(benefitKey);
  };

  const checkProductLimit = (): PermissionCheck => {
    if (loading) return { hasAccess: false, loading: true };
    
    const productBenefit = benefits.find(b => b.benefit?.benefit_key === 'max_products');
    
    if (!productBenefit || !productBenefit.is_enabled) {
      return { 
        hasAccess: false, 
        loading: false, 
        message: "Limite de produtos não definido para seu plano" 
      };
    }

    // Se limit_value for 'unlimited', permitir
    if (productBenefit.limit_value === 'unlimited') {
      return { hasAccess: true, loading: false };
    }

    // TODO: Implementar verificação real do número de produtos
    // Por enquanto, sempre permitir até implementarmos a contagem
    return { hasAccess: true, loading: false };
  };

  const checkImageLimit = (): PermissionCheck => {
    if (loading) return { hasAccess: false, loading: true };
    
    const imageBenefit = benefits.find(b => b.benefit?.benefit_key === 'max_product_images');
    
    if (!imageBenefit || !imageBenefit.is_enabled) {
      return { 
        hasAccess: false, 
        loading: false, 
        message: "Upload de imagens não disponível no seu plano" 
      };
    }

    return { hasAccess: true, loading: false };
  };

  const checkVariationLimit = (): PermissionCheck => {
    if (loading) return { hasAccess: false, loading: true };
    
    const variationBenefit = benefits.find(b => b.benefit?.benefit_key === 'product_variations');
    
    if (!variationBenefit || !variationBenefit.is_enabled) {
      return { 
        hasAccess: false, 
        loading: false, 
        message: "Variações de produtos não disponíveis no seu plano" 
      };
    }

    return { hasAccess: true, loading: false };
  };

  const checkAIUsage = (): PermissionCheck => {
    if (loading) return { hasAccess: false, loading: true };
    
    const aiBenefit = benefits.find(b => b.benefit?.benefit_key === 'ai_product_descriptions');
    
    if (!aiBenefit || !aiBenefit.is_enabled) {
      return { 
        hasAccess: false, 
        loading: false, 
        message: "IA para produtos não disponível no seu plano" 
      };
    }

    return { hasAccess: true, loading: false };
  };

  // Funções de compatibilidade com a interface antiga
  const checkFeatureAccess = (featureKey: string, showToast = true): boolean => {
    const result = hasFeatureAccess(featureKey);
    return result.hasAccess;
  };

  const hasBenefit = (benefitKey: string): boolean => {
    const result = hasBenefitAccess(benefitKey);
    return result.hasAccess;
  };

  const isTrialing = (): boolean => {
    return subscription?.status === 'trialing';
  };

  const getPlanBadgeInfo = () => {
    if (!subscription?.plan) {
      return { label: 'Sem Plano', variant: 'outline' as const };
    }

    const planLabels = {
      basic: { label: 'Básico', variant: 'outline' as const },
      premium: { label: 'Premium', variant: 'default' as const },
      enterprise: { label: 'Enterprise', variant: 'secondary' as const }
    };

    return planLabels[subscription.plan.type] || { label: 'Básico', variant: 'outline' as const };
  };

  const getFeatureDisplayInfo = (featureKey: string) => {
    const benefit = benefits.find(b => b.benefit?.benefit_key === featureKey);
    return {
      name: benefit?.benefit?.name || featureKey,
      isEnabled: benefit?.is_enabled || false
    };
  };

  return {
    // Funções específicas (nova interface)
    hasFeatureAccess,
    hasBenefitAccess,
    checkProductLimit,
    checkImageLimit,
    checkVariationLimit,
    checkAIUsage,
    
    // Propriedades de compatibilidade (interface antiga)
    checkFeatureAccess,
    hasBenefit,
    subscription,
    isTrialing,
    isSuperadmin: false,
    getPlanBadgeInfo,
    getFeatureDisplayInfo,
    loading
  };
};
