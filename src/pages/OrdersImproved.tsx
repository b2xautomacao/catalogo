
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Calendar, Package2, 
  Truck, CheckCircle, Clock, AlertCircle, Printer,
  FileText, Eye, MoreHorizontal, Tag, RefreshCw,
  Download, CreditCard, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/components/layout/AppLayout';
import OrdersTableMemo from '@/components/orders/OrdersTableMemo';
import OrdersGridMemo from '@/components/orders/OrdersGridMemo';
import { useOrders } from '@/hooks/useOrders';
import { useOrderPayments } from '@/hooks/useOrderPayments';
import { Order } from '@/hooks/useOrders';

const OrdersImproved = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Dados do banco de dados
  const {
    orders,
    loading,
    fetchOrders,
    updateOrderStatus,
  } = useOrders();
  const { getOrderPaymentStatus, refreshPayments } = useOrderPayments(orders);

  // Utilidades para filtragem real dos pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchMatch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = filterStatus === 'all' || order.status === filterStatus;
      const typeMatch = filterType === 'all' || order.order_type === filterType;
      // O status de pagamento real vem do hook
      const paymentStatusReal = getOrderPaymentStatus(order.id)?.status;
      const paymentMatch = filterPayment === 'all' || paymentStatusReal === filterPayment;
      let tabMatch = true;
      if (activeTab === 'unpaid') {
        tabMatch = paymentStatusReal === 'pending' || order.status === 'pending';
      } else if (activeTab === 'pending') {
        tabMatch = ['pending', 'confirmed'].includes(order.status);
      } else if (activeTab === 'shipped') {
        tabMatch = ['shipping', 'delivered'].includes(order.status);
      }
      return searchMatch && statusMatch && typeMatch && paymentMatch && tabMatch;
    });
  }, [orders, searchTerm, filterStatus, filterType, filterPayment, activeTab, getOrderPaymentStatus]);

  const unpaidOrders = useMemo(() =>
    orders.filter(order => {
      const paymentStatus = getOrderPaymentStatus(order.id);
      return paymentStatus?.status === 'pending' || order.status === 'pending';
    }), [orders, getOrderPaymentStatus]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handlePrintLabel = (order: Order) => {
    alert(`Imprimir etiqueta para pedido #${order.id.slice(-8)}`);
  };

  const handlePrintDeclaration = (order: Order) => {
    alert(`Imprimir declaração de conteúdo para pedido #${order.id.slice(-8)}`);
  };

  const handleRecoverUnpaidOrder = (order: Order) => {
    alert(`Enviando cobrança para ${order.customer_name} - #${order.id.slice(-8)}`);
  };

  const handleBulkRecovery = () => {
    if (unpaidOrders.length === 0) return;
    alert(`Enviando cobranças para ${unpaidOrders.length} pedidos não pagos`);
  };

  const handleCancelOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled');
  };

  // Colunas/tabs dinâmicas
  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Pedidos', current: true }
  ];

  // Mascara nomes de status conforme status real (hook)
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'Preparando';
      case 'shipping': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // UX loading
  if (loading) {
    return (
      <AppLayout title="Pedidos" subtitle="Gerencie todos os pedidos da sua loja" breadcrumbs={breadcrumbs}>
        <div className="py-16 text-center">Carregando pedidos...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Pedidos"
      subtitle="Gerencie todos os pedidos da sua loja"
      breadcrumbs={breadcrumbs}
    >
      {/* Actions Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleBulkRecovery}
            disabled={unpaidOrders.length === 0}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Recuperar Não Pagos ({unpaidOrders.length})
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            type="text"
            placeholder="Buscar por número do pedido ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="preparing">Preparando</SelectItem>
              <SelectItem value="shipping">Enviado</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="retail">Varejo</SelectItem>
              <SelectItem value="wholesale">Atacado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPayment} onValueChange={setFilterPayment}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            Todos ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="unpaid" className="text-red-600">
            Não Pagos ({unpaidOrders.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({orders.filter(o => ['pending', 'confirmed'].includes(o.status)).length})
          </TabsTrigger>
          <TabsTrigger value="shipped">
            Enviados ({orders.filter(o => ['shipping', 'delivered'].includes(o.status)).length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="space-y-4">

          {/* Vista Desktop - Tabela */}
          <div className="hidden lg:block">
            <OrdersTableMemo
              orders={filteredOrders}
              onViewOrder={handleViewOrder}
              onCancelOrder={handleCancelOrder}
              onSendFollowUp={handleRecoverUnpaidOrder}
              onPrintLabel={handlePrintLabel}
              onPrintDeclaration={handlePrintDeclaration}
              getOrderPaymentStatus={getOrderPaymentStatus}
              onStatusChange={updateOrderStatus}
            />
          </div>

          {/* Vista Mobile - Cards */}
          <div className="lg:hidden space-y-4">
            <OrdersGridMemo
              orders={filteredOrders}
              onViewOrder={handleViewOrder}
              onCancelOrder={handleCancelOrder}
              onSendFollowUp={handleRecoverUnpaidOrder}
              onPrintLabel={handlePrintLabel}
              onPrintDeclaration={handlePrintDeclaration}
              getOrderPaymentStatus={getOrderPaymentStatus}
            />
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package2 size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all' || filterPayment !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Aguardando os primeiros pedidos da sua loja'
                }
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes do Pedido */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              Detalhes do Pedido {selectedOrder && `#${selectedOrder.id.slice(-8)}`}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status e Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge>
                      {getStatusLabel(selectedOrder.status)}
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Tipo de Pedido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline">
                      <Tag className="h-4 w-4 mr-2" />
                      {selectedOrder.order_type === 'retail' ? 'Varejo' : 'Atacado'}
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Data do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">
                      {new Date(selectedOrder.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedOrder.created_at).toLocaleTimeString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
              </div>
              {/* Informações do Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Nome</Label>
                      <p>{selectedOrder.customer_name}</p>
                    </div>
                    {selectedOrder.customer_email && (
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p>{selectedOrder.customer_email}</p>
                      </div>
                    )}
                    {selectedOrder.customer_phone && (
                      <div>
                        <Label className="text-sm font-medium">Telefone</Label>
                        <p>{selectedOrder.customer_phone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              {/* Itens do Pedido */}
              <Card>
                <CardHeader>
                  <CardTitle>Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div key={item.product_id || idx} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {item.quantity}x R$ {item.price ? item.price.toFixed(2) : '-'}
                          </p>
                          {item.price && (
                            <p className="text-sm text-muted-foreground">
                              Total: R$ {(item.quantity * item.price).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {/* Resumo Financeiro */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>R$ {(selectedOrder.total_amount - (selectedOrder.shipping_cost || 0)).toFixed(2)}</span>
                    </div>
                    {selectedOrder.shipping_cost > 0 && (
                      <div className="flex justify-between">
                        <span>Frete:</span>
                        <span>R$ {selectedOrder.shipping_cost.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>R$ {selectedOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Endereço de Entrega */}
              {selectedOrder.shipping_address && (
                <Card>
                  <CardHeader>
                    <CardTitle>Endereço de Entrega</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      {selectedOrder.shipping_address.street}, {selectedOrder.shipping_address.number} <br />
                      {selectedOrder.shipping_address?.city} - {selectedOrder.shipping_address?.state} <br />
                      CEP: {selectedOrder.shipping_address?.zip_code}
                    </p>
                  </CardContent>
                </Card>
              )}
              {/* Ações */}
              <div className="flex gap-4">
                <Button onClick={() => handlePrintLabel(selectedOrder)} className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Etiqueta
                </Button>
                <Button onClick={() => handlePrintDeclaration(selectedOrder)} variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Declaração de Conteúdo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default OrdersImproved;

