
import React from 'react';
import { Plus, TrendingUp, Package, ShoppingCart, Users } from 'lucide-react';
import AppleDashboardLayout from './AppleDashboardLayout';
import AppleDashboardCard from './AppleDashboardCard';
import AppleQuickActions from './AppleQuickActions';
import AppleNavigationCard from './AppleNavigationCard';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useNavigate } from 'react-router-dom';
import '@/styles/dashboard-apple.css';

const StoreDashboard = () => {
  const navigate = useNavigate();
  const { data: metrics, isLoading } = useDashboardMetrics();

  const handleNewProduct = () => {
    navigate('/products?action=new');
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
        title="Dashboard da Loja"
        subtitle="Visão geral das suas vendas e produtos"
        actions={
          <button
            onClick={handleNewProduct}
            className="apple-button apple-button-primary"
          >
            <Plus size={16} />
            Novo Produto
          </button>
        }
      >
        {/* Métricas principais */}
        <div className="apple-grid apple-grid-cols-1 apple-grid-md-2 apple-grid-lg-4">
          <AppleDashboardCard
            title="Vendas do Mês"
            value={isLoading ? "..." : formatCurrency(metrics?.salesThisMonth || 0)}
            subtitle="vendas confirmadas"
            icon={TrendingUp}
            trend={metrics ? {
              value: Math.round(metrics.salesGrowth),
              isPositive: metrics.salesGrowth >= 0
            } : undefined}
            variant="green"
          />
          
          <AppleDashboardCard
            title="Pedidos Hoje"
            value={isLoading ? "..." : (metrics?.ordersToday || 0)}
            subtitle="novos pedidos"
            icon={ShoppingCart}
            trend={metrics ? {
              value: Math.round(metrics.ordersGrowth),
              isPositive: metrics.ordersGrowth >= 0
            } : undefined}
            variant="blue"
          />
          
          <AppleDashboardCard
            title="Produtos Ativos"
            value={isLoading ? "..." : (metrics?.activeProducts || 0)}
            subtitle="produtos disponíveis"
            icon={Package}
            trend={metrics ? {
              value: Math.round(metrics.productsGrowth),
              isPositive: metrics.productsGrowth >= 0
            } : undefined}
            variant="purple"
          />
          
          <AppleDashboardCard
            title="Visitantes"
            value={isLoading ? "..." : (metrics?.visitors || 0)}
            subtitle="acessos hoje"
            icon={Users}
            trend={metrics ? {
              value: Math.round(metrics.visitorsGrowth),
              isPositive: metrics.visitorsGrowth >= 0
            } : undefined}
            variant="orange"
          />
        </div>

        {/* Grid com navegação e ações rápidas */}
        <div className="apple-grid apple-grid-cols-1 apple-grid-lg-2">
          <AppleNavigationCard />
          <AppleQuickActions onNewProduct={handleNewProduct} />
        </div>
      </AppleDashboardLayout>
    </div>
  );
};

export default StoreDashboard;
