
import React from 'react';
import { Product } from '@/types/product';
import { CatalogType } from '@/hooks/useCatalog';
import MinimalTemplate from './templates/MinimalTemplate';
import ModernTemplate from './templates/ModernTemplate';
import IndustrialTemplate from './templates/IndustrialTemplate';

export interface TemplateSelectorProps {
  products: Product[];
  catalogType: CatalogType;
  templateName: string;
  onAddToCart: (product: Product) => void;
  onAddToWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  showPrices: boolean;
  showStock: boolean;
  storeIdentifier: string;
  loading: boolean;
  editorSettings: any;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  products,
  catalogType,
  templateName,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  isInWishlist,
  showPrices,
  showStock,
  storeIdentifier,
  loading,
  editorSettings
}) => {
  // Inferir storeId do primeiro produto se disponível
  const storeId = products.length > 0 ? products[0].store_id : storeIdentifier;

  const templateProps = {
    products,
    catalogType,
    onAddToCart,
    onAddToWishlist,
    onQuickView,
    isInWishlist,
    loading,
    showPrices,
    showStock,
    editorSettings,
    storeId
  };

  switch (templateName) {
    case 'modern':
      return <ModernTemplate {...templateProps} />;
    case 'industrial':
      return <IndustrialTemplate {...templateProps} />;
    case 'minimal':
    default:
      return <MinimalTemplate {...templateProps} />;
  }
};

export default TemplateSelector;
