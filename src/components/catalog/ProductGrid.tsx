
import React from 'react';
import { Product } from '@/hooks/useProducts';
import { CatalogType } from '@/hooks/useCatalog';
import ProductCard from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductGridProps {
  products: Product[];
  catalogType: CatalogType;
  loading?: boolean;
  onAddToWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onAddToCart?: (product: Product) => void; // Mantém para compatibilidade, mas não é mais usado
  wishlist: Product[];
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  catalogType,
  loading = false,
  onAddToWishlist,
  onQuickView,
  wishlist
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-32 h-32 mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <span className="text-4xl">📦</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum produto encontrado</h3>
        <p className="text-gray-600 max-w-md">
          Não encontramos produtos que correspondam aos seus critérios de busca. 
          Tente ajustar os filtros ou buscar por outros termos.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          catalogType={catalogType}
          onAddToWishlist={onAddToWishlist}
          onQuickView={onQuickView}
          isInWishlist={wishlist.some(item => item.id === product.id)}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
