import { useEffect } from 'react';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { hexToHslTriplet, getForegroundHslForHex } from '@/utils/color';

const DEFAULTS = {
  primary: '#0057FF',
  secondary: '#FF6F00',
  accent: '#8E2DE2',
  background: '#F8FAFC',
  text: '#1E293B',
  border: '#E2E8F0',
};

function adjustHexBrightness(hex: string, percent: number): string {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);

  const adjust = (channel: number) =>
    Math.max(0, Math.min(255, Math.round(channel + (channel * percent) / 100)));

  return `#${[adjust(r), adjust(g), adjust(b)]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * Hook único de tema por tenant, chamado uma vez por `TemplateWrapper`.
 * Substitui `useEditorSync` + `useTemplateHeaderColors`.
 *
 * Escreve duas famílias de variáveis CSS:
 * - As variáveis padrão do shadcn (`--primary`, `--secondary`, `--accent`, ...),
 *   em HSL, para que classes Tailwind como `bg-primary`/`text-primary` reflitam
 *   de fato a cor da marca do tenant (antes, ficavam presas ao neutro estático
 *   de `index.css`).
 * - As variáveis legadas `--template-*` (mesmos nomes/valores de antes), para
 *   não quebrar Footer/ConversionHeader/FloatingCart/CheckoutModal, que ainda
 *   dependem delas e estão fora do escopo desta fase.
 */
export function useTenantTheme(storeIdentifier: string) {
  const { settings, loading } = useCatalogSettings(storeIdentifier);

  useEffect(() => {
    const root = document.documentElement;

    const primary = settings?.primary_color || DEFAULTS.primary;
    const secondary = settings?.secondary_color || DEFAULTS.secondary;
    const accent = settings?.accent_color || DEFAULTS.accent;
    const background = settings?.background_color || DEFAULTS.background;
    const text = settings?.text_color || DEFAULTS.text;
    const border = settings?.border_color || DEFAULTS.border;

    // Variáveis padrão shadcn (o que `bg-primary`/`text-primary-foreground` etc. leem)
    root.style.setProperty('--primary', hexToHslTriplet(primary));
    root.style.setProperty('--primary-foreground', getForegroundHslForHex(primary));
    root.style.setProperty('--secondary', hexToHslTriplet(secondary));
    root.style.setProperty('--secondary-foreground', getForegroundHslForHex(secondary));
    root.style.setProperty('--accent', hexToHslTriplet(accent));
    root.style.setProperty('--accent-foreground', getForegroundHslForHex(accent));
    root.style.setProperty('--ring', hexToHslTriplet(primary));
    root.style.setProperty('--background', hexToHslTriplet(background));
    root.style.setProperty('--foreground', hexToHslTriplet(text));
    root.style.setProperty('--border', hexToHslTriplet(border));

    // Variáveis legadas (compatibilidade com Footer/ConversionHeader/FloatingCart/Checkout)
    root.style.setProperty('--template-primary', primary);
    root.style.setProperty('--template-secondary', secondary);
    root.style.setProperty('--template-accent', accent);
    root.style.setProperty('--template-background', background);
    root.style.setProperty('--template-text', text);
    root.style.setProperty('--template-border', border);
    root.style.setProperty('--template-surface', background);
    root.style.setProperty('--template-header-bg', primary);
    root.style.setProperty('--template-header-text', `hsl(${getForegroundHslForHex(primary)})`);
    root.style.setProperty('--template-button-primary', primary);
    root.style.setProperty('--template-button-secondary', secondary);
    root.style.setProperty('--template-button-accent', accent);
    root.style.setProperty('--template-link-color', primary);
    root.style.setProperty('--template-link-hover', secondary);
    root.style.setProperty(
      '--template-button-gradient',
      `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
    );
    root.style.setProperty('--template-button-primary-hover', adjustHexBrightness(primary, -10));
    root.style.setProperty('--template-button-secondary-hover', adjustHexBrightness(secondary, -10));

    if (settings?.font_family) {
      root.style.setProperty('--template-font-family', settings.font_family);
    }
    if (settings?.border_radius) {
      root.style.setProperty('--template-border-radius', `${settings.border_radius}px`);
    }
    if (settings?.layout_spacing) {
      root.style.setProperty('--template-spacing', `${settings.layout_spacing}px`);
    }

    return () => {
      [
        '--primary', '--primary-foreground', '--secondary', '--secondary-foreground',
        '--accent', '--accent-foreground', '--ring', '--background', '--foreground',
        '--border', '--template-primary', '--template-secondary', '--template-accent',
        '--template-background', '--template-text', '--template-border', '--template-surface',
        '--template-header-bg', '--template-header-text', '--template-button-primary',
        '--template-button-secondary', '--template-button-accent', '--template-link-color',
        '--template-link-hover', '--template-button-gradient',
        '--template-button-primary-hover', '--template-button-secondary-hover',
        '--template-font-family', '--template-border-radius', '--template-spacing',
      ].forEach((property) => root.style.removeProperty(property));
    };
  }, [settings]);

  return {
    settings,
    loading,
    templateName: settings?.template_name || 'modern',
    isConnected: !!settings && !loading,
  };
}
