
import { useMemo } from 'react';
import { useCatalogSettings } from './useCatalogSettings';

export interface TemplateColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  gradientFrom: string;
  gradientTo: string;
}

const defaultColorSchemes: Record<string, TemplateColorScheme> = {
  modern: {
    primary: '#0057FF',
    secondary: '#FF6F00',
    accent: '#8E2DE2',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1E293B',
    textMuted: '#64748B',
    border: '#E2E8F0',
    gradientFrom: '#0057FF',
    gradientTo: '#8E2DE2'
  },
  minimal: {
    primary: '#1F2937',
    secondary: '#059669',
    accent: '#DC2626',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    gradientFrom: '#1F2937',
    gradientTo: '#059669'
  },
  elegant: {
    primary: '#D97706',
    secondary: '#92400E',
    accent: '#7C2D12',
    background: '#FFFBEB',
    surface: '#FFFFFF',
    text: '#78350F',
    textMuted: '#A16207',
    border: '#FDE68A',
    gradientFrom: '#D97706',
    gradientTo: '#92400E'
  },
  industrial: {
    primary: '#475569',
    secondary: '#F59E0B',
    accent: '#DC2626',
    background: '#F1F5F9',
    surface: '#FFFFFF',
    text: '#334155',
    textMuted: '#64748B',
    border: '#CBD5E1',
    gradientFrom: '#475569',
    gradientTo: '#F59E0B'
  }
};

export const useTemplateColors = (storeIdentifier?: string) => {
  const { settings } = useCatalogSettings(storeIdentifier);
  
  const colorScheme = useMemo(() => {
    const templateName = settings?.template_name || 'modern';
    const baseColors = defaultColorSchemes[templateName] || defaultColorSchemes.modern;
    
    // Aplicar cores personalizadas se disponíveis
    if (settings) {
      // Se houver cores personalizadas nas configurações, usar elas
      const customPrimary = (settings as any).primary_color;
      const customSecondary = (settings as any).secondary_color;
      
      if (customPrimary || customSecondary) {
        return {
          ...baseColors,
          primary: customPrimary || baseColors.primary,
          secondary: customSecondary || baseColors.secondary,
          gradientFrom: customPrimary || baseColors.gradientFrom,
          gradientTo: customSecondary || baseColors.gradientTo,
        };
      }
    }
    
    return baseColors;
  }, [settings]);

  const applyColorsToDocument = () => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      root.style.setProperty('--template-primary', colorScheme.primary);
      root.style.setProperty('--template-secondary', colorScheme.secondary);
      root.style.setProperty('--template-accent', colorScheme.accent);
      root.style.setProperty('--template-background', colorScheme.background);
      root.style.setProperty('--template-surface', colorScheme.surface);
      root.style.setProperty('--template-text', colorScheme.text);
      root.style.setProperty('--template-text-muted', colorScheme.textMuted);
      root.style.setProperty('--template-border', colorScheme.border);
      root.style.setProperty('--template-gradient-from', colorScheme.gradientFrom);
      root.style.setProperty('--template-gradient-to', colorScheme.gradientTo);
    }
  };

  return {
    colorScheme,
    applyColorsToDocument,
    templateName: settings?.template_name || 'modern'
  };
};
