
import { useEffect } from 'react';
import { useCatalogSettings } from './useCatalogSettings';

export const useTemplateHeaderColors = (storeIdentifier?: string) => {
  const { settings, loading } = useCatalogSettings(storeIdentifier);

  useEffect(() => {
    if (settings && !loading) {
      applyHeaderAndButtonColors();
    }
  }, [settings, loading]);

  const applyHeaderAndButtonColors = () => {
    if (!settings) return;

    const root = document.documentElement;
    
    // Aplicar cores específicas para header e botões (sem alterar layout/background)
    const primaryColor = settings.primary_color || '#0057FF';
    const secondaryColor = settings.secondary_color || '#FF6F00';
    const accentColor = settings.accent_color || '#8E2DE2';
    
    // Cores específicas para elementos interativos
    root.style.setProperty('--template-header-bg', primaryColor);
    root.style.setProperty('--template-header-text', '#FFFFFF');
    root.style.setProperty('--template-button-primary', primaryColor);
    root.style.setProperty('--template-button-secondary', secondaryColor);
    root.style.setProperty('--template-button-accent', accentColor);
    root.style.setProperty('--template-link-color', primaryColor);
    root.style.setProperty('--template-link-hover', secondaryColor);
    
    // Gradientes para botões
    root.style.setProperty('--template-button-gradient', 
      `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`);
    
    // Estados hover
    root.style.setProperty('--template-button-primary-hover', adjustColorBrightness(primaryColor, -10));
    root.style.setProperty('--template-button-secondary-hover', adjustColorBrightness(secondaryColor, -10));

    console.log('🎨 Cores do header e botões aplicadas:', {
      header: primaryColor,
      buttonPrimary: primaryColor,
      buttonSecondary: secondaryColor
    });
  };

  // Função auxiliar para ajustar brilho das cores
  const adjustColorBrightness = (color: string, percent: number): string => {
    // Converter hex para RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Ajustar brilho
    const adjustedR = Math.max(0, Math.min(255, r + (r * percent / 100)));
    const adjustedG = Math.max(0, Math.min(255, g + (g * percent / 100)));
    const adjustedB = Math.max(0, Math.min(255, b + (b * percent / 100)));
    
    // Converter de volta para hex
    return `#${Math.round(adjustedR).toString(16).padStart(2, '0')}${Math.round(adjustedG).toString(16).padStart(2, '0')}${Math.round(adjustedB).toString(16).padStart(2, '0')}`;
  };

  return {
    isReady: !loading && !!settings,
    headerColor: settings?.primary_color || '#0057FF',
    buttonPrimaryColor: settings?.primary_color || '#0057FF',
    buttonSecondaryColor: settings?.secondary_color || '#FF6F00'
  };
};
