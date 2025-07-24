
import React, { useState, useMemo } from "react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { Product } from "@/types/product";
import { CatalogType } from "./CatalogExample";
import ProductCard from "./ProductCard";
import QuickViewModal from "./QuickViewModal";
import MinimalTemplate from "./templates/MinimalTemplate";
import ModernTemplate from "./templates/ModernTemplate";
import IndustrialTemplate from "./templates/IndustrialTemplate";
import { Loader2 } from "lucide-react";

export interface ResponsiveProductGridProps {
  products: Product[];
  catalogType: CatalogType;
  loading?: boolean;
  className?: string;
  template?: 'minimal' | 'modern' | 'elegant' | 'industrial';
  editorSettings?: any;
  storeId: string; // Deve ser sempre um UUID válido
}

const ResponsiveProductGrid: React.FC<ResponsiveProductGridProps> = ({
  products,
  catalogType,
  loading = false,
  className = "",
  template = 'minimal',
  editorSettings = {},
  storeId
}) => {
  const { addItem } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Validar se storeId é um UUID válido
  const isValidUUID = useMemo(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return storeId && uuidRegex.test(storeId);
  }, [storeId]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => product.is_active !== false);
  }, [products]);

  const handleAddToCart = (product: Product) => {
    console.log('Adding to cart:', product);
    addItem(product);
  };

  const handleAddToWishlist = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-16 ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className={`text-center py-16 ${className}`}>
        <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
        <p className="text-muted-foreground">
          Não há produtos disponíveis no momento.
        </p>
      </div>
    );
  }

  // Se o storeId não é válido, mostrar aviso
  if (!isValidUUID) {
    console.warn('ResponsiveProductGrid: storeId inválido:', storeId);
  }

  const renderTemplate = () => {
    const templateProps = {
      products: filteredProducts,
      catalogType,
      onAddToCart: handleAddToCart,
      onAddToWishlist: handleAddToWishlist,
      onQuickView: handleQuickView,
      isInWishlist,
      loading,
      showPrices: editorSettings.showPrices !== false,
      showStock: editorSettings.showStock !== false,
      editorSettings,
      storeId: isValidUUID ? storeId : '' // Só passar storeId se for válido
    };

    switch (template) {
      case 'modern':
        return <ModernTemplate {...templateProps} />;
      case 'industrial':
        return <IndustrialTemplate {...templateProps} />;
      case 'minimal':
      default:
        return <MinimalTemplate {...templateProps} />;
    }
  };

  return (
    <div className={className}>
      {renderTemplate()}
      
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          catalogType={catalogType}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
          isInWishlist={isInWishlist(quickViewProduct.id)}
          storeId={isValidUUID ? storeId : undefined}
        />
      )}
    </div>
  );
};

export default ResponsiveProductGrid;
