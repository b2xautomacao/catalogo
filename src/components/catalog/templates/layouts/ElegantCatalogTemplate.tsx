import React from "react";
import { Store, CatalogType } from "@/hooks/useCatalog";
import { CatalogSettingsData } from "@/hooks/useCatalogSettings";
import CatalogFooter from "@/components/catalog/CatalogFooter";
import SplitHeroBanner from "@/components/catalog/banners/SplitHeroBanner";
import PromotionalBanner from "@/components/catalog/banners/PromotionalBanner";
import FeaturedProductsSection from "@/components/catalog/FeaturedProductsSection";
import StorefrontHeader from "@/components/catalog/headers/StorefrontHeader";

interface ElegantCatalogTemplateProps {
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

const ElegantCatalogTemplate: React.FC<ElegantCatalogTemplateProps> = ({
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
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

      {/* Produtos em Destaque */}
      <FeaturedProductsSection
        products={products}
        catalogType={catalogType}
        enabled={storeSettings?.featured_products_enabled ?? true}
        style={(storeSettings?.featured_products_style as "hero" | "carousel") ?? "carousel"}
        onProductSelect={(product) => onProductSelect?.(product)}
        className="container mx-auto px-6 mb-4"
      />

      <div className="container mx-auto px-6 py-10">
        {/* Promotional Banners */}
        <PromotionalBanner storeId={storeId} className="mb-10" />

        {/* Main Content */}
        <main className="w-full">{children}</main>
      </div>

      <CatalogFooter
        store={store}
        whatsappNumber={whatsappNumber}
        storeSettings={storeSettings}
      />
    </div>
  );
};

export default ElegantCatalogTemplate;
