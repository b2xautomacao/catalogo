
import React from 'react';
import AppleDashboardLayout from '@/components/dashboard/AppleDashboardLayout';
import { Package } from 'lucide-react';

const Products: React.FC = () => {
  return (
    <AppleDashboardLayout 
      title="Produtos"
      subtitle="Gerencie o catálogo de produtos da sua loja"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-6 bg-white rounded-lg border">
          <Package className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold">Gestão de Produtos</h2>
            <p className="text-gray-600">Configure e organize seus produtos</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-500">Página de produtos em desenvolvimento...</p>
        </div>
      </div>
    </AppleDashboardLayout>
  );
};

export default Products;
