import React from "react";
import { Store, CatalogType } from "@/hooks/useCatalog";
import { CatalogSettingsData } from "@/hooks/useCatalogSettings";
import CatalogFooter from "@/components/catalog/CatalogFooter";
import SplitHeroBanner from "@/components/catalog/banners/SplitHeroBanner";
import PromotionalBanner from "@/components/catalog/banners/PromotionalBanner";
import FeaturedProductsSection from "@/components/catalog/FeaturedProductsSection";
import StorefrontHeader from "@/components/catalog/headers/StorefrontHeader";
import { CreditCard, ShieldCheck, Truck } from "lucide-react";
import { Product } from "@/types/product";

interface ModernCatalogTemplateProps {
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
  products?: Product[];
  onProductSelect?: (product: Product) => void;
  onCategorySelect?: (category: string) => void;
}

const ModernCatalogTemplate: React.FC<ModernCatalogTemplateProps> = ({
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
  products = [],
  onProductSelect,
  onCategorySelect,
}) => {
  const storeId = store.url_slug || store.id;
  const categories = Array.from(
    new Set(products.map((product) => product.category).filter(Boolean))
  ).map((name) => ({ id: String(name), name: String(name) }));

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
        categories={categories}
        onCategorySelect={onCategorySelect}
      />

      {/* Hero Section */}
      <SplitHeroBanner
        storeId={storeId}
        buttonShape={(storeSettings?.button_style as "flat" | "modern" | "rounded") ?? "modern"}
        className="py-5 md:py-7"
      />

      {/* Produtos em Destaque */}
      <FeaturedProductsSection
        products={products}
        catalogType={catalogType}
        enabled={storeSettings?.featured_products_enabled ?? true}
        style={(storeSettings?.featured_products_style as "hero" | "carousel") ?? "carousel"}
        onProductSelect={(product) => onProductSelect?.(product)}
        className="container mx-auto mt-3 px-4"
      />

      <section aria-label="Benefícios da loja" className="container mx-auto mt-8 px-4">
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {[
            { icon: CreditCard, title: "Compra facilitada", detail: "Condições claras e seguras" },
            { icon: Truck, title: "Entrega acompanhada", detail: "Consulte prazos para sua região" },
            { icon: ShieldCheck, title: "Atendimento confiável", detail: "Suporte direto com a loja" },
          ].map(({ icon: Icon, title, detail }) => (
            <div key={title} className="flex items-center gap-3 bg-background px-5 py-4">
              <Icon className="size-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Promotional Banners */}
        <PromotionalBanner storeId={storeId} className="mb-8" />

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

export default ModernCatalogTemplate;
