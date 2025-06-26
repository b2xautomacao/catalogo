
import React, { useState, useEffect } from 'react';
import { useCatalog, CatalogType } from '@/hooks/useCatalog';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useGlobalTemplateStyles } from '@/hooks/useGlobalTemplateStyles';
import ProductGrid from './ProductGrid';
import FilterSidebar from './FilterSidebar';
import TemplateWrapper from './TemplateWrapper';
import CheckoutModal from './CheckoutModal';
import FloatingCart from './FloatingCart';
import { Product } from '@/types/product';
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
  const { isReady, templateName } = useGlobalTemplateStyles(storeIdentifier);
  const { totalItems, toggleCart } = useCart();
  
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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
    console.log('🛒 PUBLIC CATALOG - Abrindo carrinho flutuante');
    toggleCart();
  };

  const handleCheckoutFromCart = () => {
    console.log('🛒 PUBLIC CATALOG - Abrindo checkout modal a partir do carrinho');
    setIsCheckoutOpen(true);
  };

  const handleCloseCheckout = () => {
    console.log('🛒 PUBLIC CATALOG - Fechando checkout modal');
    setIsCheckoutOpen(false);
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

  return (
    <div className="relative template-container catalog-container">
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
              showPrices={settings?.show_prices ?? true}
              showStock={settings?.show_stock ?? true}
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

      {/* Floating Cart */}
      <FloatingCart
        onCheckout={handleCheckoutFromCart}
        storeId={store?.id}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={handleCloseCheckout}
        storeSettings={settings}
        storeId={store?.id}
        storeData={store}
      />
    </div>
  );
};

export default PublicCatalog;
