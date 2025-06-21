
import React, { useState, useEffect } from 'react';
import { useCatalog } from '@/hooks/useCatalog';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import ProductGrid from './ProductGrid';
import FilterSidebar from './FilterSidebar';
import TemplateWrapper from './TemplateWrapper';
import { Product, CatalogType } from '@/hooks/useCatalog';
import { useCart } from '@/hooks/useCart';

interface PublicCatalogProps {
  storeIdentifier: string;
  catalogType?: CatalogType;
}

const PublicCatalog: React.FC<PublicCatalogProps> = ({
  storeIdentifier,
  catalogType = 'retail'
}) => {
  const { store, products, filteredProducts, loading: catalogLoading, searchProducts, filterProducts } = useCatalog(storeIdentifier, catalogType);
  const { settings, loading: settingsLoading } = useCatalogSettings(storeIdentifier);
  const { totalItems } = useCart();
  
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleAddToWishlist = (product: Product) => {
    setWishlist(prev => {
      const isAlreadyInWishlist = prev.some(item => item.id === product.id);
      if (isAlreadyInWishlist) {
        return prev.filter(item => item.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleCartClick = () => {
    console.log('🛒 PUBLIC CATALOG - Clique no carrinho');
  };

  const loading = catalogLoading || settingsLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loja não encontrada</h1>
          <p className="text-gray-600">A loja que você está procurando não existe ou não está ativa.</p>
        </div>
      </div>
    );
  }

  const templateName = settings?.template_name || 'modern';

  return (
    <TemplateWrapper
      templateName={templateName}
      store={store}
      catalogType={catalogType}
      cartItemsCount={totalItems}
      wishlistCount={wishlist.length}
      whatsappNumber={settings?.whatsapp_number || undefined}
      onSearch={searchProducts}
      onToggleFilters={() => setIsFilterOpen(!isFilterOpen)}
      onCartClick={handleCartClick}
    >
      <div className="flex gap-6">
        {settings?.allow_categories_filter && (
          <aside className="w-64 hidden lg:block">
            <FilterSidebar
              products={products}
              onFilter={filterProducts}
              isOpen={false}
              onClose={() => {}}
              isMobile={false}
            />
          </aside>
        )}
        
        <div className="flex-1">
          <ProductGrid
            products={filteredProducts}
            catalogType={catalogType}
            loading={loading}
            onAddToWishlist={handleAddToWishlist}
            onQuickView={handleQuickView}
            wishlist={wishlist}
            storeIdentifier={storeIdentifier}
            templateName={templateName}
          />
        </div>
      </div>

      {/* FilterSidebar Mobile */}
      {settings?.allow_categories_filter && (
        <FilterSidebar
          products={products}
          onFilter={filterProducts}
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          isMobile={true}
        />
      )}
    </TemplateWrapper>
  );
};

export default PublicCatalog;
