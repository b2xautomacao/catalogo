import React, { useState, useEffect, useCallback } from 'react';
import { useCatalog } from '@/hooks/useCatalog';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useCart } from '@/hooks/useCart';
import { useIsMobile } from '@/hooks/use-mobile';
import { createCartItem } from '@/utils/cartHelpers';
import { Product } from '@/hooks/useProducts';
import { ProductVariation } from '@/types/variation';
import { CatalogType } from '@/hooks/useCatalog';
import { useToast } from '@/hooks/use-toast';
import ProductDetailsModal from './ProductDetailsModal';
import FloatingCart from './FloatingCart';
import TemplateWrapper from './TemplateWrapper';
import ProductGrid from './ProductGrid';
import FilterSidebar, { FilterState } from './FilterSidebar';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

interface PublicCatalogProps {
  storeIdentifier: string;
  catalogType: CatalogType;
}

const PublicCatalog: React.FC<PublicCatalogProps> = ({ 
  storeIdentifier, 
  catalogType 
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 1000],
    inStock: false,
    variations: {
      sizes: [],
      colors: [],
      materials: []
    }
  });
  
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
    filteredProducts,
    loading, 
    storeError,
    searchProducts,
    filterProducts
  } = useCatalog(storeIdentifier, catalogType);
  
  const { settings } = useCatalogSettings(storeIdentifier);

  const applyFilters = useCallback(() => {
    console.log('🎯 PUBLIC CATALOG - Aplicando filtros:', { searchTerm, activeFilters });

    if (searchTerm.trim()) {
      searchProducts(searchTerm);
    } else {
      filterProducts({
        category: activeFilters.categories.length === 1 ? activeFilters.categories[0] : undefined,
        minPrice: activeFilters.priceRange[0],
        maxPrice: activeFilters.priceRange[1],
        inStock: activeFilters.inStock,
        variations: {
          sizes: activeFilters.variations.sizes.length ? activeFilters.variations.sizes : undefined,
          colors: activeFilters.variations.colors.length ? activeFilters.variations.colors : undefined,
          materials: activeFilters.variations.materials.length ? activeFilters.variations.materials : undefined,
        }
      });
    }
  }, [searchTerm, activeFilters, searchProducts, filterProducts]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = useCallback((filters: FilterState) => {
    console.log('🔧 PUBLIC CATALOG - Filtros alterados:', filters);
    setActiveFilters(filters);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    console.log('🔍 PUBLIC CATALOG - Busca alterada:', query);
    setSearchTerm(query);
  }, []);

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
      const cartItem = createCartItem(product, catalogType, quantity, variation);
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

  const handleAddToWishlist = (product: Product) => {
    console.log('💝 PUBLIC CATALOG - Adicionando à wishlist:', product.name);
    setWishlist(prev => {
      const isInWishlist = prev.some(item => item.id === product.id);
      if (isInWishlist) {
        toast({
          title: "Removido da wishlist",
          description: `${product.name} foi removido da sua lista de desejos.`,
          duration: 2000
        });
        return prev.filter(item => item.id !== product.id);
      } else {
        toast({
          title: "Adicionado à wishlist",
          description: `${product.name} foi adicionado à sua lista de desejos.`,
          duration: 2000
        });
        return [...prev, product];
      }
    });
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

  if (storeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar o catálogo</p>
          <p className="text-gray-600">{storeError}</p>
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

  const showPriceFilter = settings?.allow_price_filter ?? true;
  const showCategoryFilter = settings?.allow_categories_filter ?? true;
  const showPrices = settings?.show_prices ?? true;
  const showStock = settings?.show_stock ?? true;

  return (
    <div className="min-h-screen bg-gray-50">
      <TemplateWrapper
        templateName={settings?.template_name || 'modern'}
        store={store}
        catalogType={catalogType}
        cartItemsCount={totalItems}
        wishlistCount={wishlist.length}
        whatsappNumber={store.phone || undefined}
        onSearch={handleSearchChange}
        onToggleFilters={() => setShowFilters(true)}
        onCartClick={() => console.log('Cart clicked')}
      >
        <div className="flex gap-6">
          {/* Filtros Desktop */}
          {!isMobile && (showCategoryFilter || showPriceFilter) && (
            <div className="w-80 flex-shrink-0">
              <FilterSidebar
                onFilter={handleFilterChange}
                isOpen={true}
                onClose={() => {}}
                products={products}
                isMobile={false}
              />
            </div>
          )}

          {/* Grid de Produtos */}
          <div className="flex-1">
            {/* Botão de Filtros Mobile */}
            {isMobile && (showCategoryFilter || showPriceFilter) && (
              <div className="mb-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(true)}
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
            )}

            <ProductGrid
              products={filteredProducts}
              catalogType={catalogType}
              loading={loading}
              onAddToWishlist={handleAddToWishlist}
              onQuickView={handleProductClick}
              wishlist={wishlist}
              storeIdentifier={storeIdentifier}
              templateName={settings?.template_name || 'modern'}
              showPrices={showPrices}
              showStock={showStock}
              onAddToCart={handleAddToCart}
            />
          </div>
        </div>

        {/* Filtros Mobile */}
        {isMobile && (showCategoryFilter || showPriceFilter) && (
          <FilterSidebar
            onFilter={handleFilterChange}
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
            products={products}
            isMobile={true}
          />
        )}
      </TemplateWrapper>

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
