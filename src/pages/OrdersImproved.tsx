import React, { useState, useEffect } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AppLayout from '@/components/layout/AppLayout';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  variation?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'unpaid';
  order_type: 'retail' | 'wholesale';
  total_amount: number;
  shipping_cost: number;
  discount_amount: number;
  items: OrderItem[];
  shipping_address?: {
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    zip_code: string;
  };
  shipping_method: string;
  tracking_code?: string;
  notes?: string;
  payment_method?: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  due_date?: string;
}

const OrdersImproved = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);

  // Mock data expandido - em produção virá do banco
  const mockOrders: Order[] = [
    {
      id: '1',
      order_number: '#PED-001',
      customer_name: 'João Silva',
      customer_email: 'joao@email.com',
      customer_phone: '(11) 99999-9999',
      status: 'confirmed',
      order_type: 'retail',
      total_amount: 149.90,
      shipping_cost: 15.00,
      discount_amount: 0,
      payment_method: 'PIX',
      payment_status: 'paid',
      items: [
        { id: '1', name: 'Camiseta Premium', quantity: 2, price: 49.90, variation: 'Azul - M' },
        { id: '2', name: 'Calça Jeans', quantity: 1, price: 89.90 }
      ],
      shipping_address: {
        street: 'Rua das Flores',
        number: '123',
        district: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567'
      },
      shipping_method: 'PAC',
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      order_number: '#PED-002',
      customer_name: 'Maria Santos',
      customer_phone: '(11) 88888-8888',
      status: 'shipped',
      order_type: 'wholesale',
      total_amount: 450.00,
      shipping_cost: 25.00,
      discount_amount: 50.00,
      payment_method: 'Boleto',
      payment_status: 'paid',
      items: [
        { id: '3', name: 'Kit 10 Camisetas', quantity: 1, price: 250.00 },
        { id: '4', name: 'Kit 5 Bermudas', quantity: 1, price: 200.00 }
      ],
      shipping_method: 'SEDEX',
      tracking_code: 'BR123456789BR',
      created_at: '2024-01-14T14:20:00Z'
    },
    {
      id: '3',
      order_number: '#PED-003',
      customer_name: 'Pedro Costa',
      customer_email: 'pedro@email.com',
      customer_phone: '(11) 77777-7777',
      status: 'unpaid',
      order_type: 'retail',
      total_amount: 89.90,
      shipping_cost: 12.00,
      discount_amount: 0,
      payment_method: 'Boleto',
      payment_status: 'pending',
      items: [
        { id: '5', name: 'Tênis Esportivo', quantity: 1, price: 89.90 }
      ],
      shipping_method: 'PAC',
      created_at: '2024-01-13T16:45:00Z',
      due_date: '2024-01-20T23:59:59Z'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <Package2 className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      case 'unpaid': return <CreditCard className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'Preparando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      case 'unpaid': return 'Não Pago';
      default: return 'Desconhecido';
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status?: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'failed': return 'Falhou';
      case 'refunded': return 'Reembolsado';
      default: return 'N/A';
    }
  };

  const filteredOrders = mockOrders.filter(order => {
    const searchMatch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus === 'all' || order.status === filterStatus;
    const typeMatch = filterType === 'all' || order.order_type === filterType;
    const paymentMatch = filterPayment === 'all' || order.payment_status === filterPayment;
    
    // Filtros por aba
    let tabMatch = true;
    if (activeTab === 'unpaid') {
      tabMatch = order.payment_status === 'pending' || order.status === 'unpaid';
    } else if (activeTab === 'pending') {
      tabMatch = order.status === 'pending' || order.status === 'confirmed';
    } else if (activeTab === 'shipped') {
      tabMatch = order.status === 'shipped' || order.status === 'delivered';
    }
    
    return searchMatch && statusMatch && typeMatch && paymentMatch && tabMatch;
  });

  const unpaidOrders = mockOrders.filter(order => 
    order.payment_status === 'pending' || order.status === 'unpaid'
  );

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handlePrintLabel = (order: Order) => {
    // Integração com Melhor Envio
    alert(`Imprimir etiqueta para pedido ${order.order_number}`);
  };

  const handlePrintDeclaration = (order: Order) => {
    // Gerar declaração de conteúdo
    alert(`Imprimir declaração de conteúdo para pedido ${order.order_number}`);
  };

  const handleRecoverUnpaidOrder = (order: Order) => {
    // Enviar cobrança via WhatsApp ou email
    alert(`Enviando cobrança para ${order.customer_name} - ${order.order_number}`);
  };

  const handleBulkRecovery = () => {
    setLoading(true);
    // Simular processamento em lote
    setTimeout(() => {
      alert(`Enviando cobranças para ${unpaidOrders.length} pedidos não pagos`);
      setLoading(false);
    }, 2000);
  };

  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Pedidos', current: true }
  ];

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
            disabled={loading || unpaidOrders.length === 0}
          >
            {loading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
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
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
              <SelectItem value="unpaid">Não Pago</SelectItem>
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
              <SelectItem value="failed">Falhou</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            Todos ({mockOrders.length})
          </TabsTrigger>
          <TabsTrigger value="unpaid" className="text-red-600">
            Não Pagos ({unpaidOrders.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({mockOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').length})
          </TabsTrigger>
          <TabsTrigger value="shipped">
            Enviados ({mockOrders.filter(o => o.status === 'shipped' || o.status === 'delivered').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Vista Desktop - Tabela */}
          <div className="hidden lg:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.order_number}
                        {order.tracking_code && (
                          <div className="text-xs text-muted-foreground">
                            {order.tracking_code}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          {order.customer_phone && (
                            <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{getStatusText(order.status)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentStatusColor(order.payment_status)}>
                          {getPaymentStatusText(order.payment_status)}
                        </Badge>
                        {order.payment_method && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {order.payment_method}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.order_type === 'retail' ? 'Varejo' : 'Atacado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">R$ {order.total_amount.toFixed(2)}</div>
                        {order.shipping_cost > 0 && (
                          <div className="text-xs text-muted-foreground">
                            + R$ {order.shipping_cost.toFixed(2)} frete
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleTimeString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(order.payment_status === 'pending' || order.status === 'unpaid') && (
                                <DropdownMenuItem onClick={() => handleRecoverUnpaidOrder(order)}>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Cobrar Pagamento
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handlePrintLabel(order)}>
                                <Printer className="h-4 w-4 mr-2" />
                                Etiqueta
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintDeclaration(order)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Declaração
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Vista Mobile - Cards */}
          <div className="lg:hidden space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{order.order_number}</h3>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{getStatusText(order.status)}</span>
                        </Badge>
                        <Badge className={getPaymentStatusColor(order.payment_status)}>
                          {getPaymentStatusText(order.payment_status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Cliente</p>
                        <p className="font-medium">{order.customer_name}</p>
                        {order.customer_phone && (
                          <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-bold text-lg">R$ {order.total_amount.toFixed(2)}</p>
                        {order.shipping_cost > 0 && (
                          <p className="text-xs text-muted-foreground">
                            + R$ {order.shipping_cost.toFixed(2)} frete
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                      
                      {(order.payment_status === 'pending' || order.status === 'unpaid') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRecoverUnpaidOrder(order)}
                          className="text-red-600"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Cobrar
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePrintLabel(order)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Etiqueta
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrintDeclaration(order)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Declaração
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
              Detalhes do Pedido {selectedOrder?.order_number}
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
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="ml-2">{getStatusText(selectedOrder.status)}</span>
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
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.variation && (
                            <p className="text-sm text-muted-foreground">{item.variation}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {item.quantity}x R$ {item.price.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Total: R$ {(item.quantity * item.price).toFixed(2)}
                          </p>
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
                      <span>R$ {(selectedOrder.total_amount - selectedOrder.shipping_cost + selectedOrder.discount_amount).toFixed(2)}</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto:</span>
                        <span>-R$ {selectedOrder.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.shipping_cost > 0 && (
                      <div className="flex justify-between">
                        <span>Frete ({selectedOrder.shipping_method}):</span>
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
                      {selectedOrder.shipping_address.street}, {selectedOrder.shipping_address.number}<br/>
                      {selectedOrder.shipping_address.district}<br/>
                      {selectedOrder.shipping_address.city} - {selectedOrder.shipping_address.state}<br/>
                      CEP: {selectedOrder.shipping_address.zip_code}
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
