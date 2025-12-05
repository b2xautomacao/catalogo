
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<any>(null);
  
  const externalReference = searchParams.get('external_reference');
  const status = searchParams.get('status');
  const paymentId = searchParams.get('payment_id');

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
      console.error('PaymentFailure: Erro ao carregar pedido:', error);
    }
  };

  const handleTryAgain = () => {
    // Redirecionar de volta para o catálogo para tentar novamente
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-red-600">Pagamento Não Realizado</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            Infelizmente não foi possível processar seu pagamento. Isso pode ter acontecido por diversos motivos.
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
                <span className="text-red-600">Pagamento Falhou</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Possíveis causas:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Dados do cartão incorretos</li>
              <li>• Limite insuficiente</li>
              <li>• Problemas de conexão</li>
              <li>• Cancelamento pelo usuário</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={handleTryAgain} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
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
            <p>Precisa de ajuda? Entre em contato conosco.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFailure;
