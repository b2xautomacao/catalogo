
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import SubscriptionPlansManager from '@/components/admin/SubscriptionPlansManager';
import { SystemBenefitsManager } from '@/components/admin/SystemBenefitsManager';
import { TenantMonitoringDashboard } from '@/components/admin/TenantMonitoringDashboard';

const PlanManagement = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("plans");

  if (profile?.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestão de Planos e Benefícios
        </h1>
        <p className="text-gray-600">
          Configure planos de assinatura, benefícios do sistema e monitore a propagação multi-tenant
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="benefits">Benefícios</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans" className="mt-6">
          <SubscriptionPlansManager />
        </TabsContent>
        
        <TabsContent value="benefits" className="mt-6">
          <SystemBenefitsManager />
        </TabsContent>
        
        <TabsContent value="monitoring" className="mt-6">
          <TenantMonitoringDashboard />
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Analytics em Desenvolvimento
            </h3>
            <p className="text-gray-600">
              Dashboard de analytics e métricas detalhadas será implementado em breve.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanManagement;
