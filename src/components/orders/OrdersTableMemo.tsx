
import React, { memo } from 'react';
import { Order } from '@/hooks/useOrders';
import { OrderPaymentStatus } from '@/hooks/useOrderPayments';
import OrdersTable from './OrdersTable';

interface OrdersTableMemoProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onCancelOrder: (orderId: string) => void;
  onSendFollowUp: (order: Order) => void;
  onPrintLabel: (order: Order) => void;
  onPrintDeclaration: (order: Order) => void;
  getOrderPaymentStatus: (orderId: string) => OrderPaymentStatus | null;
  onStatusChange: (orderId: string, newStatus: Order['status']) => void;
}

const OrdersTableMemo: React.FC<OrdersTableMemoProps> = memo(({
  orders,
  onViewOrder,
  onCancelOrder,
  onSendFollowUp,
  onPrintLabel,
  onPrintDeclaration,
  getOrderPaymentStatus,
  onStatusChange
}) => {
  console.log('🔄 OrdersTableMemo: Re-render com', orders.length, 'pedidos');
  
  return (
    <OrdersTable
      orders={orders}
      onViewOrder={onViewOrder}
      onCancelOrder={onCancelOrder}
      onSendFollowUp={onSendFollowUp}
      onPrintLabel={onPrintLabel}
      onPrintDeclaration={onPrintDeclaration}
      getOrderPaymentStatus={getOrderPaymentStatus}
      onStatusChange={onStatusChange}
    />
  );
});

OrdersTableMemo.displayName = 'OrdersTableMemo';

export default OrdersTableMemo;
