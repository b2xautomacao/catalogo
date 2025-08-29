
import React, { useState, useEffect } from 'react';
import { useCatalog } from '@/hooks/useCatalog';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useCart } from '@/hooks/useCart';
import { createCartItem } from '@/utils/cartHelpers';
import { Product } from '@/hooks/useProducts';
import { ProductVariation } from '@/types/variation';
import { CatalogType } from '@/hooks/useCatalog';
import { useToast } from '@/hooks/use-toast';
import ProductDetailsModal from './ProductDetailsModal';
import FloatingCart from './FloatingCart';
import TemplateWrapper from './TemplateWrapper';

interface PublicCatalogProps {
  storeIdentifier: string;
  catalogType: CatalogType;
}

const PublicCatalog: React.FC<PublicCatalogProps> = ({ 
  storeIdentifier, 
  catalogType 
}) => {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Usar hook global do carrinho
  const { 
    items: cartItems, 
    addItem, 
    removeItem, 
    updateQuantity, 
    totalItems,
    clearCart 
  } = useCart();

  const { 
    store, 
    products, 
    filteredProducts,
    loading, 
    storeError 
  } = useCatalog(storeIdentifier, catalogType);
  
  const { settings } = useCatalogSettings(storeIdentifier);

  // Função para adicionar ao carrinho usando o hook global
  const handleAddToCart = (
    product: Product, 
    quantity: number = 1, 
    variation?: ProductVariation
  ) => {
    console.log('🛒 PUBLIC CATALOG - Adicionando ao carrinho:', {
      productId: product.id,
      productName: product.name,
      quantity,
      catalogType,
      variation: variation ? {
        id: variation.id,
        color: variation.color,
        size: variation.size
      } : null
    });

    try {
      // Usar helper para criar item compatível
      const cartItem = createCartItem(product, catalogType, quantity, variation);
      
      // Adicionar usando o hook global
      addItem(cartItem);
      
      console.log('✅ PUBLIC CATALOG - Item adicionado com sucesso ao carrinho global');
      
      toast({
        title: "Produto adicionado!",
        description: `${product.name} foi adicionado ao carrinho.`,
        duration: 2000
      });
      
    } catch (error) {
      console.error('❌ PUBLIC CATALOG - Erro ao adicionar ao carrinho:', error);
      toast({
        title: "Erro ao adicionar produto",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFromCart = (productId: string, variationId?: string) => {
    console.log('🗑️ PUBLIC CATALOG - Removendo do carrinho:', { productId, variationId });
    
    // Criar ID compatível com o formato do carrinho
    const itemId = variationId 
      ? `${productId}-${catalogType}-${variationId}`
      : `${productId}-${catalogType}`;
    
    removeItem(itemId);
    
    toast({
      title: "Produto removido",
      description: "Item removido do carrinho.",
      duration: 2000
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number, variationId?: string) => {
    console.log('📊 PUBLIC CATALOG - Atualizando quantidade:', { productId, quantity, variationId });
    
    // Criar ID compatível com o formato do carrinho
    const itemId = variationId 
      ? `${productId}-${catalogType}-${variationId}`
      : `${productId}-${catalogType}`;
    
    if (quantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, quantity);
    }
  };

  const handleProductClick = (product: Product) => {
    console.log('👆 PUBLIC CATALOG - Produto clicado:', product.name);
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log('❌ PUBLIC CATALOG - Fechando modal');
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Log para debug do estado do carrinho
  useEffect(() => {
    console.log('🔍 PUBLIC CATALOG - Estado do carrinho:', {
      totalItems,
      itemsCount: cartItems.length,
      catalogType
    });
  }, [cartItems, totalItems, catalogType]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando catálogo...</p>
        </div>
      </div>
    );
  }

  if (storeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar o catálogo</p>
          <p className="text-gray-600">{storeError}</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loja não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TemplateWrapper
        templateName={settings?.template_name || 'modern'}
        store={store}
        catalogType={catalogType}
        cartItemsCount={totalItems}
        wishlistCount={0}
        whatsappNumber={store.phone || undefined}
        onSearch={(query) => console.log('Search:', query)}
        onToggleFilters={() => console.log('Toggle filters')}
        onCartClick={() => console.log('Cart clicked')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleProductClick(product)}
            >
              <div className="aspect-square bg-gray-200 flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400">Sem imagem</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-blue-600">
                    R$ {catalogType === 'wholesale' ? product.wholesale_price?.toFixed(2) : product.retail_price.toFixed(2)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </TemplateWrapper>

      {/* Modal de Detalhes do Produto */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCart}
          catalogType={catalogType}
        />
      )}

      {/* Carrinho Flutuante */}
      <FloatingCart />
    </div>
  );
};

export default PublicCatalog;
