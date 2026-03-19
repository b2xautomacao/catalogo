
/**
 * Mapa de cores por nome aproximado (fallback quando não há hex_color definido)
 * Focado em tons comuns de joalheria e cores de vestuário.
 */
export const COLOR_NAME_MAP: Record<string, string> = {
  preto: "#1a1a1a",
  branco: "#f5f5f5",
  vermelho: "#EF4444",
  azul: "#3B82F6",
  "azul marinho": "#1e3a8a",
  navy: "#1e3a8a",
  verde: "#22C55E",
  amarelo: "#EAB308",
  rosa: "#EC4899",
  "rosa bebê": "#fbcfe8",
  roxo: "#A855F7",
  laranja: "#F97316",
  cinza: "#6B7280",
  "cinza claro": "#d1d5db",
  marrom: "#92400E",
  bege: "#D4B896",
  caramelo: "#c48c3e",
  dourado: "#DAA520",
  prata: "#C0C0C0",
  nude: "#E8C8A0",
  vinho: "#7f1d1d",
  bordô: "#7f1d1d",
  turquesa: "#06b6d4",
  lilás: "#c084fc",
  creme: "#fef9c3",
  off: "#f5f0e8",
  rosê: "#E5B0A3",
  rosé: "#E5B0A3",
  rose: "#E5B0A3",
  ouro: "#D4AF37",
  "ouro light": "#E5D19A",
  "banho ouro": "#D4AF37",
  rhodium: "#E5E4E2",
  ródio: "#E5E4E2",
  rodio: "#E5E4E2",
  grafite: "#41424C",
};

/** Normaliza string removendo acentos e convertendo para lowercase */
function normalizeString(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Retorna o hex para uma cor, priorizando hex_color definido
 * pelo lojista. Se não houver, usa o mapa de aproximação por nome.
 */
export function resolveColorHex(colorName?: string, hexOverride?: string | null): string {
  // Se houver um hex customizado que não seja o cinza genérico do fallback ou transparente, use-o
  if (hexOverride && 
      hexOverride !== "#9CA3AF" && 
      hexOverride !== "transparent" && 
      hexOverride !== "" && 
      hexOverride !== "#666" &&
      hexOverride !== "#CCCCCC" &&
      hexOverride !== "#ccc") {
    return hexOverride;
  }
  
  if (!colorName) return hexOverride || "#9CA3AF";
  
  const normalizedInput = normalizeString(colorName);
  
  // 1. Busca exata no mapa normalizado (Prioridade máxima)
  for (const [key, hex] of Object.entries(COLOR_NAME_MAP)) {
    if (normalizeString(key) === normalizedInput) return hex;
  }
  
  // 2. Busca por inclusão, mas priorizando nomes mais longos (mais específicos)
  // Ex: "azul marinho" deve ser encontrado antes de "azul"
  const sortedKeys = Object.keys(COLOR_NAME_MAP).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    const normalizedKey = normalizeString(key);
    // Se o input contém a palavra inteira ou é parte de uma composição
    if (normalizedInput.includes(normalizedKey)) {
      return COLOR_NAME_MAP[key];
    }
  }
  
  // Caso não encontre no mapa, mas tenha um override (mesmo que seja o genérico), usa o override
  if (hexOverride && hexOverride !== "transparent" && hexOverride !== "") {
    return hexOverride;
  }
  
  return "#9CA3AF";
}

/** Determina se a cor de texto deve ser escura ou clara com base na luminância */
export function isLightColor(hex: string): boolean {
  if (!hex || hex === "transparent") return true;
  const c = hex.replace("#", "");
  if (c.length !== 6 && c.length !== 3) return true;
  
  let r, g, b;
  if (c.length === 6) {
    r = parseInt(c.substring(0, 2), 16);
    g = parseInt(c.substring(2, 4), 16);
    b = parseInt(c.substring(4, 6), 16);
  } else {
    r = parseInt(c[0] + c[0], 16);
    g = parseInt(c[1] + c[1], 16);
    b = parseInt(c[2] + c[2], 16);
  }
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
