
import { useState, useEffect, useCallback } from 'react';
import { usePayments, Payment } from '@/hooks/usePayments';
import { Order } from '@/hooks/useOrders';

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
  const { fetchPaymentsByOrder } = usePayments();

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
  }, []);

  const loadPaymentsForOrders = useCallback(async (orderIds: string[]) => {
    if (orderIds.length === 0) return;
    
    setLoading(true);
    try {
      const paymentStatusMap = new Map<string, OrderPaymentStatus>();
      
      // Buscar pagamentos para cada pedido
      await Promise.all(
        orderIds.map(async (orderId) => {
          const order = orders.find(o => o.id === orderId);
          if (!order) return;
          
          const { data: payments } = await fetchPaymentsByOrder(orderId);
          const paymentStatus = calculatePaymentStatus(order, payments || []);
          paymentStatusMap.set(orderId, paymentStatus);
        })
      );
      
      setOrderPayments(paymentStatusMap);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    } finally {
      setLoading(false);
    }
  }, [orders, fetchPaymentsByOrder, calculatePaymentStatus]);

  const getOrderPaymentStatus = useCallback((orderId: string): OrderPaymentStatus | null => {
    return orderPayments.get(orderId) || null;
  }, [orderPayments]);

  const refreshPayments = useCallback(() => {
    const orderIds = orders.map(o => o.id);
    loadPaymentsForOrders(orderIds);
  }, [orders, loadPaymentsForOrders]);

  useEffect(() => {
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      loadPaymentsForOrders(orderIds);
    }
  }, [orders, loadPaymentsForOrders]);

  return {
    orderPayments,
    loading,
    getOrderPaymentStatus,
    refreshPayments
  };
};
