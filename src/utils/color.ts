/**
 * Conversão de cores HEX para o formato de triplet HSL usado pelas variáveis
 * CSS do design system (`--primary: H S% L%`), sem o wrapper `hsl()`.
 */

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized;

  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);

  return [r, g, b];
}

/** Converte uma cor HEX (`#RRGGBB` ou `#RGB`) para `"H S% L%"`. */
export function hexToHslTriplet(hex: string): string {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return `0 0% ${Math.round(l * 100)}%`;
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  h *= 60;

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Decide se um texto sobre `hex` deve ser claro ou escuro para manter contraste
 * legível (WCAG-ish, baseado em luminância relativa), já retornando um triplet
 * HSL pronto para `--x-foreground`.
 */
export function getForegroundHslForHex(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  return luminance > 150 ? '222.2 84% 4.9%' : '210 40% 98%';
}
