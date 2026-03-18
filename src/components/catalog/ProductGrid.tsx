
import React from 'react';
import { Product } from '@/hooks/useProducts';
import { ProductVariation } from '@/types/variation';
import { CatalogType } from '@/hooks/useCatalog';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import TemplateSelector from './TemplateSelector';

interface ProductGridProps {
  products: Product[];
  catalogType: CatalogType;
  loading: boolean;
  onAddToWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number, variation?: ProductVariation) => void;
  wishlist: Product[];
  storeIdentifier: string;
  templateName: string;
  showPrices: boolean;
  showStock: boolean;
  hasFetched?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  catalogType,
  loading,
  onAddToWishlist,
  onQuickView,
  onAddToCart,
  wishlist,
  storeIdentifier,
  templateName,
  showPrices,
  showStock,
  hasFetched = true // Default true para compatibilidade
}) => {
  const { getMobileGridClasses } = useMobileLayout(storeIdentifier);

  if (loading) {
    return (
      <div className={getMobileGridClasses()}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden border border-border/50 rounded-xl bg-white">
            <div className="aspect-square bg-muted/20 animate-pulse"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-muted/20 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-muted/10 rounded animate-pulse w-1/2"></div>
              <div className="h-10 bg-muted/20 rounded-lg animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Só mostrar "nenhum encontrado" se já tentamos carregar e realmente não veio nada
  if (!loading && products.length === 0 && hasFetched) {
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

  // Se não está carregando e não tem produtos e ainda não buscou (gap inicial), mostrar skeleton
  if (!loading && products.length === 0 && !hasFetched) {
    return (
      <div className={getMobileGridClasses()}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden border border-border/50 rounded-xl bg-white">
            <div className="aspect-square bg-muted/20 animate-pulse"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-muted/20 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-muted/10 rounded animate-pulse w-1/2"></div>
              <div className="h-10 bg-muted/20 rounded-lg animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={getMobileGridClasses()}>
      {products.map((product) => (
        <TemplateSelector
          key={product.id}
          product={product}
          catalogType={catalogType}
          templateName={templateName}
          onAddToCart={onAddToCart}
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
