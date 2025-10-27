import React from 'react';
import { Store, CatalogType } from '@/hooks/useCatalog';
import { CatalogSettingsData } from '@/hooks/useCatalogSettings';
import ConversionHeader from '@/components/catalog/headers/ConversionHeader';
import CustomizableFooter from '@/components/catalog/footers/CustomizableFooter';
import FullWidthHeroBanner from '@/components/catalog/banners/FullWidthHeroBanner';

interface MinimalCleanTemplateProps {
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
  products?: any[];
  onProductSelect?: (product: any) => void;
}

const MinimalCleanTemplate: React.FC<MinimalCleanTemplateProps> = ({
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header com badges de conversão */}
      <ConversionHeader
        store={store}
        cartItemsCount={cartItemsCount}
        wishlistCount={wishlistCount}
        products={products}
        onSearch={onSearch}
        onProductSelect={onProductSelect}
        onCartClick={onCartClick}
        onToggleFilters={onToggleFilters}
        showBadges={storeSettings?.header_badges_enabled !== false}
        storeSettings={storeSettings}
      />

      {/* Hero Banner Full-Width */}
      <FullWidthHeroBanner 
        storeId={storeId}
        showCTA={false}
      />

      {/* Main Content - Container estreito para foco */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {children}
        </div>
      </main>

      {/* Footer Customizável */}
      <CustomizableFooter
        store={store}
        whatsappNumber={whatsappNumber}
        storeSettings={storeSettings}
        style={storeSettings?.footer_style as any || 'dark'}
        bgColor={storeSettings?.footer_bg_color}
        textColor={storeSettings?.footer_text_color}
      />
    </div>
  );
};

export default MinimalCleanTemplate;

