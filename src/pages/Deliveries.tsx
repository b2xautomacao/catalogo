
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const Deliveries = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Gestão de Entregas', current: true },
  ];

  // Dados mock para demonstração
  const deliveries = [
    {
      id: '001',
      orderId: 'PED-2024-001',
      customer: 'Maria Silva',
      address: 'Rua das Flores, 123 - Centro, São Paulo - SP',
      status: 'em_transito',
      estimatedDelivery: '2024-06-15',
      trackingCode: 'TR123456789BR',
      carrier: 'Correios'
    },
    {
      id: '002',
      orderId: 'PED-2024-002',
      customer: 'João Santos',
      address: 'Av. Paulista, 456 - Bela Vista, São Paulo - SP',
      status: 'entregue',
      estimatedDelivery: '2024-06-14',
      trackingCode: 'TR987654321BR',
      carrier: 'Sedex'
    },
    {
      id: '003',
      orderId: 'PED-2024-003',
      customer: 'Ana Costa',
      address: 'Rua da Esperança, 789 - Vila Madalena, São Paulo - SP',
      status: 'preparando',
      estimatedDelivery: '2024-06-17',
      trackingCode: 'TR456789123BR',
      carrier: 'PAC'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusMap = {
      preparando: { label: 'Preparando', variant: 'secondary' as const, icon: Clock },
      em_transito: { label: 'Em Trânsito', variant: 'default' as const, icon: Package },
      entregue: { label: 'Entregue', variant: 'default' as const, icon: CheckCircle },
      problema: { label: 'Problema', variant: 'destructive' as const, icon: AlertTriangle }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.preparando;
    const Icon = statusInfo.icon;

    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      preparando: 'bg-yellow-50 border-yellow-200',
      em_transito: 'bg-blue-50 border-blue-200',
      entregue: 'bg-green-50 border-green-200',
      problema: 'bg-red-50 border-red-200'
    };
    return colorMap[status as keyof typeof colorMap] || colorMap.preparando;
  };

  const filteredDeliveries = deliveries.filter(delivery =>
    delivery.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    delivery.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    delivery.trackingCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout 
      title="Gestão de Entregas" 
      subtitle="Acompanhe e gerencie todas as entregas em andamento"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar por cliente, pedido ou código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
            <Button className="btn-primary">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Cards de Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-sm text-gray-600">Preparando</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-sm text-gray-600">Em Trânsito</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-sm text-gray-600">Entregue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-gray-600">Problemas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Entregas */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6 text-blue-600" />
              Entregas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${getStatusColor(delivery.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{delivery.customer}</h3>
                        {getStatusBadge(delivery.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Pedido:</span>
                          <span className="font-medium">{delivery.orderId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Previsão:</span>
                          <span className="font-medium">{new Date(delivery.estimatedDelivery).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-700">{delivery.address}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">Transportadora: <span className="font-medium">{delivery.carrier}</span></span>
                        <span className="text-gray-600">Código: <span className="font-mono font-medium">{delivery.trackingCode}</span></span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredDeliveries.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma entrega encontrada
                </h3>
                <p className="text-gray-600">
                  {searchQuery ? 'Tente ajustar os filtros de busca.' : 'As entregas aparecerão aqui quando houver pedidos processados.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Deliveries;
