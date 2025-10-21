import React from "react";
import { Store, CatalogType } from "@/hooks/useCatalog";
import { CatalogSettingsData } from "@/hooks/useCatalogSettings";
import CatalogFooter from "@/components/catalog/CatalogFooter";
import HeroBanner from "@/components/catalog/banners/HeroBanner";
import PromotionalBanner from "@/components/catalog/banners/PromotionalBanner";
import SidebarBanner from "@/components/catalog/banners/SidebarBanner";

interface ModernCatalogTemplateProps {
  store: Store;
  catalogType: CatalogType;
  cartItemsCount: number;
  wishlistCount: number;
  whatsappNumber?: string;
  storeSettings?: CatalogSettingsData | null;
  onSearch: (query: string) => void;
  onToggleFilters: () => void;
  onCartClick: () => void;
  children: React.ReactNode;
  editorSettings?: any;
}

const ModernCatalogTemplate: React.FC<ModernCatalogTemplateProps> = ({
  store,
  catalogType,
  cartItemsCount,
  wishlistCount,
  whatsappNumber,
  storeSettings,
  onSearch,
  onToggleFilters,
  onCartClick,
  children,
  editorSettings,
}) => {
  const storeId = store.url_slug || store.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* CatalogHeader removido - catálogo começa diretamente com o banner */}

      {/* Hero Banner Section */}
      <HeroBanner storeId={storeId} className="container mx-auto px-4 pt-6" />

      <div className="container mx-auto px-4 py-8">
        {/* Promotional Banners */}
        <PromotionalBanner storeId={storeId} className="mb-8" />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar with Banners */}
          {/* <aside className="lg:w-64 flex-shrink-0">
            <SidebarBanner storeId={storeId} />
          </aside> */}

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
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
