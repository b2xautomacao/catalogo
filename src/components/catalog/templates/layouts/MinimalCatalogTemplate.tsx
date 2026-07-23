import React from "react";
import { Store, CatalogType } from "@/hooks/useCatalog";
import { CatalogSettingsData } from "@/hooks/useCatalogSettings";
import CatalogFooter from "@/components/catalog/CatalogFooter";
import SplitHeroBanner from "@/components/catalog/banners/SplitHeroBanner";
import PromotionalBanner from "@/components/catalog/banners/PromotionalBanner";
import FeaturedProductsSection from "@/components/catalog/FeaturedProductsSection";
import StorefrontHeader from "@/components/catalog/headers/StorefrontHeader";

interface MinimalCatalogTemplateProps {
  store: Store;
  catalogType: CatalogType;
  cartItemsCount: number;
  wishlistCount: number;
  whatsappNumber?: string;
  sellerName?: string;
  storeSettings?: CatalogSettingsData | null;
  onSearch: (query: string) => void;
  onToggleFilters: () => void;
  onCartClick: () => void;
  children: React.ReactNode;
  editorSettings?: any;
  products?: any[];
  onProductSelect?: (product: any) => void;
}

const MinimalCatalogTemplate: React.FC<MinimalCatalogTemplateProps> = ({
  store,
  catalogType,
  cartItemsCount,
  wishlistCount,
  whatsappNumber,
  sellerName,
  storeSettings,
  onSearch,
  onToggleFilters,
  onCartClick,
  children,
  editorSettings,
  products = [],
  onProductSelect,
}) => {
  const storeId = store.url_slug || store.id;

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader
        store={store}
        sellerName={sellerName}
        cartItemsCount={cartItemsCount}
        wishlistCount={wishlistCount}
        products={products}
        onSearch={onSearch}
        onProductSelect={onProductSelect}
        onCartClick={onCartClick}
        onToggleFilters={onToggleFilters}
        whatsappNumber={whatsappNumber}
        storeSettings={storeSettings}
      />

      {/* Hero Section */}
      <SplitHeroBanner
        storeId={storeId}
        buttonShape={(storeSettings?.button_style as "flat" | "modern" | "rounded") ?? "modern"}
        className="py-8 md:py-12"
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Produtos em Destaque */}
        <FeaturedProductsSection
          products={products}
          catalogType={catalogType}
          enabled={storeSettings?.featured_products_enabled ?? true}
          style={(storeSettings?.featured_products_style as "hero" | "carousel") ?? "carousel"}
          onProductSelect={(product) => onProductSelect?.(product)}
          className="mb-12"
        />

        {/* Promotional Banners */}
        <PromotionalBanner storeId={storeId} className="mb-12" />

        {/* Main Content */}
        <main>{children}</main>
      </div>

      <CatalogFooter
        store={store}
        whatsappNumber={whatsappNumber}
        storeSettings={storeSettings}
      />
    </div>
  );
};

export default MinimalCatalogTemplate;
