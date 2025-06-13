
import React from 'react';
import { Order } from '@/hooks/useOrders';
import { OrderPaymentStatus } from '@/hooks/useOrderPayments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PaymentStatusBadge from './PaymentStatusBadge';
import { 
  Eye, 
  MessageCircle, 
  X, 
  Printer, 
  FileText,
  Truck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrdersTableProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onCancelOrder: (orderId: string) => void;
  onSendFollowUp: (order: Order) => void;
  onPrintLabel: (order: Order) => void;
  onPrintDeclaration: (order: Order) => void;
  getOrderPaymentStatus: (orderId: string) => OrderPaymentStatus | null;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onViewOrder,
  onCancelOrder,
  onSendFollowUp,
  onPrintLabel,
  onPrintDeclaration,
  getOrderPaymentStatus
}) => {
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

  const getShippingMethodText = (method: string | null) => {
    const methods = {
      pickup: 'Retirada',
      delivery: 'Entrega Local',
      shipping: 'Correios',
      express: 'Expresso'
    };
    return methods[method as keyof typeof methods] || method || 'N/I';
  };

  const getShippingMethodColor = (method: string | null) => {
    const colors = {
      pickup: 'bg-blue-50 text-blue-700 border-blue-200',
      delivery: 'bg-green-50 text-green-700 border-green-200',
      shipping: 'bg-orange-50 text-orange-700 border-orange-200',
      express: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[method as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const canPrintLabel = (order: Order) => {
    return order.status !== 'pending' && 
           order.status !== 'cancelled' && 
           (order.shipping_method === 'shipping' || order.shipping_method === 'express');
  };

  const getFallbackPaymentStatus = (order: Order) => {
    if (order.status === 'cancelled') return 'cancelled';
    if (order.status === 'delivered') return 'paid';
    if (order.status === 'pending') return 'pending';
    return 'processing';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 font-medium text-gray-600">Pedido</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Cliente</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Pagamento</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Envio</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Valor</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Ações</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const paymentStatus = getOrderPaymentStatus(order.id);
            const fallbackPaymentStatus = getFallbackPaymentStatus(order);
            
            return (
              <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="font-mono text-sm font-medium">
                      #{order.id.slice(-8)}
                    </span>
                    <Badge variant="outline" className="w-fit text-xs">
                      {order.order_type === 'retail' ? 'Varejo' : 'Atacado'}
                    </Badge>
                  </div>
                </td>
                
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{order.customer_name}</span>
                    {order.customer_phone && (
                      <span className="text-sm text-gray-500">{order.customer_phone}</span>
                    )}
                  </div>
                </td>
                
                <td className="py-3 px-4">
                  <Badge className={getStatusColor(order.status)} variant="outline">
                    {getStatusText(order.status)}
                  </Badge>
                </td>
                
                <td className="py-3 px-4">
                  <PaymentStatusBadge
                    paymentStatus={paymentStatus}
                    fallbackStatus={fallbackPaymentStatus}
                  />
                </td>

                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    <Badge className={getShippingMethodColor(order.shipping_method)} variant="outline">
                      <Truck className="h-3 w-3 mr-1" />
                      {getShippingMethodText(order.shipping_method)}
                    </Badge>
                    {order.tracking_code && (
                      <span className="text-xs text-gray-500 font-mono">
                        {order.tracking_code}
                      </span>
                    )}
                  </div>
                </td>
                
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">
                      R$ {order.total_amount.toFixed(2)}
                    </span>
                    {order.shipping_cost && order.shipping_cost > 0 && (
                      <span className="text-xs text-gray-500">
                        +R$ {order.shipping_cost.toFixed(2)} frete
                      </span>
                    )}
                    {paymentStatus && paymentStatus.totalPaid > 0 && (
                      <span className="text-xs text-green-600">
                        Pago: R$ {paymentStatus.totalPaid.toFixed(2)}
                      </span>
                    )}
                  </div>
                </td>
                
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(order.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </td>
                
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewOrder(order)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {paymentStatus?.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSendFollowUp(order)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onCancelOrder(order.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {canPrintLabel(order) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onPrintLabel(order)}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        title="Imprimir Etiqueta"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {(order.status === 'confirmed' || order.status === 'preparing' || order.status === 'shipping') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onPrintDeclaration(order)}
                        className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                        title="Declaração de Conteúdo"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;
