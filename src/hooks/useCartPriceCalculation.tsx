
import { useMemo } from 'react';
import { useStorePriceModel } from '@/hooks/useStorePriceModel';

interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    retail_price: number;
    wholesale_price?: number;
    min_wholesale_qty?: number;
    image_url?: string;
    store_id?: string;
    stock: number;
    allow_negative_stock: boolean;
  };
  quantity: number;
  price: number;
  originalPrice: number;
  variation?: any;
  catalogType: string;
}

interface PriceCalculationResult {
  total: number;
  savings: number;
  formattedTotal: string;
  formattedSavings: string;
  currentTier: {
    tier_name: string;
    price: number;
  };
  nextTierHint?: {
    quantityNeeded: number;
    potentialSavings: number;
  };
  priceModel?: string;
}

export const useCartPriceCalculation = (item: CartItem): PriceCalculationResult => {
  const { priceModel } = useStorePriceModel(item.product.store_id);

  return useMemo(() => {
    const quantity = item.quantity;
    const retailPrice = item.product.retail_price;
    const wholesalePrice = item.product.wholesale_price;
    const minWholesaleQty = item.product.min_wholesale_qty || 1;
    
    let finalPrice = retailPrice;
    let currentTierName = 'Varejo';
    let savings = 0;
    let nextTierHint: { quantityNeeded: number; potentialSavings: number; } | undefined;

    const modelType = priceModel?.price_model || 'retail_only';

    switch (modelType) {
      case 'retail_only':
        // Apenas varejo
        finalPrice = retailPrice;
        currentTierName = 'Varejo';
        break;

      case 'wholesale_only':
        // Apenas atacado - não mostrar economia pois é o preço padrão
        finalPrice = wholesalePrice || retailPrice;
        currentTierName = 'Atacado';
        savings = 0; // Não mostrar economia para wholesale_only
        break;

      case 'simple_wholesale':
        // Varejo + Atacado simples
        if (wholesalePrice && quantity >= minWholesaleQty) {
          finalPrice = wholesalePrice;
          currentTierName = 'Atacado';
          savings = (retailPrice - wholesalePrice) * quantity;
        } else {
          finalPrice = retailPrice;
          currentTierName = 'Varejo';
          
          // Dica para próximo nível
          if (wholesalePrice && quantity < minWholesaleQty) {
            const neededQty = minWholesaleQty - quantity;
            const potentialSavings = (retailPrice - wholesalePrice) * minWholesaleQty;
            nextTierHint = {
              quantityNeeded: neededQty,
              potentialSavings
            };
          }
        }
        break;

      case 'gradual_wholesale':
        // Para gradativo, usar preço exato do item calculado
        finalPrice = item.price;
        
        // Determinar nível baseado no preço final vs preço de varejo
        if (finalPrice < retailPrice) {
          if (wholesalePrice && finalPrice <= wholesalePrice) {
            currentTierName = priceModel?.simple_wholesale_name || 'Atacado';
          } else {
            currentTierName = 'Atacarejo';
          }
          savings = (retailPrice - finalPrice) * quantity;
        } else {
          currentTierName = 'Varejo';
        }

        // Dica para próximo nível no gradativo
        if (wholesalePrice && quantity < minWholesaleQty) {
          const neededQty = minWholesaleQty - quantity;
          const potentialSavings = (retailPrice - wholesalePrice) * minWholesaleQty;
          nextTierHint = {
            quantityNeeded: neededQty,
            potentialSavings
          };
        }
        break;

      default:
        finalPrice = retailPrice;
        currentTierName = 'Varejo';
    }

    const total = finalPrice * quantity;

    return {
      total,
      savings,
      formattedTotal: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(total),
      formattedSavings: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(savings),
      currentTier: {
        tier_name: currentTierName,
        price: finalPrice
      },
      nextTierHint,
      priceModel: modelType // Adicionar modelo de preço para uso nos componentes
    };
  }, [item, priceModel]);
};
