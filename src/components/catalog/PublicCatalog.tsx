
import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useCatalog } from '@/hooks/useCatalog';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useGlobalTemplateStyles } from '@/hooks/useGlobalTemplateStyles';
import { CatalogType } from '@/hooks/useCatalog';
import ProductGrid from './ProductGrid';
import FloatingCart from './FloatingCart';
import AdvancedFilterSidebar from './AdvancedFilterSidebar';
import TemplateWrapper from './TemplateWrapper';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const PublicCatalog = () => {
  const { storeIdentifier, catalogType = 'retail' } = useParams<{
    storeIdentifier: string;
    catalogType?: string;
  }>();

  const { profile } = useAuth();
  const { settings } = useCatalogSettings(storeIdentifier);
  useGlobalTemplateStyles(storeIdentifier);

  const {
    store,
    products,
    loading: catalogLoading,
    storeError
  } = useCatalog(storeIdentifier!, catalogType as CatalogType);

  const { categories } = useCategories(store?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [showInStock, setShowInStock] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === '' || product.category === selectedCategory;

      const price = catalogType === 'wholesale' && product.wholesale_price 
        ? product.wholesale_price 
        : product.retail_price || 0;
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

      const matchesColors = selectedColors.length === 0 || 
        (product.variations && product.variations.some(v => 
          selectedColors.includes(v.color || '')
        ));

      const matchesSizes = selectedSizes.length === 0 || 
        (product.variations && product.variations.some(v => 
          selectedSizes.includes(v.size || '')
        ));

      const matchesStock = !showInStock || product.stock > 0;

      return matchesSearch && matchesCategory && matchesPrice && matchesColors && matchesSizes && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, priceRange, selectedColors, selectedSizes, showInStock, catalogType]);

  const handleAddToCart = (product: any, variation?: any, quantity: number = 1) => {
    const cartItem = {
      id: `${product.id}-${variation?.id || 'default'}`,
      product,
      variation,
      quantity
    };
    
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === cartItem.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, cartItem];
    });
  };

  const handleAddToWishlist = (product: any) => {
    setWishlistItems(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    
    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange([0, 1000]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setShowInStock(false);
  };

  if (catalogLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg text-muted-foreground">Carregando catálogo...</p>
        </div>
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Erro ao carregar catálogo</h1>
          <p className="text-muted-foreground">
            {storeError || 'Loja não encontrada'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="catalog-container">
      <TemplateWrapper
        templateName={settings?.template_name || 'modern'}
        store={store}
        catalogType={catalogType as CatalogType}
        cartItemsCount={cartItems.length}
        wishlistCount={wishlistItems.length}
        whatsappNumber={settings?.whatsapp_number}
        onSearch={setSearchQuery}
        onToggleFilters={() => setIsMobileFiltersOpen(true)}
        onCartClick={() => {}}
      >
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <AdvancedFilterSidebar
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              selectedColors={selectedColors}
              onColorsChange={setSelectedColors}
              selectedSizes={selectedSizes}
              onSizesChange={setSelectedSizes}
              showInStock={showInStock}
              onShowInStockChange={setShowInStock}
              products={products}
              onClearFilters={clearFilters}
            />
          </aside>

          {/* Mobile Filter Button & Sheet */}
          <div className="lg:hidden mb-4">
            <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Filtros</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileFiltersOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="overflow-y-auto">
                  <AdvancedFilterSidebar
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    priceRange={priceRange}
                    onPriceRangeChange={setPriceRange}
                    selectedColors={selectedColors}
                    onColorsChange={setSelectedColors}
                    selectedSizes={selectedSizes}
                    onSizesChange={setSelectedSizes}
                    showInStock={showInStock}
                    onShowInStockChange={setShowInStock}
                    products={products}
                    onClearFilters={clearFilters}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  {selectedCategory ? 
                    categories.find(c => c.name === selectedCategory)?.name : 
                    'Todos os Produtos'
                  }
                </h2>
                <div className="text-sm text-muted-foreground">
                  {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                </div>
              </div>

              {(searchQuery || selectedCategory || selectedColors.length > 0 || selectedSizes.length > 0 || showInStock) && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                  {searchQuery && (
                    <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      Busca: "{searchQuery}"
                    </div>
                  )}
                  {selectedCategory && (
                    <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      {categories.find(c => c.name === selectedCategory)?.name}
                    </div>
                  )}
                  {selectedColors.map(color => (
                    <div key={color} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      {color}
                    </div>
                  ))}
                  {selectedSizes.map(size => (
                    <div key={size} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      {size}
                    </div>
                  ))}
                  {showInStock && (
                    <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      Em estoque
                    </div>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                </div>
              )}
            </div>

            <ProductGrid
              products={filteredProducts}
              catalogType={catalogType as CatalogType}
              loading={false}
              onAddToWishlist={handleAddToWishlist}
              onQuickView={() => {}}
              wishlist={wishlistItems}
              storeIdentifier={storeIdentifier!}
              templateName={settings?.template_name || 'modern'}
              showPrices={settings?.show_prices ?? true}
              showStock={settings?.show_stock ?? true}
            />
          </main>
        </div>
      </TemplateWrapper>

      <FloatingCart
        onCheckout={() => {}}
        storeId={store.id}
      />
    </div>
  );
};

export default PublicCatalog;
