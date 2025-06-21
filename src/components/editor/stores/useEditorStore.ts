
import { create } from 'zustand';

interface EditorStore {
  isDirty: boolean;
  markAsDirty: () => void;
  markAsClean: () => void;
  currentDevice: 'desktop' | 'tablet' | 'mobile';
  setCurrentDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  activeTab: 'catalog' | 'checkout';
  setActiveTab: (tab: 'catalog' | 'checkout') => void;
  isPreviewMode: boolean;
  togglePreviewMode: () => void;
  resetToDefault: () => void;
  configuration: any;
  updateConfiguration: (path: string, value: any) => void;
  currentTemplate: string;
  applyTemplate: (templateName: string, colors?: any) => void;
  reorderSections: (sections: string[]) => void;
  loadFromDatabase: (settings?: any) => Promise<void>;
}

const defaultConfiguration = {
  global: {
    template: 'modern',
    fontFamily: 'Inter, sans-serif',
    borderRadius: 8,
    layoutSpacing: 16,
    fontSize: {
      small: 12,
      medium: 16,
      large: 24
    },
    spacing: {
      small: 8,
      medium: 16,
      large: 24
    }
  },
  header: {
    showSearchBar: true,
    showCartButton: true,
    showWishlistButton: true,
    headerBackgroundColor: '#FFFFFF',
    headerTextColor: '#000000',
  },
  productCard: {
    showQuickView: true,
    showAddToCart: true,
    productCardStyle: 'card',
  },
  colors: {
    primary: '#0057FF',
    secondary: '#FF6F00',
    accent: '#8E2DE2',
    background: '#F8FAFC',
    text: '#1E293B',
    border: '#E2E8F0',
  },
  sections: {
    hero: {
      enabled: true,
      title: 'Bem-vindo!',
      subtitle: 'Descubra nossos produtos.',
      backgroundImage: '/placeholder.svg',
    }
  },
  checkout: {
    layout: 'single',
    type: 'both',
    showCartItems: true,
    showSecurityBadges: true,
    showReviews: false,
    colors: {
      primary: '#0057FF',
      secondary: '#FF6F00',
      accent: '#8E2DE2',
      background: '#FFFFFF',
      text: '#1E293B'
    },
    upsells: {
      showRelated: false,
      minimumValueOffers: false,
      freeShippingThreshold: '',
      customMessage: ''
    },
    urgency: {
      lowStockCounter: false,
      lowStockThreshold: '',
      offerTimer: false,
      offerDuration: ''
    },
    socialProof: {
      showReviews: false,
      recentSales: false,
      salesMessage: '',
      bestSellerBadge: false
    }
  }
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  isDirty: false,
  markAsDirty: () => set({ isDirty: true }),
  markAsClean: () => set({ isDirty: false }),
  currentDevice: 'desktop',
  setCurrentDevice: (device) => set({ currentDevice: device }),
  activeTab: 'catalog',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isPreviewMode: false,
  togglePreviewMode: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),
  resetToDefault: () => {
    set({ configuration: defaultConfiguration, isDirty: false });
  },
  configuration: defaultConfiguration,
  updateConfiguration: (path, value) => {
    set((state) => {
      const newConfiguration = { ...state.configuration };
      const pathParts = path.split('.');
      let current = newConfiguration;

      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        current[part] = { ...current[part] };
        current = current[part];
      }

      current[pathParts[pathParts.length - 1]] = value;

      return { configuration: newConfiguration, isDirty: true };
    });
  },
  
  currentTemplate: 'modern',
  applyTemplate: (templateName: string, colors?: any) => {
    set((state) => {
      const newConfiguration = { ...state.configuration };
      
      // Aplicar template
      newConfiguration.global.template = templateName;
      
      // Aplicar cores se fornecidas
      if (colors) {
        newConfiguration.colors = { ...newConfiguration.colors, ...colors };
      }
      
      return {
        currentTemplate: templateName,
        configuration: newConfiguration,
        isDirty: true
      };
    });
  },
  
  reorderSections: (sections: string[]) => {
    set((state) => ({
      configuration: {
        ...state.configuration,
        sections: {
          ...state.configuration.sections,
          order: sections
        }
      },
      isDirty: true
    }));
  },
  
  loadFromDatabase: async (settings?: any) => {
    if (settings) {
      console.log('Carregando configurações do banco:', settings);
      set((state) => ({
        configuration: {
          ...state.configuration,
          global: {
            ...state.configuration.global,
            template: settings.template_name || 'modern',
            fontFamily: settings.font_family || 'Inter, sans-serif',
            borderRadius: settings.border_radius || 8,
            layoutSpacing: settings.layout_spacing || 16,
          },
          colors: {
            ...state.configuration.colors,
            primary: settings.primary_color || '#0057FF',
            secondary: settings.secondary_color || '#FF6F00',
            accent: settings.accent_color || '#8E2DE2',
            background: settings.background_color || '#F8FAFC',
            text: settings.text_color || '#1E293B',
            border: settings.border_color || '#E2E8F0',
          }
        },
        currentTemplate: settings.template_name || 'modern',
        isDirty: false
      }));
    } else {
      console.log('Carregando configurações do banco...');
      set({ isDirty: false });
    }
  }
}));
