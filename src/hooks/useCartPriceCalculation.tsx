
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

    // Verificar se qualifica para preço de atacado
    if (
      priceModel?.simple_wholesale_enabled &&
      wholesalePrice && 
      quantity >= minWholesaleQty
    ) {
      finalPrice = wholesalePrice;
      currentTierName = priceModel.simple_wholesale_name || 'Atacado';
      savings = (retailPrice - wholesalePrice) * quantity;
    } else if (
      priceModel?.simple_wholesale_enabled &&
      wholesalePrice &&
      quantity < minWholesaleQty
    ) {
      // Dica para próximo nível
      const neededQty = minWholesaleQty - quantity;
      const potentialSavings = retailPrice - wholesalePrice;
      nextTierHint = {
        quantityNeeded: neededQty,
        potentialSavings
      };
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
      nextTierHint
    };
  }, [item, priceModel]);
};
