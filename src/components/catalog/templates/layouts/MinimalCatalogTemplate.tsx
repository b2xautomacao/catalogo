
import React, { useEffect } from 'react';
import { useTemplateColors } from '@/hooks/useTemplateColors';
import CatalogHeader from '../../CatalogHeader';
import CatalogFooter from '../../CatalogFooter';
import FloatingCart from '../../FloatingCart';
import FloatingWhatsApp from '../../FloatingWhatsApp';
import { Store } from '@/hooks/useCatalog';
import { CatalogType } from '@/hooks/useCatalog';

interface MinimalCatalogTemplateProps {
  store: Store;
  catalogType: CatalogType;
  cartItemsCount: number;
  wishlistCount: number;
  whatsappNumber?: string;
  onSearch: (query: string) => void;
  onToggleFilters: () => void;
  onCartClick: () => void;
  children: React.ReactNode;
  editorSettings?: any;
}

const MinimalCatalogTemplate: React.FC<MinimalCatalogTemplateProps> = ({
  store,
  catalogType,
  cartItemsCount,
  wishlistCount,
  whatsappNumber,
  onSearch,
  onToggleFilters,
  onCartClick,
  children,
  editorSettings
}) => {
  const { applyColorsToDocument, colorScheme } = useTemplateColors(store.url_slug || store.id);

  useEffect(() => {
    applyColorsToDocument();
  }, [applyColorsToDocument]);

  return (
    <div className="min-h-screen" style={{ 
      backgroundColor: colorScheme?.background || '#ffffff'
    }}>
      <style>{`
        .btn-primary {
          background: var(--template-primary, #1F2937);
          border: 1px solid var(--template-primary, #1F2937);
          color: white;
          transition: all 0.2s ease;
          border-radius: var(--template-border-radius, 2px);
          font-weight: 500;
          padding: 8px 16px;
        }
        .btn-primary:hover {
          background: var(--template-secondary, #059669);
          border-color: var(--template-secondary, #059669);
          transform: translateY(0);
        }
        .template-card {
          background: var(--template-surface, #ffffff);
          border: 1px solid var(--template-border, #e5e7eb);
          transition: all 0.2s ease;
          border-radius: var(--template-border-radius, 2px);
          box-shadow: none;
        }
        .template-card:hover {
          border-color: var(--template-primary, #1F2937);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .catalog-header {
          background: var(--template-surface, #ffffff);
          border-bottom: 1px solid var(--template-border, #e5e7eb);
        }
        .text-primary {
          color: var(--template-primary, #1F2937) !important;
        }
        .bg-primary {
          background-color: var(--template-primary, #1F2937) !important;
        }
        .border-primary {
          border-color: var(--template-primary, #1F2937) !important;
        }
        .minimal-text {
          font-family: var(--template-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
          line-height: 1.6;
        }
      `}</style>
      
      <div className="catalog-header">
        <CatalogHeader 
          store={store}
          catalogType={catalogType}
          cartItemsCount={cartItemsCount}
          wishlistCount={wishlistCount}
          whatsappNumber={whatsappNumber}
          onSearch={onSearch}
          onToggleFilters={onToggleFilters}
          onCartClick={onCartClick}
        />
      </div>
      
      <main className="container mx-auto px-4 py-4 minimal-text">
        {children}
      </main>

      <CatalogFooter store={store} />
      
      <FloatingCart onCheckout={onCartClick} />
      {whatsappNumber && <FloatingWhatsApp phoneNumber={whatsappNumber} />}
    </div>
  );
};

export default MinimalCatalogTemplate;
