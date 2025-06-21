
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
  children
}) => {
  const { applyColorsToDocument } = useTemplateColors();

  useEffect(() => {
    applyColorsToDocument();
  }, [applyColorsToDocument]);

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        .btn-primary {
          background: var(--template-primary);
          border: 1px solid var(--template-primary);
          color: white;
          transition: all 0.2s ease;
        }
        .btn-primary:hover {
          background: var(--template-secondary);
          border-color: var(--template-secondary);
        }
        .template-card {
          background: var(--template-surface);
          border: 1px solid var(--template-border);
          transition: all 0.2s ease;
        }
        .template-card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      
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
      
      <main className="container mx-auto px-4 py-4">
        {children}
      </main>

      <CatalogFooter store={store} />
      
      <FloatingCart onCheckout={onCartClick} />
      {whatsappNumber && <FloatingWhatsApp phoneNumber={whatsappNumber} />}
    </div>
  );
};

export default MinimalCatalogTemplate;
