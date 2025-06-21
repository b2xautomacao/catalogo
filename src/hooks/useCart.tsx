
import { useState, useEffect, createContext, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    retail_price: number;
    wholesale_price?: number;
    min_wholesale_qty?: number;
    image_url?: string;
  };
  quantity: number;
  price: number;
  originalPrice: number; // Preço original antes dos cálculos híbridos
  variations?: {
    size?: string;
    color?: string;
  };
  catalogType: 'retail' | 'wholesale';
  isWholesalePrice?: boolean; // Indica se está usando preço de atacado
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
  potentialSavings: number;
  canGetWholesalePrice: boolean;
  itemsToWholesale: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Função para recalcular preços baseado na quantidade (lógica híbrida)
  const recalculateItemPrices = (cartItems: CartItem[]): CartItem[] => {
    return cartItems.map(item => {
      const product = item.product;
      const quantity = item.quantity;
      
      // Se produto tem preço de atacado e quantidade mínima
      if (product.wholesale_price && product.min_wholesale_qty) {
        const minWholesaleQty = product.min_wholesale_qty;
        
        // Se atingiu quantidade mínima para atacado
        if (quantity >= minWholesaleQty) {
          return {
            ...item,
            price: product.wholesale_price,
            isWholesalePrice: true
          };
        }
      }
      
      // Usar preço original (varejo)
      return {
        ...item,
        price: item.originalPrice,
        isWholesalePrice: false
      };
    });
  };

  // Carregar itens do localStorage
  useEffect(() => {
    const savedItems = localStorage.getItem('cart-items');
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems);
        // Recalcular preços ao carregar
        setItems(recalculateItemPrices(parsedItems));
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
        // Garantir que originalPrice está definido
        const newItem = {
          ...item,
          originalPrice: item.originalPrice || item.price
        };
        newItems = [...current, newItem];
      }

      // Recalcular preços após adicionar
      const recalculatedItems = recalculateItemPrices(newItems);

      // Verificar se algum item mudou para preço de atacado
      const itemWithWholesalePrice = recalculatedItems.find(
        (recalcItem, index) => 
          recalcItem.product.id === item.product.id && 
          recalcItem.isWholesalePrice && 
          !newItems[index]?.isWholesalePrice
      );

      // Mostrar notificação adequada
      if (itemWithWholesalePrice) {
        const savings = (itemWithWholesalePrice.originalPrice - itemWithWholesalePrice.price) * itemWithWholesalePrice.quantity;
        toast({
          title: "🎉 Preço de atacado ativado!",
          description: `Você economizou R$ ${savings.toFixed(2)} com ${itemWithWholesalePrice.product.name}`,
          duration: 4000,
        });
      } else {
        toast({
          title: "Produto adicionado!",
          description: `${item.product.name} foi adicionado ao carrinho.`,
          duration: 2000,
        });
      }

      return recalculatedItems;
    });
  };

  const removeItem = (itemId: string) => {
    setItems(current => {
      const newItems = current.filter(item => item.id !== itemId);
      return recalculateItemPrices(newItems);
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(current => {
      const newItems = current.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      
      const recalculatedItems = recalculateItemPrices(newItems);
      
      // Verificar mudanças de preço para notificar
      const changedItem = recalculatedItems.find(item => item.id === itemId);
      const oldItem = current.find(item => item.id === itemId);
      
      if (changedItem && oldItem && changedItem.isWholesalePrice !== oldItem.isWholesalePrice) {
        if (changedItem.isWholesalePrice) {
          const savings = (changedItem.originalPrice - changedItem.price) * changedItem.quantity;
          toast({
            title: "🎉 Preço de atacado ativado!",
            description: `Você economizou R$ ${savings.toFixed(2)} com ${changedItem.product.name}`,
            duration: 4000,
          });
        } else {
          toast({
            title: "Preço alterado",
            description: `${changedItem.product.name} voltou ao preço de varejo`,
            duration: 3000,
          });
        }
      }
      
      return recalculatedItems;
    });
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

  // Calcular economia potencial se todos os itens fossem comprados no atacado
  const potentialSavings = items.reduce((total, item) => {
    if (item.product.wholesale_price && !item.isWholesalePrice) {
      const possibleSavings = (item.originalPrice - item.product.wholesale_price) * item.quantity;
      return total + possibleSavings;
    }
    return total;
  }, 0);

  // Verificar se há itens que podem obter preço de atacado
  const canGetWholesalePrice = items.some(item => 
    item.product.wholesale_price && 
    item.product.min_wholesale_qty && 
    item.quantity < item.product.min_wholesale_qty
  );

  // Calcular quantos itens faltam para atingir preço de atacado
  const itemsToWholesale = items.reduce((total, item) => {
    if (item.product.min_wholesale_qty && item.quantity < item.product.min_wholesale_qty) {
      return total + (item.product.min_wholesale_qty - item.quantity);
    }
    return total;
  }, 0);

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
    closeCart,
    potentialSavings,
    canGetWholesalePrice,
    itemsToWholesale
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
