
import { useMemo } from 'react';
import { usePlanPermissions } from './usePlanPermissions';
import { useCatalogSettings } from './useCatalogSettings';
import { useStores } from './useStores';

export interface CheckoutOption {
  type: 'whatsapp_only' | 'online_payment';
  name: string;
  description: string;
  available: boolean;
  requiresUpgrade?: boolean;
}

export const useCheckoutOptions = (storeId?: string) => {
  const { hasBenefit, isSuperadmin } = usePlanPermissions();
  const { settings } = useCatalogSettings(storeId);
  const { currentStore } = useStores();

  const checkoutOptions = useMemo((): CheckoutOption[] => {
    // Para plano básico, usar telefone da loja (stores.phone)
    // Para plano premium, usar whatsapp_number das configurações
    const basicWhatsAppNumber = currentStore?.phone?.trim();
    const premiumWhatsAppNumber = settings?.whatsapp_number?.trim();
    
    const hasWhatsAppNumber = !!basicWhatsAppNumber || !!premiumWhatsAppNumber;
    const hasPaymentAccess = isSuperadmin || hasBenefit('payment_credit_card');
    
    return [
      {
        type: 'whatsapp_only',
        name: 'Pedido via WhatsApp',
        description: 'Enviar resumo do pedido para WhatsApp da loja',
        available: hasWhatsAppNumber,
      },
      {
        type: 'online_payment',
        name: 'Pagamento Online',
        description: 'PIX, Cartão de Crédito e Boleto',
        available: hasPaymentAccess,
        requiresUpgrade: !hasPaymentAccess,
      }
    ];
  }, [settings, currentStore, hasBenefit, isSuperadmin]);

  const availableOptions = checkoutOptions.filter(option => option.available);
  const defaultOption = availableOptions[0]?.type || 'whatsapp_only';
  
  const canUseOnlinePayment = isSuperadmin || hasBenefit('payment_credit_card');
  
  // Verificar se tem WhatsApp configurado (telefone da loja OU integração premium)
  const hasWhatsAppConfigured = !!(currentStore?.phone?.trim() || settings?.whatsapp_number?.trim());

  return {
    checkoutOptions,
    availableOptions,
    defaultOption,
    canUseOnlinePayment,
    hasWhatsAppConfigured,
    isPremiumRequired: !canUseOnlinePayment
  };
};
