
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import CatalogHeader from "./CatalogHeader";
import CatalogFilters from "./CatalogFilters";
import ResponsiveProductGrid from "./ResponsiveProductGrid";
import ProductDetailsModal from "./ProductDetailsModal";
import { Product } from "@/types/product";
import { CatalogType, useCatalog } from "@/hooks/useCatalog";
import { useCart } from "@/hooks/useCart";
import { createCartItem } from "@/utils/cartHelpers";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Search, Filter } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const PublicCatalog: React.FC = () => {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Estados locais
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [showFilters, setShowFilters] = useState(false);

  // Determinar tipo de catálogo a partir da URL
  const catalogType: CatalogType = searchParams.get("type") === "wholesale" ? "wholesale" : "retail";

  // Hook do catálogo
  const {
    products: allProducts,
    categories,
    loading: storeLoading,
    error,
    storeConfig,
  } = useCatalog({
    storeIdentifier: storeSlug || "",
    catalogType,
  });

  // Hook do carrinho
  const { items: cartItems, addItem } = useCart();

  // Filtrar produtos baseado nos filtros aplicados
  const filteredProducts = React.useMemo(() => {
    if (!allProducts) return [];

    let filtered = allProducts.filter((product) => {
      // Filtro de categoria
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }

      // Filtro de preço
      const price = catalogType === 'wholesale' && product.wholesale_price 
        ? product.wholesale_price 
        : product.retail_price;
      if (price < priceRange[0] || price > priceRange[1]) {
        return false;
      }

      // Filtro de busca
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    });

    // Ordenação
    switch (sortBy) {
      case "price_asc":
        filtered.sort((a, b) => {
          const priceA = catalogType === 'wholesale' && a.wholesale_price ? a.wholesale_price : a.retail_price;
          const priceB = catalogType === 'wholesale' && b.wholesale_price ? b.wholesale_price : b.retail_price;
          return priceA - priceB;
        });
        break;
      case "price_desc":
        filtered.sort((a, b) => {
          const priceA = catalogType === 'wholesale' && a.wholesale_price ? a.wholesale_price : a.retail_price;
          const priceB = catalogType === 'wholesale' && b.wholesale_price ? b.wholesale_price : b.retail_price;
          return priceB - priceA;
        });
        break;
      case "name":
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [allProducts, selectedCategory, priceRange, searchTerm, sortBy, catalogType]);

  // Atualizar URL quando filtros mudarem
  useEffect(() => {
    const params = new URLSearchParams();
    if (catalogType === "wholesale") params.set("type", "wholesale");
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchTerm) params.set("search", searchTerm);
    if (sortBy !== "name") params.set("sort", sortBy);
    
    setSearchParams(params);
  }, [catalogType, selectedCategory, searchTerm, sortBy, setSearchParams]);

  // Handlers
  const handleAddToWishlist = (product: Product) => {
    const isInWishlist = wishlist.some(item => item.id === product.id);
    if (isInWishlist) {
      setWishlist(prev => prev.filter(item => item.id !== product.id));
    } else {
      setWishlist(prev => [...prev, product]);
    }
  };

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleAddToCart = (product: Product, quantity: number = 1, variation?: any) => {
    console.log('🛒 PUBLIC CATALOG - Adicionando ao carrinho:', { product, quantity, variation });
    
    // Criar item do carrinho usando a função helper
    const cartItem = createCartItem(product, catalogType, quantity, variation);
    addItem(cartItem);
  };

  const handleCartClick = () => {
    console.log('🛒 PUBLIC CATALOG - Abrindo carrinho');
    // Aqui você pode implementar a navegação para o carrinho ou abrir um modal
  };

  const resetFilters = () => {
    setSelectedCategory("");
    setPriceRange([0, 1000]);
    setSearchTerm("");
    setSortBy("name");
  };

  // Estados de carregamento e erro
  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando catálogo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erro ao carregar catálogo</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!storeConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loja não encontrada</p>
        </div>
      </div>
    );
  }

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header do Catálogo */}
      <CatalogHeader
        storeName={storeConfig.name}
        storeDescription={storeConfig.description}
        catalogType={catalogType}
        templateName={storeConfig.template_name || "modern"}
      />

      {/* Barra de Ações Mobile */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b lg:hidden">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <CatalogFilters
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    priceRange={priceRange}
                    onPriceRangeChange={setPriceRange}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    onResetFilters={resetFilters}
                  />
                </SheetContent>
              </Sheet>
              
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="relative">
                <Heart className="h-4 w-4" />
                {wishlist.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                    {wishlist.length}
                  </Badge>
                )}
              </Button>
              
              <Button 
                variant="default" 
                size="sm" 
                className="relative"
                onClick={handleCartClick}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Carrinho
                {totalCartItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-500">
                    {totalCartItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Principal */}
      <div className="container mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar de Filtros - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <CatalogFilters
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onResetFilters={resetFilters}
              />
            </div>
          </div>

          {/* Grid de Produtos */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {catalogType === "wholesale" ? "Catálogo Atacado" : "Catálogo Varejo"}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {filteredProducts.length} produto(s) encontrado(s)
                </p>
              </div>

              {/* Carrinho - Desktop */}
              <div className="hidden lg:flex items-center gap-4">
                <Button variant="ghost" className="relative">
                  <Heart className="h-4 w-4 mr-2" />
                  Lista de Desejos
                  {wishlist.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                      {wishlist.length}
                    </Badge>
                  )}
                </Button>
                
                <Button className="relative" onClick={handleCartClick}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Carrinho
                  {totalCartItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-500">
                      {totalCartItems}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            <ResponsiveProductGrid
              products={filteredProducts}
              catalogType={catalogType}
              storeIdentifier={storeSlug || ""}
              loading={false}
              onAddToWishlist={handleAddToWishlist}
              onQuickView={handleQuickView}
              onAddToCart={handleAddToCart}
              wishlist={wishlist}
              templateName={storeConfig.template_name || "modern"}
              showPrices={storeConfig.settings?.show_prices ?? true}
              showStock={storeConfig.settings?.show_stock ?? true}
            />
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Produto */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        catalogType={catalogType}
      />
    </div>
  );
};

export default PublicCatalog;
