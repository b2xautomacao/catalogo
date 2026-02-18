import React, { useState, useEffect, useCallback } from "react";
import { useCatalog } from "@/hooks/useCatalog";
import { useCatalogSettings } from "@/hooks/useCatalogSettings";
import { useSeller } from "@/hooks/useSeller";
import { useCart } from "@/hooks/useCart";
import { useIsMobile } from "@/hooks/use-mobile";
import { createCartItem } from "@/utils/cartHelpers";
import { Product } from "@/hooks/useProducts";
import { ProductVariation } from "@/types/variation";
import { CatalogType } from "@/hooks/useCatalog";
import { useToast } from "@/hooks/use-toast";
import ProductDetailsModal from "./ProductDetailsModal";
import ProductDetailsModalOptimized from "./ProductDetailsModalOptimized";
import ProductCardOptimized from "./ProductCardOptimized";
import FloatingCart from "./FloatingCart";
import FloatingWhatsApp from "./FloatingWhatsApp";
import TemplateWrapper from "./TemplateWrapper";
import ProductGrid from "./ProductGrid";
import FilterSidebar, { FilterState } from "./FilterSidebar";
import EnhancedCheckout from "./checkout/EnhancedCheckout";
import DynamicMetaTags from "@/components/seo/DynamicMetaTags";
import { CurrentStoreIdProvider } from "@/contexts/CurrentStoreIdContext";
import { useCatalogStoreId } from "@/contexts/CatalogStoreIdContext";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface PublicCatalogProps {
  storeIdentifier: string;
}

