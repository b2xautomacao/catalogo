
import React from 'react';
import ModernCatalogTemplate from './templates/layouts/ModernCatalogTemplate';
import IndustrialCatalogTemplate from './templates/layouts/IndustrialCatalogTemplate';
import MinimalCatalogTemplate from './templates/layouts/MinimalCatalogTemplate';
import ElegantCatalogTemplate from './templates/layouts/ElegantCatalogTemplate';
import { Store } from '@/hooks/useCatalog';
import { CatalogType } from '@/hooks/useCatalog';

interface TemplateWrapperProps {
  templateName: string;
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

const TemplateWrapper: React.FC<TemplateWrapperProps> = ({
  templateName,
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
  const templateProps = {
    store,
    catalogType,
    cartItemsCount,
    wishlistCount,
    whatsappNumber,
    onSearch,
    onToggleFilters,
    onCartClick,
    children
  };

  switch (templateName) {
    case 'industrial':
      return <IndustrialCatalogTemplate {...templateProps} />;
    case 'minimal':
      return <MinimalCatalogTemplate {...templateProps} />;
    case 'elegant':
      return <ElegantCatalogTemplate {...templateProps} />;
    case 'modern':
    default:
      return <ModernCatalogTemplate {...templateProps} />;
  }
};

export default TemplateWrapper;
