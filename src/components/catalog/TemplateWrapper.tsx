
import React, { useEffect } from 'react';
import { useEditorSync } from '@/hooks/useEditorSync';
import { useTemplateHeaderColors } from '@/hooks/useTemplateHeaderColors';
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
  // Sempre chamar hooks na mesma ordem, independente de condições
  const storeId = store?.url_slug || store?.id || '';
  const { settings } = useEditorSync(storeId);
  
  // Sempre chamar este hook, mesmo se storeId for vazio
  useTemplateHeaderColors(storeId);

  // Aplicar configurações globais do editor ao documento
  useEffect(() => {
    if (settings && storeId) {
      const root = document.documentElement;
      
      // Aplicar configurações de fonte
      if (settings.font_family) {
        root.style.setProperty('--template-font-family', settings.font_family);
      }
      
      // Aplicar configurações de espaçamento
      if (settings.layout_spacing) {
        root.style.setProperty('--template-spacing', `${settings.layout_spacing}px`);
      }
      
      // Aplicar configurações de border radius
      if (settings.border_radius) {
        root.style.setProperty('--template-border-radius', `${settings.border_radius}px`);
      }
    }
  }, [settings, storeId]);

  const templateProps = {
    store,
    catalogType,
    cartItemsCount,
    wishlistCount,
    whatsappNumber,
    onSearch,
    onToggleFilters,
    onCartClick,
    children,
    editorSettings: settings
  };

  // Verificação de segurança após os hooks
  if (!store || !storeId) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-muted-foreground">Carregando template...</p>
      </div>
    </div>;
  }

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
