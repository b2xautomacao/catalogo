
import React, { useEffect } from 'react';
import { useTemplateColors } from '@/hooks/useTemplateColors';
import CatalogHeader from '../../CatalogHeader';
import CatalogFooter from '../../CatalogFooter';
import FloatingCart from '../../FloatingCart';
import FloatingWhatsApp from '../../FloatingWhatsApp';
import { Store } from '@/hooks/useCatalog';
import { CatalogType } from '@/hooks/useCatalog';

interface ElegantCatalogTemplateProps {
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

const ElegantCatalogTemplate: React.FC<ElegantCatalogTemplateProps> = ({
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

  const backgroundTexture = colorScheme ? 
    `radial-gradient(circle at 20% 80%, ${colorScheme.background}22 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${colorScheme.primary}11 0%, transparent 50%), radial-gradient(circle at 40% 40%, ${colorScheme.secondary}08 0%, transparent 50%)` :
    'radial-gradient(circle at 20% 80%, #fffbeb22 0%, transparent 50%), radial-gradient(circle at 80% 20%, #d9770611 0%, transparent 50%), radial-gradient(circle at 40% 40%, #92400e08 0%, transparent 50%)';

  return (
    <div className="min-h-screen" style={{ 
      backgroundColor: colorScheme?.background || '#fffbeb',
      backgroundImage: backgroundTexture
    }}>
      <style>{`
        .btn-primary {
          background: linear-gradient(135deg, var(--template-primary, #D97706), var(--template-secondary, #92400E));
          border: none;
          color: white;
          transition: all 0.3s ease;
          border-radius: var(--template-border-radius, 8px);
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, var(--template-secondary, #92400E), var(--template-accent, #7C2D12));
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(217, 119, 6, 0.3);
        }
        .template-card {
          background: var(--template-surface, #ffffff);
          border: 1px solid var(--template-border, #fde68a);
          box-shadow: 0 4px 6px rgba(217, 119, 6, 0.1);
          transition: all 0.3s ease;
          border-radius: var(--template-border-radius, 12px);
          backdrop-filter: blur(10px);
        }
        .template-card:hover {
          box-shadow: 0 8px 16px rgba(217, 119, 6, 0.2);
          transform: translateY(-2px);
          border-color: var(--template-primary, #D97706);
        }
        .catalog-header {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--template-border, #fde68a);
        }
        .text-primary {
          color: var(--template-primary, #D97706) !important;
        }
        .bg-primary {
          background-color: var(--template-primary, #D97706) !important;
        }
        .border-primary {
          border-color: var(--template-primary, #D97706) !important;
        }
        .elegant-gold-accent {
          background: linear-gradient(45deg, var(--template-primary, #D97706), var(--template-secondary, #92400E));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
        }
        .elegant-shadow {
          text-shadow: 0 1px 3px rgba(217, 119, 6, 0.3);
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
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      <CatalogFooter store={store} />
      
      <FloatingCart onCheckout={onCartClick} />
      {whatsappNumber && <FloatingWhatsApp phoneNumber={whatsappNumber} />}
    </div>
  );
};

export default ElegantCatalogTemplate;
