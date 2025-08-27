
import { useEffect } from 'react';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';

export const useEditorSync = (storeIdentifier: string) => {
  const { settings, loading } = useCatalogSettings(storeIdentifier);

  const applyEditorStyles = () => {
    // Só aplicar estilos se houver configurações carregadas
    if (!settings || loading) {
      // Aplicar estilos padrão para catálogo público
      const root = document.documentElement;
      root.style.setProperty('--template-primary', '#0057FF');
      root.style.setProperty('--template-secondary', '#FF6F00');
      root.style.setProperty('--template-accent', '#8E2DE2');
      root.style.setProperty('--template-background', '#F8FAFC');
      root.style.setProperty('--template-text', '#1E293B');
      root.style.setProperty('--template-border', '#E2E8F0');
      root.style.setProperty('--template-surface', '#FFFFFF');
      return;
    }

    // Aplicar cores CSS customizadas
    const root = document.documentElement;
    
    root.style.setProperty('--template-primary', settings.primary_color || '#0057FF');
    root.style.setProperty('--template-secondary', settings.secondary_color || '#FF6F00');
    root.style.setProperty('--template-accent', settings.accent_color || '#8E2DE2');
    root.style.setProperty('--template-background', settings.background_color || '#F8FAFC');
    root.style.setProperty('--template-text', settings.text_color || '#1E293B');
    root.style.setProperty('--template-border', settings.border_color || '#E2E8F0');
    root.style.setProperty('--template-surface', '#FFFFFF');
    
    // Aplicar configurações de layout se disponíveis
    if (settings.font_family) {
      root.style.setProperty('--template-font-family', settings.font_family);
    }
    
    if (settings.border_radius) {
      root.style.setProperty('--template-border-radius', `${settings.border_radius}px`);
    }
    
    if (settings.layout_spacing) {
      root.style.setProperty('--template-spacing', `${settings.layout_spacing}px`);
    }

    console.log('Editor styles aplicados:', {
      primary: settings.primary_color,
      secondary: settings.secondary_color,
      accent: settings.accent_color,
      background: settings.background_color,
      text: settings.text_color,
      border: settings.border_color,
      template: settings.template_name
    });
  };

  useEffect(() => {
    applyEditorStyles();
  }, [settings, loading]);

  return {
    settings,
    loading,
    templateName: settings?.template_name || 'modern',
    isConnected: !!settings && !loading
  };
};
