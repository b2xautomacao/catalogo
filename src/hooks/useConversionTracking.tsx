import { useEffect } from 'react';
import { useCatalogSettings } from './useCatalogSettings';

// Tipos de eventos suportados
export type ConversionEvent =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Search'
  | 'ViewCategory'
  | 'AddToWishlist'
  | 'Contact'
  | 'Lead';

interface EventParams {
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  num_items?: number;
  search_string?: string;
  predicted_ltv?: number;
  contents?: any[];
  [key: string]: any;
}

declare global {
  interface Window {
    fbq?: any;
    gtag?: any;
    dataLayer?: any[];
    ttq?: any;
  }
}

export const useConversionTracking = () => {
  const { settings } = useCatalogSettings();

  /**
   * Dispara evento para Meta Pixel
   */
  const trackMetaPixel = (event: ConversionEvent, params?: EventParams) => {
    if (!settings?.meta_pixel_enabled || !settings?.meta_pixel_id || !window.fbq) {
      return;
    }

    try {
      if (settings.tracking_debug_mode) {
        console.log('🔵 Meta Pixel Event:', event, params);
      }

      window.fbq('track', event, params || {});
    } catch (error) {
      console.error('Erro ao disparar Meta Pixel:', error);
    }
  };

  /**
   * Dispara evento para Google Analytics 4
   */
  const trackGA4 = (event: string, params?: EventParams) => {
    if (!settings?.ga4_enabled || !settings?.ga4_measurement_id || !window.gtag) {
      return;
    }

    try {
      if (settings.tracking_debug_mode) {
        console.log('🔴 GA4 Event:', event, params);
      }

      window.gtag('event', event, params || {});
    } catch (error) {
      console.error('Erro ao disparar GA4:', error);
    }
  };

  /**
   * Dispara evento para Google Ads
   */
  const trackGoogleAds = (conversionLabel?: string, value?: number) => {
    if (!settings?.google_ads_enabled || !settings?.google_ads_id || !window.gtag) {
      return;
    }

    try {
      const label = conversionLabel || settings.google_ads_conversion_label;
      
      if (!label) {
        console.warn('Google Ads conversion label não configurado');
        return;
      }

      if (settings.tracking_debug_mode) {
        console.log('🟡 Google Ads Conversion:', label, value);
      }

      window.gtag('event', 'conversion', {
        send_to: `${settings.google_ads_id}/${label}`,
        value: value || 0,
        currency: 'BRL',
      });
    } catch (error) {
      console.error('Erro ao disparar Google Ads:', error);
    }
  };

  /**
   * Dispara evento para TikTok Pixel
   */
  const trackTikTokPixel = (event: string, params?: EventParams) => {
    if (!settings?.tiktok_pixel_enabled || !settings?.tiktok_pixel_id || !window.ttq) {
      return;
    }

    try {
      if (settings.tracking_debug_mode) {
        console.log('⚫ TikTok Pixel Event:', event, params);
      }

      window.ttq.track(event, params || {});
    } catch (error) {
      console.error('Erro ao disparar TikTok Pixel:', error);
    }
  };

  /**
   * Função universal para disparar evento em todas as plataformas
   */
  const track = (event: ConversionEvent, params?: EventParams) => {
    // Verificar se o evento está habilitado
    const eventEnabled = checkIfEventEnabled(event);
    
    if (!eventEnabled) {
      if (settings?.tracking_debug_mode) {
        console.log(`⏭️ Evento ${event} desabilitado nas configurações`);
      }
      return;
    }

    // Disparar para todas as plataformas ativas
    trackMetaPixel(event, params);
    trackGA4(eventToGA4(event), params);
    trackTikTokPixel(event, params);

    // Log unificado
    if (settings?.tracking_debug_mode) {
      console.log('📊 Conversion Tracking:', {
        event,
        params,
        platforms: {
          meta: !!settings?.meta_pixel_enabled,
          ga4: !!settings?.ga4_enabled,
          googleAds: !!settings?.google_ads_enabled,
          tiktok: !!settings?.tiktok_pixel_enabled,
        },
      });
    }
  };

  /**
   * Verificar se evento específico está habilitado
   */
  const checkIfEventEnabled = (event: ConversionEvent): boolean => {
    const eventMap: Record<ConversionEvent, boolean> = {
      PageView: settings?.tracking_pageview !== false,
      ViewContent: settings?.tracking_view_content !== false,
      AddToCart: settings?.tracking_add_to_cart !== false,
      InitiateCheckout: settings?.tracking_initiate_checkout !== false,
      AddPaymentInfo: settings?.tracking_add_payment_info !== false,
      Purchase: settings?.tracking_purchase !== false,
      Search: settings?.tracking_search !== false,
      ViewCategory: settings?.tracking_view_category !== false,
      AddToWishlist: true,
      Contact: true,
      Lead: true,
    };

    return eventMap[event] ?? true;
  };

  /**
   * Converter evento para nomenclatura GA4
   */
  const eventToGA4 = (event: ConversionEvent): string => {
    const ga4Map: Record<ConversionEvent, string> = {
      PageView: 'page_view',
      ViewContent: 'view_item',
      AddToCart: 'add_to_cart',
      InitiateCheckout: 'begin_checkout',
      AddPaymentInfo: 'add_payment_info',
      Purchase: 'purchase',
      Search: 'search',
      ViewCategory: 'view_item_list',
      AddToWishlist: 'add_to_wishlist',
      Contact: 'generate_lead',
      Lead: 'generate_lead',
    };

    return ga4Map[event] || event.toLowerCase();
  };

  /**
   * Helpers para eventos específicos
   */
  const trackPageView = (pagePath?: string, pageTitle?: string) => {
    track('PageView', {
      page_path: pagePath || window.location.pathname,
      page_title: pageTitle || document.title,
    });
  };

  const trackProductView = (product: {
    id: string;
    name: string;
    category?: string;
    price: number;
  }) => {
    track('ViewContent', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      content_category: product.category || '',
      value: product.price,
      currency: 'BRL',
    });
  };

  const trackAddToCart = (product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }) => {
    track('AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price * product.quantity,
      currency: 'BRL',
      num_items: product.quantity,
    });
  };

  const trackInitiateCheckout = (cartValue: number, numItems: number) => {
    track('InitiateCheckout', {
      value: cartValue,
      currency: 'BRL',
      num_items: numItems,
    });
  };

  const trackPurchase = (order: {
    id: string;
    value: number;
    items: any[];
  }) => {
    track('Purchase', {
      value: order.value,
      currency: 'BRL',
      transaction_id: order.id,
      num_items: order.items.length,
      contents: order.items.map(item => ({
        id: item.product_id,
        quantity: item.quantity,
        item_price: item.price,
      })),
    });

    // Disparar conversão do Google Ads também
    if (settings?.google_ads_enabled) {
      trackGoogleAds(undefined, order.value);
    }
  };

  const trackSearch = (searchQuery: string, results: number) => {
    track('Search', {
      search_string: searchQuery,
      num_results: results,
    });
  };

  return {
    track,
    trackPageView,
    trackProductView,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
    trackSearch,
    trackMetaPixel,
    trackGA4,
    trackGoogleAds,
    trackTikTokPixel,
    isEnabled: !!(
      settings?.meta_pixel_enabled ||
      settings?.ga4_enabled ||
      settings?.google_ads_enabled ||
      settings?.tiktok_pixel_enabled
    ),
    debugMode: settings?.tracking_debug_mode || false,
  };
};

