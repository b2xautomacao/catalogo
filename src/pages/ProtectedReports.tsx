
import React from 'react';
import { BenefitGate } from '@/components/billing/BenefitGate';
import AppLayout from '@/components/layout/AppLayout';
import { useReports } from '@/hooks/useReports';

const ProtectedReports = () => {
  const { salesMetrics, productMetrics, isLoadingSales, isLoadingProducts } = useReports();

  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Relatórios', current: true }
  ];

  return (
    <AppLayout 
      title="Relatórios"
      subtitle="Análises detalhadas do seu negócio"
      breadcrumbs={breadcrumbs}
    >
      <BenefitGate 
        benefitKey="dedicated_support"
        customMessage="Os relatórios avançados estão disponíveis apenas no plano Premium. Obtenha insights valiosos do seu negócio!"
      >
        <div className="space-y-6">
          {/* Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-2">Vendas Totais</h3>
              {isLoadingSales ? (
                <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
              ) : (
                <p className="text-3xl font-bold text-green-600">
                  R$ {salesMetrics ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(salesMetrics.totalRevenue) : '0,00'}
                </p>
              )}
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-2">Produtos Ativos</h3>
              {isLoadingProducts ? (
                <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
              ) : (
                <p className="text-3xl font-bold text-blue-600">
                  {productMetrics?.totalProducts || 0}
                </p>
              )}
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-2">Pedidos</h3>
              <p className="text-3xl font-bold text-purple-600">
                {salesMetrics?.totalOrders || 0}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Chart */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-4">Vendas por Período</h3>
              {isLoadingSales ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center border rounded">
                  <p className="text-gray-600">Gráfico de vendas será exibido aqui</p>
                </div>
              )}
            </div>

            {/* Top Products Table */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-4">Produtos Mais Vendidos</h3>
              {isLoadingProducts ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {productMetrics?.topSellingProducts && productMetrics.topSellingProducts.length > 0 ? (
                    productMetrics.topSellingProducts.slice(0, 5).map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm">{index + 1}. {product.name}</span>
                        <span className="text-sm font-medium">{product.sales || 0} vendas</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-8">
                      Nenhum produto vendido ainda
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </BenefitGate>
    </AppLayout>
  );
};

export default ProtectedReports;
