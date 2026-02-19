import React from "react";
import { Store, CatalogType } from "@/hooks/useCatalog";
import { CatalogSettingsData } from "@/hooks/useCatalogSettings";
import CatalogFooter from "@/components/catalog/CatalogFooter";
import HeroBanner from "@/components/catalog/banners/HeroBanner";
import PromotionalBanner from "@/components/catalog/banners/PromotionalBanner";
import SmartSearch from "@/components/catalog/SmartSearch";
import { ShoppingCart, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  editorSettings?: any;
  products?: any[];
  onProductSelect?: (product: any) => void;
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
  editorSettings,
  products = [],
  onProductSelect,
}) => {
  const storeId = store.url_slug || store.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navbar com busca inteligente */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Logo e nome da loja */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {store.logo_url && (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div className="hidden sm:block">
                <h1 className="font-bold text-gray-900 text-lg">{store.name}</h1>
                {sellerName && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    Atendimento: <span className="font-medium text-gray-800">{sellerName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Busca inteligente */}
            <div className="flex-1">
              <SmartSearch
                products={products}
                onSearch={onSearch}
                onProductSelect={onProductSelect}
                placeholder="Buscar produtos..."
              />
            </div>

            {/* Ícones de carrinho e wishlist */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {wishlistCount > 0 && (
                <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Heart className="h-5 w-5 text-gray-600" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                    {wishlistCount}
                  </Badge>
                </button>
              )}
              
              {cartItemsCount > 0 && (
                <button 
                  onClick={onCartClick}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ShoppingCart className="h-5 w-5 text-gray-600" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary">
                    {cartItemsCount}
                  </Badge>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner Section */}
      <HeroBanner storeId={storeId} className="container mx-auto px-4 pt-6" />

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
