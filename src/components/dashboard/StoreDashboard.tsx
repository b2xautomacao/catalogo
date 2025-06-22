
import React from 'react';
import { Plus } from 'lucide-react';
import DashboardCards from './DashboardCards';
import AppleQuickActions from './AppleQuickActions';
import AppleNavigationCard from './AppleNavigationCard';
import { useNavigate } from 'react-router-dom';

const StoreDashboard = () => {
  const navigate = useNavigate();

  const handleNewProduct = () => {
    navigate('/products?action=new');
  };

  return (
    <div className="space-y-6">
      {/* Header com ação */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral das suas vendas e produtos</p>
        </div>
        <button
          onClick={handleNewProduct}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Novo Produto
        </button>
      </div>

      {/* Métricas principais */}
      <DashboardCards userRole="admin" />

      {/* Grid com navegação e ações rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppleNavigationCard />
        <AppleQuickActions onNewProduct={handleNewProduct} />
      </div>
    </div>
  );
};

export default StoreDashboard;
