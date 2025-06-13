
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Eye, Calendar, User, Phone, Mail, MapPin } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Orders = () => {
  const { orders, loading, error } = useOrders();

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      shipping: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <AppLayout title="Pedidos" subtitle="Gerencie todos os pedidos da sua loja">
        <div className="space-y-6">
          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando pedidos...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Pedidos" subtitle="Gerencie todos os pedidos da sua loja">
        <div className="space-y-6">
          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <p className="text-red-600">Erro ao carregar pedidos: {error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Pedidos" subtitle="Gerencie todos os pedidos da sua loja">
      <div className="space-y-6">
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              Lista de Pedidos ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  Nenhum pedido encontrado
                </p>
                <p className="text-sm text-gray-500">
                  Os pedidos aparecerão aqui quando forem realizados pelos clientes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusText(order.status)}
                            </Badge>
                            <Badge variant="outline">
                              {order.order_type === 'retail' ? 'Varejo' : 'Atacado'}
                            </Badge>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDistanceToNow(new Date(order.created_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{order.customer_name}</span>
                            </div>
                            
                            {order.customer_phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{order.customer_phone}</span>
                              </div>
                            )}
                            
                            {order.customer_email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span>{order.customer_email}</span>
                              </div>
                            )}
                          </div>

                          <div className="text-sm text-gray-600">
                            <strong>Itens:</strong> {order.items?.length || 0} item(s)
                            {order.items?.length > 0 && (
                              <span className="ml-2">
                                ({order.items.map(item => `${item.name} (${item.quantity}x)`).join(', ')})
                              </span>
                            )}
                          </div>

                          {order.shipping_address && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                              <span>
                                {order.shipping_address.street}, {order.shipping_address.number}
                                {order.shipping_address.complement && `, ${order.shipping_address.complement}`}
                                <br />
                                {order.shipping_address.district}, {order.shipping_address.city} - {order.shipping_address.state}
                                <br />
                                CEP: {order.shipping_address.zip_code}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-2xl font-bold text-primary">
                            R$ {order.total_amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Pedido #{order.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Orders;
