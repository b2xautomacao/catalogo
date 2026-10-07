import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sparkles, Key, FileText, Activity } from 'lucide-react';
import { useTenantMcp } from '@/hooks/useTenantMcp';
import { McpHubOverview } from '@/components/ia/McpHubOverview';
import { McpCredentialsList } from '@/components/ia/McpCredentialsList';
import { McpDocumentationPortal } from '@/components/ia/McpDocumentationPortal';
import { McpActivityAudit } from '@/components/ia/McpActivityAudit';

export const IaHubPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    credentials,
    auditLogs,
    loadingCredentials,
    loadingAudit,
    isSubmitting,
    isSuperadmin,
    currentStore,
    stores,
    selectedStoreIdFilter,
    setSelectedStoreIdFilter,
    mcpEndpointUrl,
    getQuickConfigSnippet,
    fetchAuditLogs,
    createCredential,
    revokeCredential,
  } = useTenantMcp();

  // Controla abertura do modal de nova credencial
  const [isOpenNewModal, setIsOpenNewModal] = useState(false);

  // Mapear rota para aba
  const getTabFromPath = (path: string) => {
    if (path.includes('/ia/credenciais')) return 'credenciais';
    if (path.includes('/ia/docs')) return 'docs';
    if (path.includes('/ia/atividade')) return 'atividade';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<string>(getTabFromPath(location.pathname));

  useEffect(() => {
    const tab = getTabFromPath(location.pathname);
    setActiveTab(tab);
  }, [location.pathname]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (newTab === 'overview') navigate('/ia');
    else if (newTab === 'credenciais') navigate('/ia/credenciais');
    else if (newTab === 'docs') navigate('/ia/docs');
    else if (newTab === 'atividade') navigate('/ia/atividade');
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Navegação por Tabs do Hub IA */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-white">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="credenciais" className="text-xs data-[state=active]:bg-white">
              <Key className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Credenciais MCP
            </TabsTrigger>
            <TabsTrigger value="docs" className="text-xs data-[state=active]:bg-white">
              <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Docs MCP
            </TabsTrigger>
            <TabsTrigger value="atividade" className="text-xs data-[state=active]:bg-white">
              <Activity className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Atividade
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Overview */}
        <TabsContent value="overview">
          <McpHubOverview
            credentials={credentials}
            auditLogs={auditLogs}
            mcpEndpointUrl={mcpEndpointUrl}
            getQuickConfigSnippet={getQuickConfigSnippet}
            onNavigateTab={handleTabChange}
            onOpenNewCredentialModal={() => {
              setActiveTab('credenciais');
              navigate('/ia/credenciais');
              setIsOpenNewModal(true);
            }}
          />
        </TabsContent>

        {/* Tab 2: Credenciais */}
        <TabsContent value="credenciais">
          <McpCredentialsList
            credentials={credentials}
            loading={loadingCredentials}
            isSubmitting={isSubmitting}
            isSuperadmin={isSuperadmin}
            currentStore={currentStore}
            stores={stores}
            mcpEndpointUrl={mcpEndpointUrl}
            getQuickConfigSnippet={getQuickConfigSnippet}
            onCreateCredential={createCredential}
            onRevokeCredential={revokeCredential}
            isOpenNewModal={isOpenNewModal}
            onOpenNewModalChange={setIsOpenNewModal}
          />
        </TabsContent>

        {/* Tab 3: Documentação */}
        <TabsContent value="docs">
          <McpDocumentationPortal
            storeName={currentStore?.name || 'Loja B2X'}
            mcpEndpointUrl={mcpEndpointUrl}
          />
        </TabsContent>

        {/* Tab 4: Atividade */}
        <TabsContent value="atividade">
          <McpActivityAudit
            auditLogs={auditLogs}
            loading={loadingAudit}
            isSuperadmin={isSuperadmin}
            currentStore={currentStore}
            stores={stores}
            selectedStoreIdFilter={selectedStoreIdFilter}
            onSelectStoreFilterChange={setSelectedStoreIdFilter}
            onRefresh={fetchAuditLogs}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IaHubPage;
