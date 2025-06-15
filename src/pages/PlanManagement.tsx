
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import SubscriptionPlansManager from '@/components/admin/SubscriptionPlansManager';
import { SystemBenefitsManager } from '@/components/admin/SystemBenefitsManager';

const PlanManagement = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("plans");

  if (profile?.role !== 'superadmin') {
    return (
      <AppLayout title="Acesso Negado">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Gestão de Planos', current: true }
  ];

  return (
    <AppLayout 
      title="Gestão de Planos e Benefícios"
      subtitle="Configure planos de assinatura e benefícios disponíveis no sistema"
      breadcrumbs={breadcrumbs}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans">Planos de Assinatura</TabsTrigger>
          <TabsTrigger value="benefits">Benefícios do Sistema</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans" className="mt-6">
          <SubscriptionPlansManager />
        </TabsContent>
        
        <TabsContent value="benefits" className="mt-6">
          <SystemBenefitsManager />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default PlanManagement;
