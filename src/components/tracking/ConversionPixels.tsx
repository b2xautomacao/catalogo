import { useEffect } from 'react';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { Helmet } from 'react-helmet-async';

/**
 * Componente Global de Tracking
 * Injeta scripts de Meta Pixel, Google Analytics, Google Ads e TikTok Pixel
 * Deve ser incluído uma vez no App.tsx ou na raiz da aplicação
 */
const ConversionPixels: React.FC = () => {
  const { settings } = useCatalogSettings();

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

  // Meta Pixel Script
  const metaPixelScript = settings?.meta_pixel_enabled && settings?.meta_pixel_id ? `
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
  ` : '';

  // Google Analytics 4 Script
  const ga4Script = settings?.ga4_enabled && settings?.ga4_measurement_id ? `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${settings.ga4_measurement_id}', {
      send_page_view: ${settings.tracking_auto_events ? 'true' : 'false'},
      debug_mode: ${settings.tracking_debug_mode ? 'true' : 'false'}
    });
  ` : '';

  // Google Ads Conversion Tracking
  const googleAdsScript = settings?.google_ads_enabled && settings?.google_ads_id ? `
    gtag('config', '${settings.google_ads_id}');
  ` : '';

  // TikTok Pixel Script
  const tiktokPixelScript = settings?.tiktok_pixel_enabled && settings?.tiktok_pixel_id ? `
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      ttq.load('${settings.tiktok_pixel_id}');
      ttq.page();
    }(window, document, 'ttq');
  ` : '';

  return (
    <Helmet>
      {/* Meta Pixel */}
      {metaPixelScript && (
        <>
          <script>{metaPixelScript}</script>
          <noscript>
            {`<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${settings?.meta_pixel_id}&ev=PageView&noscript=1" />`}
          </noscript>
        </>
      )}

      {/* Google Analytics 4 */}
      {settings?.ga4_enabled && settings?.ga4_measurement_id && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.ga4_measurement_id}`}
          />
          <script>{ga4Script}</script>
          {googleAdsScript && <script>{googleAdsScript}</script>}
        </>
      )}

      {/* TikTok Pixel */}
      {tiktokPixelScript && <script>{tiktokPixelScript}</script>}

      {/* Debug Mode Indicator */}
      {settings?.tracking_debug_mode && (
        <script>
          {`console.log('🎯 TRACKING DEBUG MODE ATIVADO - Eventos serão logados no console');`}
        </script>
      )}
    </Helmet>
  );
};

export default ConversionPixels;

