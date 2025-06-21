
import React, { useEffect } from 'react';
import { useTemplateColors } from '@/hooks/useTemplateColors';
import CatalogHeader from '../../CatalogHeader';
import CatalogFooter from '../../CatalogFooter';
import FloatingCart from '../../FloatingCart';
import FloatingWhatsApp from '../../FloatingWhatsApp';
import { Store } from '@/hooks/useCatalog';
import { CatalogType } from '@/hooks/useCatalog';

interface IndustrialCatalogTemplateProps {
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

const IndustrialCatalogTemplate: React.FC<IndustrialCatalogTemplateProps> = ({
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

  const backgroundPattern = colorScheme ? 
    `linear-gradient(45deg, ${colorScheme.background} 25%, transparent 25%), linear-gradient(-45deg, ${colorScheme.background} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${colorScheme.primary}11 75%), linear-gradient(-45deg, transparent 75%, ${colorScheme.primary}11 75%)` :
    'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #47556911 75%), linear-gradient(-45deg, transparent 75%, #47556911 75%)';

  return (
    <div className="min-h-screen bg-gray-50" style={{ 
      backgroundImage: backgroundPattern,
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
    }}>
      <style>{`
        .btn-primary {
          background: linear-gradient(135deg, var(--template-primary, #475569), var(--template-secondary, #F59E0B));
          border: 2px solid var(--template-primary, #475569);
          color: white;
          transition: all 0.3s ease;
          border-radius: var(--template-border-radius, 4px);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .btn-primary:hover {
          background: var(--template-primary, #475569);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(71, 85, 105, 0.4);
        }
        .template-card {
          background: var(--template-surface, #ffffff);
          border: 2px solid var(--template-border, #cbd5e1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border-radius: var(--template-border-radius, 4px);
        }
        .template-card:hover {
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
          border-color: var(--template-primary, #475569);
        }
        .catalog-header {
          background: var(--template-surface, #ffffff);
          border-bottom: 3px solid var(--template-primary, #475569);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .text-primary {
          color: var(--template-primary, #475569) !important;
        }
        .bg-primary {
          background-color: var(--template-primary, #475569) !important;
        }
        .border-primary {
          border-color: var(--template-primary, #475569) !important;
        }
        .industrial-accent {
          background: linear-gradient(90deg, var(--template-secondary, #F59E0B), var(--template-accent, #DC2626));
          padding: 2px 8px;
          border-radius: var(--template-border-radius, 4px);
          color: white;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
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

export default IndustrialCatalogTemplate;
