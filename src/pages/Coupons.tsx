
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
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, Plus, Copy, Download, Tag, 
  TrendingUp, Users, ShoppingBag, CalendarIcon,
  Edit, Trash2, Eye, BarChart3, Percent
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  category: 'general' | 'vip' | 'new_customer' | 'seasonal';
  createdAt: string;
  customerSegments: string[];
}

const mockCoupons: Coupon[] = [
  {
    id: '1',
    code: 'BEMVINDO10',
    description: 'Desconto de boas-vindas para novos clientes',
    type: 'percentage',
    value: 10,
    minOrderValue: 50,
    maxDiscount: 20,
    usageLimit: 1000,
    usedCount: 234,
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    isActive: true,
    category: 'new_customer',
    createdAt: '2024-01-01',
    customerSegments: ['new']
  },
  {
    id: '2',
    code: 'VIP20',
    description: 'Desconto exclusivo para clientes VIP',
    type: 'percentage',
    value: 20,
    minOrderValue: 200,
    maxDiscount: 100,
    usageLimit: 500,
    usedCount: 89,
    validFrom: '2024-01-01',
    validUntil: '2024-06-30',
    isActive: true,
    category: 'vip',
    createdAt: '2024-01-01',
    customerSegments: ['vip']
  },
  {
    id: '3',
    code: 'FRETE25',
    description: 'R$ 25 de desconto no frete',
    type: 'fixed',
    value: 25,
    minOrderValue: 100,
    usageLimit: 2000,
    usedCount: 456,
    validFrom: '2024-01-15',
    validUntil: '2024-03-15',
    isActive: false,
    category: 'general',
    createdAt: '2024-01-15',
    customerSegments: ['regular', 'vip']
  }
];

