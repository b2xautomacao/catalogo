import React from "react";
import { useLocation } from "react-router-dom";
import { useSubdomainStore } from "@/hooks/useSubdomainStore";
import { getSubdomainInfo } from "@/utils/subdomainRouter";
import PublicCatalog from "@/components/catalog/PublicCatalog";
import { Loader2 } from "lucide-react";

// Slugs reservados (rotas do app) - não tratados como vendedor
const RESERVED_SLUGS = ["produto", "catalog", "track", "auth", "c"];

/** Extrai sellerSlug do path (ex: /daniel → "daniel") */
function extractSellerSlugFromPath(pathname: string): string | undefined {
  const segment = pathname.replace(/^\//, "").split("/")[0]?.toLowerCase().trim();
  if (!segment || RESERVED_SLUGS.includes(segment)) return undefined;
  return segment;
}

/**
 * Catalog page specifically for subdomain routing
 * Uses subdomain detection instead of URL parameters
 */
const SubdomainCatalogPage: React.FC = () => {
  const { pathname } = useLocation();
  const { store, loading, error } = useSubdomainStore();
  const { subdomain } = getSubdomainInfo();
  const sellerSlug = extractSellerSlugFromPath(pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Carregando catálogo
          </h2>
          <p className="text-gray-600">
            {subdomain}.aoseudispor.com.br
          </p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Loja não encontrada
          </h1>
          <p className="text-gray-600 mb-4">
            {error || 'Subdomínio não está configurado ou ativo'}
          </p>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Subdomínio:</strong> <code>{subdomain}.aoseudispor.com.br</code>
            </p>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p><strong>Possíveis causas:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>Subdomínio não foi configurado no admin</li>
              <li>Loja foi desativada temporariamente</li>
              <li>Configuração de DNS ainda propagando</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <a 
              href="https://app.aoseudispor.com.br" 
              className="inline-block w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Ir para Admin
            </a>
            <button 
              onClick={() => window.location.reload()} 
              className="inline-block w-full px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <PublicCatalog storeIdentifier={store.slug} sellerSlug={sellerSlug} />;
};

export default SubdomainCatalogPage;
