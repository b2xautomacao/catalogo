
import React, { useEffect } from 'react';
import { useTemplateColors } from '@/hooks/useTemplateColors';
import CatalogHeader from '../../CatalogHeader';
import CatalogFooter from '../../CatalogFooter';
import FloatingCart from '../../FloatingCart';
import FloatingWhatsApp from '../../FloatingWhatsApp';
import { Store } from '@/hooks/useCatalog';
import { CatalogType } from '@/hooks/useCatalog';

interface ModernCatalogTemplateProps {
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

const ModernCatalogTemplate: React.FC<ModernCatalogTemplateProps> = ({
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <style>{`
        .btn-primary {
          background: linear-gradient(135deg, var(--template-primary), var(--template-secondary));
          border: none;
          color: white;
          transition: all 0.3s ease;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, var(--template-secondary), var(--template-accent));
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 87, 255, 0.3);
        }
        .template-card {
          background: var(--template-surface);
          border: 1px solid var(--template-border);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        .template-card:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          transform: translateY(-5px);
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
      
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      <CatalogFooter store={store} />
      
      <FloatingCart onCheckout={onCartClick} />
      {whatsappNumber && <FloatingWhatsApp phoneNumber={whatsappNumber} />}
    </div>
  );
};

export default ModernCatalogTemplate;
