
import { useEffect } from 'react';
import { useCatalogSettings } from './useCatalogSettings';

export const useGlobalTemplateStyles = (storeIdentifier?: string) => {
  const { settings, loading } = useCatalogSettings(storeIdentifier);

  useEffect(() => {
    if (settings && !loading) {
      applyGlobalStyles();
    }
  }, [settings, loading]);

  const applyGlobalStyles = () => {
    if (!settings) return;

    const root = document.documentElement;
    
    // Aplicar cores CSS customizadas
    root.style.setProperty('--template-primary', settings.primary_color || '#0057FF');
    root.style.setProperty('--template-secondary', settings.secondary_color || '#FF6F00');
    root.style.setProperty('--template-accent', settings.accent_color || '#8E2DE2');
    root.style.setProperty('--template-background', settings.background_color || '#F8FAFC');
    root.style.setProperty('--template-text', settings.text_color || '#1E293B');
    root.style.setProperty('--template-border', settings.border_color || '#E2E8F0');
    root.style.setProperty('--template-surface', '#FFFFFF');
    
    // Aplicar gradientes
    root.style.setProperty('--template-gradient-from', settings.primary_color || '#0057FF');
    root.style.setProperty('--template-gradient-to', settings.secondary_color || '#FF6F00');
    
    // Aplicar configurações de layout
    if (settings.font_family) {
      root.style.setProperty('--template-font-family', settings.font_family);
    }
    
    if (settings.border_radius) {
      root.style.setProperty('--template-border-radius', `${settings.border_radius}px`);
    }
    
    if (settings.layout_spacing) {
      root.style.setProperty('--template-spacing', `${settings.layout_spacing}px`);
    }

    // Adicionar classe ao body para aplicar estilos
    document.body.classList.add('template-container');

    console.log('useGlobalTemplateStyles: Estilos aplicados:', {
      primary: settings.primary_color,
      secondary: settings.secondary_color,
      template: settings.template_name
    });
  };

  return {
    isReady: !loading && !!settings,
    templateName: settings?.template_name || 'editor'
  };
};
