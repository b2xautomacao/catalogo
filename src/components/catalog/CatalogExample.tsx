
import React, { useState, useEffect } from "react";
import CatalogHeader from "./CatalogHeader";
import ResponsiveProductGrid from "./ResponsiveProductGrid";
import ProductDetailsModal from "./ProductDetailsModal";
import { Product } from "@/types/product";
import { CatalogType, useCatalog } from "@/hooks/useCatalog";
import { useCart } from "@/hooks/useCart";
import { createCartItem } from "@/utils/cartHelpers";

interface CatalogExampleProps {
  storeIdentifier: string;
  catalogType: CatalogType;
  templateName?: string;
}

const CatalogExample: React.FC<CatalogExampleProps> = ({
  storeIdentifier,
  catalogType,
  templateName = "modern",
}) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const {
    store,
    products,
    loading: storeLoading,
    storeError,
  } = useCatalog();

  // Inicializar catálogo quando componente montar
  useEffect(() => {
    if (storeIdentifier) {
      console.log('🚀 CATALOG EXAMPLE - Inicializando catálogo:', { storeIdentifier, catalogType });
    }
  }, [storeIdentifier, catalogType]);

  const { addItem } = useCart();

  const handleAddToWishlist = (product: Product) => {
    const isInWishlist = wishlist.some(item => item.id === product.id);
    if (isInWishlist) {
      setWishlist(prev => prev.filter(item => item.id !== product.id));
    } else {
      setWishlist(prev => [...prev, product]);
    }
  };

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleAddToCart = (product: Product, quantity: number = 1, variation?: any) => {
    console.log('Adding to cart:', { product, quantity, variation });
    
    // Criar item do carrinho usando a função helper
    const cartItem = createCartItem(product, catalogType, quantity, variation);
    addItem(cartItem);
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando catálogo...</p>
        </div>
      </div>
    );
  }

  if (storeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erro ao carregar catálogo</p>
          <p className="text-gray-500 text-sm">{storeError}</p>
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
    <div className="min-h-screen bg-background">
      <CatalogHeader
        store={store}
        catalogType={catalogType}
        templateName={templateName}
      />

      <main className="container mx-auto px-4 py-8">
        <ResponsiveProductGrid
          products={products}
          catalogType={catalogType}
          storeIdentifier={storeIdentifier}
          loading={false}
          onAddToWishlist={handleAddToWishlist}
          onQuickView={handleQuickView}
          onAddToCart={handleAddToCart}
          wishlist={wishlist}
          templateName={templateName}
          showPrices={true}
          showStock={true}
        />
      </main>

      <ProductDetailsModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        catalogType={catalogType}
      />
    </div>
  );
};

export default CatalogExample;
