import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Product } from '@/types/product';
import { ProductVariation } from '@/types/variation';
import { usePriceCalculation } from '@/hooks/usePriceCalculation';
import { useProductPriceTiers } from '@/hooks/useProductPriceTiers';
import { useStorePriceModel } from '@/hooks/useStorePriceModel';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  variation?: ProductVariation;
  price: number;
  originalPrice: number;
  catalogType: string;
  currentTier?: any;
  nextTier?: any;
  nextTierQuantityNeeded?: number;
  nextTierPotentialSavings?: number;
  catalogMode?: string;
  priceModel?: string;
  finalPrice?: number;
  totalSavings?: number;
  savingsPercentage?: number;
}

export const useCart = () => {
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>('cart_items', []);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = (product: Product, quantity: number = 1, variation?: ProductVariation) => {
    const itemId = `${product.id}-${variation?.id || 'default'}`;
    
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === itemId);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      
      return [...prev, {
        id: itemId,
        product,
        quantity,
        price: product.retail_price,
        originalPrice: product.retail_price,
        catalogType: 'retail',
        variation
      }];
    });
  };

  const removeItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const toggleCart = () => {
    setIsOpen(prev => !prev);
  };

  const openCart = () => {
    setIsOpen(true);
  };

  const closeCart = () => {
    setIsOpen(false);
  };

  const enrichItemsWithPricing = useCallback((items: CartItem[]) => {
    return items.map(item => {
      const product = item.product;
      
      const { settings } = useCatalogSettings();
      const { priceModel } = useStorePriceModel(product.store_id);
      
      const catalogMode = settings?.catalog_mode || 'separated';
      const modelKey = product.price_model || priceModel?.price_model || "retail_only";

      const { tiers: priceTiers } = useProductPriceTiers(product.id, {
        wholesale_price: product.wholesale_price,
        min_wholesale_qty: product.min_wholesale_qty,
        retail_price: product.retail_price,
      });

      const calculation = usePriceCalculation(product.store_id, {
        product_id: product.id,
        retail_price: product.retail_price,
        wholesale_price: product.wholesale_price,
        min_wholesale_qty: product.min_wholesale_qty,
        quantity: item.quantity,
        price_tiers: product.enable_gradual_wholesale ? priceTiers : [],
        enable_gradual_wholesale: product.enable_gradual_wholesale,
      });

      return {
        ...item,
        currentTier: calculation.currentTier,
        nextTier: calculation.nextTierHint ? {
          tier_name: `Próximo Nível`,
          price: calculation.price - (calculation.nextTierHint.potentialSavings || 0)
        } : null,
        nextTierQuantityNeeded: calculation.nextTierHint?.quantityNeeded || 0,
        nextTierPotentialSavings: calculation.nextTierHint?.potentialSavings || 0,
        catalogMode,
        priceModel: modelKey,
        finalPrice: modelKey === "wholesale_only" ? item.price : calculation.price,
        totalSavings: calculation.savings,
        savingsPercentage: calculation.percentage
      };
    });
  }, []);

  const enrichedItems = useMemo(() => {
    return enrichItemsWithPricing(cartItems);
  }, [cartItems, enrichItemsWithPricing]);

  const totalItems = enrichedItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const totalAmount = enrichedItems.reduce((sum, item) => {
    const finalPrice = item.finalPrice || item.price;
    return sum + (finalPrice * item.quantity);
  }, 0);

  const totalSavings = enrichedItems.reduce((sum, item) => {
    return sum + (item.totalSavings || 0);
  }, 0);

  const cartAnalysis = useMemo(() => {
    const itemsWithNextTier = enrichedItems.filter(item => 
      item.nextTierQuantityNeeded > 0
    );
    
    const potentialSavings = itemsWithNextTier.reduce((sum, item) => 
      sum + (item.nextTierPotentialSavings * item.nextTierQuantityNeeded), 0
    );

    const canGetWholesalePrice = enrichedItems.some(item => 
      item.currentTier?.tier_name === "Varejo" && 
      item.product.wholesale_price &&
      item.quantity < (item.product.min_wholesale_qty || 1)
    );

    return {
      itemsWithUpgradeOpportunity: itemsWithNextTier.length,
      totalPotentialSavings: potentialSavings,
      canGetWholesalePrice,
      averageOrderValue: totalAmount / Math.max(1, enrichedItems.length),
      totalUniqueProducts: enrichedItems.length
    };
  }, [enrichedItems, totalAmount]);

  return {
    items: enrichedItems,
    
    cartAnalysis,
    totalSavings,
    
    totalItems,
    totalAmount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isOpen,
    toggleCart,
    openCart,
    closeCart,
    
    potentialSavings: cartAnalysis.totalPotentialSavings,
    canGetWholesalePrice: cartAnalysis.canGetWholesalePrice,
    itemsToWholesale: cartAnalysis.itemsWithUpgradeOpportunity,
  };
};
