
import { useState } from 'react';
import { Product, ProductVariation } from '@/types/product';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  variation?: ProductVariation;
}

export const useShoppingCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product, quantity: number = 1, variation?: ProductVariation) => {
    const itemId = `${product.id}-${variation?.id || 'default'}`;
    
    setItems(prev => {
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
        variation
      }];
    });
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    setItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => sum + (item.product.retail_price * item.quantity), 0);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalValue
  };
};
