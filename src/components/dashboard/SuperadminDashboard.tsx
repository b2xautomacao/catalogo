
import React from 'react';
import { Plus, TrendingUp, Store, Users, DollarSign, Package } from 'lucide-react';
import AppleDashboardLayout from './AppleDashboardLayout';
import AppleDashboardCard from './AppleDashboardCard';
import AppleNavigationCard from './AppleNavigationCard';
import { useSuperadminMetrics } from '@/hooks/useSuperadminMetrics';
import { useNavigate } from 'react-router-dom';
import '@/styles/dashboard-apple.css';

const SuperadminDashboard = () => {
  const navigate = useNavigate();
  const { data: metrics, isLoading } = useSuperadminMetrics();

  const handleNewStore = () => {
    navigate('/stores?action=new');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="dashboard-container">
      <AppleDashboardLayout
        title="Dashboard Administrativo"
        subtitle="Visão geral de todas as lojas do sistema"
        actions={
          <button
            onClick={handleNewStore}
            className="apple-button apple-button-primary"
          >
            <Plus size={16} />
            Nova Loja
          </button>
        }
      >
        {/* Métricas principais */}
        <div className="apple-grid apple-grid-cols-1 apple-grid-md-2 apple-grid-lg-4">
          <AppleDashboardCard
            title="Total de Lojas"
            value={isLoading ? "..." : (metrics?.totalStores || 0)}
            subtitle="lojas ativas"
            icon={Store}
            trend={metrics ? {
              value: metrics.storesGrowth,
              isPositive: metrics.storesGrowth >= 0
            } : undefined}
            variant="blue"
          />
          
          <AppleDashboardCard
            title="Receita Total"
            value={isLoading ? "..." : formatCurrency(metrics?.totalRevenue || 0)}
            subtitle="receita mensal"
            icon={DollarSign}
            trend={metrics ? {
              value: metrics.revenueGrowth,
              isPositive: metrics.revenueGrowth >= 0
            } : undefined}
            variant="green"
          />
          
          <AppleDashboardCard
            title="Pedidos Hoje"
            value={isLoading ? "..." : (metrics?.ordersToday || 0)}
            subtitle="pedidos no sistema"
            icon={TrendingUp}
            trend={metrics ? {
              value: metrics.ordersGrowth,
              isPositive: metrics.ordersGrowth >= 0
            } : undefined}
            variant="orange"
          />
          
          <AppleDashboardCard
            title="Produtos Cadastrados"
            value={isLoading ? "..." : (metrics?.totalProducts || 0)}
            subtitle="produtos no sistema"
            icon={Package}
            trend={metrics ? {
              value: metrics.productsGrowth,
              isPositive: metrics.productsGrowth >= 0
            } : undefined}
            variant="purple"
          />
        </div>

        {/* Grid com navegação */}
        <div className="apple-grid apple-grid-cols-1">
          <AppleNavigationCard />
        </div>
      </AppleDashboardLayout>
    </div>
  );
};

export default SuperadminDashboard;
