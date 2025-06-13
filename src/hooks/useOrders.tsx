
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
  store_id?: string; // Novo campo para suportar criação pública
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile, user } = useAuth();

  // Função melhorada para aguardar o profile com retry logic mais robusto
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
      
      // Validar dados obrigatórios antes de prosseguir
      if (!orderData.customer_name?.trim()) {
        throw new Error('Nome do cliente é obrigatório');
      }
      
      if (!orderData.items?.length) {
        throw new Error('Pedido deve conter pelo menos um item');
      }

      console.log('useOrders: Criando pedido com dados:', orderData);

      // Determinar store_id - priorizar o passado via parâmetro para criação pública
      let storeId = orderData.store_id;
      
      // Se não foi passado store_id, tentar obter do profile (usuário autenticado)
      if (!storeId) {
        storeId = profile?.store_id;
        
        if (!storeId) {
          console.warn('useOrders: Store ID não encontrado, tentando buscar...');
          
          // Tentar aguardar profile por um tempo limitado
          try {
            await waitForProfile(5); // Apenas 5 tentativas para não bloquear muito
            storeId = profile?.store_id;
          } catch {
            // Se não conseguir o profile, verificar se há uma store ativa
            const { data: activeStores } = await supabase
              .from('stores')
              .select('id')
              .eq('is_active', true)
              .limit(1);
              
            if (activeStores?.length) {
              storeId = activeStores[0].id;
              console.log('useOrders: Usando store ativa como fallback:', storeId);
            } else {
              throw new Error('Nenhuma loja disponível para criar o pedido');
            }
          }
        }
      }

      if (!storeId) {
        throw new Error('Store ID não encontrado. Verifique se existe uma loja ativa.');
      }

      // Calcular tempo de expiração da reserva (30 minutos)
      const reservationExpires = new Date();
      reservationExpires.setMinutes(reservationExpires.getMinutes() + 30);

      const newOrder = {
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email || null,
        customer_phone: orderData.customer_phone || null,
        total_amount: orderData.total_amount,
        status: 'pending' as const,
        order_type: orderData.order_type,
        items: orderData.items,
        shipping_address: orderData.shipping_address || null,
        shipping_method: orderData.shipping_method || null,
        payment_method: orderData.payment_method || null,
        shipping_cost: orderData.shipping_cost || 0,
        notes: orderData.notes || null,
        store_id: storeId,
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
        await reserveStock(item.id || item.product_id, item.quantity, data.id, storeId);
      }

      // Recarregar pedidos apenas se o profile estiver disponível e o store_id for o mesmo
      if (profile?.store_id && profile.store_id === storeId) {
        await fetchOrders();
      }
      
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

  const reserveStock = async (productId: string, quantity: number, orderId: string, storeId: string) => {
    try {
      console.log('useOrders: Reservando estoque:', { productId, quantity, orderId, storeId });

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
          store_id: storeId,
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
      // Aguardar um pouco e tentar novamente com timeout reduzido
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
