import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Filter, Grid, List, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCatalog, CatalogType, Product } from '@/hooks/useCatalog';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useCatalogMode } from '@/hooks/useCatalogMode';
import { CartProvider, useCart } from '@/hooks/useCart';
import { useDebounce } from '@/hooks/useDebounce';
import { createCartItem } from '@/utils/cartHelpers';
import CatalogHeader from '@/components/catalog/CatalogHeader';
import CatalogModeToggle from '@/components/catalog/CatalogModeToggle';
import FilterSidebar, { FilterState } from '@/components/catalog/FilterSidebar';
import ProductGrid from '@/components/catalog/ProductGrid';
import CatalogFooter from '@/components/catalog/CatalogFooter';
import FloatingCart from '@/components/catalog/FloatingCart';
import CheckoutModal from '@/components/catalog/CheckoutModal';
import { useToast } from '@/hooks/use-toast';

const CatalogContent = memo(() => {
  const { storeIdentifier } = useParams<{ storeIdentifier: string }>();
  const location = useLocation();
  const { toast } = useToast();
  const { totalItems } = useCart();
  
  const { catalogMode, currentCatalogType, toggleCatalogType } = useCatalogMode(storeIdentifier);
  
  console.log('Catalog: Parâmetros da URL:', { 
    storeIdentifier, 
    pathname: location.pathname, 
    search: location.search,
    catalogMode,
    currentCatalogType
  });
  
  const getCatalogTypeFromUrl = useCallback((): CatalogType => {
    // Para modo toggle, usar o tipo atual do hook
    if (catalogMode === 'toggle') {
      return currentCatalogType;
    }
    
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type');
    if (typeParam === 'wholesale') return 'wholesale';
    
    // Verificar se a URL contém "atacado" ou "wholesale"
    if (location.pathname.includes('atacado') || location.pathname.includes('wholesale')) {
      return 'wholesale';
    }
    
    return 'retail';
  }, [location.pathname, location.search, catalogMode, currentCatalogType]);

  const initialCatalogType = useMemo(() => getCatalogTypeFromUrl(), [getCatalogTypeFromUrl]);
  
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
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Handle search with debounced query
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchProducts(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, searchProducts]);

  // Update catalog type when URL changes or toggle mode changes
  useEffect(() => {
    const newCatalogType = getCatalogTypeFromUrl();
    if (newCatalogType !== catalogType) {
      console.log('Catalog: Mudando tipo de catálogo:', { from: catalogType, to: newCatalogType });
      setCatalogType(newCatalogType);
    }
  }, [location.pathname, location.search, catalogType, getCatalogTypeFromUrl, currentCatalogType]);

  // Set page title when store data is available
  useEffect(() => {
    if (store) {
      const pageTitle = `${store.name} - Catálogo ${catalogType === 'retail' ? 'Varejo' : 'Atacado'}`;
      console.log('Catalog: Definindo título da página:', pageTitle);
      document.title = pageTitle;
    }
  }, [store, catalogType]);

  // ... keep existing code (handler functions)

  const handleCatalogTypeChange = useCallback((type: CatalogType) => {
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
  }, [settings, toast, storeIdentifier, initializeCatalog]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFilter = useCallback((filters: FilterState) => {
    const filterOptions = {
      category: filters.categories.length > 0 ? filters.categories[0] : undefined,
      minPrice: filters.priceRange[0],
      maxPrice: filters.priceRange[1],
      inStock: filters.inStock,
      variations: filters.variations
    };
    
    filterProducts(filterOptions);
  }, [filterProducts]);

  const handleAddToWishlist = useCallback((product: Product) => {
    const isInWishlist = wishlist.some(item => item.id === product.id);
    
    if (isInWishlist) {
      setWishlist(prev => prev.filter(item => item.id !== product.id));
      toast({
        title: "Removido da lista de desejos",
        description: `${product.name} foi removido da sua lista de desejos.`,
      });
    } else {
      setWishlist(prev => [...prev, product]);
      toast({
        title: "Adicionado à lista de desejos!",
        description: `${product.name} foi adicionado à sua lista de desejos.`,
      });
    }
  }, [wishlist, toast]);

  const handleQuickView = useCallback((product: Product) => {
    toast({
      title: "Visualização rápida",
      description: `Abrindo detalhes de ${product.name}...`,
    });
  }, [toast]);

  const getSortedProducts = useMemo(() => {
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
  }, [filteredProducts, sortBy]);

  // Check for mobile view
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ERROR HANDLING WITH BETTER LOGGING
  if (!storeIdentifier) {
    console.error('Catalog: storeIdentifier ausente - URL inválida');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">URL inválida</h1>
          <p className="text-gray-600">O identificador da loja não foi encontrado na URL.</p>
          <p className="text-sm text-gray-500 mt-2">
            URL atual: {window.location.pathname}
          </p>
        </div>
      </div>
    );
  }

  if (storeError) {
    console.error('Catalog: Erro da loja:', storeError);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar loja</h1>
          <p className="text-gray-600 mb-2">{storeError}</p>
          <p className="text-sm text-gray-500">
            Identificador: {storeIdentifier}
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (loading && !store) {
    console.log('Catalog: Carregando loja...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Carregando catálogo...</h2>
          <p className="text-sm text-gray-500 mt-2">Buscando loja: {storeIdentifier}</p>
        </div>
      </div>
    );
  }

  if (!loading && !store) {
    console.error('Catalog: Loja não encontrada após carregamento - storeIdentifier:', storeIdentifier);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loja não encontrada</h1>
          <p className="text-gray-600">A loja que você está procurando não existe ou não está mais ativa.</p>
          <p className="text-sm text-gray-500 mt-2">Identificador buscado: {storeIdentifier}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  const sortedProducts = getSortedProducts;
  const showCategoryFilter = settings?.allow_categories_filter !== false;
  const showPriceFilter = settings?.allow_price_filter !== false;
  const showFilters = showCategoryFilter || showPriceFilter;

  console.log('Catalog: Renderizando catálogo:', { 
    store: store?.name, 
    productsCount: sortedProducts.length, 
    loading,
    storeActive: store?.is_active,
    catalogMode
  });

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
        onToggleFilters={() => setFilterSidebarOpen(true)}
      />

      {/* Toggle de Catálogo - Para modo toggle */}
      {catalogMode === 'toggle' && (
        <div className="container mx-auto px-4 pt-4">
          <CatalogModeToggle storeIdentifier={storeIdentifier} />
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filter Sidebar - Desktop */}
          {showFilters && !isMobile && (
            <div className="w-80 flex-shrink-0">
              <FilterSidebar
                onFilter={handleFilter}
                isOpen={true}
                onClose={() => {}}
                products={products}
                isMobile={false}
              />
            </div>
          )}

          {/* Mobile Filter Sidebar */}
          {showFilters && (
            <FilterSidebar
              onFilter={handleFilter}
              isOpen={filterSidebarOpen}
              onClose={() => setFilterSidebarOpen(false)}
              products={products}
              isMobile={true}
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
              storeIdentifier={storeIdentifier}
            />
          </div>
        </div>
      </div>

      {/* Footer com configurações reais */}
      <CatalogFooter
        store={store}
        whatsappNumber={settings?.whatsapp_number || undefined}
        storeSettings={settings}
      />

      {/* Floating Cart */}
      <FloatingCart onCheckout={() => setShowCheckout(true)} />

      {/* Checkout Modal - Passando dados da loja */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        storeSettings={settings}
        storeId={store?.id}
        storeData={store}
      />
    </div>
  );
});

CatalogContent.displayName = 'CatalogContent';

const Catalog = memo(() => {
  return (
    <CartProvider>
      <CatalogContent />
    </CartProvider>
  );
});

Catalog.displayName = 'Catalog';

export default Catalog;
