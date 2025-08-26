
import { useState, useCallback } from 'react';
import { useShoppingCart } from './useShoppingCart';

export const useFloatingCart = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { items, totalItems, totalValue } = useShoppingCart();

  const showCart = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hideCart = useCallback(() => {
    setIsVisible(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  return {
    isVisible,
    showCart,
    hideCart,
    toggleCart,
    items,
    totalItems,
    totalPrice: totalValue,
    hasItems: totalItems > 0
  };
};
