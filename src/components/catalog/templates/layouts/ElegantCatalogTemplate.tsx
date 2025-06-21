
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
  children
}) => {
  const { applyColorsToDocument } = useTemplateColors();

  useEffect(() => {
    applyColorsToDocument();
  }, [applyColorsToDocument]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      <style jsx global>{`
        .btn-primary {
          background: linear-gradient(135deg, var(--template-primary), var(--template-secondary));
          border: 2px solid var(--template-primary);
          color: white;
          font-weight: 600;
          letter-spacing: 0.5px;
          transition: all 0.4s ease;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, var(--template-secondary), var(--template-accent));
          border-color: var(--template-secondary);
          transform: translateY(-3px);
          box-shadow: 0 12px 24px rgba(217, 119, 6, 0.3);
        }
        .template-card {
          background: linear-gradient(135deg, var(--template-surface), rgba(255, 251, 235, 0.8));
          border: 2px solid var(--template-border);
          box-shadow: 0 8px 16px rgba(217, 119, 6, 0.1);
          transition: all 0.4s ease;
        }
        .template-card:hover {
          box-shadow: 0 20px 40px rgba(217, 119, 6, 0.2);
          transform: translateY(-8px);
          border-color: var(--template-primary);
        }
        .elegant-pattern {
          background-image: radial-gradient(circle at 2px 2px, rgba(217, 119, 6, 0.15) 1px, transparent 0);
          background-size: 20px 20px;
        }
      `}</style>
      
      <div className="elegant-pattern">
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

export default ElegantCatalogTemplate;
