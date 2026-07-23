
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCheckoutContext } from '../context/CheckoutProvider';

interface CheckoutConfigurationProps {
  isOpen: boolean;
  onClose: () => void;
}

const CheckoutConfiguration: React.FC<CheckoutConfigurationProps> = ({ isOpen, onClose }) => {
  const { availableOptions, canUseOnlinePayment, hasWhatsAppConfigured, settings, currentStore } = useCheckoutContext();

  console.log('CheckoutConfiguration - Debug valores:', {
    'currentStore?.phone': currentStore?.phone,
    'settings.whatsapp_number': settings?.whatsapp_number,
    'hasWhatsAppConfigured': hasWhatsAppConfigured,
    'availableOptions.length': availableOptions.length,
    'canUseOnlinePayment': canUseOnlinePayment
  });

  // Verificar se deve mostrar apenas WhatsApp (basic) - usar mesma lógica do useCheckoutOptions
  const showWhatsAppSuggestion = React.useMemo(() => {
    const basicPhoneNumber = currentStore?.phone?.trim();
    const premiumWhatsAppNumber = settings?.whatsapp_number?.trim();
    const hasAnyWhatsAppNumber = !!(basicPhoneNumber || premiumWhatsAppNumber);
    
    return (
      availableOptions.length === 0 &&
      !canUseOnlinePayment &&
      !hasAnyWhatsAppNumber
    );
  }, [availableOptions, canUseOnlinePayment, currentStore?.phone, settings?.whatsapp_number]);

  const showPaymentSuggestion = React.useMemo(() => {
    const pm = settings?.payment_methods || {};
    return (
      availableOptions.length === 0 &&
      canUseOnlinePayment &&
      (!pm.pix && !pm.credit_card && !pm.bank_slip)
    );
  }, [availableOptions, canUseOnlinePayment, settings?.payment_methods]);

  console.log('CheckoutConfiguration - Condições:', {
    showWhatsAppSuggestion,
    showPaymentSuggestion
  });

  if (availableOptions.length > 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configuração Necessária</DialogTitle>
        </DialogHeader>
        <div className="text-center py-6">
          {/* WhatsApp não configurado */}
          {showWhatsAppSuggestion && (
            <>
              <p className="text-gray-600 mb-2">
                Para receber pedidos pelo Plano Básico, configure um número de WhatsApp.
              </p>
              <a
                href="/settings?tab=store-info"
                target="_blank"
                className="text-blue-600 underline font-medium"
              >
                 Ir para Dados da Loja
              </a>
              <div className="mt-4">
                <Button onClick={onClose}>Fechar</Button>
              </div>
            </>
          )}
          {/* Métodos de pagamento não configurados no Premium */}
          {showPaymentSuggestion && (
            <>
              <p className="text-gray-600 mb-2">
                Você possui plano Premium, mas ainda não configurou nenhum método de pagamento online.
              </p>
              <a
                href="/settings?tab=payments"
                target="_blank"
                className="text-blue-600 underline font-medium"
              >
                 Configurar pagamentos online
              </a>
              <div className="mt-4">
                <Button onClick={onClose}>Fechar</Button>
              </div>
            </>
          )}
          {/* Fallback padrão */}
          {!showWhatsAppSuggestion && !showPaymentSuggestion && (
            <>
              <p className="text-gray-600 mb-4">
                Esta loja ainda não configurou métodos de finalização de pedido. Entre em contato diretamente com a loja para fazer seu pedido.
              </p>
              <Button onClick={onClose}>Fechar</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutConfiguration;
