/**
 * Color Extractor - Extrai paleta de cores de uma imagem
 * Usado para gerar esquema de cores automático baseado no logo da loja
 */

export interface ColorPalette {
  primary: string;      // Cor dominante do logo
  secondary: string;    // Segunda cor mais presente
  accent: string;       // Cor de destaque
  neutral: string;      // Cor neutra complementar
  text: string;         // Cor para texto (contraste automático)
  background: string;   // Cor de fundo sugerida
}

/**
 * Calcula o brilho de uma cor RGB (0-255)
 */
function getBrightness(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Calcula contraste entre duas cores
 */
function getContrast(rgb1: number[], rgb2: number[]): number {
  const l1 = getBrightness(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = getBrightness(rgb2[0], rgb2[1], rgb2[2]);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Converte RGB para HEX
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Converte HEX para RGB
 */
function hexToRgb(hex: string): number[] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

/**
 * Ajusta brilho de uma cor
 */
function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  const adjusted = rgb.map(c => Math.min(255, Math.max(0, c + (c * percent / 100))));
  return rgbToHex(Math.round(adjusted[0]), Math.round(adjusted[1]), Math.round(adjusted[2]));
}

/**
 * Gera cor complementar
 */
function getComplementaryColor(hex: string): string {
  const rgb = hexToRgb(hex);
  const complementary = rgb.map(c => 255 - c);
  return rgbToHex(complementary[0], complementary[1], complementary[2]);
}

/**
 * Extrai cores dominantes de uma imagem
 */
export async function extractColorsFromImage(imageUrl: string): Promise<ColorPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Não foi possível criar contexto do canvas');
        }

        // Redimensionar para performance
        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Contar cores (agrupando cores similares)
        const colorCounts = new Map<string, number>();
        
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Ignorar pixels transparentes ou muito claros/escuros
          if (a < 128) continue;
          const brightness = getBrightness(r, g, b);
          if (brightness > 240 || brightness < 15) continue;

          // Agrupar cores similares (reduzir precisão)
          const rGroup = Math.floor(r / 10) * 10;
          const gGroup = Math.floor(g / 10) * 10;
          const bGroup = Math.floor(b / 10) * 10;
          const colorKey = rgbToHex(rGroup, gGroup, bGroup);

          colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
        }

        // Ordenar cores por frequência
        const sortedColors = Array.from(colorCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0]);

        if (sortedColors.length === 0) {
          // Fallback: cores padrão
          resolve({
            primary: '#0057FF',
            secondary: '#FF6F00',
            accent: '#8E2DE2',
            neutral: '#64748B',
            text: '#1E293B',
            background: '#F8FAFC',
          });
          return;
        }

        // Extrair cores principais
        const primary = sortedColors[0];
        const secondary = sortedColors[Math.min(1, sortedColors.length - 1)];
        const accent = sortedColors[Math.min(2, sortedColors.length - 1)];

        // Gerar cor neutra (cinza baseado no primary)
        const primaryRgb = hexToRgb(primary);
        const neutralValue = Math.floor((primaryRgb[0] + primaryRgb[1] + primaryRgb[2]) / 3);
        const neutral = rgbToHex(neutralValue, neutralValue, neutralValue);

        // Determinar cor de texto (preto ou branco baseado no contraste)
        const whiteContrast = getContrast(hexToRgb(primary), [255, 255, 255]);
        const blackContrast = getContrast(hexToRgb(primary), [0, 0, 0]);
        const text = whiteContrast > blackContrast ? '#FFFFFF' : '#1E293B';

        // Gerar cor de fundo (muito clara baseada no primary)
        const background = adjustBrightness(primary, 90);

        resolve({
          primary,
          secondary,
          accent,
          neutral,
          text,
          background,
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem'));
    };

    img.src = imageUrl;
  });
}

/**
 * Gera paleta de cores padrão para um template
 */
export function getDefaultPaletteForTemplate(templateName: string): ColorPalette {
  const palettes: Record<string, ColorPalette> = {
    modern: {
      primary: '#0057FF',
      secondary: '#FF6F00',
      accent: '#8E2DE2',
      neutral: '#64748B',
      text: '#1E293B',
      background: '#F8FAFC',
    },
    minimal: {
      primary: '#000000',
      secondary: '#FFFFFF',
      accent: '#3B82F6',
      neutral: '#6B7280',
      text: '#111827',
      background: '#FFFFFF',
    },
    elegant: {
      primary: '#D97706',
      secondary: '#92400E',
      accent: '#7C2D12',
      neutral: '#78716C',
      text: '#292524',
      background: '#FEF3C7',
    },
    industrial: {
      primary: '#475569',
      secondary: '#F59E0B',
      accent: '#DC2626',
      neutral: '#64748B',
      text: '#1E293B',
      background: '#F1F5F9',
    },
  };

  return palettes[templateName] || palettes.modern;
}

/**
 * Valida se uma cor HEX é válida
 */
export function isValidHexColor(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex);
}

/**
 * Gera variações de uma cor (lighter, darker)
 */
export function generateColorVariations(hex: string): {
  lighter: string;
  light: string;
  base: string;
  dark: string;
  darker: string;
} {
  return {
    lighter: adjustBrightness(hex, 40),
    light: adjustBrightness(hex, 20),
    base: hex,
    dark: adjustBrightness(hex, -20),
    darker: adjustBrightness(hex, -40),
  };
}

