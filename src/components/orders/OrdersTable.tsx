
import React from 'react';
import { Eye, MessageCircle, FileText, Printer } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/hooks/useOrders';
import { OrderPaymentStatus } from '@/hooks/useOrderPayments';
import PaymentStatusBadge from './PaymentStatusBadge';
import OrderStatusDropdown from './OrderStatusDropdown';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrdersTableProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onCancelOrder: (orderId: string) => void;
  onSendFollowUp: (order: Order) => void;
  onPrintLabel: (order: Order) => void;
  onPrintDeclaration: (order: Order) => void;
  getOrderPaymentStatus: (orderId: string) => OrderPaymentStatus | null;
  onStatusChange?: (orderId: string, newStatus: Order['status']) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onViewOrder,
  onSendFollowUp,
  onPrintLabel,
  onPrintDeclaration,
  getOrderPaymentStatus,
  onStatusChange
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const paymentStatus = getOrderPaymentStatus(order.id);
            
            return (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">
                  #{order.id.slice(-8)}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customer_name}</div>
                    {order.customer_phone && (
                      <div className="text-sm text-gray-600">{order.customer_phone}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                  <div className="text-xs text-gray-600">
                    {format(new Date(order.created_at), 'HH:mm', { locale: ptBR })}
                  </div>
                </TableCell>
                <TableCell>
                  {onStatusChange ? (
                    <OrderStatusDropdown
                      order={order}
                      onStatusChange={onStatusChange}
                    />
                  ) : (
                    <Badge variant="outline" className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge paymentStatus={paymentStatus} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {order.order_type === 'retail' ? 'Varejo' : 'Atacado'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  R$ {order.total_amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewOrder(order)}
                      className="h-8 w-8 p-0"
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {paymentStatus?.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSendFollowUp(order)}
                        className="h-8 w-8 p-0"
                        title="Enviar cobrança"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {(order.shipping_method === 'shipping' || order.shipping_method === 'express') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPrintLabel(order)}
                        className="h-8 w-8 p-0"
                        title="Gerar etiqueta"
                        disabled={!!order.label_generated_at}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPrintDeclaration(order)}
                      className="h-8 w-8 p-0"
                      title="Declaração de conteúdo"
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

const getStatusColor = (status: string) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    preparing: 'bg-orange-100 text-orange-800 border-orange-200',
    shipping: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
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

export default OrdersTable;
