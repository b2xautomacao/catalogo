import React from "react";
import { Store, CatalogType } from "@/hooks/useCatalog";
import { CatalogSettingsData } from "@/hooks/useCatalogSettings";
import CatalogFooter from "@/components/catalog/CatalogFooter";
import HeroBanner from "@/components/catalog/banners/HeroBanner";
import PromotionalBanner from "@/components/catalog/banners/PromotionalBanner";
import SmartSearch from "@/components/catalog/SmartSearch";
import { ShoppingCart, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <div className="min-h-screen bg-white">
      {/* Navbar sticky minimalista */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {store.logo_url && (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-8 h-8 rounded object-cover"
                />
              )}
              <div className="hidden sm:block">
                <h1 className="font-semibold text-gray-900">{store.name}</h1>
                {sellerName && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Atendimento: <span className="font-medium text-gray-700">{sellerName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Busca */}
            <div className="flex-1">
              <SmartSearch
                products={products}
                onSearch={onSearch}
                onProductSelect={onProductSelect}
                placeholder="Buscar..."
              />
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              {wishlistCount > 0 && (
                <button className="relative p-2 hover:bg-gray-100 rounded transition-colors">
                  <Heart className="h-5 w-5 text-gray-600" />
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs bg-red-500">
                    {wishlistCount}
                  </Badge>
                </button>
              )}
              
              <button onClick={onCartClick} className="relative p-2 hover:bg-gray-100 rounded transition-colors">
                <ShoppingCart className="h-5 w-5 text-gray-600" />
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs bg-gray-900">
                    {cartItemsCount}
                  </Badge>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Banner Section */}
        <HeroBanner storeId={storeId} className="mb-12" />

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
