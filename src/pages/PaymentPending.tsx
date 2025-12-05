
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';

const PaymentPending = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const externalReference = searchParams.get('external_reference');
  const paymentId = searchParams.get('payment_id');
  const { settings } = useCatalogSettings();

  useEffect(() => {
    if (externalReference) {
      loadOrderData();
    }
  }, [externalReference]);

  const loadOrderData = async () => {
    if (!externalReference) return;

    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', externalReference)
        .single();

      if (error) throw error;
      setOrderData(order);
    } catch (error) {
      console.error('PaymentPending: Erro ao carregar pedido:', error);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentId || !orderData || !settings?.payment_methods?.mercadopago_access_token) {
      toast({
        title: "Erro",
        description: "Não foi possível verificar o status do pagamento.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('mercadopago-verify-payment', {
        body: {
          payment_id: paymentId,
          order_id: orderData.id,
          access_token: settings.payment_methods.mercadopago_access_token
        }
      });

      if (error) throw error;

      if (data.payment_status === 'approved') {
        toast({
          title: "✅ Pagamento Confirmado!",
          description: "Seu pagamento foi aprovado com sucesso!",
          duration: 5000
        });
        navigate(`/payment-success?${searchParams.toString()}`);
      } else if (data.payment_status === 'rejected') {
        toast({
          title: "❌ Pagamento Rejeitado",
          description: "Infelizmente seu pagamento foi rejeitado.",
          variant: "destructive"
        });
        navigate(`/payment-failure?${searchParams.toString()}`);
      } else {
        toast({
          title: "⏳ Ainda Pendente",
          description: "Seu pagamento ainda está sendo processado.",
        });
      }

    } catch (error) {
      console.error('PaymentPending: Erro ao verificar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar o status do pagamento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Clock className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl text-yellow-600">Pagamento Pendente</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            Seu pagamento está sendo processado. Isso pode levar alguns minutos para ser confirmado.
          </p>

          {orderData && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Pedido:</span>
                <span>#{orderData.id.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total:</span>
                <span>R$ {orderData.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className="text-yellow-600">Aguardando Pagamento</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">O que acontece agora?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Para PIX: O pagamento é aprovado em segundos</li>
              <li>• Para cartão: Pode levar alguns minutos</li>
              <li>• Para boleto: Aprovação em até 3 dias úteis</li>
              <li>• Você receberá uma confirmação por email</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={checkPaymentStatus} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Verificando...' : 'Verificar Status'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 pt-4">
            <p>Mantenha esta página aberta ou salve o link para acompanhar seu pedido.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPending;
