
import React from 'react';
import { Plus } from 'lucide-react';
import DashboardCards from './DashboardCards';
import AppleNavigationCard from './AppleNavigationCard';
import { useNavigate } from 'react-router-dom';

const SuperadminDashboard = () => {
  const navigate = useNavigate();

  const handleNewStore = () => {
    navigate('/stores?action=new');
  };

  return (
    <div className="space-y-6">
      {/* Header com ação */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600">Visão geral de todas as lojas do sistema</p>
        </div>
        <button
          onClick={handleNewStore}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Nova Loja
        </button>
      </div>

      {/* Métricas principais */}
      <DashboardCards userRole="superadmin" />

      {/* Grid com navegação */}
      <div className="grid grid-cols-1">
        <AppleNavigationCard />
      </div>
    </div>
  );
};

export default SuperadminDashboard;
