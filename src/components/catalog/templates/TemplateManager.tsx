
import React from 'react';
import { Store, CatalogType } from '@/hooks/useCatalog';
import { useTemplateColors } from '@/hooks/useTemplateColors';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';

// Importar novos templates modernos
import FashionLuxeTemplate from './styles/FashionLuxeTemplate';
import CleanProfessionalTemplate from './styles/CleanProfessionalTemplate';
import TechModernTemplate from './styles/TechModernTemplate';
import ElegantStoreTemplate from './styles/ElegantStoreTemplate';

// Importar templates de estilo existentes
import MinimalTemplate from './styles/MinimalTemplate';
import DarkTemplate from './styles/DarkTemplate';
import VibrantTemplate from './styles/VibrantTemplate';
import NeutralTemplate from './styles/NeutralTemplate';

// Importar templates de layout (compatibilidade)
import ProfessionalCatalogTemplate from './layouts/ProfessionalCatalogTemplate';

interface TemplateManagerProps {
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

// Mapeamento completo de templates
const TEMPLATE_MAPPING = {
  // Novos templates modernos e profissionais
  'fashion-luxe': { component: 'FashionLuxeTemplate' },
  'clean-professional': { component: 'CleanProfessionalTemplate' },
  'tech-modern': { component: 'TechModernTemplate' },
  'elegant-store': { component: 'ElegantStoreTemplate' },
  
  // Templates baseados em estilo e nicho
  'minimal-fashion': { style: 'minimal', niche: 'fashion' },
  'minimal-electronics': { style: 'minimal', niche: 'electronics' },
  'minimal-food': { style: 'minimal', niche: 'food' },
  'minimal-cosmetics': { style: 'minimal', niche: 'cosmetics' },
  
  'dark-fashion': { style: 'dark', niche: 'fashion' },
  'dark-electronics': { style: 'dark', niche: 'electronics' },
  'dark-food': { style: 'dark', niche: 'food' },
  'dark-cosmetics': { style: 'dark', niche: 'cosmetics' },
  
  'vibrant-fashion': { style: 'vibrant', niche: 'fashion' },
  'vibrant-electronics': { style: 'vibrant', niche: 'electronics' },
  'vibrant-food': { style: 'vibrant', niche: 'food' },
  'vibrant-cosmetics': { style: 'vibrant', niche: 'cosmetics' },
  
  'neutral-fashion': { style: 'neutral', niche: 'fashion' },
  'neutral-electronics': { style: 'neutral', niche: 'electronics' },
  'neutral-food': { style: 'neutral', niche: 'food' },
  'neutral-cosmetics': { style: 'neutral', niche: 'cosmetics' },

  // Compatibilidade com templates legados
  'professional': { style: 'neutral', niche: 'electronics' },
  'modern': { style: 'vibrant', niche: 'fashion' },
  'luxury': { style: 'dark', niche: 'fashion' },
  'tech': { style: 'dark', niche: 'electronics' },
  'fashion': { style: 'vibrant', niche: 'fashion' },
  'health': { style: 'neutral', niche: 'cosmetics' },
  'sports': { style: 'vibrant', niche: 'electronics' },
  'minimal': { style: 'minimal', niche: 'fashion' },
  'elegant': { style: 'minimal', niche: 'cosmetics' },
  'industrial': { style: 'neutral', niche: 'electronics' }
};

const TemplateManager: React.FC<TemplateManagerProps> = (props) => {
  const { store } = props;
  const storeIdentifier = store.url_slug || store.id;
  const { settings } = useCatalogSettings(storeIdentifier);
  
  // Aplicar cores do template automaticamente
  const { applyColorsToDocument } = useTemplateColors(storeIdentifier);
  
  React.useEffect(() => {
    applyColorsToDocument();
  }, [applyColorsToDocument, settings]);

  // Determinar template e configurações
  const templateName = settings?.template_name || 'clean-professional';
  const templateConfig = TEMPLATE_MAPPING[templateName as keyof typeof TEMPLATE_MAPPING];
  
  if (!templateConfig) {
    console.warn(`Template '${templateName}' não encontrado, usando padrão clean-professional`);
    return <CleanProfessionalTemplate {...props} editorSettings={settings} />;
  }

  // Preparar props base para todos os templates
  const templateProps = {
    ...props,
    editorSettings: settings
  };

  // Renderizar template específico ou baseado no estilo
  if ('component' in templateConfig) {
    switch (templateConfig.component) {
      case 'FashionLuxeTemplate':
        return <FashionLuxeTemplate {...templateProps} />;
      case 'CleanProfessionalTemplate':
        return <CleanProfessionalTemplate {...templateProps} />;
      case 'TechModernTemplate':
        return <TechModernTemplate {...templateProps} />;
      case 'ElegantStoreTemplate':
        return <ElegantStoreTemplate {...templateProps} />;
      default:
        return <CleanProfessionalTemplate {...templateProps} />;
    }
  }

  // Renderizar template baseado no estilo
  if ('style' in templateConfig && 'niche' in templateConfig) {
    const { style, niche } = templateConfig;
    const styleTemplateProps = {
      ...templateProps,
      niche: niche as 'fashion' | 'electronics' | 'food' | 'cosmetics'
    };

    switch (style) {
      case 'minimal':
        return <MinimalTemplate {...styleTemplateProps} />;
      case 'dark':
        return <DarkTemplate {...styleTemplateProps} />;
      case 'vibrant':
        return <VibrantTemplate {...styleTemplateProps} />;
      case 'neutral':
        return <NeutralTemplate {...styleTemplateProps} />;
      default:
        return <CleanProfessionalTemplate {...templateProps} />;
    }
  }

  // Fallback para templates legados
  return <ProfessionalCatalogTemplate {...props} editorSettings={settings} />;
};

export default TemplateManager;
