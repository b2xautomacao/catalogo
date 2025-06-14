
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart,
  DollarSign,
  Users,
  AlertTriangle,
  TrendingDown
} from 'lucide-react';
import { SalesMetrics, ProductMetrics, StockMetrics } from '@/hooks/useReports';
import { Skeleton } from '@/components/ui/skeleton';

interface ReportCardsProps {
  salesMetrics?: SalesMetrics;
  productMetrics?: ProductMetrics;
  stockMetrics?: StockMetrics;
  isLoadingSales: boolean;
  isLoadingProducts: boolean;
  isLoadingStock: boolean;
}

const ReportCards: React.FC<ReportCardsProps> = ({
  salesMetrics,
  productMetrics,
  stockMetrics,
  isLoadingSales,
  isLoadingProducts,
  isLoadingStock
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const cards = [
    // Vendas
    {
      title: 'Receita Total',
      value: salesMetrics ? formatCurrency(salesMetrics.totalRevenue) : '---',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      growth: salesMetrics?.revenueGrowth,
      loading: isLoadingSales,
      description: 'Vendas confirmadas'
    },
    {
      title: 'Total de Pedidos',
      value: salesMetrics?.totalOrders?.toString() || '---',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      growth: salesMetrics?.ordersGrowth,
      loading: isLoadingSales,
      description: 'Pedidos processados'
    },
    {
      title: 'Ticket Médio',
      value: salesMetrics ? formatCurrency(salesMetrics.avgOrderValue) : '---',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      loading: isLoadingSales,
      description: 'Valor médio por pedido'
    },
    // Produtos
    {
      title: 'Total de Produtos',
      value: productMetrics?.totalProducts?.toString() || '---',
      icon: Package,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      loading: isLoadingProducts,
      description: 'Produtos ativos'
    },
    {
      title: 'Estoque Baixo',
      value: productMetrics?.lowStockProducts?.toString() || '---',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      loading: isLoadingProducts,
      description: 'Produtos com estoque baixo',
      alert: (productMetrics?.lowStockProducts || 0) > 0
    },
    {
      title: 'Sem Estoque',
      value: productMetrics?.outOfStockProducts?.toString() || '---',
      icon: Package,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      loading: isLoadingProducts,
      description: 'Produtos esgotados',
      alert: (productMetrics?.outOfStockProducts || 0) > 0
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <Card key={index} className="card-modern hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {card.loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {card.value}
                    {card.alert && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Atenção
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                  
                  {card.growth !== undefined && !card.loading && (
                    <div className={`flex items-center text-xs ${
                      card.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.growth >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {formatPercentage(card.growth)}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ReportCards;
