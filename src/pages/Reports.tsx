import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { formatCurrency } from '@/lib/utils';

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const {
    salesMetrics,
    productMetrics,
    stockMetrics,
    isLoadingSales,
    isLoadingProducts,
    isLoadingStock,
    refetchAll,
  } = useReports(dateRange);

  const dateRangeLabels: Record<string, string> = {
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
    '90d': 'Últimos 90 dias',
    '1y': 'Último ano',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-sm text-gray-500">Dados e insights da sua loja</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refetchAll}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Métricas de Vendas */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Vendas — {dateRangeLabels[dateRange]}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isLoadingSales ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Receita Total</p>
                      <p className="text-2xl font-bold mt-1">
                        {salesMetrics ? formatCurrency(salesMetrics.totalRevenue) : 'R$ 0,00'}
                      </p>
                    </div>
                    <DollarSign className="w-5 h-5 text-green-500 mt-1" />
                  </div>
                  {salesMetrics && salesMetrics.revenueGrowth !== 0 && (
                    <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${salesMetrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {salesMetrics.revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(salesMetrics.revenueGrowth).toFixed(1)}% vs período anterior
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Pedidos</p>
                      <p className="text-2xl font-bold mt-1">
                        {salesMetrics?.totalOrders ?? 0}
                      </p>
                    </div>
                    <ShoppingCart className="w-5 h-5 text-blue-500 mt-1" />
                  </div>
                  {salesMetrics && salesMetrics.ordersGrowth !== 0 && (
                    <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${salesMetrics.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {salesMetrics.ordersGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(salesMetrics.ordersGrowth).toFixed(1)}% vs período anterior
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Ticket Médio</p>
                      <p className="text-2xl font-bold mt-1">
                        {salesMetrics ? formatCurrency(salesMetrics.avgOrderValue) : 'R$ 0,00'}
                      </p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-purple-500 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Métricas de Produtos */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Estoque</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isLoadingProducts ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total de Produtos</p>
                      <p className="text-2xl font-bold mt-1">{productMetrics?.totalProducts ?? 0}</p>
                    </div>
                    <Package className="w-5 h-5 text-gray-400 mt-1" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Estoque Baixo</p>
                      <p className="text-2xl font-bold mt-1 text-yellow-600">{productMetrics?.lowStockProducts ?? 0}</p>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-1" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Sem Estoque</p>
                      <p className="text-2xl font-bold mt-1 text-red-600">{productMetrics?.outOfStockProducts ?? 0}</p>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Top Produtos */}
      {!isLoadingProducts && productMetrics?.topSellingProducts && productMetrics.topSellingProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {productMetrics.topSellingProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-5">#{index + 1}</span>
                    <span className="text-sm font-medium text-gray-900">{product.name}</span>
                  </div>
                  <Badge variant="secondary">{product.sales} vendas</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Movimentações Recentes de Estoque */}
      {!isLoadingStock && stockMetrics?.recentMovements && stockMetrics.recentMovements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Movimentações de Estoque Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stockMetrics.recentMovements.map((mov) => (
                <div key={mov.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <span className="font-medium text-gray-800">{mov.product_name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={mov.movement_type === 'sale' ? 'default' : 'outline'}>
                      {mov.movement_type === 'sale' ? 'Venda' : mov.movement_type}
                    </Badge>
                    <span className="text-gray-500">{mov.quantity} un.</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {!isLoadingSales && salesMetrics?.totalOrders === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma venda no período selecionado</p>
            <p className="text-gray-400 text-sm mt-1">Tente selecionar um período maior</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;
