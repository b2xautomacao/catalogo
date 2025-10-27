import { useEffect } from 'react';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';

/**
 * Componente Global de Tracking
 * Injeta scripts de Meta Pixel, Google Analytics, Google Ads e TikTok Pixel
 * Deve ser incluído uma vez no App.tsx ou na raiz da aplicação
 */
const ConversionPixels: React.FC = () => {
  const { settings } = useCatalogSettings();

  /**
   * Injeta script no head
   */
  const injectScript = (id: string, content: string, isAsync: boolean = false, src?: string) => {
    // Remover script existente se houver
    const existingScript = document.getElementById(id);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = id;
    script.type = 'text/javascript';
    
    if (src) {
      script.src = src;
      script.async = isAsync;
    } else {
      script.innerHTML = content;
    }
    
    document.head.appendChild(script);
  };

  /**
   * Injeta noscript no body
   */
  const injectNoScript = (id: string, content: string) => {
    const existingNoScript = document.getElementById(id);
    if (existingNoScript) {
      existingNoScript.remove();
    }

    const noscript = document.createElement('noscript');
    noscript.id = id;
    noscript.innerHTML = content;
    document.body.appendChild(noscript);
  };

  useEffect(() => {
    if (settings?.tracking_debug_mode) {
      console.log('🎯 Conversion Pixels Configurados:', {
        metaPixel: settings?.meta_pixel_enabled && settings?.meta_pixel_id,
        ga4: settings?.ga4_enabled && settings?.ga4_measurement_id,
        googleAds: settings?.google_ads_enabled && settings?.google_ads_id,
        tiktok: settings?.tiktok_pixel_enabled && settings?.tiktok_pixel_id,
      });
    }
  }, [settings]);

  /**
   * Meta Pixel
   */
  useEffect(() => {
    if (!settings?.meta_pixel_enabled || !settings?.meta_pixel_id) {
      return;
    }

    const metaPixelScript = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${settings.meta_pixel_id}');
      ${settings.tracking_auto_events ? "fbq('track', 'PageView');" : ''}
    `;

    injectScript('meta-pixel', metaPixelScript);
    
    // NoScript fallback
    injectNoScript(
      'meta-pixel-noscript',
      `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${settings.meta_pixel_id}&ev=PageView&noscript=1" />`
    );
  }, [settings?.meta_pixel_enabled, settings?.meta_pixel_id]);

  /**
   * Google Analytics 4
   */
  useEffect(() => {
    if (!settings?.ga4_enabled || !settings?.ga4_measurement_id) {
      return;
    }

    // Script externo
    injectScript(
      'ga4-external',
      '',
      true,
      `https://www.googletagmanager.com/gtag/js?id=${settings.ga4_measurement_id}`
    );

    // Script de configuração
    const ga4ConfigScript = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${settings.ga4_measurement_id}', {
        send_page_view: ${settings.tracking_auto_events ? 'true' : 'false'},
        debug_mode: ${settings.tracking_debug_mode ? 'true' : 'false'}
      });
      ${settings.google_ads_enabled && settings.google_ads_id ? `gtag('config', '${settings.google_ads_id}');` : ''}
    `;

    setTimeout(() => {
      injectScript('ga4-config', ga4ConfigScript);
    }, 100);
  }, [settings?.ga4_enabled, settings?.ga4_measurement_id, settings?.google_ads_enabled, settings?.google_ads_id]);

  /**
   * TikTok Pixel
   */
  useEffect(() => {
    if (!settings?.tiktok_pixel_enabled || !settings?.tiktok_pixel_id) {
      return;
    }

    const tiktokScript = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        ttq.load('${settings.tiktok_pixel_id}');
        ttq.page();
      }(window, document, 'ttq');
    `;

    injectScript('tiktok-pixel', tiktokScript);
  }, [settings?.tiktok_pixel_enabled, settings?.tiktok_pixel_id]);

  /**
   * Debug Mode
   */
  useEffect(() => {
    if (settings?.tracking_debug_mode) {
      console.log('🎯 TRACKING DEBUG MODE ATIVADO - Eventos serão logados no console');
    }
  }, [settings?.tracking_debug_mode]);

  return null;
};

export default ConversionPixels;