const Coupons = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showCouponDetails, setShowCouponDetails] = useState(false);
  const [validFrom, setValidFrom] = useState<Date>();
  const [validUntil, setValidUntil] = useState<Date>();

  const filteredCoupons = mockCoupons.filter(coupon => {
    const searchMatch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = filterCategory === 'all' || coupon.category === filterCategory;
    const statusMatch = filterStatus === 'all' || 
                       (filterStatus === 'active' && coupon.isActive) ||
                       (filterStatus === 'inactive' && !coupon.isActive);
    
    return searchMatch && categoryMatch && statusMatch;
  });

  const getCategoryBadge = (category: string) => {
    const variants = {
      general: 'bg-blue-100 text-blue-800',
      vip: 'bg-purple-100 text-purple-800',
      new_customer: 'bg-green-100 text-green-800',
      seasonal: 'bg-orange-100 text-orange-800'
    };
    const labels = {
      general: 'Geral',
      vip: 'VIP',
      new_customer: 'Novo Cliente',
      seasonal: 'Sazonal'
    };
    return (
      <Badge className={variants[category as keyof typeof variants]}>
        {labels[category as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? 'Ativo' : 'Inativo'}
      </Badge>
    );
  };

  const totalCoupons = mockCoupons.length;
  const activeCoupons = mockCoupons.filter(c => c.isActive).length;
  const totalUsed = mockCoupons.reduce((sum, c) => sum + c.usedCount, 0);
  const conversionRate = ((totalUsed / mockCoupons.reduce((sum, c) => sum + c.usageLimit, 0)) * 100);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado",
      description: `O código ${code} foi copiado para a área de transferência.`,
    });
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Cupons de Desconto</h1>
          <p className="text-muted-foreground">Gerencie promoções e descontos</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
          <Dialog open={showAddCoupon} onOpenChange={setShowAddCoupon}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} className="mr-2" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Cupom</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="code">Código do Cupom</Label>
                    <div className="flex gap-2">
                      <Input id="code" placeholder="Digite o código" />
                      <Button type="button" variant="outline" onClick={() => {
                        const input = document.getElementById('code') as HTMLInputElement;
                        if (input) input.value = generateCouponCode();
                      }}>
                        Gerar
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" placeholder="Descreva o cupom" />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo de Desconto</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="value">Valor do Desconto</Label>
                    <Input id="value" type="number" placeholder="0" />
                  </div>
                  <div>
                    <Label htmlFor="minOrder">Pedido Mínimo (R$)</Label>
                    <Input id="minOrder" type="number" placeholder="0" />
                  </div>
                  <div>
                    <Label htmlFor="maxDiscount">Desconto Máximo (R$)</Label>
                    <Input id="maxDiscount" type="number" placeholder="Opcional" />
                  </div>
                  <div>
                    <Label htmlFor="usageLimit">Limite de Uso</Label>
                    <Input id="usageLimit" type="number" placeholder="0 = ilimitado" />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Geral</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="new_customer">Novo Cliente</SelectItem>
                        <SelectItem value="seasonal">Sazonal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data de Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {validFrom ? format(validFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={validFrom}
                          onSelect={setValidFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Data de Expiração</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {validUntil ? format(validUntil, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={validUntil}
                          onSelect={setValidUntil}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="col-span-2 flex items-center space-x-2">
                    <Switch id="active" />
                    <Label htmlFor="active">Cupom ativo</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowAddCoupon(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => {
                    setShowAddCoupon(false);
                    toast({
                      title: "Cupom criado",
                      description: "Novo cupom de desconto criado com sucesso.",
                    });
                  }}>
                    Criar Cupom
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
            <CardTitle className="text-sm font-medium">Total de Cupons</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCoupons}</div>
            <p className="text-xs text-muted-foreground">
              {activeCoupons} ativos
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupons Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCoupons}</div>
            <p className="text-xs text-muted-foreground">
              {((activeCoupons / totalCoupons) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsed}</div>
            <p className="text-xs text-muted-foreground">
              Cupons utilizados
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Taxa de utilização
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
                placeholder="Buscar por código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                <SelectItem value="general">Geral</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="new_customer">Novo Cliente</SelectItem>
                <SelectItem value="seasonal">Sazonal</SelectItem>
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

      {/* Coupons Table */}
      <Card className="card-modern">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.map((coupon) => (
                  <TableRow key={coupon.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCoupon(coupon.code)}
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{coupon.description}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {coupon.type === 'percentage' ? (
                          <>
                            <Percent size={14} />
                            {coupon.value}%
                          </>
                        ) : (
                          <>R$ {coupon.value}</>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(coupon.category)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{coupon.usedCount} / {coupon.usageLimit === 0 ? '∞' : coupon.usageLimit}</div>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-primary h-1.5 rounded-full" 
                            style={{ 
                              width: coupon.usageLimit === 0 ? '0%' : `${(coupon.usedCount / coupon.usageLimit) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Até {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(coupon.isActive)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCoupon(coupon);
                            setShowCouponDetails(true);
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <BarChart3 size={16} />
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

      {/* Coupon Details Dialog */}
      <Dialog open={showCouponDetails} onOpenChange={setShowCouponDetails}>
        <DialogContent className="max-w-2xl">
          {selectedCoupon && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do Cupom</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <code className="bg-muted px-3 py-2 rounded text-lg font-mono">
                      {selectedCoupon.code}
                    </code>
                  </div>
                  <div className="flex gap-2">
                    {getCategoryBadge(selectedCoupon.category)}
                    {getStatusBadge(selectedCoupon.isActive)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Descrição</Label>
                    <p className="text-sm mt-1">{selectedCoupon.description}</p>
                  </div>
                  <div>
                    <Label>Tipo de Desconto</Label>
                    <p className="text-sm mt-1">
                      {selectedCoupon.type === 'percentage' 
                        ? `${selectedCoupon.value}% de desconto`
                        : `R$ ${selectedCoupon.value} de desconto`
                      }
                    </p>
                  </div>
                  <div>
                    <Label>Pedido Mínimo</Label>
                    <p className="text-sm mt-1">R$ {selectedCoupon.minOrderValue}</p>
                  </div>
                  <div>
                    <Label>Desconto Máximo</Label>
                    <p className="text-sm mt-1">
                      {selectedCoupon.maxDiscount ? `R$ ${selectedCoupon.maxDiscount}` : 'Sem limite'}
                    </p>
                  </div>
                  <div>
                    <Label>Usos</Label>
                    <p className="text-sm mt-1">
                      {selectedCoupon.usedCount} / {selectedCoupon.usageLimit === 0 ? 'Ilimitado' : selectedCoupon.usageLimit}
                    </p>
                  </div>
                  <div>
                    <Label>Validade</Label>
                    <p className="text-sm mt-1">
                      {new Date(selectedCoupon.validFrom).toLocaleDateString('pt-BR')} até{' '}
                      {new Date(selectedCoupon.validUntil).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label>Estatísticas de Uso</Label>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{selectedCoupon.usedCount}</div>
                      <div className="text-xs text-muted-foreground">Usos Totais</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {selectedCoupon.usageLimit === 0 ? '∞' : selectedCoupon.usageLimit - selectedCoupon.usedCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Usos Restantes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {selectedCoupon.usageLimit === 0 ? '0' : 
                         ((selectedCoupon.usedCount / selectedCoupon.usageLimit) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Taxa de Uso</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Coupons;
