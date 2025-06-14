
import { useCallback } from 'react';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';

interface StockReservationParams {
  productId: string;
  quantity: number;
  orderId: string;
  expiresInHours?: number;
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

  // Reservar estoque quando pedido é criado
  const reserveStock = useCallback(async (params: StockReservationParams) => {
    try {
      console.log('🔒 StockManager: Reservando estoque:', params);
      
      const product = products.find(p => p.id === params.productId);
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
      await fetchProducts(); // Atualizar dados
      
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
  }, [products, createStockMovement, fetchProducts, toast]);

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
      await fetchProducts(); // Atualizar dados
      
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
      await fetchProducts(); // Atualizar dados
      
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
    handleOrderStatusChange
  };
};
