
import React, { useState } from 'react';
import { Store, Building2, Users, DollarSign, Plus, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStores, CreateStoreData } from '@/hooks/useStores';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import StoreForm from '@/components/stores/StoreForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardCard from './DashboardCard';

const SuperadminDashboard = () => {
  const { stores, loading: storesLoading, createStore } = useStores();
  const { users, loading: usersLoading } = useUsers();
  const { profile } = useAuth();
  const [showStoreForm, setShowStoreForm] = useState(false);
  const { toast } = useToast();

  const handleCreateStore = async (storeData: CreateStoreData) => {
    if (!profile?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    const dataWithOwner: CreateStoreData = {
      ...storeData,
      owner_id: profile.id
    };

    const { error } = await createStore(dataWithOwner);
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar loja",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Loja criada com sucesso",
      });
      setShowStoreForm(false);
    }
  };

  // Métricas calculadas
  const totalStores = stores.length;
  const activeStores = stores.filter(store => store.is_active).length;
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.is_active).length;
  const totalRevenue = stores.reduce((sum, store) => sum + (store.monthly_fee || 0), 0);
  const growthRate = 12.5; // Simulado

  // Loading state para métricas individuais
  const metricsLoading = storesLoading || usersLoading;

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-2">Visão geral de todas as lojas do sistema</p>
        </div>
        <Button onClick={() => setShowStoreForm(true)} className="btn-primary">
          <Plus className="mr-2 h-5 w-5" />
          Nova Loja
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total de Lojas"
          value={metricsLoading ? "..." : totalStores}
          subtitle={metricsLoading ? "carregando..." : `${activeStores} ativas`}
          icon={Store}
          variant="primary"
          trend={metricsLoading ? undefined : { value: 8.2, isPositive: true }}
        />

        <DashboardCard
          title="Receita Mensal"
          value={metricsLoading ? "..." : `R$ ${totalRevenue.toFixed(2)}`}
          subtitle="Receita recorrente"
          icon={DollarSign}
          variant="success"
          trend={metricsLoading ? undefined : { value: growthRate, isPositive: true }}
        />

        <DashboardCard
          title="Lojas Ativas"
          value={metricsLoading ? "..." : activeStores}
          subtitle={metricsLoading ? "carregando..." : `${((activeStores / totalStores) * 100 || 0).toFixed(1)}% do total`}
          icon={Building2}
          variant="warning"
          trend={metricsLoading ? undefined : { value: 5.1, isPositive: true }}
        />

        <DashboardCard
          title="Usuários Ativos"
          value={metricsLoading ? "..." : activeUsers}
          subtitle={metricsLoading ? "carregando..." : `de ${totalUsers} usuários`}
          icon={Users}
          variant="secondary"
          trend={metricsLoading ? undefined : { value: 3.2, isPositive: false }}
        />
      </div>

      {/* Gráfico de Performance Simulado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-modern lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Performance das Lojas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {storesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner"></div>
                <span className="ml-2">Carregando lojas...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {stores.slice(0, 5).map((store, index) => (
                  <div key={store.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="font-medium">{store.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">R$ {(store.monthly_fee || 0).toFixed(2)}</div>
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${Math.random() * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
                {stores.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Nenhuma loja encontrada
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Nova loja criada</p>
                  <p className="text-xs text-gray-500">há 2 horas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Pagamento recebido</p>
                  <p className="text-xs text-gray-500">há 4 horas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Loja atualizada</p>
                  <p className="text-xs text-gray-500">há 6 horas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Lojas */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Gestão de Lojas</CardTitle>
        </CardHeader>
        <CardContent>
          {storesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="loading-spinner"></div>
              <span className="ml-2">Carregando lojas...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {stores.map((store) => (
                <div key={store.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{store.name}</h3>
                      <Badge variant={store.is_active ? "default" : "secondary"}>
                        {store.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                      <Badge variant="outline">{store.plan_type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {store.description || "Sem descrição"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Criada em: {new Date(store.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {(store.monthly_fee || 0).toFixed(2)}/mês</p>
                    <p className="text-sm text-muted-foreground">ID: {store.id.slice(0, 8)}...</p>
                  </div>
                </div>
              ))}
              {stores.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma loja cadastrada ainda.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar nova loja */}
      <Dialog open={showStoreForm} onOpenChange={setShowStoreForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Loja</DialogTitle>
          </DialogHeader>
          <StoreForm onSubmit={handleCreateStore} onCancel={() => setShowStoreForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperadminDashboard;
