
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Smartphone, FileText, ExternalLink } from 'lucide-react';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { useToast } from '@/hooks/use-toast';
import PixPaymentModal from './PixPaymentModal';

interface CartItem {
  product: { id: string; name: string };
  quantity: number;
  price: number;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
}

interface MercadoPagoPaymentProps {
  items: CartItem[];
  totalAmount: number;
  customerData: CustomerData;
  paymentMethod: 'pix' | 'credit_card' | 'bank_slip';
  orderId?: string;
  onPaymentStarted?: (preferenceId: string) => void;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

const MercadoPagoPayment: React.FC<MercadoPagoPaymentProps> = ({
  items,
  totalAmount,
  customerData,
  paymentMethod,
  orderId,
  onPaymentStarted,
  onPaymentSuccess,
  onPaymentError
}) => {
  const { createPixPayment, createCardPayment, createBankSlipPayment, loading, error, hasCredentials } = useMercadoPago();
  const { toast } = useToast();
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [showPixModal, setShowPixModal] = useState(false);

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  const prepareCheckoutData = () => {
    const baseUrl = window.location.origin;
    
    return {
      items: items.map(item => ({
        id: item.product.id,
        title: item.product.name,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: 'BRL'
      })),
      payer: {
        name: customerData.name,
        email: customerData.email,
        phone: formatPhoneNumber(customerData.phone)
      },
      back_urls: {
        success: `${baseUrl}/payment-success`,
        failure: `${baseUrl}/payment-failure`,
        pending: `${baseUrl}/payment-pending`
      },
      auto_return: 'approved',
      external_reference: orderId || `ORDER_${Date.now()}`,
      notification_url: `${baseUrl}/api/mercadopago-webhook`
    };
  };

  const handlePayment = async () => {
    // Verificar se as credenciais estão configuradas
    if (!hasCredentials) {
      toast({
        title: "❌ Credenciais não configuradas",
        description: "Configure o Access Token e Public Key do Mercado Pago nas configurações de pagamento.",
        variant: "destructive",
        duration: 7000,
      });
      onPaymentError?.('Credenciais do Mercado Pago não configuradas');
      return;
    }

    try {
      const checkoutData = prepareCheckoutData();
      let result = null;

      switch (paymentMethod) {
        case 'pix':
          result = await createPixPayment(checkoutData);
          if (result) {
            setPaymentResult(result);
            onPaymentStarted?.(result.preference_id);
            setShowPixModal(true);
          }
          break;
        case 'credit_card':
          result = await createCardPayment(checkoutData);
          if (result) {
            setPaymentResult(result);
            onPaymentStarted?.(result.preference_id);
            
            toast({
              title: "🚀 Redirecionando para pagamento",
              description: "Você será redirecionado para o Mercado Pago em uma nova aba.",
              duration: 3000,
            });

            window.open(result.init_point, '_blank');
            
            setTimeout(() => {
              onPaymentSuccess?.();
            }, 2000);
          }
          break;
        case 'bank_slip':
          result = await createBankSlipPayment(checkoutData);
          if (result) {
            setPaymentResult(result);
            onPaymentStarted?.(result.preference_id);
            
            toast({
              title: "🚀 Redirecionando para pagamento",
              description: "Você será redirecionado para o Mercado Pago em uma nova aba.",
              duration: 3000,
            });

            window.open(result.init_point, '_blank');
            
            setTimeout(() => {
              onPaymentSuccess?.();
            }, 2000);
          }
          break;
        default:
          throw new Error('Método de pagamento não suportado');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pagamento';
      toast({
        title: "❌ Erro no pagamento",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      onPaymentError?.(errorMessage);
    }
  };

  const handlePixPaymentConfirmed = () => {
    setShowPixModal(false);
    toast({
      title: "✅ Pagamento confirmado!",
      description: `Pedido #${orderId?.slice(-8)} confirmado via PIX.`,
      duration: 5000,
    });
    onPaymentSuccess?.();
  };

  const getPaymentMethodInfo = () => {
    switch (paymentMethod) {
      case 'pix':
        return {
          name: 'PIX',
          icon: Smartphone,
          description: 'Pagamento instantâneo via PIX',
          color: 'bg-green-50 text-green-700 border-green-200'
        };
      case 'credit_card':
        return {
          name: 'Cartão de Crédito',
          icon: CreditCard,
          description: 'Parcelamento em até 12x',
          color: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'bank_slip':
        return {
          name: 'Boleto Bancário',
          icon: FileText,
          description: 'Vencimento em 3 dias úteis',
          color: 'bg-orange-50 text-orange-700 border-orange-200'
        };
      default:
        return {
          name: 'Mercado Pago',
          icon: CreditCard,
          description: 'Pagamento seguro',
          color: 'bg-gray-50 text-gray-700 border-gray-200'
        };
    }
  };

  const methodInfo = getPaymentMethodInfo();
  const IconComponent = methodInfo.icon;

  // Mostrar erro se não há credenciais
  if (!hasCredentials) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-800">
              Configuração Necessária
            </h3>
            <p className="text-red-700">
              As credenciais do Mercado Pago não foram configuradas.
              Acesse as configurações de pagamento para configurar o Access Token e Public Key.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paymentResult && paymentMethod !== 'pix') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <ExternalLink className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800">
              Redirecionamento realizado!
            </h3>
            <p className="text-green-700">
              Uma nova aba foi aberta com o pagamento do Mercado Pago.
              Complete o pagamento na nova janela.
            </p>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              ID: {paymentResult.preference_id}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent className="w-5 h-5" />
            Pagar com {methodInfo.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-lg border-2 ${methodInfo.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{methodInfo.name}</h4>
                <p className="text-sm opacity-75">{methodInfo.description}</p>
              </div>
              <IconComponent className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>R$ {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span className="text-primary">R$ {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {paymentMethod === 'pix' ? (
                  <Smartphone className="mr-2 h-4 w-4" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Pagar R$ {totalAmount.toFixed(2)}
              </>
            )}
          </Button>

          <p className="text-xs text-gray-600 text-center">
            {paymentMethod === 'pix' 
              ? 'Você receberá o QR Code para pagamento via PIX'
              : 'Você será redirecionado para o ambiente seguro do Mercado Pago'
            }
          </p>
        </CardContent>
      </Card>

      {/* Modal PIX */}
      <PixPaymentModal
        isOpen={showPixModal}
        onClose={() => setShowPixModal(false)}
        orderId={orderId || ''}
        amount={totalAmount}
        onPaymentConfirmed={handlePixPaymentConfirmed}
      />
    </>
  );
};

export default MercadoPagoPayment;
