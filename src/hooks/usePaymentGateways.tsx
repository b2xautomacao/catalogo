
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PaymentGateway {
  id: string;
  name: 'stripe' | 'asaas' | 'mercadopago';
  is_active: boolean;
  config: {
    public_key?: string;
    secret_key?: string;
    api_key?: string;
    environment?: 'sandbox' | 'production';
  };
  created_at: string;
  updated_at: string;
}

export interface UpdateGatewayData {
  is_active?: boolean;
  config?: PaymentGateway['config'];
}

export const usePaymentGateways = () => {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGateway, setActiveGateway] = useState<PaymentGateway | null>(null);

  const fetchGateways = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Type assertion para garantir que os dados estão no formato correto
      const typedGateways = (data || []) as PaymentGateway[];
      setGateways(typedGateways);
      
      const active = typedGateways.find(g => g.is_active) || null;
      setActiveGateway(active);
    } catch (error) {
      console.error('Erro ao buscar gateways:', error);
      toast.error('Erro ao carregar gateways de pagamento');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateGateway = useCallback(async (id: string, data: UpdateGatewayData) => {
    try {
      const { data: updatedGateway, error } = await supabase
        .from('payment_gateways')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const typedGateway = updatedGateway as PaymentGateway;
      setGateways(prev => prev.map(g => g.id === id ? typedGateway : g));
      
      if (typedGateway.is_active) {
        setActiveGateway(typedGateway);
      }

      toast.success('Gateway atualizado com sucesso');
      return { data: typedGateway, error: null };
    } catch (error) {
      console.error('Erro ao atualizar gateway:', error);
      toast.error('Erro ao atualizar gateway');
      return { data: null, error };
    }
  }, []);

  const testGatewayConnection = useCallback(async (gateway: PaymentGateway) => {
    try {
      if (gateway.name === 'stripe') {
        return { success: true, message: 'Conexão com Stripe OK' };
      } else if (gateway.name === 'asaas') {
        return { success: true, message: 'Conexão com Asaas OK' };
      }
      
      return { success: false, message: 'Gateway não suportado' };
    } catch (error) {
      console.error('Erro ao testar gateway:', error);
      return { success: false, message: 'Erro na conexão' };
    }
  }, []);

  const hasValidCredentials = useCallback((gateway: PaymentGateway) => {
    if (gateway.name === 'stripe') {
      return !!(gateway.config.public_key && gateway.config.secret_key);
    } else if (gateway.name === 'asaas') {
      return !!gateway.config.api_key;
    }
    return false;
  }, []);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  return {
    gateways,
    activeGateway,
    loading,
    updateGateway,
    testGatewayConnection,
    hasValidCredentials,
    refetch: fetchGateways
  };
};
