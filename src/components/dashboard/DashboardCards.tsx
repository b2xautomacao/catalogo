
import React from 'react';
import { TrendingUp, Package, ShoppingCart, Users, DollarSign, Store } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useSuperadminMetrics } from '@/hooks/useSuperadminMetrics';

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
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
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100'
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
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100'
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
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100'
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
      color: 'bg-orange-50 text-orange-600',
      iconBg: 'bg-orange-100'
    }
  ];

  const superadminStats = [
    {
      title: 'Total de Lojas',
      value: adminMetrics?.totalStores || 0,
      subtitle: 'lojas ativas',
      icon: Store,
      trend: adminMetrics ? {
        value: adminMetrics.storesGrowth,
        isPositive: adminMetrics.storesGrowth >= 0
      } : undefined,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100'
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
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100'
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
      color: 'bg-orange-50 text-orange-600',
      iconBg: 'bg-orange-100'
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
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100'
    }
  ];

  const stats = userRole === 'superadmin' ? superadminStats : adminStats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${stat.iconBg}`}>
              <stat.icon className={`h-6 w-6 ${stat.color.split(' ')[1]}`} />
            </div>
            {stat.trend && (
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <span>{stat.trend.isPositive ? '↗' : '↘'}</span>
                <span>{Math.abs(stat.trend.value)}%</span>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
            {stat.subtitle && (
              <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardCards;
