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
}

const defaultConfiguration = {
  global: {
    template: 'modern',
    fontFamily: 'Inter, sans-serif',
    borderRadius: 8,
    layoutSpacing: 16,
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
  
  
}));
