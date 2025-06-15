
import { useBenefitValidation } from './useBenefitValidation';
import { useSubscription } from './useSubscription';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const usePlanPermissions = () => {
  const { subscription, hasFeature, canUseFeature, getFeatureLimit, isTrialing } = useSubscription();
  const { 
    validateBenefitAccess, 
    hasBenefit, 
    getBenefitLimit, 
    getBenefitInfo 
  } = useBenefitValidation();
  const { profile } = useAuth();

  // Para superadmin, sempre retornar true (acesso total)
  const isSuperadmin = profile?.role === 'superadmin';

  // Verificação principal de acesso a funcionalidades
  const checkFeatureAccess = (featureType: string, showUpgradeMessage = true): boolean => {
    // Superadmin tem acesso total
    if (isSuperadmin) return true;

    // Mapear feature para benefit_key
    const benefitKey = mapFeatureToBenefit(featureType);
    
    if (benefitKey) {
      const hasAccess = hasBenefit(benefitKey);
      
      if (!hasAccess && showUpgradeMessage) {
        const planName = subscription?.plan.type === 'basic' ? 'Premium' : 'Enterprise';
        toast.error(`Esta funcionalidade está disponível apenas no plano ${planName}. Faça upgrade para ter acesso!`);
      }
      
      return hasAccess;
    }
    
    // Se não tem mapeamento, bloquear por padrão (segurança)
    if (showUpgradeMessage) {
      toast.error('Esta funcionalidade requer um plano premium. Entre em contato para mais informações.');
    }
    return false;
  };

  const checkFeatureUsage = (featureType: string, currentUsage?: number, showLimitMessage = true): boolean => {
    // Superadmin tem uso ilimitado
    if (isSuperadmin) return true;

    const canUse = canUseFeature(featureType, currentUsage);
    
    if (!canUse && showLimitMessage) {
      const limit = getFeatureLimit(featureType);
      if (limit > 0) {
        toast.error(`Você atingiu o limite de ${limit} para esta funcionalidade. Faça upgrade para aumentar o limite!`);
      }
    }
    
    return canUse;
  };

  const getFeatureDisplayInfo = (featureType: string) => {
    // Tentar primeiro o novo sistema
    const benefitKey = mapFeatureToBenefit(featureType);
    if (benefitKey) {
      const benefitInfo = getBenefitInfo(benefitKey);
      if (benefitInfo) {
        return benefitInfo.name;
      }
    }

    // Fallback para nomes manuais
    const featureNames: Record<string, string> = {
      'max_images_per_product': 'Imagens por Produto',
      'max_team_members': 'Membros da Equipe',
      'whatsapp_integration': 'Integração WhatsApp',
      'payment_pix': 'Pagamento PIX',
      'payment_credit_card': 'Pagamento Cartão',
      'custom_domain': 'Domínio Personalizado',
      'api_access': 'Acesso à API',
      'ai_agent': 'Agente de IA',
      'discount_coupons': 'Cupons de Desconto',
      'abandoned_cart_recovery': 'Recuperação de Carrinho',
      'multi_variations': 'Múltiplas Variações',
      'shipping_calculator': 'Calculadora de Frete',
      'dedicated_support': 'Suporte Dedicado',
      'team_management': 'Gestão de Equipe'
    };

    return featureNames[featureType] || featureType;
  };

  const getPlanBadgeInfo = () => {
    if (!subscription) return { label: 'Carregando...', variant: 'secondary' as const };

    const planLabels = {
      basic: 'Básico',
      premium: 'Premium',
      enterprise: 'Enterprise'
    };

    const statusLabels = {
      active: 'Ativo',
      trialing: 'Trial',
      inactive: 'Inativo',
      canceled: 'Cancelado',
      past_due: 'Vencido'
    };

    const variants = {
      active: 'default' as const,
      trialing: 'secondary' as const,
      inactive: 'outline' as const,
      canceled: 'destructive' as const,
      past_due: 'destructive' as const
    };

    const planName = planLabels[subscription.plan.type] || subscription.plan.type;
    const statusName = statusLabels[subscription.status] || subscription.status;

    return {
      label: `${planName} (${statusName})`,
      variant: variants[subscription.status] || 'secondary'
    };
  };

  // Novo método para validar benefícios
  const checkBenefitAccess = async (benefitKey: string, showUpgradeMessage = true): Promise<boolean> => {
    // Superadmin tem acesso total
    if (isSuperadmin) return true;
    
    return await validateBenefitAccess(benefitKey, showUpgradeMessage);
  };

  return {
    subscription,
    checkFeatureAccess,
    checkFeatureUsage,
    getFeatureDisplayInfo,
    getPlanBadgeInfo,
    hasFeature: isSuperadmin ? () => true : hasFeature,
    canUseFeature: isSuperadmin ? () => true : canUseFeature,
    isTrialing,
    // Novos métodos para benefícios
    checkBenefitAccess,
    hasBenefit: isSuperadmin ? () => true : hasBenefit,
    getBenefitLimit: isSuperadmin ? () => 'unlimited' : getBenefitLimit,
    getBenefitInfo: isSuperadmin ? (key: string) => ({ name: 'Ilimitado', hasAccess: true }) : getBenefitInfo,
    isSuperadmin
  };
};

// Mapear features antigas para benefit_keys
const mapFeatureToBenefit = (featureType: string): string | null => {
  const mapping: Record<string, string> = {
    'ai_agent': 'ai_agent',
    'max_images_per_product': 'max_images_per_product',
    'max_team_members': 'max_team_members',
    'whatsapp_integration': 'whatsapp_integration',
    'payment_pix': 'payment_pix',
    'payment_credit_card': 'payment_credit_card',
    'custom_domain': 'custom_domain',
    'api_access': 'api_access',
    'discount_coupons': 'discount_coupons',
    'abandoned_cart_recovery': 'abandoned_cart_recovery',
    'multi_variations': 'multi_variations',
    'shipping_calculator': 'shipping_calculator',
    'dedicated_support': 'dedicated_support',
    'team_management': 'team_management'
  };

  return mapping[featureType] || null;
};
