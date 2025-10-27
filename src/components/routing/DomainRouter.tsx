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

