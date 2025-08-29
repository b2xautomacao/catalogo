
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const Customers: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-6 bg-white rounded-lg border">
        <Users className="w-8 h-8 text-purple-600" />
        <div>
          <h2 className="text-lg font-semibold">Base de Clientes</h2>
          <p className="text-gray-600">Histórico de compras e dados dos clientes</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-500">Página de clientes em desenvolvimento...</p>
      </div>
    </div>
  );
};

export default Customers;
