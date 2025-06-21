
import React, { useState, useEffect } from 'react';
import { useCatalog } from '@/hooks/useCatalog';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useNavigate } from 'react-router-dom';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const navigate = useNavigate();
  
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

  const handleEditCatalog = () => {
    navigate('/visual-editor');
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
    <div className="relative">
      {/* Botão flutuante para acessar o editor */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleEditCatalog}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg"
        >
          <Edit size={24} />
        </Button>
      </div>

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
    </div>
  );
};

export default PublicCatalog;
