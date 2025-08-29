
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
import TemplateWrapper from './templates/TemplateWrapper';

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
  
  // Usar hook global do carrinho em vez de estado local
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
    categories, 
    loading, 
    error 
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar o catálogo</p>
          <p className="text-gray-600">{error}</p>
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
        store={store}
        products={products}
        categories={categories}
        catalogType={catalogType}
        settings={settings}
        cartItems={cartItems}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onProductClick={handleProductClick}
        cartItemsCount={totalItems} // Usar totalItems do hook global
      />

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
