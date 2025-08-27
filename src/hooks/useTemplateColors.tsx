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
  // NOVOS TEMPLATES MODERNOS E PROFISSIONAIS
  'fashion-luxe': {
    primary: '#e11d48',
    secondary: '#8b5cf6',
    accent: '#f97316',
    background: '#fef7f7',
    surface: '#ffffff',
    text: '#1f2937',
    textMuted: '#6b7280',
    border: '#f9a8d4',
    gradientFrom: '#e11d48',
    gradientTo: '#8b5cf6'
  },
  'clean-professional': {
    primary: '#3b82f6',
    secondary: '#1f2937',
    accent: '#059669',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#111827',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    gradientFrom: '#3b82f6',
    gradientTo: '#1f2937'
  },
  'tech-modern': {
    primary: '#0ea5e9',
    secondary: '#14b8a6',
    accent: '#8b5cf6',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#334155',
    gradientFrom: '#0ea5e9',
    gradientTo: '#14b8a6'
  },
  'elegant-store': {
    primary: '#d97706',
    secondary: '#f59e0b',
    accent: '#dc2626',
    background: '#fef3c7',
    surface: '#ffffff',
    text: '#78350f',
    textMuted: '#a16207',
    border: '#fde68a',
    gradientFrom: '#d97706',
    gradientTo: '#f59e0b'
  },

  // TEMPLATES MODERNOS - ESTILO MINIMALISTA
  'minimal-fashion': {
    primary: '#2c3338',
    secondary: '#6b7280',
    accent: '#e11d48',
    background: '#fef7f7',
    surface: '#ffffff',
    text: '#2c3338',
    textMuted: '#6b7280',
    border: '#f9a8d4',
    gradientFrom: '#2c3338',
    gradientTo: '#e11d48'
  },
  'minimal-electronics': {
    primary: '#2c3338',
    secondary: '#6b7280',
    accent: '#3b82f6',
    background: '#eff6ff',
    surface: '#ffffff',
    text: '#2c3338',
    textMuted: '#6b7280',
    border: '#e2e8f0',
    gradientFrom: '#2c3338',
    gradientTo: '#3b82f6'
  },
  'minimal-food': {
    primary: '#2c3338',
    secondary: '#6b7280',
    accent: '#16a34a',
    background: '#f0fdf4',
    surface: '#ffffff',
    text: '#2c3338',
    textMuted: '#6b7280',
    border: '#a7f3d0',
    gradientFrom: '#2c3338',
    gradientTo: '#16a34a'
  },
  'minimal-cosmetics': {
    primary: '#2c3338',
    secondary: '#6b7280',
    accent: '#d946ef',
    background: '#fef5ff',
    surface: '#ffffff',
    text: '#2c3338',
    textMuted: '#6b7280',
    border: '#e2e8f0',
    gradientFrom: '#2c3338',
    gradientTo: '#d946ef'
  },

  // TEMPLATES MODERNOS - ESTILO ESCURO
  'dark-fashion': {
    primary: '#d97706',
    secondary: '#e11d48',
    accent: '#8b5cf6',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#d97706',
    gradientFrom: '#d97706',
    gradientTo: '#e11d48'
  },
  'dark-electronics': {
    primary: '#0ea5e9',
    secondary: '#14b8a6',
    accent: '#8b5cf6',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#0ea5e9',
    gradientFrom: '#0ea5e9',
    gradientTo: '#14b8a6'
  },
  'dark-food': {
    primary: '#f97316',
    secondary: '#16a34a',
    accent: '#8b5cf6',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#f97316',
    gradientFrom: '#f97316',
    gradientTo: '#16a34a'
  },
  'dark-cosmetics': {
    primary: '#d946ef',
    secondary: '#eab308',
    accent: '#8b5cf6',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#d946ef',
    gradientFrom: '#d946ef',
    gradientTo: '#eab308'
  },

  // TEMPLATES MODERNOS - ESTILO VIBRANTE
  'vibrant-fashion': {
    primary: '#e11d48',
    secondary: '#d946ef',
    accent: '#f97316',
    background: '#fef2f2',
    surface: '#ffffff',
    text: '#be185d',
    textMuted: '#f472b6',
    border: '#f9a8d4',
    gradientFrom: '#e11d48',
    gradientTo: '#d946ef'
  },
  'vibrant-electronics': {
    primary: '#3b82f6',
    secondary: '#0ea5e9',
    accent: '#f97316',
    background: '#eff6ff',
    surface: '#ffffff',
    text: '#1e40af',
    textMuted: '#6b7280',
    border: '#e2e8f0',
    gradientFrom: '#3b82f6',
    gradientTo: '#0ea5e9'
  },
  'vibrant-food': {
    primary: '#16a34a',
    secondary: '#f97316',
    accent: '#8b5cf6',
    background: '#f0fdf4',
    surface: '#ffffff',
    text: '#15803d',
    textMuted: '#6b7280',
    border: '#a7f3d0',
    gradientFrom: '#16a34a',
    gradientTo: '#f97316'
  },
  'vibrant-cosmetics': {
    primary: '#d946ef',
    secondary: '#e11d48',
    accent: '#f97316',
    background: '#fef5ff',
    surface: '#ffffff',
    text: '#a21caf',
    textMuted: '#6b7280',
    border: '#e2e8f0',
    gradientFrom: '#d946ef',
    gradientTo: '#e11d48'
  },

  // TEMPLATES MODERNOS - ESTILO NEUTRO
  'neutral-fashion': {
    primary: '#a16207',
    secondary: '#d97706',
    accent: '#f97316',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    gradientFrom: '#a16207',
    gradientTo: '#d97706'
  },
  'neutral-electronics': {
    primary: '#2c3338',
    secondary: '#3b82f6',
    accent: '#f97316',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    gradientFrom: '#2c3338',
    gradientTo: '#3b82f6'
  },
  'neutral-food': {
    primary: '#16a34a',
    secondary: '#a16207',
    accent: '#f97316',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    gradientFrom: '#16a34a',
    gradientTo: '#a16207'
  },
  'neutral-cosmetics': {
    primary: '#d1a3b3',
    secondary: '#d97706',
    accent: '#f97316',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    gradientFrom: '#d1a3b3',
    gradientTo: '#d97706'
  },

  // COMPATIBILIDADE COM TEMPLATES LEGADOS
  professional: {
    primary: '#2563EB',
    secondary: '#059669',
    accent: '#DC2626',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    gradientFrom: '#2563EB',
    gradientTo: '#059669'
  },
  luxury: {
    primary: '#D97706',
    secondary: '#F59E0B',
    accent: '#EAB308',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textMuted: '#CBD5E1',
    border: '#D97706',
    gradientFrom: '#D97706',
    gradientTo: '#F59E0B'
  },
  tech: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#06B6D4',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    border: '#3B82F6',
    gradientFrom: '#3B82F6',
    gradientTo: '#8B5CF6'
  },
  fashion: {
    primary: '#EC4899',
    secondary: '#F97316',
    accent: '#EF4444',
    background: '#FDF2F8',
    surface: '#FFFFFF',
    text: '#BE185D',
    textMuted: '#F472B6',
    border: '#F9A8D4',
    gradientFrom: '#EC4899',
    gradientTo: '#F97316'
  },
  health: {
    primary: '#059669',
    secondary: '#0D9488',
    accent: '#3B82F6',
    background: '#ECFDF5',
    surface: '#FFFFFF',
    text: '#064E3B',
    textMuted: '#6B7280',
    border: '#A7F3D0',
    gradientFrom: '#059669',
    gradientTo: '#0D9488'
  },
  sports: {
    primary: '#DC2626',
    secondary: '#EA580C',
    accent: '#EAB308',
    background: '#7F1D1D',
    surface: '#991B1B',
    text: '#FEF2F2',
    textMuted: '#FCA5A5',
    border: '#DC2626',
    gradientFrom: '#DC2626',
    gradientTo: '#EA580C'
  },
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
    const templateName = settings?.template_name || 'clean-professional';
    const baseColors = defaultColorSchemes[templateName] || defaultColorSchemes['clean-professional'];
    
    if (settings) {
      return {
        primary: settings.primary_color || baseColors.primary,
        secondary: settings.secondary_color || baseColors.secondary,
        accent: settings.accent_color || baseColors.accent,
        background: settings.background_color || baseColors.background,
        surface: '#FFFFFF',
        text: settings.text_color || baseColors.text,
        textMuted: baseColors.textMuted,
        border: settings.border_color || baseColors.border,
        gradientFrom: settings.primary_color || baseColors.gradientFrom,
        gradientTo: settings.secondary_color || baseColors.gradientTo,
      };
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
      
      console.log('Cores aplicadas ao documento:', colorScheme);
    }
  };

  const resetToTemplateDefaults = (templateName: string) => {
    const defaults = defaultColorSchemes[templateName] || defaultColorSchemes['minimal-fashion'];
    return {
      primary_color: defaults.primary,
      secondary_color: defaults.secondary,
      accent_color: defaults.accent,
      background_color: defaults.background,
      text_color: defaults.text,
      border_color: defaults.border,
    };
  };

  return {
    colorScheme,
    applyColorsToDocument,
    resetToTemplateDefaults,
    templateName: settings?.template_name || 'clean-professional'
  };
};
