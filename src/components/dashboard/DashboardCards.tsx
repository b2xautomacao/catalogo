
import React from 'react';
import { TrendingUp, Package, ShoppingCart, Users, DollarSign } from 'lucide-react';
import ResponsiveDashboardCard from './ResponsiveDashboardCard';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useSuperadminMetrics } from '@/hooks/useSuperadminMetrics';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardCardsProps {
  userRole: 'superadmin' | 'admin';
}

const DashboardCards = ({ userRole }: DashboardCardsProps) => {
  const { data: storeMetrics, isLoading: storeLoading, error: storeError } = useDashboardMetrics();
  const { data: adminMetrics, isLoading: adminLoading, error: adminError } = useSuperadminMetrics();

  const isLoading = userRole === 'superadmin' ? adminLoading : storeLoading;
  const error = userRole === 'superadmin' ? adminError : storeError;

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="dashboard-skeleton rounded-2xl p-6 space-y-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Erro ao carregar métricas:', error);
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const adminStats = [
    {
      title: 'Vendas do Mês',
      value: storeMetrics ? formatCurrency(storeMetrics.salesThisMonth) : 'R$ 0,00',
      subtitle: 'vendas confirmadas',
      icon: DollarSign,
      trend: storeMetrics ? {
        value: Math.round(storeMetrics.salesGrowth),
        isPositive: storeMetrics.salesGrowth >= 0
      } : undefined,
      variant: 'success' as const
    },
    {
      title: 'Pedidos Hoje',
      value: storeMetrics?.ordersToday || 0,
      subtitle: 'novos pedidos',
      icon: ShoppingCart,
      trend: storeMetrics ? {
        value: Math.round(storeMetrics.ordersGrowth),
        isPositive: storeMetrics.ordersGrowth >= 0
      } : undefined,
      variant: 'primary' as const
    },
    {
      title: 'Produtos Ativos',
      value: storeMetrics?.activeProducts || 0,
      subtitle: 'produtos disponíveis',
      icon: Package,
      trend: storeMetrics ? {
        value: Math.round(storeMetrics.productsGrowth),
        isPositive: storeMetrics.productsGrowth >= 0
      } : undefined,
      variant: 'secondary' as const
    },
    {
      title: 'Visitantes',
      value: storeMetrics?.visitors || 0,
      subtitle: 'acessos hoje',
      icon: Users,
      trend: storeMetrics ? {
        value: Math.round(storeMetrics.visitorsGrowth),
        isPositive: storeMetrics.visitorsGrowth >= 0
      } : undefined,
      variant: 'warning' as const
    }
  ];

  const superadminStats = [
    {
      title: 'Total de Lojas',
      value: adminMetrics?.totalStores || 0,
      subtitle: 'lojas ativas',
      icon: Users,
      trend: adminMetrics ? {
        value: adminMetrics.storesGrowth,
        isPositive: adminMetrics.storesGrowth >= 0
      } : undefined,
      variant: 'primary' as const
    },
    {
      title: 'Receita Total',
      value: adminMetrics ? formatCurrency(adminMetrics.totalRevenue) : 'R$ 0,00',
      subtitle: 'receita mensal',
      icon: DollarSign,
      trend: adminMetrics ? {
        value: adminMetrics.revenueGrowth,
        isPositive: adminMetrics.revenueGrowth >= 0
      } : undefined,
      variant: 'success' as const
    },
    {
      title: 'Pedidos Hoje',
      value: adminMetrics?.ordersToday || 0,
      subtitle: 'pedidos no sistema',
      icon: ShoppingCart,
      trend: adminMetrics ? {
        value: adminMetrics.ordersGrowth,
        isPositive: adminMetrics.ordersGrowth >= 0
      } : undefined,
      variant: 'warning' as const
    },
    {
      title: 'Produtos Cadastrados',
      value: adminMetrics?.totalProducts || 0,
      subtitle: 'produtos no sistema',
      icon: Package,
      trend: adminMetrics ? {
        value: adminMetrics.productsGrowth,
        isPositive: adminMetrics.productsGrowth >= 0
      } : undefined,
      variant: 'secondary' as const
    }
  ];

  const stats = userRole === 'superadmin' ? superadminStats : adminStats;

  return (
    <div className="dashboard-container">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 dashboard-animate-in">
        {stats.map((stat, index) => (
          <ResponsiveDashboardCard
            key={index}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            trend={stat.trend}
            variant={stat.variant}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardCards;
