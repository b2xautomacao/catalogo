
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/hooks/useProducts';
import { ProductVariation } from '@/types/variation';
import { CatalogType } from '@/hooks/useCatalog';
import ModernTemplate from './templates/ModernTemplate';
import MinimalTemplate from './templates/MinimalTemplate';
import ElegantTemplate, { CatalogSettingsData } from './templates/ElegantTemplate';
import IndustrialTemplate from './templates/IndustrialTemplate';

interface TemplateSelectorProps {
  product: Product;
  catalogType: CatalogType;
  templateName: string;
  onAddToCart: (product: Product, quantity?: number, variation?: ProductVariation) => void;
  onAddToWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isInWishlist: boolean;
  showPrices: boolean;
  showStock: boolean;
  storeIdentifier: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  product,
  catalogType,
  templateName,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  isInWishlist,
  showPrices,
  showStock,
  storeIdentifier: _storeIdentifier
}) => {
  // Converter settings para o formato esperado pelo ElegantTemplate
  const editorSettings: CatalogSettingsData = {
    colors: {
      primary: '#0057FF',
      secondary: '#FF6F00',
      surface: '#FFFFFF',
      text: '#1E293B'
    },
    global: {
      borderRadius: 8,
      fontSize: {
        small: '14px',
        medium: '16px',
        large: '20px'
      }
    },
    productCard: {
      showQuickView: true,
      showAddToCart: true,
      productCardStyle: 'default'
    }
  };

  const templateProps = {
    product,
    catalogType,
    onAddToCart,
    onAddToWishlist,
    onQuickView,
    isInWishlist,
    showPrices,
    showStock,
    editorSettings
  };

  // Verificar se o produto tem variações
  console.log('🎯 TemplateSelector - Produto:', {
    id: product.id,
    name: product.name,
    variations: product.variations?.length || 0,
    template: templateName
  });

  switch (templateName) {
    case 'modern':
      return <ModernTemplate {...templateProps} />;
    case 'minimal':
      return <MinimalTemplate {...templateProps} />;
    case 'elegant':
      return <ElegantTemplate {...templateProps} />;
    case 'industrial':
      return <IndustrialTemplate {...templateProps} />;
    default:
      return <ModernTemplate {...templateProps} />;
  }
};

export default TemplateSelector;