const PublicCatalog: React.FC<PublicCatalogProps> = ({ storeIdentifier }) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 1000],
    inStock: false,
    variations: {
      sizes: [],
      colors: [],
      materials: [],
    },
  });

  const {
    items: cartItems,
    addItem,
    removeItem,
    updateQuantity,
    totalItems,
    clearCart,
  } = useCart();

  const {
    store,
    products,
    filteredProducts,
    loading,
    storeError,
    catalogType,
    searchProducts,
    filterProducts,
  } = useCatalog(storeIdentifier);

  const { seller } = useSeller(store?.id, sellerSlug);
  const effectivePhone = seller?.whatsapp_phone ?? store?.phone ?? undefined;

  const { settings } = useCatalogSettings(storeIdentifier);
  const catalogStoreIdApi = useCatalogStoreId();

  // Informar o carrinho qual é o store_id do catálogo (para aplicar atacado no total)
  useEffect(() => {
    if (!catalogStoreIdApi) return;
    catalogStoreIdApi.setStoreId(store?.id);
    return () => catalogStoreIdApi.setStoreId(undefined);
  }, [store?.id, catalogStoreIdApi]);

  const applyFilters = useCallback(() => {
    console.log("🎯 PUBLIC CATALOG - Aplicando filtros:", {
      searchTerm,
      activeFilters,
    });

    if (searchTerm.trim()) {
      searchProducts(searchTerm);
    } else {
      filterProducts({
        category:
          activeFilters.categories.length === 1
            ? activeFilters.categories[0]
            : undefined,
        minPrice: activeFilters.priceRange[0],
        maxPrice: activeFilters.priceRange[1],
        inStock: activeFilters.inStock,
        variations: {
          sizes: activeFilters.variations.sizes.length
            ? activeFilters.variations.sizes
            : undefined,
          colors: activeFilters.variations.colors.length
            ? activeFilters.variations.colors
            : undefined,
          materials: activeFilters.variations.materials.length
            ? activeFilters.variations.materials
            : undefined,
        },
      });
    }
  }, [searchTerm, activeFilters, searchProducts, filterProducts]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = useCallback((filters: FilterState) => {
    console.log("🔧 PUBLIC CATALOG - Filtros alterados:", filters);
    setActiveFilters(filters);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    console.log("🔍 PUBLIC CATALOG - Busca alterada:", query);
    setSearchTerm(query);
  }, []);

  const handleAddToCart = (
    product: Product,
    quantity: number = 1,
    variation?: ProductVariation
  ) => {
    console.log("🛒 PUBLIC CATALOG - Adicionando ao carrinho:", {
      productId: product.id,
      productName: product.name,
      quantity,
      catalogType,
      variation: variation
        ? {
            id: variation.id,
            color: variation.color,
            size: variation.size,
            is_grade: variation.is_grade,
            grade_name: variation.grade_name,
            grade_sizes: variation.grade_sizes,
            grade_pairs: variation.grade_pairs,
            variation_type: variation.variation_type,
          }
        : null,
    });

    try {
      console.log("🔧 PUBLIC CATALOG - ANTES createCartItem:", {
        product: product.name,
        catalogType,
        quantity,
        variation: variation
          ? {
              id: variation.id,
              is_grade: variation.is_grade,
              grade_name: variation.grade_name,
              grade_pairs: variation.grade_pairs,
              grade_sizes: variation.grade_sizes,
            }
          : null,
      });

      const productWithStore = {
        ...product,
        store_id: product.store_id ?? store?.id ?? "",
      };
      const cartItem = createCartItem(
        productWithStore,
        catalogType,
        quantity,
        variation
      );

      console.log("🔧 PUBLIC CATALOG - DEPOIS createCartItem:", {
        cartItemId: cartItem.id,
        cartItemPrice: cartItem.price,
        hasGradeInfo: !!cartItem.gradeInfo,
        gradeInfo: cartItem.gradeInfo,
      });

      addItem(cartItem);

      console.log(
        "✅ PUBLIC CATALOG - Item adicionado com sucesso ao carrinho global"
      );

      toast({
        title: "Produto adicionado!",
        description: `${product.name} foi adicionado ao carrinho.`,
        duration: 2000,
      });
    } catch (error) {
      console.error(
        "❌ PUBLIC CATALOG - Erro ao adicionar ao carrinho:",
        error
      );
      toast({
        title: "Erro ao adicionar produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleAddToWishlist = (product: Product) => {
    console.log("💝 PUBLIC CATALOG - Adicionando à wishlist:", product.name);
    setWishlist((prev) => {
      const isInWishlist = prev.some((item) => item.id === product.id);
      if (isInWishlist) {
        toast({
          title: "Removido da wishlist",
          description: `${product.name} foi removido da sua lista de desejos.`,
          duration: 2000,
        });
        return prev.filter((item) => item.id !== product.id);
      } else {
        toast({
          title: "Adicionado à wishlist",
          description: `${product.name} foi adicionado à sua lista de desejos.`,
          duration: 2000,
        });
        return [...prev, product];
      }
    });
  };

  const handleShareProduct = (product: Product) => {
    console.log("📤 PUBLIC CATALOG - Compartilhando produto:", product.name);
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Confira este produto: ${product.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "Link do produto copiado para a área de transferência.",
      });
    }
  };

  const handleProductClick = (product: Product) => {
    console.log("👆 PUBLIC CATALOG - Produto clicado:", product.name);
    // Redirecionar para página dedicada do produto
    window.location.href = `/produto/${product.id}`;
  };

  const handleQuickView = (product: Product) => {
    console.log("🚀 PUBLIC CATALOG - handleQuickView chamado:", {
      productName: product.name,
      productId: product.id,
      hasVariations: product.variations && product.variations.length > 0,
      variationsCount: product.variations?.length || 0,
    });
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log("❌ PUBLIC CATALOG - Fechando modal");
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleOpenCheckout = () => {
    setShowCheckout(true);
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
  };

  useEffect(() => {
    console.log("🔍 PUBLIC CATALOG - Estado do carrinho:", {
      totalItems,
      itemsCount: cartItems.length,
      catalogType,
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
  const useOptimizedComponents = settings?.conversion_mode === "optimized";

  return (
    <CurrentStoreIdProvider storeId={store?.id}>
      {/* Meta tags dinâmicas para SEO e compartilhamento */}
      <DynamicMetaTags storeIdentifier={storeIdentifier} catalogType={catalogType} />
      
      <div className="min-h-screen bg-gray-50">
        <TemplateWrapper
        templateName={settings?.template_name || "modern"}
        store={store}
        catalogType={catalogType}
        cartItemsCount={totalItems}
        wishlistCount={wishlist.length}
        whatsappNumber={store.phone || undefined}
        storeSettings={settings}
        onSearch={handleSearchChange}
        onToggleFilters={() => setShowFilters(true)}
        onCartClick={() => console.log("Cart clicked")}
        products={filteredProducts}
        onProductSelect={handleProductClick}
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
              templateName={settings?.template_name || "modern"}
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
        useOptimizedComponents ? (
          <ProductDetailsModalOptimized
            product={selectedProduct}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onAddToCart={handleAddToCart}
            catalogType={catalogType}
            showStock={showStock}
            showPrices={showPrices}
            storeName={store.name}
            storePhone={effectivePhone}
            storeId={store?.id}
            relatedProducts={products.filter(
              (p) =>
                p.id !== selectedProduct.id &&
                p.category === selectedProduct.category
            )}
            showConversionElements={true}
            cartTotal={cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)}
          />
        ) : (
          <ProductDetailsModal
            product={selectedProduct}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onAddToCart={handleAddToCart}
            catalogType={catalogType}
            showStock={showStock}
            showPrices={showPrices}
            storeName={store.name}
            storePhone={store.phone}
            relatedProducts={products.filter(
              (p) =>
                p.id !== selectedProduct.id &&
                p.category === selectedProduct.category
            )}
          />
        )
      )}

      {/* Carrinho Flutuante */}
      <FloatingCart onCheckout={handleOpenCheckout} storeId={store?.id} />

      {/* WhatsApp Flutuante */}
      <FloatingWhatsApp
        phoneNumber={effectivePhone}
        storeName={store.name}
        isVisible={!!effectivePhone}
      />

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-y-auto">
            <EnhancedCheckout
              storeId={store.id}
              storeName={store.name}
              storePhone={effectivePhone}
              onClose={() => setShowCheckout(false)}
            />
          </div>
        </div>
      )}
      </div>
    </CurrentStoreIdProvider>
  );
};

export default PublicCatalog;
