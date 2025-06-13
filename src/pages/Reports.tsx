
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Tag,
  Download, CalendarIcon, Filter, BarChart3, PieChart as PieChartIcon,
  LineChart as LineChartIcon, Activity, Target, Award, Package
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock data for charts
const salesData = [
  { month: 'Jan', revenue: 12500, orders: 45, customers: 38 },
  { month: 'Fev', revenue: 18900, orders: 67, customers: 52 },
  { month: 'Mar', revenue: 15600, orders: 58, customers: 48 },
  { month: 'Abr', revenue: 22300, orders: 89, customers: 71 },
  { month: 'Mai', revenue: 28700, orders: 102, customers: 86 },
  { month: 'Jun', revenue: 25400, orders: 94, customers: 78 }
];

const productData = [
  { name: 'Produto A', sales: 45, revenue: 4500 },
  { name: 'Produto B', sales: 32, revenue: 3200 },
  { name: 'Produto C', sales: 28, revenue: 2800 },
  { name: 'Produto D', sales: 24, revenue: 2400 },
  { name: 'Produto E', sales: 18, revenue: 1800 }
];

const categoryData = [
  { name: 'Eletrônicos', value: 35, color: '#0088FE' },
  { name: 'Roupas', value: 25, color: '#00C49F' },
  { name: 'Casa & Jardim', value: 20, color: '#FFBB28' },
  { name: 'Livros', value: 12, color: '#FF8042' },
  { name: 'Outros', value: 8, color: '#8884d8' }
];

const dailySalesData = [
  { day: '01', orders: 12, revenue: 1200 },
  { day: '02', orders: 15, revenue: 1500 },
  { day: '03', orders: 8, revenue: 800 },
  { day: '04', orders: 22, revenue: 2200 },
  { day: '05', orders: 18, revenue: 1800 },
  { day: '06', orders: 25, revenue: 2500 },
  { day: '07', orders: 30, revenue: 3000 }
];

const couponData = [
  { code: 'BEMVINDO10', uses: 234, discount: 2340 },
  { code: 'VIP20', uses: 89, discount: 1780 },
  { code: 'FRETE25', uses: 156, discount: 3900 },
  { code: 'NATAL15', uses: 78, discount: 1170 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Reports = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [reportType, setReportType] = useState('sales');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = salesData.reduce((sum, item) => sum + item.orders, 0);
  const totalCustomers = salesData.reduce((sum, item) => sum + item.customers, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  const revenueGrowth = ((salesData[salesData.length - 1].revenue - salesData[salesData.length - 2].revenue) / salesData[salesData.length - 2].revenue) * 100;
  const orderGrowth = ((salesData[salesData.length - 1].orders - salesData[salesData.length - 2].orders) / salesData[salesData.length - 2].orders) * 100;

  const handleExportReport = () => {
    console.log('Exportando relatório...');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios e Análises</h1>
          <p className="text-muted-foreground">Insights detalhados sobre sua loja</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportReport}>
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {revenueGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={revenueGrowth > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(revenueGrowth).toFixed(1)}%
              </span>
              vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {orderGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={orderGrowth > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(orderGrowth).toFixed(1)}%
              </span>
              vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {(totalCustomers / totalOrders * 100).toFixed(1)}% de conversão
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {avgOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Por pedido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs value={reportType} onValueChange={setReportType} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="coupons">Cupons</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon size={20} />
                  Receita Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `R$ ${value}` : value,
                        name === 'revenue' ? 'Receita' : 'Pedidos'
                      ]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Receita" />
                    <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="Pedidos" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Sales */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 size={20} />
                  Vendas Diárias (Últimos 7 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailySalesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `R$ ${value}` : value,
                        name === 'revenue' ? 'Receita' : 'Pedidos'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="orders" fill="#8884d8" name="Pedidos" />
                    <Bar dataKey="revenue" fill="#82ca9d" name="Receita" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Sales Summary */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Resumo de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">R$ 28.700</div>
                  <div className="text-sm text-muted-foreground">Melhor mês</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">102</div>
                  <div className="text-sm text-muted-foreground">Mais pedidos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">86</div>
                  <div className="text-sm text-muted-foreground">Mais clientes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">R$ 281</div>
                  <div className="text-sm text-muted-foreground">Maior ticket médio</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package size={20} />
                  Produtos Mais Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value) => [`${value} vendas`, 'Vendas']} />
                    <Bar dataKey="sales" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon size={20} />
                  Distribuição por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Product Performance Table */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Performance de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productData.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.sales} vendas</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">R$ {product.revenue.toLocaleString('pt-BR')}</div>
                      <div className="text-sm text-muted-foreground">receita</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Growth */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} />
                  Crescimento de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} clientes`, 'Novos Clientes']} />
                    <Area type="monotone" dataKey="customers" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Customer Segments */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Segmentos de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-purple-100 text-purple-800">VIP</Badge>
                      <span>Clientes VIP</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">15</div>
                      <div className="text-sm text-muted-foreground">12% do total</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-100 text-blue-800">Regular</Badge>
                      <span>Clientes Regulares</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">89</div>
                      <div className="text-sm text-muted-foreground">71% do total</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-100 text-green-800">Novo</Badge>
                      <span>Novos Clientes</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">21</div>
                      <div className="text-sm text-muted-foreground">17% do total</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coupon Usage */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag size={20} />
                  Uso de Cupons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={couponData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="code" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'discount' ? `R$ ${value}` : value,
                      name === 'discount' ? 'Desconto Total' : 'Usos'
                    ]} />
                    <Legend />
                    <Bar dataKey="uses" fill="#8884d8" name="Usos" />
                    <Bar dataKey="discount" fill="#82ca9d" name="Desconto (R$)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Coupon Performance */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Performance de Cupons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {couponData.map((coupon) => (
                    <div key={coupon.code} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {coupon.code}
                        </code>
                        <div className="text-sm text-muted-foreground mt-1">
                          {coupon.uses} usos
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">R$ {coupon.discount}</div>
                        <div className="text-sm text-muted-foreground">desconto total</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-sm">Taxa de Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.2%</div>
                <p className="text-xs text-muted-foreground">visitantes → compradores</p>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-sm">Taxa de Abandono</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68.5%</div>
                <p className="text-xs text-muted-foreground">carrinho abandonado</p>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-sm">Tempo Médio no Site</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4:32</div>
                <p className="text-xs text-muted-foreground">minutos por sessão</p>
                <div className="flex items-center gap-1 text-xs text-green-500 mt-2">
                  <TrendingUp className="h-3 w-3" />
                  +12% vs mês anterior
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-sm">Avaliação Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.7</div>
                <p className="text-xs text-muted-foreground">⭐⭐⭐⭐⭐</p>
                <p className="text-xs text-muted-foreground mt-1">basado em 156 avaliações</p>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-sm">Produtos em Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">234</div>
                <p className="text-xs text-muted-foreground">12 com estoque baixo</p>
                <Badge variant="secondary" className="mt-2">Alerta</Badge>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-sm">Crescimento MoM</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+24.5%</div>
                <p className="text-xs text-muted-foreground">crescimento mensal</p>
                <div className="flex items-center gap-1 text-xs text-green-500 mt-2">
                  <TrendingUp className="h-3 w-3" />
                  Tendência positiva
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
