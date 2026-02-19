import React from "react";
import { Store, CatalogType } from "@/hooks/useCatalog";
import { CatalogSettingsData } from "@/hooks/useCatalogSettings";
import CatalogFooter from "@/components/catalog/CatalogFooter";
import HeroBanner from "@/components/catalog/banners/HeroBanner";
import PromotionalBanner from "@/components/catalog/banners/PromotionalBanner";
import SmartSearch from "@/components/catalog/SmartSearch";
import { ShoppingCart, Heart, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface IndustrialCatalogTemplateProps {
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

const IndustrialCatalogTemplate: React.FC<IndustrialCatalogTemplateProps> = ({
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
    <div className="min-h-screen bg-gray-100">
      {/* Navbar industrial */}
      <div className="sticky top-0 z-40 bg-gray-800 border-b-2 border-amber-500 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Logo e nome */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-10 h-10 rounded object-cover border-2 border-amber-500"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-bold border-2 border-amber-500">
                  {store.name.charAt(0)}
                </div>
              )}
              <div className="hidden md:block">
                <h1 className="font-bold text-white text-lg flex items-center gap-2">
                  {store.name}
                  <Settings className="h-4 w-4 text-amber-500" />
                </h1>
                {sellerName && (
                  <p className="text-xs text-amber-200 mt-0.5">
                    Atendimento: <span className="font-medium">{sellerName}</span>
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
                placeholder="Buscar produtos profissionais..."
              />
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              {wishlistCount > 0 && (
                <button className="relative p-2 hover:bg-gray-700 rounded transition-colors">
                  <Heart className="h-5 w-5 text-gray-300" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600">
                    {wishlistCount}
                  </Badge>
                </button>
              )}
              
              <button onClick={onCartClick} className="relative p-2 hover:bg-gray-700 rounded transition-colors">
                <ShoppingCart className="h-5 w-5 text-gray-300" />
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-amber-500 text-gray-900">
                    {cartItemsCount}
                  </Badge>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner Section */}
      <HeroBanner storeId={storeId} className="container mx-auto px-4 py-4" />

      <div className="container mx-auto px-4 py-6">
        {/* Promotional Banners */}
        <PromotionalBanner storeId={storeId} className="mb-6" />

        {/* Main Content */}
        <main className="w-full bg-white rounded-lg shadow-sm p-6">{children}</main>
      </div>

      <CatalogFooter
        store={store}
        whatsappNumber={whatsappNumber}
        storeSettings={storeSettings}
      />
    </div>
  );
};

export default IndustrialCatalogTemplate;
