import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePayments, Payment } from '@/hooks/usePayments';
import { Order } from '@/hooks/useOrders';
import { useStockManager } from '@/hooks/useStockManager';

export interface OrderPaymentStatus {
  orderId: string;
  status: 'pending' | 'partial' | 'paid' | 'overpaid' | 'cancelled';
  totalPaid: number;
  totalAmount: number;
  remainingAmount: number;
  payments: Payment[];
  lastPaymentMethod?: string;
}

export const useOrderPayments = (orders: Order[]) => {
  const [orderPayments, setOrderPayments] = useState<Map<string, OrderPaymentStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [lastFetchedOrderIds, setLastFetchedOrderIds] = useState<string>('');
  const { fetchPaymentsByOrder } = usePayments();
  const { handleOrderStatusChange } = useStockManager();

  // Memorizar IDs dos pedidos para evitar re-renders desnecessários
  const orderIds = useMemo(() => {
    return orders.map(o => o.id).sort();
  }, [orders]);

  // Verificar se os IDs realmente mudaram
  const orderIdsKey = useMemo(() => {
    return orderIds.join(',');
  }, [orderIds]);

  const calculatePaymentStatus = useCallback((order: Order, payments: Payment[]): OrderPaymentStatus => {
    const confirmedPayments = payments.filter(p => p.status === 'confirmed');
    const totalPaid = confirmedPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = Math.max(0, order.total_amount - totalPaid);
    
    let status: OrderPaymentStatus['status'] = 'pending';
    
    if (order.status === 'cancelled') {
      status = 'cancelled';
    } else if (totalPaid === 0) {
      status = 'pending';
    } else if (totalPaid >= order.total_amount) {
      status = totalPaid > order.total_amount ? 'overpaid' : 'paid';
      
      // 💰 AUTOMAÇÃO: Quando pagamento é confirmado, processar estoque
      if (status === 'paid' && order.status === 'pending') {
        console.log('💰 OrderPayments: Pagamento confirmado, atualizando estoque...');
        handleOrderStatusChange(order.id, 'confirmed', order.items || []);
      }
    } else {
      status = 'partial';
    }

    const lastPayment = confirmedPayments[confirmedPayments.length - 1];
    
    return {
      orderId: order.id,
      status,
      totalPaid,
      totalAmount: order.total_amount,
      remainingAmount,
      payments,
      lastPaymentMethod: lastPayment?.payment_method
    };
  }, [handleOrderStatusChange]);

  const loadPaymentsForOrders = useCallback(async (orderIdsToFetch: string[]) => {
    if (orderIdsToFetch.length === 0) return;
    
    console.log('🔄 useOrderPayments: Carregando pagamentos para pedidos:', orderIdsToFetch.length);
    
    setLoading(true);
    try {
      const paymentStatusMap = new Map<string, OrderPaymentStatus>();
      
      // Buscar pagamentos para cada pedido em lotes menores
      const batchSize = 5;
      for (let i = 0; i < orderIdsToFetch.length; i += batchSize) {
        const batch = orderIdsToFetch.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (orderId) => {
            const order = orders.find(o => o.id === orderId);
            if (!order) return;
            
            const { data: payments } = await fetchPaymentsByOrder(orderId);
            const paymentStatus = calculatePaymentStatus(order, payments || []);
            paymentStatusMap.set(orderId, paymentStatus);
          })
        );
      }
      
      setOrderPayments(paymentStatusMap);
      console.log('✅ useOrderPayments: Pagamentos carregados com sucesso');
    } catch (error) {
      console.error('❌ useOrderPayments: Erro ao carregar pagamentos:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchPaymentsByOrder, calculatePaymentStatus, orders]);

  const getOrderPaymentStatus = useCallback((orderId: string): OrderPaymentStatus | null => {
    return orderPayments.get(orderId) || null;
  }, [orderPayments]);

  const refreshPayments = useCallback(() => {
    console.log('🔄 useOrderPayments: Refresh manual solicitado');
    if (orderIds.length > 0) {
      loadPaymentsForOrders(orderIds);
      setLastFetchedOrderIds(orderIdsKey);
    }
  }, [orderIds, orderIdsKey, loadPaymentsForOrders]);

  // Carregar pagamentos apenas quando os IDs realmente mudarem
  useEffect(() => {
    if (orderIdsKey && orderIdsKey !== lastFetchedOrderIds && orderIds.length > 0) {
      console.log('🆕 useOrderPayments: IDs dos pedidos mudaram, carregando pagamentos');
      loadPaymentsForOrders(orderIds);
      setLastFetchedOrderIds(orderIdsKey);
    }
  }, [orderIdsKey, lastFetchedOrderIds, orderIds, loadPaymentsForOrders]);

  return {
    orderPayments,
    loading,
    getOrderPaymentStatus,
    refreshPayments
  };
};
