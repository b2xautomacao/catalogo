
import React from "react";
import { Product } from "@/types/product";
import { CatalogType } from "../CatalogExample";
import ProductCard from "../ProductCard";
import { Loader2 } from "lucide-react";

export interface ModernTemplateProps {
  products: Product[];
  catalogType: CatalogType;
  onAddToCart: (product: Product) => void;
  onAddToWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  loading: boolean;
  showPrices: boolean;
  showStock: boolean;
  editorSettings: any;
  storeId?: string;
}

const ModernTemplate: React.FC<ModernTemplateProps> = ({
  products,
  catalogType,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  isInWishlist,
  loading,
  showPrices,
  showStock,
  editorSettings,
  storeId
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum produto encontrado</h3>
        <p className="text-gray-500">Não há produtos disponíveis no momento.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
      {products.map((product) => (
        <div key={product.id} className="animate-fadeInUp">
          <ProductCard
            product={product}
            catalogType={catalogType}
            onAddToCart={() => onAddToCart(product)}
            onAddToWishlist={() => onAddToWishlist(product)}
            onQuickView={() => onQuickView(product)}
            isInWishlist={isInWishlist(product.id)}
            showPrices={showPrices}
            showStock={showStock}
            storeId={storeId}
            className="hover:scale-105 transition-transform duration-300"
          />
        </div>
      ))}
    </div>
  );
};

export default ModernTemplate;
