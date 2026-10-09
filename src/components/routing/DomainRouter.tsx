import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDomainDetection } from '@/hooks/useDomainDetection';
import PublicCatalog from '@/components/catalog/PublicCatalog';
import { Loader2 } from 'lucide-react';

/**
 * Router inteligente que detecta domínio e redireciona apropriadamente
 * - Subdomínio (mirazzi.aoseudispor.com.br) → Catálogo público
 * - Domínio próprio (www.mirazzi.com.br) → Catálogo público
 * - App principal (app.aoseudispor.com.br) → Dashboard/Login
 */
const DomainRouter: React.FC = () => {
  const { domainInfo, loading, error } = useDomainDetection();
  const location = useLocation();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Erro ao detectar domínio
  if (error || !domainInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="text-6xl">❌</div>
          <h1 className="text-2xl font-bold text-gray-900">Erro ao Carregar</h1>
          <p className="text-gray-600">
            Não foi possível detectar a configuração do domínio.
          </p>
          <p className="text-sm text-gray-500">
            {error || 'Domínio não configurado ou inválido'}
          </p>
        </div>
      </div>
    );
  }

  // Plataforma MCP Endpoint (mcp.gargalozero.com.br)
  if (domainInfo.type === 'platform_mcp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            ⚡
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">B2XCATALOGO MCP Runtime</h1>
            <p className="text-sm text-slate-400">
              Ambiente de infraestrutura global de Inteligência Artificial da plataforma.
            </p>
          </div>
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-4 text-left font-mono text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[11px] uppercase tracking-wider pb-1 border-b border-slate-800">
              <span>Endpoint Canônico MCP</span>
              <span className="text-emerald-400 font-semibold">Online</span>
            </div>
            <p className="text-blue-400 break-all">POST https://mcp.gargalozero.com.br/mcp</p>
            <p className="text-slate-500 text-[11px]">Protocolo: Model Context Protocol (Streamable HTTP)</p>
          </div>
          <p className="text-xs text-slate-500">
            A autenticação deste serviço é realizada estritamente via Bearer API Key gerada no painel administrativo da sua loja.
          </p>
        </div>
      </div>
    );
  }

  // Subdomínio detectado
  if (domainInfo.type === 'subdomain' && domainInfo.storeId) {
    console.log('🌐 DomainRouter: Renderizando catálogo para subdomínio:', domainInfo.subdomain);
    return <PublicCatalog storeIdentifier={domainInfo.storeId} />;
  }

  // Domínio próprio detectado
  if (domainInfo.type === 'custom_domain' && domainInfo.storeId) {
    console.log('🌐 DomainRouter: Renderizando catálogo para domínio próprio:', domainInfo.customDomain);
    return <PublicCatalog storeIdentifier={domainInfo.storeId} />;
  }

  // App principal (admin/dashboard)
  // Verificar se usuário está autenticado via localStorage
  if (domainInfo.type === 'app') {
    const authData = localStorage.getItem('supabase.auth.token');
    
    if (authData) {
      console.log('🌐 DomainRouter: App principal + autenticado, redirecionando para /dashboard');
      return <Navigate to="/dashboard" replace />;
    } else {
      console.log('🌐 DomainRouter: App principal + não autenticado, redirecionando para /auth');
      return <Navigate to="/auth" replace />;
    }
  }

  // Fallback: domínio detectado mas loja não encontrada
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 max-w-md px-4">
        <div className="text-6xl">🏪</div>
        <h1 className="text-2xl font-bold text-gray-900">Loja Não Encontrada</h1>
        <p className="text-gray-600">
          {domainInfo.type === 'subdomain' 
            ? `O subdomínio "${domainInfo.subdomain}" não está configurado ou não está ativo.`
            : `O domínio "${domainInfo.customDomain}" não está configurado, verificado ou não está ativo.`
          }
        </p>
        <p className="text-sm text-gray-500">
          Entre em contato com o suporte se você é o proprietário desta loja.
        </p>
      </div>
    </div>
  );
};

export default DomainRouter;

