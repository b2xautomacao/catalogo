
import React from 'react';
import AppleDashboardLayout from '@/components/dashboard/AppleDashboardLayout';
import { Folder } from 'lucide-react';

const Categories: React.FC = () => {
  return (
    <AppleDashboardLayout 
      title="Categorias"
      subtitle="Organize produtos por categorias e subcategorias"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-6 bg-white rounded-lg border">
          <Folder className="w-8 h-8 text-orange-600" />
          <div>
            <h2 className="text-lg font-semibold">Gestão de Categorias</h2>
            <p className="text-gray-600">Estruture e organize seu catálogo</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-500">Página de categorias em desenvolvimento...</p>
        </div>
      </div>
    </AppleDashboardLayout>
  );
};

export default Categories;
