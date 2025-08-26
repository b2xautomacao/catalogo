import React, { useState, useEffect } from "react";
import { useCatalog, CatalogType } from "@/hooks/useCatalog";
import { useCatalogSettings } from "@/hooks/useCatalogSettings";
import { useGlobalTemplateStyles } from "@/hooks/useGlobalTemplateStyles";
import { useDynamicMetaTags } from "@/hooks/useDynamicMetaTags";
import ResponsiveProductGrid from "./ResponsiveProductGrid";
import AdvancedFilterSidebar, {
  AdvancedFilterState,
} from "./AdvancedFilterSidebar";
import TemplateWrapper from "./TemplateWrapper";
import CheckoutModal from "./CheckoutModal";
import FloatingCart from "./FloatingCart";
import ProductDetailsModal from "./ProductDetailsModal";
import CatalogBannerSection from "./banners/CatalogBannerSection";
import { Product } from "@/types/product";
import { useCart } from "@/hooks/useCart";

interface PublicCatalogProps {
  storeIdentifier: string;
  catalogType?: CatalogType;
}

const PublicCatalog: React.FC<PublicCatalogProps> = ({
  storeIdentifier,
  catalogType = "retail",
}) => {
  const {
    store,
    products,
    loading: catalogLoading,
    searchProducts,
  } = useCatalog(storeIdentifier, catalogType);
  const { settings, loading: settingsLoading } =
    useCatalogSettings(storeIdentifier);
  const { isReady, templateName } = useGlobalTemplateStyles(storeIdentifier);
  const { totalItems, toggleCart, addItem } = useCart();

  // Hook para meta tags dinâmicas
  const { isLoaded: metaTagsLoaded } = useDynamicMetaTags({
    storeIdentifier,
    catalogType,
  });

  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);

  // Atualizar produtos filtrados quando os produtos mudarem
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  // Função de filtragem inteligente
  const handleAdvancedFilter = (filters: AdvancedFilterState) => {
    let filtered = [...products];

    // Busca por texto inteligente
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase().trim();
      const searchTerms = query.split(" ").filter((term) => term.length > 0);

      filtered = filtered.filter((product) => {
        const searchableText = [
          product.name,
          product.description,
          product.category,
          ...(
            product.variations?.map((v) => [v.color, v.size].filter(Boolean)) ||
            []
          ).flat(),
        ]
          .join(" ")
          .toLowerCase();

        return searchTerms.every((term) => searchableText.includes(term));
      });
    }

    // Filtro por categoria
    if (filters.categories.length > 0) {
      filtered = filtered.filter((product) =>
        filters.categories.includes(product.category || "")
      );
    }

    // Filtro por faixa de preço
    filtered = filtered.filter((product) => {
      const price = product.retail_price || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Filtro por estoque
    if (filters.inStock) {
      filtered = filtered.filter((product) => (product.stock || 0) > 0);
    }

    // Filtro por destaque
    if (filters.featured) {
      filtered = filtered.filter((product) => product.is_featured);
    }

    // Filtro por variações
    if (
      filters.variations.colors.length > 0 ||
      filters.variations.sizes.length > 0
    ) {
      filtered = filtered.filter((product) => {
        if (!product.variations || product.variations.length === 0)
          return false;

        return product.variations.some((variation) => {
          const colorMatch =
            filters.variations.colors.length === 0 ||
            (variation.color &&
              filters.variations.colors.includes(variation.color));

          const sizeMatch =
            filters.variations.sizes.length === 0 ||
            (variation.size &&
              filters.variations.sizes.includes(variation.size));

          return colorMatch && sizeMatch;
        });
      });
    }

    // Filtro por avaliação
    if (filters.rating > 0) {
      filtered = filtered.filter((product) => {
        const hash = product.id.split("").reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0);
          return a & a;
        }, 0);
        const rating = 3.5 + (Math.abs(hash) % 15) / 10;
        return rating >= filters.rating;
      });
    }

    setFilteredProducts(filtered);
  };

  const handleAddToWishlist = (product: Product) => {
    setWishlist((prev) => {
      const isAlreadyInWishlist = prev.some((item) => item.id === product.id);
      if (isAlreadyInWishlist) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleAddToCart = (product: Product, quantity: number = 1, variation?: any) => {
    console.log('🛒 PUBLIC CATALOG - Adicionando ao carrinho:', { product, quantity, variation });
    
    // Criar item do carrinho usando a função helper
    import('@/utils/cartHelpers').then(({ createCartItem }) => {
      const cartItem = createCartItem(product, catalogType, quantity, variation);
      addItem(cartItem);
    });
  };

  const handleCartClick = () => {
    console.log("🛒 PUBLIC CATALOG - Abrindo carrinho flutuante");
    toggleCart();
  };

  const handleCheckoutFromCart = () => {
    console.log(
      "🛒 PUBLIC CATALOG - Abrindo checkout modal a partir do carrinho"
    );
    setIsCheckoutOpen(true);
  };

  const handleCloseCheckout = () => {
    console.log("🛒 PUBLIC CATALOG - Fechando checkout modal");
    setIsCheckoutOpen(false);
  };

  const loading = catalogLoading || settingsLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">
            Carregando catálogo...
          </h2>
          <p className="text-gray-500 mt-2">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Loja não encontrada
          </h1>
          <p className="text-gray-600 mb-6">
            A loja que você está procurando não existe ou não está ativa.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative template-container catalog-container enhanced-catalog">
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
        {/* Layout Desktop Otimizado - Estilo Mercado Livre */}
        <div className="min-h-screen bg-gray-50">
          {/* Banner do Catálogo - Mesma largura do header */}
          <div className="container mx-auto px-4 py-4">
            <CatalogBannerSection
              storeId={store.id}
              bannerType="promotional"
              className="mb-6"
            />
          </div>

          {/* Conteúdo Principal */}
          <div className="container mx-auto px-4">
            <div className="flex gap-6">
              {/* Sidebar de Filtros - Desktop */}
              {settings?.allow_categories_filter && (
                <div className="hidden lg:block w-60 flex-shrink-0">
                  <div className="sticky top-4">
                    <AdvancedFilterSidebar
                      onFilter={handleAdvancedFilter}
                      isOpen={true}
                      onClose={() => {}}
                      products={products}
                      isMobile={false}
                    />
                  </div>
                </div>
              )}

              {/* Grid de Produtos */}
              <div className="flex-1 min-w-0">
                <ResponsiveProductGrid
                  products={filteredProducts}
                  catalogType={catalogType}
                  storeIdentifier={storeIdentifier}
                  loading={loading}
                  onAddToWishlist={handleAddToWishlist}
                  onQuickView={handleQuickView}
                  onAddToCart={handleAddToCart}
                  wishlist={wishlist}
                  templateName={templateName}
                  showPrices={settings?.show_prices ?? true}
                  showStock={settings?.show_stock ?? true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros Mobile */}
        {settings?.allow_categories_filter && (
          <AdvancedFilterSidebar
            onFilter={handleAdvancedFilter}
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            products={products}
            isMobile={true}
          />
        )}
      </TemplateWrapper>

      {/* Floating Cart */}
      <FloatingCart onCheckout={handleCheckoutFromCart} storeId={store?.id} />

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        catalogType={catalogType}
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
