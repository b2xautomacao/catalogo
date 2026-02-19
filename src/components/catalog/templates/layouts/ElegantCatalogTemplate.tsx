import React from "react";
import { Store, CatalogType } from "@/hooks/useCatalog";
import { CatalogSettingsData } from "@/hooks/useCatalogSettings";
import CatalogFooter from "@/components/catalog/CatalogFooter";
import HeroBanner from "@/components/catalog/banners/HeroBanner";
import PromotionalBanner from "@/components/catalog/banners/PromotionalBanner";
import SmartSearch from "@/components/catalog/SmartSearch";
import { ShoppingCart, Heart, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      {/* Navbar elegante */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Logo e nome */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-12 h-12 rounded-lg object-cover ring-2 ring-amber-300"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                  {store.name.charAt(0)}
                </div>
              )}
              <div className="hidden md:block">
                <h1 className="font-bold text-gray-900 text-xl flex items-center gap-2">
                  {store.name}
                  <Crown className="h-4 w-4 text-amber-600" />
                </h1>
                {sellerName && (
                  <p className="text-xs text-amber-800 mt-0.5">
                    Atendimento: <span className="font-medium text-amber-900">{sellerName}</span>
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
                placeholder="Buscar produtos elegantes..."
              />
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              {wishlistCount > 0 && (
                <button className="relative p-2 hover:bg-amber-100 rounded-lg transition-colors">
                  <Heart className="h-5 w-5 text-amber-700" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                    {wishlistCount}
                  </Badge>
                </button>
              )}
              
              <button onClick={onCartClick} className="relative p-2 hover:bg-amber-100 rounded-lg transition-colors">
                <ShoppingCart className="h-5 w-5 text-amber-700" />
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-amber-600">
                    {cartItemsCount}
                  </Badge>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner Section */}
      <HeroBanner storeId={storeId} className="container mx-auto px-6 py-8" />

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
