import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStockMovements } from '@/hooks/useStockMovements';
import type { Database } from '@/integrations/supabase/types';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  variation?: string;
}

// Usar os tipos do Supabase para garantir compatibilidade
type DatabaseOrder = Database['public']['Tables']['orders']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];
type CatalogType = Database['public']['Enums']['catalog_type'];

export interface Order {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  status: OrderStatus;
  order_type: CatalogType;
  total_amount: number;
  shipping_cost?: number;
  discount_amount?: number;
  items: OrderItem[];
  shipping_address?: {
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    zip_code: string;
  };
  shipping_method?: string;
  tracking_code?: string;
  notes?: string;
  payment_method?: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
  due_date?: string;
  store_id: string;
}

export interface OrderFilters {
  status?: string;
  order_type?: string;
  payment_status?: string;
  search?: string;
  tab?: string;
}

// Função helper para converter Json para OrderItem[]
const convertJsonToOrderItems = (items: any): OrderItem[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item: any) => ({
    id: item.id || '',
    name: item.name || '',
    quantity: Number(item.quantity) || 0,
    price: Number(item.price) || 0,
    variation: item.variation || undefined
  }));
};

// Função helper para converter OrderItem[] para Json
const convertOrderItemsToJson = (items: OrderItem[]): any => {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    variation: item.variation || null
  }));
};

