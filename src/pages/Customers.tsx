
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, Plus, Filter, Download, MessageSquare, 
  Users, TrendingUp, ShoppingBag, MapPin, Phone, Mail,
  Calendar, Star, MoreVertical, Edit, Trash2, UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  segment: 'vip' | 'regular' | 'new';
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  status: 'active' | 'inactive';
  notes: string;
  createdAt: string;
  birthDate?: string;
  preferences: string[];
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Maria Silva',
    email: 'maria@email.com',
    phone: '(11) 99999-9999',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    segment: 'vip',
    totalOrders: 24,
    totalSpent: 3450.80,
    lastOrder: '2024-01-10',
    status: 'active',
    notes: 'Cliente VIP, sempre compra produtos premium',
    createdAt: '2023-05-15',
    birthDate: '1985-03-20',
    preferences: ['Varejo', 'Produtos Premium']
  },
  {
    id: '2',
    name: 'João Santos',
    email: 'joao@empresa.com',
    phone: '(11) 88888-8888',
    address: 'Av. Principal, 456',
    city: 'Rio de Janeiro',
    segment: 'regular',
    totalOrders: 12,
    totalSpent: 1890.50,
    lastOrder: '2024-01-08',
    status: 'active',
    notes: 'Compra principalmente para revenda',
    createdAt: '2023-08-10',
    preferences: ['Atacado', 'Desconto']
  },
  {
    id: '3',
    name: 'Ana Costa',
    email: 'ana@email.com',
    phone: '(11) 77777-7777',
    address: 'Rua do Comércio, 789',
    city: 'Belo Horizonte',
    segment: 'new',
    totalOrders: 2,
    totalSpent: 245.90,
    lastOrder: '2024-01-05',
    status: 'active',
    notes: 'Cliente novo, potencial para crescimento',
    createdAt: '2024-01-01',
    preferences: ['Varejo']
  }
];

const Customers = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegment, setFilterSegment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);

  const filteredCustomers = mockCustomers.filter(customer => {
    const searchMatch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       customer.phone.includes(searchTerm);
    const segmentMatch = filterSegment === 'all' || customer.segment === filterSegment;
    const statusMatch = filterStatus === 'all' || customer.status === filterStatus;
    
    return searchMatch && segmentMatch && statusMatch;
  });

  const getSegmentBadge = (segment: string) => {
    const variants = {
      vip: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      regular: 'bg-blue-100 text-blue-800',
      new: 'bg-green-100 text-green-800'
    };
    const labels = {
      vip: 'VIP',
      regular: 'Regular',
      new: 'Novo'
    };
    return (
      <Badge className={variants[segment as keyof typeof variants]}>
        {labels[segment as keyof typeof labels]}
      </Badge>
    );
  };

  const totalCustomers = mockCustomers.length;
  const activeCustomers = mockCustomers.filter(c => c.status === 'active').length;
  const vipCustomers = mockCustomers.filter(c => c.segment === 'vip').length;
  const totalRevenue = mockCustomers.reduce((sum, c) => sum + c.totalSpent, 0);

  const handleExportCustomers = () => {
    toast({
      title: "Exportação iniciada",
      description: "Os dados dos clientes estão sendo preparados para download.",
    });
  };

  const handleSendMessage = (customer: Customer) => {
    toast({
      title: "Mensagem enviada",
      description: `Mensagem enviada para ${customer.name} via WhatsApp.`,
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua base de clientes</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportCustomers}>
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
          <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus size={16} className="mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" placeholder="Digite o nome" />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" placeholder="email@exemplo.com" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <Label htmlFor="segment">Segmento</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" placeholder="Rua, número, bairro" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea id="notes" placeholder="Notas sobre o cliente" />
                </div>
                <div className="col-span-2 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowAddCustomer(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => {
                    setShowAddCustomer(false);
                    toast({
                      title: "Cliente adicionado",
                      description: "Novo cliente cadastrado com sucesso.",
                    });
                  }}>
                    Salvar Cliente
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {activeCustomers} ativos
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes VIP</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vipCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {((vipCustomers / totalCustomers) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              Média: R$ {(totalRevenue / totalCustomers).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Totais</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCustomers.reduce((sum, c) => sum + c.totalOrders, 0)}</div>
            <p className="text-xs text-muted-foreground">
              Média: {(mockCustomers.reduce((sum, c) => sum + c.totalOrders, 0) / totalCustomers).toFixed(1)} por cliente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-modern">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterSegment} onValueChange={setFilterSegment}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Segmentos</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="new">Novo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="card-modern">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Último Pedido</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin size={12} />
                          {customer.city}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail size={12} />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone size={12} />
                          {customer.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSegmentBadge(customer.segment)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{customer.totalOrders}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        R$ {customer.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(customer.lastOrder).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendMessage(customer)}
                        >
                          <MessageSquare size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowCustomerDetails(true);
                          }}
                        >
                          <Edit size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={showCustomerDetails} onOpenChange={setShowCustomerDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do Cliente</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="orders">Pedidos</TabsTrigger>
                  <TabsTrigger value="analytics">Análise</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome Completo</Label>
                      <Input value={selectedCustomer.name} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={selectedCustomer.email} />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input value={selectedCustomer.phone} />
                    </div>
                    <div>
                      <Label>Segmento</Label>
                      <div className="pt-2">
                        {getSegmentBadge(selectedCustomer.segment)}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label>Endereço</Label>
                      <Input value={selectedCustomer.address} />
                    </div>
                    <div className="col-span-2">
                      <Label>Observações</Label>
                      <Textarea value={selectedCustomer.notes} />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="orders">
                  <div className="text-center py-8">
                    <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Histórico de Pedidos</h3>
                    <p className="text-muted-foreground">
                      {selectedCustomer.totalOrders} pedidos realizados
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="analytics">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Valor Médio por Pedido</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          R$ {(selectedCustomer.totalSpent / selectedCustomer.totalOrders).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Cliente desde</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {new Date(selectedCustomer.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
