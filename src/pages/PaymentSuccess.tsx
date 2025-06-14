
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Clock, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [orderData, setOrderData] = useState<any>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  
  // Extrair parâmetros da URL
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');
  const collectionStatus = searchParams.get('collection_status');
  const preferenceId = searchParams.get('preference_id');

  // Buscar configurações para obter access token
  const { settings } = useCatalogSettings();

  useEffect(() => {
    console.log('PaymentSuccess: Parâmetros recebidos:', {
      paymentId,
      status,
      externalReference,
      collectionStatus,
      preferenceId
    });

    if (externalReference) {
      loadOrderData();
    }
  }, [externalReference]);

  useEffect(() => {
    if (paymentId && orderData && settings?.payment_methods?.mercadopago_access_token) {
      verifyPaymentStatus();
    }
  }, [paymentId, orderData, settings]);

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
      console.log('PaymentSuccess: Pedido carregado:', order);
    } catch (error) {
      console.error('PaymentSuccess: Erro ao carregar pedido:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do pedido.",
        variant: "destructive"
      });
    }
  };

  const verifyPaymentStatus = async () => {
    if (!paymentId || !orderData || !settings?.payment_methods?.mercadopago_access_token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('PaymentSuccess: Verificando status do pagamento...');

      const { data, error } = await supabase.functions.invoke('mercadopago-verify-payment', {
        body: {
          payment_id: paymentId,
          order_id: orderData.id,
          access_token: settings.payment_methods.mercadopago_access_token
        }
      });

      if (error) throw error;

      setPaymentStatus(data.payment_status);
      console.log('PaymentSuccess: Status verificado:', data.payment_status);

      // Mostrar toast baseado no status
      if (data.payment_status === 'approved') {
        toast({
          title: "✅ Pagamento Confirmado!",
          description: `Pedido #${orderData.id.slice(-8)} foi pago com sucesso.`,
          duration: 5000
        });
      } else if (data.payment_status === 'pending') {
        toast({
          title: "⏳ Pagamento Pendente",
          description: "Aguardando confirmação do pagamento.",
          duration: 5000
        });
      } else if (data.payment_status === 'rejected') {
        toast({
          title: "❌ Pagamento Rejeitado",
          description: "O pagamento foi rejeitado. Entre em contato conosco.",
          variant: "destructive",
          duration: 7000
        });
      }

    } catch (error) {
      console.error('PaymentSuccess: Erro ao verificar status:', error);
      
      // Tentar novamente até 3 vezes
      if (verificationAttempts < 2) {
        setVerificationAttempts(prev => prev + 1);
        setTimeout(() => verifyPaymentStatus(), 2000);
        return;
      }

      toast({
        title: "Erro na Verificação",
        description: "Não foi possível verificar o status do pagamento. Tente atualizar a página.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'approved':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      case 'rejected':
        return <AlertCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Clock className="h-16 w-16 text-blue-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'approved':
        return {
          title: 'Pagamento Confirmado!',
          message: 'Seu pedido foi pago com sucesso e será processado em breve.',
          variant: 'success' as const
        };
      case 'pending':
        return {
          title: 'Pagamento Pendente',
          message: 'Aguardando confirmação do seu pagamento. Isso pode levar alguns minutos.',
          variant: 'warning' as const
        };
      case 'rejected':
        return {
          title: 'Pagamento Rejeitado',
          message: 'Infelizmente seu pagamento foi rejeitado. Entre em contato conosco para mais informações.',
          variant: 'destructive' as const
        };
      default:
        return {
          title: 'Verificando Pagamento...',
          message: 'Aguarde enquanto verificamos o status do seu pagamento.',
          variant: 'default' as const
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl">{statusInfo.title}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            {statusInfo.message}
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
              {paymentStatus && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <Badge 
                    variant={
                      paymentStatus === 'approved' ? 'default' :
                      paymentStatus === 'pending' ? 'secondary' : 'destructive'
                    }
                  >
                    {paymentStatus === 'approved' ? 'Pago' :
                     paymentStatus === 'pending' ? 'Pendente' : 'Rejeitado'}
                  </Badge>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            {paymentStatus === 'pending' && (
              <Button onClick={verifyPaymentStatus} disabled={loading}>
                {loading ? 'Verificando...' : 'Verificar Status Novamente'}
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Catálogo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
