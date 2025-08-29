
import React from 'react';
import AppleDashboardLayout from '@/components/dashboard/AppleDashboardLayout';
import { ShoppingBag } from 'lucide-react';

const Orders: React.FC = () => {
  return (
    <AppleDashboardLayout 
      title="Pedidos"
      subtitle="Acompanhe e gerencie todos os pedidos da loja"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-6 bg-white rounded-lg border">
          <ShoppingBag className="w-8 h-8 text-green-600" />
          <div>
            <h2 className="text-lg font-semibold">Gestão de Pedidos</h2>
            <p className="text-gray-600">Acompanhe status e histórico de vendas</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-500">Página de pedidos em desenvolvimento...</p>
        </div>
      </div>
    </AppleDashboardLayout>
  );
};

export default Orders;
