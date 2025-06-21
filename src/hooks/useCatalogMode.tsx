
import { useState, useEffect, useCallback } from 'react';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';

type CatalogMode = 'separated' | 'hybrid' | 'toggle';
type CatalogType = 'retail' | 'wholesale';

export const useCatalogMode = (storeIdentifier?: string) => {
  const { settings } = useCatalogSettings(storeIdentifier);
  const [currentCatalogType, setCurrentCatalogType] = useState<CatalogType>('retail');
  
  // Para modo toggle, permitir alternar entre tipos
  const toggleCatalogType = useCallback(() => {
    if (settings?.catalog_mode === 'toggle') {
      setCurrentCatalogType(prev => prev === 'retail' ? 'wholesale' : 'retail');
      
      // Persistir preferência no localStorage
      const storageKey = `catalog_type_${settings.store_id}`;
      const newType = currentCatalogType === 'retail' ? 'wholesale' : 'retail';
      localStorage.setItem(storageKey, newType);
    }
  }, [settings, currentCatalogType]);

  // Recuperar preferência salva no localStorage
  useEffect(() => {
    if (settings?.catalog_mode === 'toggle' && settings.store_id) {
      const storageKey = `catalog_type_${settings.store_id}`;
      const savedType = localStorage.getItem(storageKey) as CatalogType;
      if (savedType && (savedType === 'retail' || savedType === 'wholesale')) {
        setCurrentCatalogType(savedType);
      }
    }
  }, [settings]);

  // Função para calcular o preço baseado no modo e quantidade
  const calculatePrice = useCallback((
    product: { retail_price: number; wholesale_price?: number | null; min_wholesale_qty?: number | null },
    quantity: number = 1
  ) => {
    if (!settings) return product.retail_price;

    const catalogMode = settings.catalog_mode;
    const wholesalePrice = product.wholesale_price || product.retail_price;
    const minWholesaleQty = product.min_wholesale_qty || 1;

    switch (catalogMode) {
      case 'hybrid':
        // No modo híbrido, usar preço de atacado se quantidade >= mínima
        return quantity >= minWholesaleQty ? wholesalePrice : product.retail_price;
      
      case 'toggle':
        // No modo toggle, usar o tipo selecionado pelo usuário
        return currentCatalogType === 'wholesale' ? wholesalePrice : product.retail_price;
      
      case 'separated':
      default:
        // No modo separado, sempre usar o preço do tipo especificado
        return product.retail_price;
    }
  }, [settings, currentCatalogType]);

  // Função para determinar se deve mostrar indicador de economia
  const shouldShowSavingsIndicator = useCallback((
    product: { retail_price: number; wholesale_price?: number | null; min_wholesale_qty?: number | null },
    quantity: number = 1
  ) => {
    if (!settings || settings.catalog_mode !== 'hybrid') return false;
    
    const wholesalePrice = product.wholesale_price || product.retail_price;
    const minWholesaleQty = product.min_wholesale_qty || 1;
    
    return quantity < minWholesaleQty && wholesalePrice < product.retail_price;
  }, [settings]);

  // Função para calcular economia potencial
  const calculatePotentialSavings = useCallback((
    product: { retail_price: number; wholesale_price?: number | null; min_wholesale_qty?: number | null },
    quantity: number = 1
  ) => {
    if (!settings || settings.catalog_mode !== 'hybrid') return null;
    
    const wholesalePrice = product.wholesale_price || product.retail_price;
    const minWholesaleQty = product.min_wholesale_qty || 1;
    
    if (quantity >= minWholesaleQty) return null;
    
    const retailTotal = product.retail_price * minWholesaleQty;
    const wholesaleTotal = wholesalePrice * minWholesaleQty;
    const savings = retailTotal - wholesaleTotal;
    const savingsPercentage = (savings / retailTotal) * 100;
    
    return {
      savings,
      savingsPercentage,
      minQtyNeeded: minWholesaleQty,
      qtyRemaining: minWholesaleQty - quantity
    };
  }, [settings]);

  return {
    catalogMode: settings?.catalog_mode || 'separated',
    currentCatalogType,
    toggleCatalogType,
    calculatePrice,
    shouldShowSavingsIndicator,
    calculatePotentialSavings,
    isRetailActive: settings?.retail_catalog_active || true,
    isWholesaleActive: settings?.wholesale_catalog_active || false,
  };
};
