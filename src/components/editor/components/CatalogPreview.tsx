
import React from 'react';
import { useEditorStore } from '../stores/useEditorStore';
import { usePreviewData } from '../hooks/usePreviewData';
import { useUnifiedEditor } from '@/hooks/useUnifiedEditor';
import { useAuth } from '@/hooks/useAuth';
import { useStoreData } from '@/hooks/useStoreData';
import { Store } from '@/hooks/useCatalog';
import { Product } from '@/hooks/useProducts';
import { ProductVariation } from '@/types/variation';
import TemplateWrapper from '@/components/catalog/TemplateWrapper';
import ProductGrid from '@/components/catalog/ProductGrid';

const CatalogPreview: React.FC = () => {
  const { configuration } = useEditorStore();
  const { products, categories, loading, hasRealData } = usePreviewData();
  const { applyStylesImmediately, isConnected } = useUnifiedEditor();
  const { profile } = useAuth();
  const { store } = useStoreData(profile?.store_id);

  // Aplicar estilos quando o componente montar
  React.useEffect(() => {
    applyStylesImmediately();
  }, [applyStylesImmediately]);

  // Função de adicionar ao carrinho para o preview (apenas log)
  const handleAddToCart = (product: Product, quantity?: number, variation?: ProductVariation) => {
    console.log('🎨 PREVIEW - Simulando adicionar ao carrinho:', {
      productName: product.name,
      quantity: quantity || 1,
      variation: variation ? { id: variation.id, color: variation.color, size: variation.size } : null
    });
  };

  // Função de adicionar à wishlist para o preview (apenas log)
  const handleAddToWishlist = (product: Product) => {
    console.log('🎨 PREVIEW - Simulando adicionar à wishlist:', product.name);
  };

  // Função de visualização rápida para o preview (apenas log)
  const handleQuickView = (product: Product) => {
    console.log('🎨 PREVIEW - Simulando visualização rápida:', product.name);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando preview...</p>
        </div>
      </div>
    );
  }

  // Usar loja mockada se não tiver dados reais - com todos os campos obrigatórios
  const previewStore: Store = store ? {
    id: store.id,
    name: store.name,
    description: store.description || 'Descrição da loja de exemplo',
    logo_url: store.logo_url || null,
    phone: store.phone || '(11) 99999-9999',
    email: store.email || 'contato@minhaloja.com',
    address: store.address || 'Rua Example, 123 - São Paulo, SP',
    url_slug: store.url_slug || 'preview',
    owner_id: profile?.id || 'preview-owner-id',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    cnpj: null,
    plan_type: 'basic',
    monthly_fee: 0
  } : {
    id: 'preview-store',
    name: 'Minha Loja',
    description: 'Descrição da loja de exemplo',
    logo_url: null,
    phone: '(11) 99999-9999',
    email: 'contato@minhaloja.com',
    address: 'Rua Example, 123 - São Paulo, SP',
    url_slug: 'preview',
    owner_id: 'preview-owner-id',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    cnpj: null,
    plan_type: 'basic',
    monthly_fee: 0
  };

  return (
    <div 
      className="min-h-full template-container catalog-container"
      style={{ 
        backgroundColor: configuration.colors.background,
        fontFamily: configuration.global.fontFamily,
        color: configuration.colors.text
      }}
    >
      {/* Indicador de status */}
      <div className="bg-blue-100 border-l-4 border-blue-500 p-2 text-sm">
        <div className="flex items-center gap-2 text-blue-800">
          <span className="font-medium">🎨 Preview em Tempo Real</span>
          {!hasRealData && (
            <span className="opacity-70">• Usando dados de exemplo</span>
          )}
          {!isConnected && (
            <span className="opacity-70">• Editor desconectado</span>
          )}
        </div>
      </div>

      {/* Usar o TemplateWrapper real do catálogo */}
      <TemplateWrapper
        templateName={configuration.global.template}
        store={previewStore}
        catalogType="retail"
        cartItemsCount={0}
        wishlistCount={0}
        onSearch={() => {}}
        onToggleFilters={() => {}}
        onCartClick={() => {}}
      >
        <div className="container mx-auto px-4 py-8">
          <ProductGrid
            products={products}
            catalogType="retail"
            loading={false}
            onAddToWishlist={handleAddToWishlist}
            onQuickView={handleQuickView}
            onAddToCart={handleAddToCart}
            wishlist={[]}
            storeIdentifier="preview"
            templateName={configuration.global.template}
            showPrices={configuration.checkout.showPrices}
            showStock={true}
          />
        </div>
      </TemplateWrapper>
    </div>
  );
};

export { CatalogPreview };
