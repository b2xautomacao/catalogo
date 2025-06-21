
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EditorConfiguration {
  // Header Settings
  header: {
    layout: 'left' | 'center' | 'right' | 'split';
    backgroundColor: string;
    textColor: string;
    logoPosition: 'left' | 'center' | 'right';
    showSlogan: boolean;
    slogan: string;
    showSearchBar: boolean;
    searchBarPosition: 'header' | 'below';
    isSticky: boolean;
  };
  
  // Product Cards Settings
  productCards: {
    layout: 'grid' | 'list' | 'masonry';
    imagePosition: 'top' | 'left' | 'right';
    showBorder: boolean;
    borderColor: string;
    backgroundColor: string;
    columns: {
      desktop: number;
      tablet: number;
      mobile: number;
    };
    showElements: {
      title: boolean;
      price: boolean;
      buyButton: boolean;
      discountBadge: boolean;
      description: boolean;
    };
    buttonStyle: {
      backgroundColor: string;
      textColor: string;
      borderRadius: number;
    };
  };
  
  // Checkout Settings Avançadas
  checkout: {
    layout: 'single' | 'steps';
    type: 'whatsapp' | 'online' | 'both';
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    showCartItems: boolean;
    showSecurityBadges: boolean;
    showReviews: boolean;
    showPrices: boolean;
    allowFilters: boolean;
    
    // Upsells e Cross-sells
    upsells?: {
      showRelated: boolean;
      minimumValueOffers: boolean;
      freeShippingThreshold: string;
      customMessage: string;
    };
    
    // Elementos de Urgência
    urgency?: {
      lowStockCounter: boolean;
      lowStockThreshold: string;
      offerTimer: boolean;
      offerDuration: string;
    };
    
    // Prova Social
    socialProof?: {
      show Reviews: boolean;
      recentSales: boolean;
      salesMessage: string;
      bestSellerBadge: boolean;
    };
  };
  
  // Global Settings ampliadas
  global: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    fontFamily: string;
    templateName: string;
    fontSize: {
      small: number;
      medium: number;
      large: number;
    };
    spacing: {
      small: number;
      medium: number;
      large: number;
    };
  };
  
  // Notificações e Conversão
  notifications: {
    cartToast: {
      enabled: boolean;
      message: string;
      position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
      duration: number;
      showUpsell: boolean;
    };
    stockAlert: {
      enabled: boolean;
      threshold: number;
      message: string;
    };
    freeShippingAlert: {
      enabled: boolean;
      threshold: number;
      message: string;
    };
  };
  
  // Active Sections
  sections: {
    banner: boolean;
    categories: boolean;
    featuredProducts: boolean;
    testimonials: boolean;
    newsletter: boolean;
    footer: boolean;
  };
  
  // Section Order
  sectionOrder: string[];
}

interface EditorStore {
  // Estado
  configuration: EditorConfiguration;
  selectedElement: string | null;
  currentDevice: 'desktop' | 'tablet' | 'mobile';
  currentTemplate: string;
  isPreviewMode: boolean;
  isDirty: boolean;
  
  // Ações
  updateConfiguration: (path: string, value: any) => void;
  setSelectedElement: (elementId: string | null) => void;
  setCurrentDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  togglePreviewMode: () => void;
  saveConfiguration: () => Promise<void>;
  resetToDefault: () => void;
  reorderSections: (newOrder: string[]) => void;
  applyTemplate: (templateId: string, colors?: any) => void;
  syncWithDatabase: () => Promise<void>;
}

