
import React from 'react';
import { Product } from '@/hooks/useProducts';
import { CatalogType } from '@/hooks/useCatalog';
import TemplateSelector from './TemplateSelector';

interface ProductGridProps {
  products: Product[];
  catalogType: CatalogType;
  loading: boolean;
  onAddToWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  wishlist: Product[];
  storeIdentifier: string;
  templateName: string;
  showPrices: boolean;
  showStock: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  catalogType,
  loading,
  onAddToWishlist,
  onQuickView,
  wishlist,
  storeIdentifier,
  templateName,
  showPrices,
  showStock
}) => {
  const handleAddToCart = (product: Product) => {
    console.log('🛒 PRODUCT GRID - Produto adicionado ao carrinho:', product);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum produto encontrado</h3>
        <p className="text-gray-500 text-center max-w-md">
          Não encontramos produtos que correspondam aos seus filtros. Tente ajustar os critérios de busca.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <TemplateSelector
          key={product.id}
          product={product}
          catalogType={catalogType}
          templateName={templateName}
          onAddToCart={handleAddToCart}
          onAddToWishlist={onAddToWishlist}
          onQuickView={onQuickView}
          isInWishlist={wishlist.some(item => item.id === product.id)}
          showPrices={showPrices}
          showStock={showStock}
          storeIdentifier={storeIdentifier}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
