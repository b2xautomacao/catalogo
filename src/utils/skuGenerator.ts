
import { supabase } from '@/integrations/supabase/client';

// Função para normalizar texto (remover acentos, espaços, etc)
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9]/g, '') // Remove caracteres especiais
    .toUpperCase();
};

// Função para gerar SKU base a partir de um texto
export const generateBaseSKU = (text: string, maxLength: number = 8): string => {
  const normalized = normalizeText(text);
  
  if (normalized.length <= maxLength) {
    return normalized;
  }
  
  // Se for muito longo, pega as primeiras letras de cada palavra
  const words = text.split(/\s+/);
  if (words.length > 1) {
    const initials = words
      .map(word => normalizeText(word).charAt(0))
      .join('')
      .substring(0, maxLength);
    
    if (initials.length >= 3) {
      return initials;
    }
  }
  
  // Fallback: primeiros caracteres
  return normalized.substring(0, maxLength);
};

// Função para verificar se SKU já existe
export const checkSKUExists = async (sku: string, excludeId?: string): Promise<boolean> => {
  try {
    let query = supabase
      .from('products')
      .select('id')
      .eq('sku', sku);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao verificar SKU:', error);
      return false;
    }
    
    return (data && data.length > 0);
  } catch (error) {
    console.error('Erro ao verificar SKU:', error);
    return false;
  }
};

// Função para verificar se SKU de variação já existe
export const checkVariationSKUExists = async (sku: string, excludeId?: string): Promise<boolean> => {
  try {
    let query = supabase
      .from('product_variations')
      .select('id')
      .eq('sku', sku);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao verificar SKU de variação:', error);
      return false;
    }
    
    return (data && data.length > 0);
  } catch (error) {
    console.error('Erro ao verificar SKU de variação:', error);
    return false;
  }
};

// Função para gerar SKU único para produto
export const generateUniqueProductSKU = async (
  productName: string, 
  excludeId?: string,
  maxAttempts: number = 100
): Promise<string> => {
  const baseSKU = generateBaseSKU(productName);
  
  // Primeiro tenta o SKU base
  const baseExists = await checkSKUExists(baseSKU, excludeId);
  if (!baseExists) {
    return baseSKU;
  }
  
  // Se existe, adiciona sufixos incrementais
  for (let i = 1; i <= maxAttempts; i++) {
    const candidate = `${baseSKU}${i.toString().padStart(2, '0')}`;
    const exists = await checkSKUExists(candidate, excludeId);
    
    if (!exists) {
      return candidate;
    }
  }
  
  // Fallback com timestamp se todos os tentativas falharam
  const timestamp = Date.now().toString().slice(-4);
  const fallbackSKU = `${baseSKU.substring(0, 4)}${timestamp}`;
  
  return fallbackSKU;
};

// Função para gerar SKU único para variação
export const generateUniqueVariationSKU = async (
  productName: string,
  variationData: { color?: string; size?: string },
  excludeId?: string,
  maxAttempts: number = 100
): Promise<string> => {
  const productBase = generateBaseSKU(productName, 4);
  
  let variationPart = '';
  if (variationData.color) {
    variationPart += generateBaseSKU(variationData.color, 2);
  }
  if (variationData.size) {
    variationPart += generateBaseSKU(variationData.size, 2);
  }
  
  // Se não tem dados de variação, usa um sufixo genérico
  if (!variationPart) {
    variationPart = 'VAR';
  }
  
  const baseSKU = `${productBase}-${variationPart}`;
  
  // Primeiro tenta o SKU base
  const baseExists = await checkVariationSKUExists(baseSKU, excludeId);
  if (!baseExists) {
    return baseSKU;
  }
  
  // Se existe, adiciona sufixos incrementais
  for (let i = 1; i <= maxAttempts; i++) {
    const candidate = `${baseSKU}${i.toString().padStart(2, '0')}`;
    const exists = await checkVariationSKUExists(candidate, excludeId);
    
    if (!exists) {
      return candidate;
    }
  }
  
  // Fallback com timestamp
  const timestamp = Date.now().toString().slice(-3);
  const fallbackSKU = `${baseSKU.substring(0, 8)}${timestamp}`;
  
  return fallbackSKU;
};

// Função para gerar um novo SKU incrementado
export const generateIncrementedSKU = async (baseSKU: string): Promise<string> => {
  let newSKU = baseSKU;
  let counter = 1;
  
  while (await checkSKUExists(newSKU) || await checkVariationSKUExists(newSKU)) {
    const suffix = counter.toString().padStart(2, '0');
    
    // Remove qualquer sufixo numérico existente
    const cleanBase = baseSKU.replace(/\d+$/, '');
    newSKU = `${cleanBase}${suffix}`;
    counter++;
    
    // Evita loop infinito
    if (counter > 99) {
      const timestamp = Date.now().toString().slice(-3);
      newSKU = `${cleanBase.substring(0, 5)}${timestamp}`;
      break;
    }
  }
  
  return newSKU;
};

// Função para gerar SKU único (compatibilidade)
export const generateUniqueSKU = async (
  productName: string, 
  variationData?: { 
    color?: string; 
    size?: string; 
    name?: string; 
    index?: number;
  }
): Promise<string> => {
  if (variationData) {
    return await generateUniqueVariationSKU(productName, variationData);
  } else {
    return await generateUniqueProductSKU(productName);
  }
};

// Função para gerar SKUs em lote
export const generateBatchSKUs = async (
  productName: string,
  variations: Array<{ color?: string; size?: string; name?: string }>
): Promise<string[]> => {
  const skus: string[] = [];
  
  for (const variation of variations) {
    const sku = await generateUniqueVariationSKU(productName, variation);
    skus.push(sku);
  }
  
  return skus;
};

// Função para validar unicidade de SKUs
export const validateSKUUniqueness = (skus: string[]): boolean => {
  const uniqueSkus = new Set(skus);
  return uniqueSkus.size === skus.length;
};

// Função para sugerir SKU (usada em tempo real nos forms)
export const suggestSKU = async (input: string, type: 'product' | 'variation' = 'product'): Promise<string> => {
  const normalized = normalizeText(input);
  
  if (type === 'product') {
    return await generateUniqueProductSKU(input);
  } else {
    // Para variações, gera um SKU mais simples
    const baseSKU = generateBaseSKU(input, 6);
    return await generateIncrementedSKU(baseSKU);
  }
};