const defaultConfiguration: EditorConfiguration = {
  header: {
    layout: 'left',
    backgroundColor: '#FFFFFF',
    textColor: '#1E293B',
    logoPosition: 'left',
    showSlogan: true,
    slogan: 'Sua loja online',
    showSearchBar: true,
    searchBarPosition: 'header',
    isSticky: true,
  },
  productCards: {
    layout: 'grid',
    imagePosition: 'top',
    showBorder: true,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    columns: {
      desktop: 4,
      tablet: 3,
      mobile: 2,
    },
    showElements: {
      title: true,
      price: true,
      buyButton: true,
      discountBadge: true,
      description: false,
    },
    buttonStyle: {
      backgroundColor: '#0057FF',
      textColor: '#FFFFFF',
      borderRadius: 8,
    },
  },
  checkout: {
    layout: 'single',
    type: 'both',
    colors: {
      primary: '#0057FF',
      secondary: '#FF6F00',
      accent: '#8E2DE2',
      background: '#FFFFFF',
      text: '#1E293B',
    },
    showCartItems: true,
    showSecurityBadges: true,
    showReviews: false,
    showPrices: true,
    allowFilters: true,
    upsells: {
      showRelated: true,
      minimumValueOffers: false,
      freeShippingThreshold: '150',
      customMessage: 'Complete sua compra com estes produtos selecionados...'
    },
    urgency: {
      lowStockCounter: false,
      lowStockThreshold: '5',
      offerTimer: false,
      offerDuration: '15'
    },
    socialProof: {
      showReviews: false,
      recentSales: true,
      salesMessage: 'X pessoas compraram este produto hoje',
      bestSellerBadge: false
    }
  },
  global: {
    primaryColor: '#0057FF',
    secondaryColor: '#FF6F00',
    accentColor: '#8E2DE2',
    backgroundColor: '#F8FAFC',
    textColor: '#1E293B',
    borderColor: '#E2E8F0',
    fontFamily: 'Inter',
    templateName: 'modern',
    fontSize: {
      small: 14,
      medium: 16,
      large: 20,
    },
    spacing: {
      small: 8,
      medium: 16,
      large: 24,
    },
  },
  notifications: {
    cartToast: {
      enabled: true,
      message: 'Produto adicionado ao carrinho!',
      position: 'top-right',
      duration: 3000,
      showUpsell: false
    },
    stockAlert: {
      enabled: false,
      threshold: 5,
      message: 'Restam apenas {stock} unidades!'
    },
    freeShippingAlert: {
      enabled: true,
      threshold: 150,
      message: 'Faltam apenas R$ {remaining} para frete grátis!'
    }
  },
  sections: {
    banner: true,
    categories: true,
    featuredProducts: true,
    testimonials: false,
    newsletter: true,
    footer: true,
  },
  sectionOrder: ['banner', 'categories', 'featuredProducts', 'testimonials', 'newsletter', 'footer'],
};

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      configuration: defaultConfiguration,
      selectedElement: null,
      currentDevice: 'desktop',
      currentTemplate: 'modern',
      isPreviewMode: false,
      isDirty: false,
      
      updateConfiguration: (path: string, value: any) => {
        set((state) => {
          const newConfig = { ...state.configuration };
          const keys = path.split('.');
          let current: any = newConfig;
          
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }
          
          current[keys[keys.length - 1]] = value;
          
          return {
            configuration: newConfig,
            isDirty: true,
          };
        });
      },
      
      applyTemplate: (templateId: string, colors?: any) => {
        set((state) => {
          const newConfig = { ...state.configuration };
          
          if (colors) {
            newConfig.global.primaryColor = colors.primary;
            newConfig.global.secondaryColor = colors.secondary;
            newConfig.global.accentColor = colors.accent;
            newConfig.global.backgroundColor = colors.background;
            newConfig.global.textColor = colors.text;
            newConfig.global.borderColor = colors.border;
            
            // Aplicar também no checkout
            newConfig.checkout.colors.primary = colors.primary;
            newConfig.checkout.colors.secondary = colors.secondary;
            newConfig.checkout.colors.accent = colors.accent;
          }
          
          newConfig.global.templateName = templateId;
          
          return {
            configuration: newConfig,
            currentTemplate: templateId,
            isDirty: true,
          };
        });
      },
      
      syncWithDatabase: async () => {
        // Implementar sincronização com o banco via hook
        console.log('Sincronizando com banco de dados...');
      },
      
      setSelectedElement: (elementId) => set({ selectedElement: elementId }),
      
      setCurrentDevice: (device) => set({ currentDevice: device }),
      
      togglePreviewMode: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),
      
      saveConfiguration: async () => {
        // TODO: Implementar salvamento no Supabase via hook
        console.log('Salvando configuração...', get().configuration);
        set({ isDirty: false });
      },
      
      resetToDefault: () => set({ 
        configuration: defaultConfiguration, 
        isDirty: true 
      }),
      
      reorderSections: (newOrder) => {
        set((state) => ({
          configuration: {
            ...state.configuration,
            sectionOrder: newOrder,
          },
          isDirty: true,
        }));
      },
    }),
    {
      name: 'visual-editor-store',
      partialize: (state) => ({ 
        configuration: state.configuration,
        currentTemplate: state.currentTemplate 
      }),
    }
  )
);
