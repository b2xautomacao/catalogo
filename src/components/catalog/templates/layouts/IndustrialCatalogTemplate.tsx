
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
  children
}) => {
  const { applyColorsToDocument } = useTemplateColors();

  useEffect(() => {
    applyColorsToDocument();
  }, [applyColorsToDocument]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-gray-200">
      <style>{`
        .btn-primary {
          background: linear-gradient(135deg, var(--template-primary), var(--template-secondary));
          border: 2px solid rgba(71, 85, 105, 0.3);
          color: white;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, var(--template-secondary), var(--template-primary));
          border-color: var(--template-secondary);
          box-shadow: 0 8px 20px rgba(71, 85, 105, 0.4);
        }
        .template-card {
          background: var(--template-surface);
          border: 2px solid var(--template-border);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
        }
        .template-card:hover {
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
          border-color: var(--template-secondary);
        }
        .industrial-texture {
          background-image: 
            linear-gradient(45deg, transparent 25%, rgba(71, 85, 105, 0.05) 25%),
            linear-gradient(-45deg, transparent 25%, rgba(71, 85, 105, 0.05) 25%),
            linear-gradient(45deg, rgba(71, 85, 105, 0.05) 75%, transparent 75%),
            linear-gradient(-45deg, rgba(71, 85, 105, 0.05) 75%, transparent 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
      
      <div className="industrial-texture">
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
        
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>

        <CatalogFooter store={store} />
      </div>
      
      <FloatingCart onCheckout={onCartClick} />
      {whatsappNumber && <FloatingWhatsApp phoneNumber={whatsappNumber} />}
    </div>
  );
};

export default IndustrialCatalogTemplate;
