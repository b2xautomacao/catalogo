import React from "react";
import { useParams } from "react-router-dom";
import { useSubdomainStore } from "@/hooks/useSubdomainStore";
import { getSubdomainInfo } from "@/utils/subdomainRouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductPage from "@/pages/ProductPage";

/**
 * Product page specifically for subdomain routing
 * Uses the complete ProductPage with all conversion elements
 * but renders in public catalog context
 */
const SubdomainProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { store, loading: storeLoading, error: storeError } = useSubdomainStore();
  const { subdomain } = getSubdomainInfo();

  const handleBackToCatalog = () => {
    window.location.href = `https://${subdomain}.aoseudispor.com.br`;
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Carregando produto
          </h2>
          <p className="text-gray-600">
            {subdomain}.aoseudispor.com.br
          </p>
        </div>
      </div>
    );
  }

  if (storeError || !store || !productId) {
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
            Produto não encontrado
          </h1>
          <p className="text-gray-600 mb-4">
            {storeError || 'O produto solicitado não está disponível'}
          </p>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Loja:</strong> <code>{subdomain}.aoseudispor.com.br</code>
            </p>
            {productId && (
              <p className="text-sm text-gray-700 mt-1">
                <strong>Produto ID:</strong> <code>{productId}</code>
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={handleBackToCatalog}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render the complete ProductPage but in public template context
  // The ProductPage will handle all the conversion elements automatically
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back to catalog button - positioned outside template */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="outline" 
            onClick={handleBackToCatalog}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Complete ProductPage with all conversion elements */}
      <ProductPage isPublicContext={true} storeContext={store} />
    </div>
  );
};

export default SubdomainProductPage;
