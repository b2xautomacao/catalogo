
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Smartphone, CreditCard, FileText, MapPin, Truck } from 'lucide-react';
import { CheckoutProvider, useCheckoutContext } from './checkout/context/CheckoutProvider';
import CheckoutConfiguration from './checkout/components/CheckoutConfiguration';
import CheckoutContent from './checkout/components/CheckoutContent';
import OrderSummary from './checkout/OrderSummary';
import MercadoPagoPayment from './checkout/MercadoPagoPayment';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings: any;
  storeId?: string;
}

const CheckoutModalContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    availableOptions,
    catalogLoading,
    currentStep,
    setCurrentStep,
    createdOrder,
    customerData,
    cartItems,
    totalAmount,
    shippingCost,
    paymentMethod,
    isWhatsappOnly,
    checkoutType,
    isCreatingOrder,
    settings,
    clearCart,
    toast
  } = useCheckoutContext();

  // Aguardar carregamento das configurações do catálogo antes de renderizar
  if (catalogLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-gray-600">Carregando configurações do catálogo...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Renderizar modal de configuração se não houver opções disponíveis
  if (availableOptions.length === 0) {
    return <CheckoutConfiguration isOpen={true} onClose={onClose} />;
  }

  // Verificar se está em ambiente de teste
  const isTestEnvironment = React.useMemo(() => {
    const paymentMethods = settings?.payment_methods;
    const accessToken = paymentMethods?.mercadopago_access_token || '';
    const publicKey = paymentMethods?.mercadopago_public_key || '';
    return accessToken.startsWith('TEST-') || publicKey.startsWith('TEST-');
  }, [settings]);

  const handlePaymentSuccess = () => {
    toast({
      title: "✅ Pagamento processado!",
      description: `Pedido #${createdOrder?.id.slice(-8)} foi processado com sucesso.`,
      duration: 5000,
    });
    
    clearCart();
    onClose();
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "❌ Erro no pagamento",
      description: error,
      variant: "destructive",
      duration: 7000,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 px-6 py-4 border-b bg-gradient-to-r from-primary to-accent">
          <DialogTitle className="text-2xl font-bold text-white text-center flex items-center justify-center gap-3">
            {currentStep === 'checkout' ? '🛒 Finalizar Pedido' : '💳 Pagamento'}
            {isTestEnvironment && checkoutType === 'online_payment' && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 font-bold">
                🧪 TESTE
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {currentStep === 'checkout' ? (
            <div className="h-full lg:grid lg:grid-cols-3 lg:gap-0">
              <CheckoutContent />

              {/* Summary só aparece para premium+online */}
              {!isWhatsappOnly && checkoutType === 'online_payment' && (
                <div className="hidden lg:block border-l bg-gray-50">
                  <OrderSummary
                    items={cartItems}
                    totalAmount={totalAmount}
                    shippingCost={shippingCost}
                    finalTotal={totalAmount + shippingCost}
                    isProcessing={isCreatingOrder}
                    isDisabled={isCreatingOrder || !customerData.name || !customerData.phone}
                    onSubmit={() => {}} // será chamado pelo contexto
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <ScrollArea className="h-full w-full">
                <div className="max-w-lg mx-auto">
                  <MercadoPagoPayment
                    items={cartItems}
                    totalAmount={totalAmount + shippingCost}
                    customerData={customerData}
                    paymentMethod={paymentMethod as 'pix' | 'credit_card' | 'bank_slip'}
                    orderId={createdOrder?.id}
                    storeId={undefined}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                  
                  <div className="mt-6 text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep('checkout')}
                      className="mr-3"
                    >
                      ← Voltar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={onClose}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Footer mobile apenas para checkout premium/online */}
        {currentStep === 'checkout' && !isWhatsappOnly && checkoutType === 'online_payment' && (
          <div className="lg:hidden shrink-0 bg-white border-t p-4">
            <div className="space-y-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="text-primary">R$ {(totalAmount + shippingCost).toFixed(2)}</span>
              </div>
              
              <Button
                onClick={() => {}} // será chamado pelo contexto
                disabled={isCreatingOrder || !customerData.name || !customerData.phone}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg transition-all"
                size="lg"
              >
                {isCreatingOrder ? 'Processando...' : 'Continuar para Pagamento'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, storeSettings, storeId }) => {
  if (!isOpen) return null;

  return (
    <CheckoutProvider storeSettings={storeSettings} storeId={storeId}>
      <CheckoutModalContent onClose={onClose} />
    </CheckoutProvider>
  );
};

export default CheckoutModal;
