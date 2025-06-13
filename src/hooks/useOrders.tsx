
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
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile, user } = useAuth();

  // Função para aguardar o profile estar disponível
  const waitForProfile = useCallback(async (maxAttempts = 10): Promise<void> => {
    let attempts = 0;
    while (attempts < maxAttempts && (!profile || !profile.store_id)) {
      console.log(`useOrders: Aguardando profile (tentativa ${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (!profile || !profile.store_id) {
      throw new Error('Profile ou Store ID não disponível após aguardar');
    }
  }, [profile]);

  // Função para converter dados do Supabase para o tipo Order
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
      
      // Aguardar profile estar disponível
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
      
      // Converter os dados do Supabase para o tipo Order
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
      
      // Aguardar profile estar disponível
      await waitForProfile();
      
      if (!profile?.store_id) {
        throw new Error('Store ID não encontrado. Verifique se você está logado corretamente.');
      }

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('useOrders: Criando pedido para store_id:', profile.store_id);
      console.log('useOrders: Dados do pedido:', orderData);

      // Calcular tempo de expiração da reserva (30 minutos)
      const reservationExpires = new Date();
      reservationExpires.setMinutes(reservationExpires.getMinutes() + 30);

      const newOrder = {
        ...orderData,
        store_id: profile.store_id,
        status: 'pending' as const,
        stock_reserved: true,
        reservation_expires_at: reservationExpires.toISOString()
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select()
        .single();

      if (error) {
        console.error('useOrders: Erro ao criar pedido:', error);
        throw error;
      }

      console.log('useOrders: Pedido criado com sucesso:', data);

      // Reservar estoque para cada item
      for (const item of orderData.items) {
        await reserveStock(item.id || item.product_id, item.quantity, data.id);
      }

      await fetchOrders();
      
      // Converter o dado para o tipo Order antes de retornar
      const convertedOrder = convertSupabaseToOrder(data);
      return { data: convertedOrder, error: null };
    } catch (error) {
      console.error('useOrders: Erro ao criar pedido:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar pedido';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Versão async que retorna o pedido diretamente ou lança erro
  const createOrderAsync = async (orderData: CreateOrderData): Promise<Order> => {
    const result = await createOrder(orderData);
    if (result.error || !result.data) {
      throw new Error(result.error || 'Erro ao criar pedido');
    }
    return result.data;
  };

  const reserveStock = async (productId: string, quantity: number, orderId: string) => {
    try {
      console.log('useOrders: Reservando estoque:', { productId, quantity, orderId });

      // Buscar produto atual
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock, reserved_stock')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      const availableStock = (product.stock || 0) - (product.reserved_stock || 0);
      
      if (availableStock < quantity) {
        throw new Error(`Estoque insuficiente para o produto. Disponível: ${availableStock}, Solicitado: ${quantity}`);
      }

      // Atualizar estoque reservado
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          reserved_stock: (product.reserved_stock || 0) + quantity 
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Registrar movimentação de estoque
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          product_id: productId,
          order_id: orderId,
          movement_type: 'reservation',
          quantity: quantity,
          previous_stock: product.stock,
          new_stock: product.stock,
          notes: `Reserva para pedido ${orderId}`,
          store_id: profile!.store_id,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
        }]);

      if (movementError) throw movementError;

      console.log('useOrders: Estoque reservado com sucesso');
    } catch (error) {
      console.error('useOrders: Erro ao reservar estoque:', error);
      throw error;
    }
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
      
      // Converter o dado para o tipo Order antes de retornar
      const convertedOrder = convertSupabaseToOrder(data);
      return { data: convertedOrder, error: null };
    } catch (error) {
      console.error('useOrders: Erro ao atualizar status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar status';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  // Carregar pedidos quando o profile estiver disponível
  useEffect(() => {
    if (profile?.store_id) {
      console.log('useOrders: Profile disponível, carregando pedidos');
      fetchOrders();
    } else if (user) {
      console.log('useOrders: Usuário logado mas profile ainda não disponível');
      // Aguardar um pouco e tentar novamente
      const timer = setTimeout(() => {
        if (profile?.store_id) {
          fetchOrders();
        }
      }, 2000);
      
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
