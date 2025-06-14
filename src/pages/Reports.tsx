
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  ShoppingCart,
  Download,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

const Reports = () => {
  const navigate = useNavigate();

  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Relatórios', current: true },
  ];

  const reportCards = [
    {
      title: 'Vendas por Período',
      description: 'Análise de vendas diárias, semanais e mensais',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Produtos Mais Vendidos',
      description: 'Ranking dos produtos com melhor performance',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Análise de Pedidos',
      description: 'Status dos pedidos e tempo médio de processamento',
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <AppLayout 
      title="Relatórios" 
      subtitle="Análise de vendas e performance da sua loja"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Filtrar Período
            </Button>
            <Button className="btn-primary">
              <Download className="mr-2 h-4 w-4" />
              Exportar Dados
            </Button>
          </div>
        </div>

        {/* Cards de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCards.map((report, index) => {
            const Icon = report.icon;
            return (
              <Card key={index} className="card-modern hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${report.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{report.description}</p>
                  <Button variant="ghost" className="mt-4 p-0 h-auto font-medium text-blue-600">
                    Ver Relatório →
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Relatório Principal */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Visão Geral das Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Relatórios em Desenvolvimento
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Estamos preparando relatórios detalhados para ajudar você a acompanhar o desempenho da sua loja.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  📊 Em breve: Gráficos de vendas, análise de produtos e muito mais!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Reports;
