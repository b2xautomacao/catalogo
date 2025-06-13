
import { useState, useEffect, createContext, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    retail_price: number;
    wholesale_price?: number;
    image_url?: string;
  };
  quantity: number;
  price: number;
  variations?: {
    size?: string;
    color?: string;
  };
  catalogType: 'retail' | 'wholesale';
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
  isOpen: boolean;
  toggleCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Carregar itens do localStorage
  useEffect(() => {
    const savedItems = localStorage.getItem('cart-items');
    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems));
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        localStorage.removeItem('cart-items');
      }
    }
  }, []);

  // Salvar no localStorage sempre que items mudarem
  useEffect(() => {
    localStorage.setItem('cart-items', JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems(current => {
      const existingIndex = current.findIndex(
        cartItem => 
          cartItem.product.id === item.product.id && 
          cartItem.catalogType === item.catalogType &&
          JSON.stringify(cartItem.variations) === JSON.stringify(item.variations)
      );

      let newItems;
      if (existingIndex >= 0) {
        newItems = [...current];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + item.quantity
        };
      } else {
        newItems = [...current, item];
      }

      // Mostrar notificação de sucesso
      toast({
        title: "Produto adicionado!",
        description: `${item.product.name} foi adicionado ao carrinho.`,
        duration: 2000,
      });

      return newItems;
    });
  };

  const removeItem = (itemId: string) => {
    setItems(current => current.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(current =>
      current.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart-items');
  };

  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  const closeCart = () => {
    setIsOpen(false);
  };

  const totalAmount = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalAmount,
    totalItems,
    isOpen,
    toggleCart,
    closeCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
