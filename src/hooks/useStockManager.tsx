
import { useCallback } from 'react';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StockReservationParams {
  productId: string;
  quantity: number;
  orderId: string;
  expiresInHours?: number;
  storeId?: string;
}

interface StockSaleParams {
  productId: string;
  quantity: number;
  orderId: string;
}

export const useStockManager = () => {
  const { createStockMovement } = useStockMovements();
  const { products, fetchProducts } = useProducts();
  const { toast } = useToast();

  // Buscar produto diretamente do banco quando não está na lista local
  const fetchProductById = useCallback(async (productId: string, storeId?: string) => {
    try {
      console.log('🔍 StockManager: Buscando produto diretamente:', { productId, storeId });
      
      let query = supabase
        .from('products')
        .select('*')
        .eq('id', productId);
      
      if (storeId) {
        query = query.eq('store_id', storeId);
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        console.error('❌ StockManager: Erro ao buscar produto:', error);
        throw new Error(`Produto não encontrado: ${error.message}`);
      }
      
      console.log('✅ StockManager: Produto encontrado:', data);
      return data;
    } catch (error) {
      console.error('❌ StockManager: Erro na busca direta do produto:', error);
      throw error;
    }
  }, []);

  // Reservar estoque quando pedido é criado
  const reserveStock = useCallback(async (params: StockReservationParams) => {
    try {
      console.log('🔒 StockManager: Reservando estoque:', params);
      
      // Tentar encontrar produto na lista local primeiro
      let product = products.find(p => p.id === params.productId);
      
      // Se não encontrar na lista local, buscar diretamente do banco
      if (!product) {
        console.log('⚠️ StockManager: Produto não encontrado na lista local, buscando no banco...');
        product = await fetchProductById(params.productId, params.storeId);
      }

      if (!product) {
        throw new Error('Produto não encontrado');
      }

      const availableStock = product.stock - (product.reserved_stock || 0);
      if (availableStock < params.quantity && !product.allow_negative_stock) {
        throw new Error(`Estoque insuficiente. Disponível: ${availableStock}, Solicitado: ${params.quantity}`);
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (params.expiresInHours || 24));

      createStockMovement({
        product_id: params.productId,
        order_id: params.orderId,
        movement_type: 'reservation',
        quantity: params.quantity,
        expires_at: expiresAt.toISOString(),
        notes: `Reserva automática para pedido ${params.orderId}`
      });

      console.log('✅ StockManager: Estoque reservado com sucesso');
      
      // Tentar atualizar dados locais se possível
      if (fetchProducts) {
        await fetchProducts();
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ StockManager: Erro ao reservar estoque:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao reservar estoque';
      
      toast({
        title: "Erro na Reserva",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, error: errorMessage };
    }
  }, [products, createStockMovement, fetchProducts, toast, fetchProductById]);

  // Confirmar venda quando pagamento é aprovado
  const confirmSale = useCallback(async (params: StockSaleParams) => {
    try {
      console.log('💰 StockManager: Confirmando venda:', params);

      createStockMovement({
        product_id: params.productId,
        order_id: params.orderId,
        movement_type: 'sale',
        quantity: params.quantity,
        notes: `Venda confirmada - pagamento aprovado para pedido ${params.orderId}`
      });

      console.log('✅ StockManager: Venda confirmada com sucesso');
      
      // Tentar atualizar dados locais se possível
      if (fetchProducts) {
        await fetchProducts();
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ StockManager: Erro ao confirmar venda:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao confirmar venda';
      
      return { success: false, error: errorMessage };
    }
  }, [createStockMovement, fetchProducts]);

  // Liberar reserva quando pedido é cancelado
  const releaseReservation = useCallback(async (params: StockSaleParams) => {
    try {
      console.log('🔓 StockManager: Liberando reserva:', params);

      createStockMovement({
        product_id: params.productId,
        order_id: params.orderId,
        movement_type: 'release',
        quantity: params.quantity,
        notes: `Reserva liberada - pedido ${params.orderId} cancelado`
      });

      console.log('✅ StockManager: Reserva liberada com sucesso');
      
      // Tentar atualizar dados locais se possível
      if (fetchProducts) {
        await fetchProducts();
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ StockManager: Erro ao liberar reserva:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao liberar reserva';
      
      return { success: false, error: errorMessage };
    }
  }, [createStockMovement, fetchProducts]);

  // Processar mudança de status do pedido
  const handleOrderStatusChange = useCallback(async (
    orderId: string, 
    newStatus: string, 
    orderItems: any[]
  ) => {
    try {
      console.log('📋 StockManager: Processando mudança de status:', { orderId, newStatus });

      // Quando pedido é confirmado (pagamento aprovado)
      if (newStatus === 'confirmed' || newStatus === 'preparing') {
        for (const item of orderItems) {
          await confirmSale({
            productId: item.product_id,
            quantity: item.quantity,
            orderId: orderId
          });
        }
      }

      // Quando pedido é cancelado
      if (newStatus === 'cancelled') {
        for (const item of orderItems) {
          await releaseReservation({
            productId: item.product_id,
            quantity: item.quantity,
            orderId: orderId
          });
        }
      }

      console.log('✅ StockManager: Status processado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ StockManager: Erro ao processar status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }, [confirmSale, releaseReservation]);

  return {
    reserveStock,
    confirmSale,
    releaseReservation,
    handleOrderStatusChange,
    fetchProductById
  };
};
