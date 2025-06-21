
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
    template: 'editor', // Usar template "editor" como padrão
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: 12, // Mais arredondado como no editor
    layoutSpacing: 20, // Mais espaçamento como no editor
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
  productCards: {
    columns: {
      desktop: 4,
      tablet: 3,
      mobile: 2
    },
    showBorder: true,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    showElements: {
      title: true,
      description: true,
      price: true,
      discountBadge: true,
      buyButton: true
    },
    buttonStyle: {
      backgroundColor: '#0057FF',
      textColor: '#FFFFFF',
      borderRadius: 12 // Mais arredondado
    }
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
    },
    banner: true,
    categories: true,
    featuredProducts: true,
    testimonials: false,
    newsletter: false,
    footer: true,
  },
  sectionOrder: ['banner', 'categories', 'featuredProducts', 'testimonials', 'newsletter', 'footer'],
  checkout: {
    layout: 'single',
    type: 'both',
    showCartItems: true,
    showSecurityBadges: true,
    showReviews: false,
    showPrices: true,
    allowFilters: true,
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
    set({ configuration: defaultConfiguration, isDirty: false, currentTemplate: 'editor' });
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
  
  currentTemplate: 'editor', // Template padrão
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
        sectionOrder: sections
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
            template: settings.template_name || 'editor',
            fontFamily: settings.font_family || 'Inter, system-ui, sans-serif',
            borderRadius: settings.border_radius || 12,
            layoutSpacing: settings.layout_spacing || 20,
          },
          colors: {
            ...state.configuration.colors,
            primary: settings.primary_color || '#0057FF',
            secondary: settings.secondary_color || '#FF6F00',
            accent: settings.accent_color || '#8E2DE2',
            background: settings.background_color || '#F8FAFC',
            text: settings.text_color || '#1E293B',
            border: settings.border_color || '#E2E8F0',
          },
          checkout: {
            ...state.configuration.checkout,
            showPrices: settings.show_prices !== false,
            allowFilters: settings.allow_categories_filter !== false,
          }
        },
        currentTemplate: settings.template_name || 'editor',
        isDirty: false
      }));
    } else {
      console.log('Carregando configurações padrão...');
      set({ isDirty: false });
    }
  }
}));
