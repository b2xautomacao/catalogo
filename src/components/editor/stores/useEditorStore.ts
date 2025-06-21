
import { create } from 'zustand';

interface EditorConfiguration {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
  };
  global: {
    fontFamily: string;
    borderRadius: number;
    layoutSpacing: number;
    template: string;
  };
  sections: {
    hero: {
      enabled: boolean;
      title?: string;
      subtitle?: string;
      backgroundImage?: string;
    };
    categories: boolean;
    featuredProducts: boolean;
    footer: boolean;
  };
  sectionOrder: string[];
  header: {
    layout: 'left' | 'center' | 'right' | 'split';
    logoPosition: 'left' | 'center' | 'right';
    showSearchBar: boolean;
    searchBarPosition: 'header' | 'below';
    showSlogan: boolean;
    slogan: string;
    backgroundColor: string;
    textColor: string;
    isSticky: boolean;
  };
  footer?: {
    backgroundColor?: string;
    textColor?: string;
    showContact?: boolean;
    showSocial?: boolean;
    showQuickLinks?: boolean;
    showBusinessHours?: boolean;
    customText?: string;
    copyrightText?: string;
  };
  checkout: {
    showPrices: boolean;
    allowFilters: boolean;
    layout?: 'single' | 'steps';
    type?: 'whatsapp' | 'online' | 'both';
    showCartItems?: boolean;
    showSecurityBadges?: boolean;
    showReviews?: boolean;
    colors?: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    upsells?: {
      showRelated?: boolean;
      minimumValueOffers?: boolean;
      freeShippingThreshold?: string;
      customMessage?: string;
    };
    urgency?: {
      lowStockCounter?: boolean;
      lowStockThreshold?: string;
      offerTimer?: boolean;
      offerDuration?: string;
    };
    socialProof?: {
      showReviews?: boolean;
      recentSales?: boolean;
      salesMessage?: string;
      bestSellerBadge?: boolean;
    };
  };
}

interface EditorStore {
  configuration: EditorConfiguration;
  currentDevice: 'desktop' | 'tablet' | 'mobile';
  activeTab: 'catalog' | 'checkout';
  isPreviewMode: boolean;
  isDirty: boolean;
  currentTemplate: string;
  
  setCurrentDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  setActiveTab: (tab: 'catalog' | 'checkout') => void;
  togglePreviewMode: () => void;
  updateConfiguration: (updates: Partial<EditorConfiguration> | string, value?: any) => void;
  resetToDefault: () => void;
  applyTemplate: (templateId: string, colors: any) => void;
  loadFromDatabase: (settings: any) => void;
}

const defaultConfiguration: EditorConfiguration = {
  colors: {
    primary: '#0057FF',
    secondary: '#FF6F00',
    accent: '#8E2DE2',
    background: '#F8FAFC',
    text: '#1E293B',
    border: '#E2E8F0'
  },
  global: {
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: 8,
    layoutSpacing: 16,
    template: 'editor'
  },
  sections: {
    hero: {
      enabled: true,
      title: 'Bem-vindo à nossa loja',
      subtitle: 'Encontre os melhores produtos com os melhores preços'
    },
    categories: true,
    featuredProducts: true,
    footer: true
  },
  sectionOrder: ['hero', 'categories', 'featuredProducts', 'footer'],
  header: {
    layout: 'left',
    logoPosition: 'left',
    showSearchBar: true,
    searchBarPosition: 'header',
    showSlogan: false,
    slogan: '',
    backgroundColor: '#FFFFFF',
    textColor: '#1E293B',
    isSticky: false
  },
  footer: {
    backgroundColor: '#1E293B',
    textColor: '#FFFFFF',
    showContact: true,
    showSocial: true,
    showQuickLinks: true,
    showBusinessHours: true,
    customText: '',
    copyrightText: ''
  },
  checkout: {
    showPrices: true,
    allowFilters: true,
    layout: 'single',
    type: 'both',
    showCartItems: true,
    showSecurityBadges: true,
    showReviews: true,
    colors: {
      primary: '#0057FF',
      secondary: '#FF6F00',
      accent: '#8E2DE2',
      background: '#F8FAFC',
      text: '#1E293B'
    },
    upsells: {
      showRelated: false,
      minimumValueOffers: false,
      freeShippingThreshold: '150',
      customMessage: ''
    },
    urgency: {
      lowStockCounter: false,
      lowStockThreshold: '5',
      offerTimer: false,
      offerDuration: '15'
    },
    socialProof: {
      showReviews: true,
      recentSales: false,
      salesMessage: '',
      bestSellerBadge: false
    }
  }
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  configuration: defaultConfiguration,
  currentDevice: 'desktop',
  activeTab: 'catalog',
  isPreviewMode: false,
  isDirty: false,
  currentTemplate: 'editor',

  setCurrentDevice: (device) => set({ currentDevice: device }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  togglePreviewMode: () => set(state => ({ isPreviewMode: !state.isPreviewMode })),

  updateConfiguration: (updates, value) => set(state => {
    let newConfig = { ...state.configuration };
    
    if (typeof updates === 'string') {  
      // Support for dot notation like 'checkout.colors.primary'
      const keys = updates.split('.');
      let current = newConfig as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
    } else {
      // Merge object updates
      newConfig = { ...newConfig, ...updates };
    }
    
    return {
      configuration: newConfig,
      isDirty: true
    };
  }),

  resetToDefault: () => set({
    configuration: defaultConfiguration,
    isDirty: true,
    currentTemplate: 'editor'
  }),

  applyTemplate: (templateId, colors) => set(state => ({
    configuration: {
      ...state.configuration,
      colors,
      global: {
        ...state.configuration.global,
        template: templateId
      }
    },
    currentTemplate: templateId,
    isDirty: true
  })),

  loadFromDatabase: (settings) => {
    const config = {
      ...defaultConfiguration,
      colors: {
        primary: settings.primary_color || defaultConfiguration.colors.primary,
        secondary: settings.secondary_color || defaultConfiguration.colors.secondary,
        accent: settings.accent_color || defaultConfiguration.colors.accent,
        background: settings.background_color || defaultConfiguration.colors.background,
        text: settings.text_color || defaultConfiguration.colors.text,
        border: settings.border_color || defaultConfiguration.colors.border,
      },
      global: {
        ...defaultConfiguration.global,
        fontFamily: settings.font_family || defaultConfiguration.global.fontFamily,
        borderRadius: settings.border_radius || defaultConfiguration.global.borderRadius,
        layoutSpacing: settings.layout_spacing || defaultConfiguration.global.layoutSpacing,
        template: settings.template_name || defaultConfiguration.global.template,
      },
      checkout: {
        ...defaultConfiguration.checkout,
        showPrices: settings.show_prices ?? defaultConfiguration.checkout.showPrices,
        allowFilters: settings.allow_categories_filter ?? defaultConfiguration.checkout.allowFilters,
        colors: {
          ...defaultConfiguration.checkout.colors!,
          primary: settings.primary_color || defaultConfiguration.checkout.colors!.primary,
          secondary: settings.secondary_color || defaultConfiguration.checkout.colors!.secondary,
          accent: settings.accent_color || defaultConfiguration.checkout.colors!.accent,
          background: settings.background_color || defaultConfiguration.checkout.colors!.background,
          text: settings.text_color || defaultConfiguration.checkout.colors!.text,
        }
      }
    };

    set({ 
      configuration: config, 
      currentTemplate: settings.template_name || 'editor',
      isDirty: false 
    });
  }
}));
