
/**
 * Utilitário para geração de SKUs únicos
 */

export const generateUniqueSKU = (
  productName: string,
  variationDetails: {
    color?: string;
    size?: string;
    name?: string;
    index?: number;
  } = {}
): string => {
  // Normalizar o nome do produto
  const normalizedProduct = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6);

  // Normalizar detalhes da variação
  const { color, size, name, index = 0 } = variationDetails;
  
  let variationPart = '';
  
  if (name) {
    variationPart = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
  } else {
    if (color) {
      variationPart += color.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 2);
    }
    if (size) {
      variationPart += size.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 2);
    }
  }

  // Se não tiver variação específica, usar índice
  if (!variationPart) {
    variationPart = String(index + 1).padStart(2, '0');
  }

  // Timestamp para garantir unicidade
  const timestamp = Date.now().toString().slice(-4);
  
  // Gerar número aleatório para extra unicidade
  const random = Math.floor(Math.random() * 99).toString().padStart(2, '0');

  return `${normalizedProduct}-${variationPart}-${timestamp}${random}`;
};

export const generateBatchSKUs = (
  productName: string,
  variations: Array<{
    color?: string;
    size?: string;
    name?: string;
  }>
): string[] => {
  const skus: string[] = [];
  const usedSKUs = new Set<string>();

  variations.forEach((variation, index) => {
    let sku = generateUniqueSKU(productName, { ...variation, index });
    
    // Garantir que não há duplicatas
    let attempts = 0;
    while (usedSKUs.has(sku) && attempts < 10) {
      sku = generateUniqueSKU(productName, { 
        ...variation, 
        index: index + attempts + Date.now() 
      });
      attempts++;
    }
    
    usedSKUs.add(sku);
    skus.push(sku);
  });

  return skus;
};

export const validateSKUUniqueness = (skus: string[]): boolean => {
  const uniqueSKUs = new Set(skus);
  return uniqueSKUs.size === skus.length;
};