export const useOrders = (filters: OrderFilters = {}) => {
  const { profile, isSuperadmin } = useAuth();
  const queryClient = useQueryClient();
  const { createStockMovement } = useStockMovements();

  // Função para buscar pedidos
  const fetchOrders = async (): Promise<Order[]> => {
    if (!profile) {
      console.log('useOrders: Profile não disponível');
      return [];
    }

    console.log('useOrders: Buscando pedidos com filtros:', filters);

    let query = supabase.from('orders').select('*');

    // Se não for superadmin, filtrar por loja
    if (!isSuperadmin && profile.store_id) {
      query = query.eq('store_id', profile.store_id);
    }

    // Aplicar filtros
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status as OrderStatus);
    }

    if (filters.order_type && filters.order_type !== 'all') {
      query = query.eq('order_type', filters.order_type as CatalogType);
    }

    // Filtro de busca por texto
    if (filters.search) {
      query = query.or(`customer_name.ilike.%${filters.search}%,id.ilike.%${filters.search}%`);
    }

    // Filtros por aba
    if (filters.tab === 'unpaid') {
      query = query.eq('status', 'pending' as OrderStatus);
    } else if (filters.tab === 'pending') {
      query = query.in('status', ['pending', 'confirmed'] as OrderStatus[]);
    } else if (filters.tab === 'shipped') {
      query = query.in('status', ['shipping', 'delivered'] as OrderStatus[]);
    }

    // Ordenar por data mais recente
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('useOrders: Erro ao buscar pedidos:', error);
      throw error;
    }

    console.log('useOrders: Pedidos encontrados:', data?.length || 0);
    
    // Converter dados do banco para nossa interface
    return (data || []).map((order: DatabaseOrder): Order => ({
      id: order.id,
      customer_name: order.customer_name,
      customer_email: order.customer_email || undefined,
      customer_phone: order.customer_phone || undefined,
      status: order.status,
      order_type: order.order_type,
      total_amount: Number(order.total_amount),
      items: convertJsonToOrderItems(order.items),
      shipping_address: order.shipping_address ? order.shipping_address as Order['shipping_address'] : undefined,
      created_at: order.created_at,
      updated_at: order.updated_at,
      store_id: order.store_id
    }));
  };

  // Query para buscar pedidos
  const ordersQuery = useQuery({
    queryKey: ['orders', profile?.store_id, filters],
    queryFn: fetchOrders,
    enabled: !!profile,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Mutation para atualizar status do pedido com gestão de estoque
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      console.log('Atualizando status do pedido:', orderId, status);
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, items')
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('Erro ao buscar pedido:', orderError);
        throw orderError;
      }

      // Atualizar status do pedido
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({ 
          status: status as OrderStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar status:', error);
        throw error;
      }

      // Processar mudanças de estoque baseado no status
      const items = convertJsonToOrderItems(order.items);
      
      if (status === 'confirmed' && !order.stock_reserved) {
        // Reservar estoque quando pedido é confirmado
        for (const item of items) {
          await createStockMovement({
            product_id: item.id,
            order_id: orderId,
            movement_type: 'reservation',
            quantity: item.quantity,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
            notes: `Estoque reservado para pedido confirmado`
          });
        }

        // Marcar como estoque reservado
        await supabase
          .from('orders')
          .update({ 
            stock_reserved: true,
            reservation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', orderId);
      } else if (status === 'delivered') {
        // Confirmar venda quando pedido é entregue
        for (const item of items) {
          await createStockMovement({
            product_id: item.id,
            order_id: orderId,
            movement_type: 'sale',
            quantity: item.quantity,
            notes: `Venda confirmada - pedido entregue`
          });
        }
      } else if (status === 'cancelled') {
        // Liberar estoque reservado quando pedido é cancelado
        if (order.stock_reserved) {
          for (const item of items) {
            await createStockMovement({
              product_id: item.id,
              order_id: orderId,
              movement_type: 'release',
              quantity: item.quantity,
              notes: `Estoque liberado - pedido cancelado`
            });
          }
        }
      }

      return updatedOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
    }
  });

  // Mutation para criar novo pedido com gestão de estoque
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: Partial<Order>) => {
      console.log('useOrders: Criando novo pedido:', orderData);
      
      // Determinar store_id de múltiplas fontes
      const targetStoreId = orderData.store_id || profile?.store_id;
      
      if (!targetStoreId) {
        console.error('useOrders: Store ID não encontrado. Profile:', profile);
        throw new Error('Store ID não encontrado. Verifique se você está logado corretamente.');
      }

      console.log('useOrders: Usando store_id:', targetStoreId);

      // Verificar disponibilidade de estoque
      if (orderData.items) {
        for (const item of orderData.items) {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('stock, reserved_stock, allow_negative_stock')
            .eq('id', item.id)
            .single();

          if (productError) {
            console.error('useOrders: Erro ao verificar produto:', productError);
            throw new Error(`Produto ${item.name} não encontrado`);
          }

          const availableStock = product.stock - (product.reserved_stock || 0);
          if (availableStock < item.quantity && !product.allow_negative_stock) {
            throw new Error(`Estoque insuficiente para ${item.name}. Disponível: ${availableStock}`);
          }
        }
      }

      // Preparar dados para inserção no formato esperado pelo banco
      const newOrderData = {
        customer_name: orderData.customer_name || '',
        customer_email: orderData.customer_email || null,
        customer_phone: orderData.customer_phone || null,
        status: (orderData.status || 'pending') as OrderStatus,
        order_type: (orderData.order_type || 'retail') as CatalogType,
        total_amount: orderData.total_amount || 0,
        items: convertOrderItemsToJson(orderData.items || []),
        shipping_address: orderData.shipping_address || null,
        store_id: targetStoreId,
        stock_reserved: false,
        reservation_expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('useOrders: Dados formatados para inserção:', newOrderData);

      const { data, error } = await supabase
        .from('orders')
        .insert(newOrderData)
        .select()
        .single();

      if (error) {
        console.error('useOrders: Erro ao criar pedido no banco:', error);
        throw error;
      }

      console.log('useOrders: Pedido criado com sucesso:', data.id);

      // Se o pedido for criado como confirmado, reservar estoque automaticamente
      if (newOrderData.status === 'confirmed' && orderData.items) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
        
        for (const item of orderData.items) {
          await createStockMovement({
            product_id: item.id,
            order_id: data.id,
            movement_type: 'reservation',
            quantity: item.quantity,
            expires_at: expiresAt.toISOString(),
            notes: `Estoque reservado automaticamente`
          });
        }

        // Atualizar pedido com informações de reserva
        await supabase
          .from('orders')
          .update({ 
            stock_reserved: true,
            reservation_expires_at: expiresAt.toISOString()
          })
          .eq('id', data.id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
    }
  });

  // Função para buscar pedido por ID
  const getOrderById = async (orderId: string): Promise<Order | null> => {
    console.log('useOrders: Buscando pedido por ID:', orderId);
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('useOrders: Erro ao buscar pedido:', error);
      return null;
    }

    // Converter dados do banco para nossa interface
    const order: Order = {
      id: data.id,
      customer_name: data.customer_name,
      customer_email: data.customer_email || undefined,
      customer_phone: data.customer_phone || undefined,
      status: data.status,
      order_type: data.order_type,
      total_amount: Number(data.total_amount),
      items: convertJsonToOrderItems(data.items),
      shipping_address: data.shipping_address ? data.shipping_address as Order['shipping_address'] : undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
      store_id: data.store_id
    };

    return order;
  };

  return {
    // Dados
    orders: ordersQuery.data || [],
    isLoading: ordersQuery.isLoading,
    error: ordersQuery.error,
    
    // Funções
    updateOrderStatus: updateOrderStatusMutation.mutate,
    isUpdatingStatus: updateOrderStatusMutation.isPending,
    createOrder: createOrderMutation.mutate,
    isCreatingOrder: createOrderMutation.isPending,
    getOrderById,
    refetch: ordersQuery.refetch,
    
    // Filtros derivados
    unpaidOrders: (ordersQuery.data || []).filter(order => 
      order.status === 'pending' || order.payment_status === 'pending'
    )
  };
};
