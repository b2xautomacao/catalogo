import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Filter, Grid, List, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCatalog, CatalogType } from '@/hooks/useCatalog';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { Product } from '@/hooks/useProducts';
import { CartProvider, useCart } from '@/hooks/useCart';
import { createCartItem } from '@/utils/cartHelpers';
import CatalogHeader from '@/components/catalog/CatalogHeader';
import FilterSidebar, { FilterState } from '@/components/catalog/FilterSidebar';
import ProductGrid from '@/components/catalog/ProductGrid';
import CatalogFooter from '@/components/catalog/CatalogFooter';
import FloatingCart from '@/components/catalog/FloatingCart';
import CheckoutModal from '@/components/catalog/CheckoutModal';
import { useToast } from '@/hooks/use-toast';

const CatalogContent = () => {
  const { storeId, storeSlug, catalogType: urlCatalogType } = useParams<{ 
    storeId?: string; 
    storeSlug?: string; 
    catalogType?: string; 
  }>();
  const location = useLocation();
  const { toast } = useToast();
  const { totalItems } = useCart();
  
  const storeIdentifier = storeSlug || storeId;
  
  const getCatalogTypeFromUrl = (): CatalogType => {
    if (urlCatalogType === 'atacado') return 'wholesale';
    if (urlCatalogType === 'varejo') return 'retail';
    
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type');
    if (typeParam === 'wholesale') return 'wholesale';
    
    return 'retail';
  };

  const initialCatalogType = getCatalogTypeFromUrl();
  
  const {
    store,
    storeError,
    products,
    filteredProducts,
    loading,
    initializeCatalog,
    searchProducts,
    filterProducts
  } = useCatalog(storeIdentifier, initialCatalogType);

  const { settings } = useCatalogSettings(storeIdentifier);

  const [catalogType, setCatalogType] = useState<CatalogType>(initialCatalogType);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (storeIdentifier) {
      console.log('Inicializando catálogo:', storeIdentifier, catalogType);
      initializeCatalog(storeIdentifier, catalogType).then((success) => {
        if (!success) {
          toast({
            title: "Catálogo indisponível",
            description: `O catálogo de ${catalogType === 'retail' ? 'varejo' : 'atacado'} não está disponível.`,
            variant: "destructive"
          });
        }
      });
    }
  }, [storeIdentifier, catalogType, initializeCatalog]);

  useEffect(() => {
    const newCatalogType = getCatalogTypeFromUrl();
    if (newCatalogType !== catalogType) {
      setCatalogType(newCatalogType);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (store) {
      document.title = `${store.name} - Catálogo ${catalogType === 'retail' ? 'Varejo' : 'Atacado'}`;
    }
  }, [store, catalogType]);

  const handleCatalogTypeChange = (type: CatalogType) => {
    if (type === 'wholesale' && settings && !settings.wholesale_catalog_active) {
      toast({
        title: "Catálogo indisponível",
        description: "O catálogo de atacado não está disponível no momento.",
        variant: "destructive"
      });
      return;
    }

    if (type === 'retail' && settings && !settings.retail_catalog_active) {
      toast({
        title: "Catálogo indisponível",
        description: "O catálogo de varejo não está disponível no momento.",
        variant: "destructive"
      });
      return;
    }

    setCatalogType(type);
    
    if (storeIdentifier) {
      initializeCatalog(storeIdentifier, type);
    }
  };

  const handleSearch = (query: string) => {
    searchProducts(query);
  };

  const handleFilter = (filters: FilterState) => {
    const filterOptions = {
      category: filters.categories.length > 0 ? filters.categories[0] : undefined,
      minPrice: filters.priceRange[0],
      maxPrice: filters.priceRange[1],
      inStock: filters.inStock
    };
    
    filterProducts(filterOptions);
  };

  const handleAddToWishlist = (product: Product) => {
    const isInWishlist = wishlist.some(item => item.id === product.id);
    
    if (isInWishlist) {
      setWishlist(wishlist.filter(item => item.id !== product.id));
      toast({
        title: "Removido da lista de desejos",
        description: `${product.name} foi removido da sua lista de desejos.`,
      });
    } else {
      setWishlist([...wishlist, product]);
      toast({
        title: "Adicionado à lista de desejos!",
        description: `${product.name} foi adicionado à sua lista de desejos.`,
      });
    }
  };

  const handleQuickView = (product: Product) => {
    toast({
      title: "Visualização rápida",
      description: `Abrindo detalhes de ${product.name}...`,
    });
  };

  const getSortedProducts = () => {
    const sorted = [...filteredProducts];
    
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.retail_price - b.retail_price);
      case 'price-desc':
        return sorted.sort((a, b) => b.retail_price - a.retail_price);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      default:
        return sorted;
    }
  };

  if (storeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar loja</h1>
          <p className="text-gray-600">{storeError}</p>
        </div>
      </div>
    );
  }

  if (loading && !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Carregando catálogo...</h2>
        </div>
      </div>
    );
  }

  if (!loading && !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loja não encontrada</h1>
          <p className="text-gray-600">A loja que você está procurando não existe ou não está mais ativa.</p>
        </div>
      </div>
    );
  }

  const sortedProducts = getSortedProducts();
  const showCategoryFilter = settings?.allow_categories_filter !== false;
  const showPriceFilter = settings?.allow_price_filter !== false;
  const showFilters = showCategoryFilter || showPriceFilter;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header */}
      <CatalogHeader
        store={store}
        catalogType={catalogType}
        onCatalogTypeChange={handleCatalogTypeChange}
        onSearch={handleSearch}
        cartItemsCount={totalItems}
        wishlistCount={wishlist.length}
        whatsappNumber={settings?.whatsapp_number || undefined}
        onCartClick={() => setShowCheckout(true)}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filter Sidebar - Desktop */}
          {showFilters && (
            <div className="hidden lg:block w-80 flex-shrink-0">
              <FilterSidebar
                onFilter={handleFilter}
                isOpen={true}
                onClose={() => {}}
              />
            </div>
          )}

          {/* Mobile Filter Sidebar */}
          {showFilters && (
            <FilterSidebar
              onFilter={handleFilter}
              isOpen={filterSidebarOpen}
              onClose={() => setFilterSidebarOpen(false)}
            />
          )}

          {/* Products Area */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  {showFilters && (
                    <Button
                      variant="outline"
                      onClick={() => setFilterSidebarOpen(true)}
                      className="lg:hidden"
                    >
                      <Filter size={16} className="mr-2" />
                      Filtros
                    </Button>
                  )}
                  
                  <span className="text-sm text-gray-600 font-medium">
                    {sortedProducts.length} produto{sortedProducts.length !== 1 ? 's' : ''} encontrado{sortedProducts.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-lg"
                    >
                      <Grid size={16} />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-lg"
                    >
                      <List size={16} />
                    </Button>
                  </div>

                  {/* Sort Selector */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <ArrowUpDown size={16} className="mr-2" />
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nome A-Z</SelectItem>
                      <SelectItem value="price-asc">Menor preço</SelectItem>
                      <SelectItem value="price-desc">Maior preço</SelectItem>
                      <SelectItem value="newest">Mais recentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <ProductGrid
              products={sortedProducts}
              catalogType={catalogType}
              loading={loading}
              onAddToWishlist={handleAddToWishlist}
              onQuickView={handleQuickView}
              wishlist={wishlist}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <CatalogFooter
        store={store}
        whatsappNumber={settings?.whatsapp_number || undefined}
      />

      {/* Floating Cart */}
      <FloatingCart onCheckout={() => setShowCheckout(true)} />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        storeSettings={settings}
        storeId={store?.id}
      />
    </div>
  );
};

const Catalog = () => {
  return (
    <CartProvider>
      <CatalogContent />
    </CartProvider>
  );
};

export default Catalog;
