
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Phone, Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PaymentStatusBadge from './PaymentStatusBadge';
import OrderStatusDropdown from './OrderStatusDropdown';
import { Order } from '@/hooks/useOrders';
import { OrderPaymentStatus } from '@/hooks/useOrderPayments';

interface OrdersTableProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onCancelOrder: (orderId: string) => void;
  onSendFollowUp: (order: Order) => void;
  onPrintLabel: (order: Order) => void;
  onPrintDeclaration: (order: Order) => void;
  getOrderPaymentStatus: (orderId: string) => OrderPaymentStatus | null;
  onStatusChange: (orderId: string, newStatus: Order['status']) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onViewOrder,
  onCancelOrder,
  onSendFollowUp,
  onPrintLabel,
  onPrintDeclaration,
  getOrderPaymentStatus,
  onStatusChange
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'shipping': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      shipping: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getTypeText = (type: string) => {
    return type === 'retail' ? 'Varejo' : 'Atacado';
  };

  const getShippingText = (method: string) => {
    const methods = {
      pickup: 'Retirada',
      delivery: 'Entrega',
      shipping: 'Correios',
      express: 'Expresso'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Entrega</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Criado</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const paymentStatus = getOrderPaymentStatus(order.id);
            
            return (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  #{order.id.slice(-8)}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customer_name}</div>
                    {order.customer_phone && (
                      <div className="text-sm text-gray-500">{order.customer_phone}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <OrderStatusDropdown
                    order={order}
                    onStatusChange={onStatusChange}
                  />
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge
                    status={paymentStatus?.status || 'pending'}
                    method={paymentStatus?.lastPaymentMethod}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getTypeText(order.order_type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getShippingText(order.shipping_method)}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(order.total_amount)}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(order.created_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSendFollowUp(order)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    
                    {(order.shipping_method === 'shipping' || order.shipping_method === 'express') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPrintLabel(order)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPrintDeclaration(order)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;
