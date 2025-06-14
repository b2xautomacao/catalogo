
import React, { useState, useEffect } from 'react';
import { Truck, MapPin, CreditCard, Smartphone, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useOrders } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import CustomerDataForm from './checkout/CustomerDataForm';
import ShippingMethodCard from './checkout/ShippingMethodCard';
import ShippingAddressForm from './checkout/ShippingAddressForm';
import ShippingOptionsCard from './checkout/ShippingOptionsCard';
import PaymentMethodCard from './checkout/PaymentMethodCard';
import OrderSummary from './checkout/OrderSummary';
import MercadoPagoPayment from './checkout/MercadoPagoPayment';
import TestEnvironmentInfo from './checkout/TestEnvironmentInfo';
import { generateWhatsAppMessage } from './checkout/checkoutUtils';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings: any;
  storeId?: string;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, storeSettings, storeId }) => {
  const { items, totalAmount, clearCart } = useCart();
  const { createOrderAsync, isCreatingOrder } = useOrders();
  const { settings: catalogSettings, loading: catalogLoading } = useCatalogSettings(storeId);
  const { toast } = useToast();
  
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [shippingMethod, setShippingMethod] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [shippingAddress, setShippingAddress] = useState({
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });
  
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState('');
  const [currentStep, setCurrentStep] = useState<'checkout' | 'payment'>('checkout');
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);

  // SEMPRE usar catalogSettings como prioridade, fallback para storeSettings apenas se não houver catalogSettings
  const effectiveSettings = catalogSettings || storeSettings;

  // Log para debug das credenciais
  console.log('CheckoutModal Debug:', {
    catalogSettings: catalogSettings?.payment_methods,
    storeSettings: storeSettings?.payment_methods,
    effectiveSettings: effectiveSettings?.payment_methods,
    catalogLoading
  });

  // Verificar credenciais do Mercado Pago - SEMPRE usar catalogSettings primeiro
  const hasMercadoPagoCredentials = React.useMemo(() => {
    if (catalogLoading || !effectiveSettings) {
      console.log('CheckoutModal: Ainda carregando configurações...');
      return false;
    }

    const paymentMethods = effectiveSettings?.payment_methods;
    const hasCredentials = !!(paymentMethods?.mercadopago_access_token?.trim() && paymentMethods?.mercadopago_public_key?.trim());
    
    console.log('CheckoutModal: Verificação de credenciais MP:', {
      accessToken: paymentMethods?.mercadopago_access_token ? 'presente' : 'ausente',
      publicKey: paymentMethods?.mercadopago_public_key ? 'presente' : 'ausente',
      hasCredentials
    });
    
    return hasCredentials;
  }, [effectiveSettings, catalogLoading]);

  // Verificar se está em ambiente de teste
  const isTestEnvironment = React.useMemo(() => {
    const paymentMethods = effectiveSettings?.payment_methods;
    const accessToken = paymentMethods?.mercadopago_access_token || '';
    const publicKey = paymentMethods?.mercadopago_public_key || '';
    return accessToken.startsWith('TEST-') || publicKey.startsWith('TEST-');
  }, [effectiveSettings]);

  const availablePaymentMethods = React.useMemo(() => {
    if (!hasMercadoPagoCredentials) {
      console.log('CheckoutModal: Sem credenciais MP, nenhum método disponível');
      return [];
    }

    const methods = [];
    if (effectiveSettings?.payment_methods?.pix) {
      methods.push({ 
        id: 'pix', 
        name: 'PIX', 
        icon: Smartphone,
        description: 'Pagamento instantâneo'
      });
    }
    if (effectiveSettings?.payment_methods?.credit_card) {
      methods.push({ 
        id: 'credit_card', 
        name: 'Cartão de Crédito', 
        icon: CreditCard,
        description: 'Parcelamento em até 12x'
      });
    }
    if (effectiveSettings?.payment_methods?.bank_slip) {
      methods.push({ 
        id: 'bank_slip', 
        name: 'Boleto Bancário', 
        icon: FileText,
        description: 'Vencimento em 3 dias úteis'
      });
    }
    
    console.log('CheckoutModal: Métodos de pagamento disponíveis:', methods.length);
    return methods;
  }, [effectiveSettings, hasMercadoPagoCredentials]);

  const availableShippingMethods = React.useMemo(() => {
    const methods = [];
    if (effectiveSettings?.shipping_options?.pickup) {
      methods.push({ 
        id: 'pickup', 
        name: 'Retirar na Loja', 
        cost: 0, 
        icon: MapPin 
      });
    }
    if (effectiveSettings?.shipping_options?.delivery) {
      methods.push({ 
        id: 'delivery', 
        name: 'Entrega Local', 
        cost: effectiveSettings.shipping_options.delivery_fee || 0, 
        icon: Truck 
      });
    }
    if (effectiveSettings?.shipping_options?.shipping) {
      methods.push({ 
        id: 'shipping', 
        name: 'Correios', 
        cost: 0, 
        icon: Truck 
      });
    }
    return methods;
  }, [effectiveSettings]);

  useEffect(() => {
    if (availablePaymentMethods.length > 0) {
      setPaymentMethod(availablePaymentMethods[0].id);
    }
    if (availableShippingMethods.length > 0) {
      setShippingMethod(availableShippingMethods[0].id);
    }
  }, [availablePaymentMethods, availableShippingMethods]);

  const finalTotal = totalAmount + shippingCost;

  const handleShippingCalculated = (options: any[]) => {
    setShippingOptions(options);
    
    // Auto-selecionar primeira opção se não houver seleção
    if (options.length > 0 && !shippingMethod) {
      setShippingMethod(options[0].id);
      setShippingCost(options[0].price);
    }
  };

  const handleShippingMethodChange = (methodId: string) => {
    setShippingMethod(methodId);
    const selectedOption = shippingOptions.find(opt => opt.id === methodId);
    if (selectedOption) {
      // Verificar se é frete grátis
      const freeDeliveryAmount = effectiveSettings?.shipping_options?.free_delivery_amount || 0;
      const isFreeDelivery = freeDeliveryAmount > 0 && 
                           totalAmount >= freeDeliveryAmount && 
                           methodId === 'delivery';
      
      setShippingCost(isFreeDelivery ? 0 : selectedOption.price);
    }
  };

  const handleCreateOrder = async () => {
    console.log('CheckoutModal: Iniciando criação do pedido...');
    
    try {
      if (!customerData.name.trim()) {
        toast({
          title: "Nome obrigatório",
          description: "Por favor, informe seu nome.",
          variant: "destructive"
        });
        return;
      }

      if (!customerData.phone.trim()) {
        toast({
          title: "Telefone obrigatório",
          description: "Por favor, informe seu telefone.",
          variant: "destructive"
        });
        return;
      }

      if (items.length === 0) {
        toast({
          title: "Carrinho vazio",
          description: "Adicione produtos ao carrinho antes de finalizar.",
          variant: "destructive"
        });
        return;
      }

      const orderData = {
        customer_name: customerData.name.trim(),
        customer_email: customerData.email.trim() || undefined,
        customer_phone: customerData.phone.trim(),
        status: 'pending' as const,
        order_type: items[0]?.catalogType || 'retail' as const,
        total_amount: finalTotal,
        items: items.map(item => ({
          id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          variation: item.variations ? `${item.variations.size || ''} ${item.variations.color || ''}`.trim() : undefined
        })),
        shipping_address: shippingMethod !== 'pickup' ? {
          street: shippingAddress.street,
          number: shippingAddress.number,
          district: shippingAddress.neighborhood,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip_code: shippingAddress.zipCode
        } : undefined,
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        shipping_cost: shippingCost,
        notes: notes.trim() || undefined,
        store_id: storeId
      };

      console.log('CheckoutModal: Dados do pedido preparados:', orderData);

      toast({
        title: "Criando pedido...",
        description: "Aguarde enquanto criamos seu pedido.",
      });

      const savedOrder = await createOrderAsync(orderData);
      console.log('CheckoutModal: Pedido criado com sucesso:', savedOrder);
      
      setCreatedOrder(savedOrder);
      
      // Se for um método do Mercado Pago, ir para o pagamento
      if (['pix', 'credit_card', 'bank_slip'].includes(paymentMethod)) {
        setCurrentStep('payment');
      } else {
        // Para outros métodos, finalizar com WhatsApp
        handleWhatsAppCheckout(savedOrder);
      }

    } catch (error) {
      console.error('CheckoutModal: Erro ao criar pedido:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "❌ Erro ao criar pedido",
        description: `Não foi possível criar seu pedido: ${errorMessage}. Tente novamente.`,
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleWhatsAppCheckout = (order: any) => {
    const checkoutType = effectiveSettings?.checkout_type || 'both';
    
    if (checkoutType === 'whatsapp_only' || (checkoutType === 'both' && effectiveSettings?.whatsapp_number)) {
      const orderData = {
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        total_amount: finalTotal,
        items: items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price
        })),
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        notes: notes
      };
      
      const message = generateWhatsAppMessage(orderData);
      
      toast({
        title: "✅ Pedido criado com sucesso!",
        description: `Pedido #${order.id.slice(-8)} criado. Redirecionando para WhatsApp...`,
        duration: 5000,
      });

      setTimeout(() => {
        window.open(`https://wa.me/${effectiveSettings.whatsapp_number}?text=${encodeURIComponent(message)}`, '_blank');
      }, 1000);
    }

    clearCart();
    onClose();
  };

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

  // Aguardar carregamento das configurações do catálogo antes de renderizar
  if (catalogLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
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

  // Renderizar modal de configuração se não houver métodos disponíveis
  if (!hasMercadoPagoCredentials || (availablePaymentMethods.length === 0 || availableShippingMethods.length === 0)) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configuração Necessária</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">
              {!hasMercadoPagoCredentials 
                ? "As credenciais do Mercado Pago não foram configuradas. Acesse as configurações de pagamento para configurar o Access Token e Public Key."
                : "Esta loja ainda não configurou os métodos de pagamento e envio. Entre em contato diretamente com a loja para fazer seu pedido."
              }
            </p>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[98vw] h-[95vh] p-0 gap-0 flex flex-col overflow-auto">
        <DialogHeader className="shrink-0 px-6 py-4 border-b bg-gradient-to-r from-primary to-accent">
          <DialogTitle className="text-2xl font-bold text-white text-center flex items-center justify-center gap-3">
            {currentStep === 'checkout' ? 'Finalizar Pedido' : 'Pagamento'}
            {isTestEnvironment && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 font-bold">
                🧪 TESTE
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {currentStep === 'checkout' ? (
            <div className="h-full lg:grid lg:grid-cols-3 lg:gap-0">
              <div className="lg:col-span-2 h-full">
                <ScrollArea className="h-full w-full">
                  <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-6">
                    {/* Alerta de ambiente de teste */}
                    {isTestEnvironment && (
                      <TestEnvironmentInfo />
                    )}

                    <CustomerDataForm
                      customerData={customerData}
                      onDataChange={setCustomerData}
                    />

                    {/* Usar ShippingMethodCard apenas para opções básicas ou ShippingOptionsCard para opções calculadas */}
                    {shippingOptions.length === 0 ? (
                      <ShippingMethodCard
                        shippingMethods={availableShippingMethods}
                        selectedMethod={shippingMethod}
                        onMethodChange={setShippingMethod}
                      />
                    ) : (
                      <ShippingOptionsCard
                        options={shippingOptions}
                        selectedOption={shippingMethod}
                        onOptionChange={handleShippingMethodChange}
                        freeDeliveryAmount={effectiveSettings?.shipping_options?.free_delivery_amount}
                        cartTotal={totalAmount}
                      />
                    )}

                    {(shippingMethod === 'shipping' || shippingMethod === 'delivery') && (
                      <ShippingAddressForm
                        address={shippingAddress}
                        onAddressChange={setShippingAddress}
                        onCalculateShipping={() => {}}
                        onShippingCalculated={handleShippingCalculated}
                        storeSettings={effectiveSettings}
                      />
                    )}

                    <PaymentMethodCard
                      paymentMethods={availablePaymentMethods}
                      selectedMethod={paymentMethod}
                      onMethodChange={setPaymentMethod}
                    />

                    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Observações</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          placeholder="Observações sobre o pedido (opcional)"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </div>

              <div className="hidden lg:block border-l bg-gray-50">
                <OrderSummary
                  items={items}
                  totalAmount={totalAmount}
                  shippingCost={shippingCost}
                  finalTotal={finalTotal}
                  isProcessing={isCreatingOrder}
                  isDisabled={isCreatingOrder || !customerData.name || !customerData.phone}
                  onSubmit={handleCreateOrder}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <ScrollArea className="h-full w-full">
                <div className="max-w-lg mx-auto">
                  <MercadoPagoPayment
                    items={items}
                    totalAmount={finalTotal}
                    customerData={customerData}
                    paymentMethod={paymentMethod as 'pix' | 'credit_card' | 'bank_slip'}
                    orderId={createdOrder?.id}
                    storeId={storeId}
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

        {/* Footer mobile apenas para checkout */}
        {currentStep === 'checkout' && (
          <div className="lg:hidden shrink-0 bg-white border-t p-4">
            <div className="space-y-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="text-primary">R$ {finalTotal.toFixed(2)}</span>
              </div>
              
              <Button
                onClick={handleCreateOrder}
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

export default CheckoutModal;
