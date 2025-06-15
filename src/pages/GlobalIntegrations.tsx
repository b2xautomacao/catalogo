
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { N8NWebhooksManager } from '@/components/admin/N8NWebhooksManager';
import { TenantMonitoringDashboard } from '@/components/admin/TenantMonitoringDashboard';

const GlobalIntegrations = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("webhooks");

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
    { label: 'Integrações Globais', current: true }
  ];

  return (
    <AppLayout 
      title="Integrações Globais"
      subtitle="Configure integrações, webhooks e monitore o sistema multi-tenant"
      breadcrumbs={breadcrumbs}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="webhooks">Webhooks N8N</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="integrations">Outras Integrações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="webhooks" className="mt-6">
          <N8NWebhooksManager />
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
        
        <TabsContent value="integrations" className="mt-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Outras Integrações
            </h3>
            <p className="text-gray-600">
              Configurações para Zapier, APIs externas e outras integrações serão adicionadas aqui.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default GlobalIntegrations;
