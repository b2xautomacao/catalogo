
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useReports } from '@/hooks/useReports';
import ReportCards from '@/components/reports/ReportCards';
import SalesChart from '@/components/reports/SalesChart';
import TopProductsTable from '@/components/reports/TopProductsTable';
import DateRangeSelector from '@/components/reports/DateRangeSelector';

const Reports = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('30d');
  
  const {
    salesMetrics,
    productMetrics,
    stockMetrics,
    salesData,
    isLoadingSales,
    isLoadingProducts,
    isLoadingStock,
    isLoadingSalesData,
    refetchAll
  } = useReports(dateRange);

  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Relatórios', current: true },
  ];

  const handleExport = () => {
    // TODO: Implementar exportação de dados
    console.log('Exportando relatórios...');
  };

  const handleRefresh = () => {
    refetchAll();
  };

  return (
    <AppLayout 
      title="Relatórios" 
      subtitle="Análise de vendas e performance da sua loja"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button className="btn-primary" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Dados
            </Button>
          </div>
        </div>

        {/* Cards de Métricas */}
        <ReportCards
          salesMetrics={salesMetrics}
          productMetrics={productMetrics}
          stockMetrics={stockMetrics}
          isLoadingSales={isLoadingSales}
          isLoadingProducts={isLoadingProducts}
          isLoadingStock={isLoadingStock}
        />

        {/* Gráficos de Vendas */}
        <SalesChart 
          data={salesData}
          isLoading={isLoadingSalesData}
          dateRange={dateRange}
        />

        {/* Tabelas de Produtos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopProductsTable
            productMetrics={productMetrics}
            isLoading={isLoadingProducts}
          />

          {/* Movimentações de Estoque Recentes */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Movimentações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {stockMetrics?.recentMovements && stockMetrics.recentMovements.length > 0 ? (
                <div className="space-y-3">
                  {stockMetrics.recentMovements.slice(0, 5).map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{movement.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {movement.movement_type === 'sale' ? 'Venda' :
                           movement.movement_type === 'reservation' ? 'Reserva' :
                           movement.movement_type === 'return' ? 'Devolução' :
                           movement.movement_type === 'adjustment' ? 'Ajuste' : 'Liberação'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {movement.movement_type === 'sale' || movement.movement_type === 'reservation' ? '-' : '+'}
                          {movement.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(movement.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Sem movimentações recentes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Resumo do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {salesMetrics?.totalOrders || 0}
                </p>
                <p className="text-sm text-blue-800">Total de Pedidos</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {salesMetrics ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(salesMetrics.totalRevenue) : 'R$ 0,00'}
                </p>
                <p className="text-sm text-green-800">Receita Total</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {salesMetrics ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(salesMetrics.avgOrderValue) : 'R$ 0,00'}
                </p>
                <p className="text-sm text-purple-800">Ticket Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Reports;
