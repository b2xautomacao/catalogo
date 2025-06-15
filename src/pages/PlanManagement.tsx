
import React, { useState } from 'react';
import { Plus, Settings, Package, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import { SystemBenefitsManager } from '@/components/admin/SystemBenefitsManager';
import { PlanBenefitsManager } from '@/components/admin/PlanBenefitsManager';
import SubscriptionPlansManager from '@/components/admin/SubscriptionPlansManager';

const PlanManagement = () => {
  const [activeTab, setActiveTab] = useState('plans');

  const breadcrumbs = [
    { label: 'Dashboard', href: '/' },
    { label: 'Gestão de Planos', current: true }
  ];

  return (
    <AppLayout 
      title="Gestão de Planos de Assinatura"
      subtitle="Configure planos, benefícios e recursos do sistema"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {/* Header com estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                +1 desde o mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Benefícios Disponíveis</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">14</div>
              <p className="text-xs text-muted-foreground">
                Recursos configurados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">
                Lojas com planos ativos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para diferentes seções */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Planos de Assinatura
            </TabsTrigger>
            <TabsTrigger value="benefits" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Benefícios do Sistema
            </TabsTrigger>
            <TabsTrigger value="plan-benefits" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Benefícios por Plano
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            <SubscriptionPlansManager />
          </TabsContent>

          <TabsContent value="benefits" className="space-y-6">
            <SystemBenefitsManager />
          </TabsContent>

          <TabsContent value="plan-benefits" className="space-y-6">
            <PlanBenefitsManager />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default PlanManagement;
