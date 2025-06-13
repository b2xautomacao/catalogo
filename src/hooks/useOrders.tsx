
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Order {
  id: string;
  store_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';
  order_type: 'retail' | 'wholesale';
  items: any[];
  shipping_address: any;
  stock_reserved: boolean;
  reservation_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderData {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  order_type: 'retail' | 'wholesale';
  items: any[];
  shipping_address?: any;
  shipping_method?: string;
  payment_method?: string;
  shipping_cost?: number;
  notes?: string;
  store_id?: string;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile, user } = useAuth();

  const waitForProfile = useCallback(async (maxAttempts = 15): Promise<void> => {
    let attempts = 0;
    while (attempts < maxAttempts && (!profile || !profile.store_id)) {
      console.log(`useOrders: Aguardando profile (tentativa ${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 300));
      attempts++;
    }
    
    if (!profile || !profile.store_id) {
      console.warn('useOrders: Profile não disponível após múltiplas tentativas');
      throw new Error('Profile ou Store ID não disponível após aguardar');
    }
  }, [profile]);

  const convertSupabaseToOrder = (supabaseData: any): Order => {
    return {
      ...supabaseData,
      items: Array.isArray(supabaseData.items) ? supabaseData.items : []
    };
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await waitForProfile();
      
      if (!profile?.store_id) {
        throw new Error('Store ID não encontrado no profile');
      }

      console.log('useOrders: Buscando pedidos para store_id:', profile.store_id);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', profile.store_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      console.log('useOrders: Pedidos carregados:', data?.length || 0);
      
      const convertedOrders = data ? data.map(convertSupabaseToOrder) : [];
      setOrders(convertedOrders);
    } catch (error) {
      console.error('useOrders: Erro ao buscar pedidos:', error);
      setError(error instanceof Error ? error.message : 'Erro ao buscar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: CreateOrderData) => {
    try {
      setError(null);
      setIsCreatingOrder(true);
      
      console.log('🚀 useOrders: Iniciando criação de pedido via Edge Function');
      console.log('📋 useOrders: Dados do pedido:', {
        customer_name: orderData.customer_name,
        store_id: orderData.store_id,
        items_count: orderData.items?.length,
        total_amount: orderData.total_amount
      });
      
      if (!orderData.customer_name?.trim()) {
        throw new Error('Nome do cliente é obrigatório');
      }
      
      if (!orderData.items?.length) {
        throw new Error('Pedido deve conter pelo menos um item');
      }

      let storeId = orderData.store_id;
      
      if (!storeId) {
        console.log('⚠️ useOrders: Store ID não fornecido, tentando obter do profile...');
        storeId = profile?.store_id;
        
        if (!storeId) {
          console.warn('⚠️ useOrders: Store ID não encontrado no profile');
          
          try {
            await waitForProfile(5);
            storeId = profile?.store_id;
          } catch {
            console.log('🔍 useOrders: Buscando store ativa como fallback...');
            const { data: activeStores } = await supabase
              .from('stores')
              .select('id')
              .eq('is_active', true)
              .limit(1);
              
            if (activeStores?.length) {
              storeId = activeStores[0].id;
              console.log('✅ useOrders: Usando store ativa como fallback:', storeId);
            } else {
              throw new Error('Nenhuma loja disponível para criar o pedido');
            }
          }
        }
      }

      if (!storeId) {
        throw new Error('Store ID não encontrado. Verifique se existe uma loja ativa.');
      }

      console.log('🏪 useOrders: Store ID determinado:', storeId);

      const orderPayload = {
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email || null,
        customer_phone: orderData.customer_phone || null,
        total_amount: orderData.total_amount,
        order_type: orderData.order_type,
        items: orderData.items,
        shipping_address: orderData.shipping_address || null,
        shipping_method: orderData.shipping_method || null,
        payment_method: orderData.payment_method || null,
        shipping_cost: orderData.shipping_cost || 0,
        notes: orderData.notes || null,
        store_id: storeId
      };

      console.log('🔗 useOrders: Chamando Edge Function create-public-order...');

      // Chamar Edge Function em vez de inserir diretamente
      const { data: functionResult, error: functionError } = await supabase.functions.invoke(
        'create-public-order',
        {
          body: { orderData: orderPayload }
        }
      );

      if (functionError) {
        console.error('❌ useOrders: Erro na Edge Function:', functionError);
        throw new Error(`Erro ao processar pedido: ${functionError.message}`);
      }

      if (!functionResult?.success) {
        console.error('❌ useOrders: Edge Function retornou erro:', functionResult?.error);
        throw new Error(functionResult?.error || 'Erro desconhecido ao criar pedido');
      }

      console.log('✅ useOrders: Pedido criado com sucesso via Edge Function:', functionResult.order);

      if (profile?.store_id && profile.store_id === storeId) {
        console.log('🔄 useOrders: Recarregando lista de pedidos...');
        await fetchOrders();
      }
      
      const convertedOrder = convertSupabaseToOrder(functionResult.order);
      console.log('🎉 useOrders: Processo concluído com sucesso');
      return { data: convertedOrder, error: null };
    } catch (error) {
      console.error('❌ useOrders: Erro geral ao criar pedido:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar pedido';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const createOrderAsync = async (orderData: CreateOrderData): Promise<Order> => {
    const result = await createOrder(orderData);
    if (result.error || !result.data) {
      throw new Error(result.error || 'Erro ao criar pedido');
    }
    return result.data;
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      
      await fetchOrders();
      
      const convertedOrder = convertSupabaseToOrder(data);
      return { data: convertedOrder, error: null };
    } catch (error) {
      console.error('useOrders: Erro ao atualizar status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar status';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  useEffect(() => {
    if (profile?.store_id) {
      console.log('useOrders: Profile disponível, carregando pedidos');
      fetchOrders();
    } else if (user) {
      console.log('useOrders: Usuário logado mas profile ainda não disponível');
      const timer = setTimeout(() => {
        if (profile?.store_id) {
          fetchOrders();
        } else {
          console.log('useOrders: Profile ainda não disponível após timeout');
          setLoading(false);
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      console.log('useOrders: Usuário não logado');
      setLoading(false);
    }
  }, [profile?.store_id, user]);

  return {
    orders,
    loading,
    error,
    isCreatingOrder,
    fetchOrders,
    createOrder,
    createOrderAsync,
    updateOrderStatus
  };
};
