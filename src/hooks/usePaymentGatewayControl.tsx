
import { usePlanPermissions } from './usePlanPermissions';
import { useState } from 'react';
import { toast } from 'sonner';

export const usePaymentGatewayControl = () => {
  const { checkFeatureAccess, getFeatureDisplayInfo } = usePlanPermissions();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const canUseCreditCard = (): boolean => {
    const hasAccess = checkFeatureAccess('payment_credit_card', false);
    
    if (!hasAccess) {
      toast.error('Pagamento com cartão disponível apenas no plano Premium');
      setShowUpgradeModal(true);
      return false;
    }
    
    return true;
  };

  const canUsePix = (): boolean => {
    // PIX está disponível em todos os planos
    return checkFeatureAccess('payment_pix', false);
  };

  const getAvailablePaymentMethods = () => {
    const methods = [];
    
    if (canUsePix()) {
      methods.push('pix');
    }
    
    if (checkFeatureAccess('payment_credit_card', false)) {
      methods.push('credit_card');
    }
    
    return methods;
  };

  const validatePaymentMethod = (method: string): boolean => {
    switch (method) {
      case 'pix':
        return canUsePix();
      case 'credit_card':
        return canUseCreditCard();
      default:
        return false;
    }
  };

  const getPaymentLimitInfo = () => {
    return {
      pixFeature: getFeatureDisplayInfo('payment_pix'),
      creditCardFeature: getFeatureDisplayInfo('payment_credit_card'),
      showUpgradeModal,
      setShowUpgradeModal
    };
  };

  return {
    canUseCreditCard,
    canUsePix,
    getAvailablePaymentMethods,
    validatePaymentMethod,
    getPaymentLimitInfo,
    showUpgradeModal,
    setShowUpgradeModal
  };
};
