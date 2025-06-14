
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

const Customers = () => {
  const navigate = useNavigate();

  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Clientes', current: true },
  ];

  return (
    <AppLayout 
      title="Clientes" 
      subtitle="Gerencie a base de clientes da sua loja"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {/* Action Button */}
        <div className="flex justify-end">
          <Button className="btn-primary" disabled>
            <UserPlus className="mr-2 h-5 w-5" />
            Adicionar Cliente
          </Button>
        </div>

        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Clientes Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum cliente cadastrado
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Os clientes aparecerão aqui automaticamente quando realizarem pedidos através do seu catálogo online.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  💡 <strong>Dica:</strong> Compartilhe o link do seu catálogo para começar a receber pedidos e clientes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Customers;
