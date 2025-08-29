
import React from 'react';
import AppleDashboardLayout from '@/components/dashboard/AppleDashboardLayout';
import { BarChart3 } from 'lucide-react';

const Reports: React.FC = () => {
  return (
    <AppleDashboardLayout 
      title="Relatórios"
      subtitle="Análises e métricas do seu negócio"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-6 bg-white rounded-lg border">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          <div>
            <h2 className="text-lg font-semibold">Relatórios e Analytics</h2>
            <p className="text-gray-600">Dados e insights para tomada de decisão</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-500">Página de relatórios em desenvolvimento...</p>
        </div>
      </div>
    </AppleDashboardLayout>
  );
};

export default Reports;
