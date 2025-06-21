
import React from 'react';
import { useEditorStore } from '../stores/useEditorStore';
import { usePreviewData } from '../hooks/usePreviewData';
import { useTemplateSync } from '../hooks/useTemplateSync';
import PreviewHeader from './preview/PreviewHeader';
import PreviewBanner from './preview/PreviewBanner';
import PreviewCategories from './preview/PreviewCategories';
import PreviewProductGrid from './preview/PreviewProductGrid';
import PreviewFooter from './preview/PreviewFooter';

const CatalogPreview: React.FC = () => {
  const { configuration } = useEditorStore();
  const { products, categories, loading, hasRealData } = usePreviewData();
  const { settings, isConnected } = useTemplateSync();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando preview...</p>
        </div>
      </div>
    );
  }

  // Usar configurações do banco se disponível, senão usar do editor
  const activeConfig = settings && isConnected ? {
    colors: {
      primary: settings.primary_color || configuration.colors.primary,
      secondary: settings.secondary_color || configuration.colors.secondary,
      accent: settings.accent_color || configuration.colors.accent,
      background: settings.background_color || configuration.colors.background,
      text: settings.text_color || configuration.colors.text,
      border: settings.border_color || configuration.colors.border,
    },
    global: {
      fontFamily: settings.font_family || configuration.global.fontFamily,
      borderRadius: settings.border_radius || configuration.global.borderRadius,
      layoutSpacing: settings.layout_spacing || configuration.global.layoutSpacing,
      ...configuration.global
    },
    sections: configuration.sections,
    sectionOrder: configuration.sectionOrder
  } : configuration;

  return (
    <div 
      className="min-h-screen template-container"
      style={{ 
        backgroundColor: activeConfig.colors.background,
        fontFamily: activeConfig.global.fontFamily,
        color: activeConfig.colors.text
      }}
    >
      {/* Indicador de dados e conexão */}
      {(!hasRealData || !isConnected) && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-2 text-sm">
          <div className="flex items-center gap-2">
            {!isConnected && (
              <span className="text-yellow-800">
                ⚠️ Editor desconectado - usando configurações locais
              </span>
            )}
            {!hasRealData && (
              <span className="text-yellow-800">
                📝 Usando dados de exemplo - adicione produtos reais
              </span>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <PreviewHeader />
      
      {/* Hero/Banner Section */}
      {activeConfig.sections.hero?.enabled && (
        <PreviewBanner />
      )}
      
      {/* Categories Navigation */}
      {activeConfig.sections.categories && (
        <PreviewCategories categories={categories} />
      )}
      
      {/* Products Grid */}
      {activeConfig.sections.featuredProducts && (
        <PreviewProductGrid products={products} />
      )}
      
      {/* Footer */}
      {activeConfig.sections.footer && (
        <PreviewFooter />
      )}
    </div>
  );
};

export { CatalogPreview };
