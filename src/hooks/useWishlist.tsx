
import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { useToast } from '@/hooks/use-toast';

interface WishlistItem {
  id: string;
  product: Product;
  added_at: string;
}

export const useWishlist = () => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const { toast } = useToast();

  // Carregar wishlist do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        setWishlist(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Erro ao carregar wishlist:', error);
      localStorage.removeItem('wishlist');
    }
  }, []);

  // Salvar no localStorage quando wishlist mudar
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (product: Product) => {
    if (isInWishlist(product.id)) return;

    const newItem: WishlistItem = {
      id: product.id,
      product,
      added_at: new Date().toISOString()
    };

    setWishlist(prev => [...prev, newItem]);
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => prev.filter(item => item.id !== productId));
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlist.some(item => item.id === productId);
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  return {
    wishlist: wishlist.map(item => item.product),
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
  };
};
