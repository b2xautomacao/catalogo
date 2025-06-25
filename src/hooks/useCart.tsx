import { useState, useEffect, createContext, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ProductVariation } from '@/types/variation';

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
  originalPrice: number;
  variation?: ProductVariation;
  catalogType: 'retail' | 'wholesale';
  isWholesalePrice?: boolean;
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

// Função para validar estrutura de item do carrinho
const validateCartItem = (item: any): CartItem | null => {
  try {
    if (!item || typeof item !== 'object') return null;
    
    // Verificar propriedades obrigatórias
    if (!item.id || !item.product || typeof item.quantity !== 'number') return null;
    if (typeof item.price !== 'number' || isNaN(item.price)) return null;
    if (!item.product.id || !item.product.name) return null;
    if (typeof item.product.retail_price !== 'number' || isNaN(item.product.retail_price)) return null;
    
    // Garantir que originalPrice existe e é válido
    const originalPrice = item.originalPrice || item.product.retail_price || item.price;
    if (typeof originalPrice !== 'number' || isNaN(originalPrice)) return null;
    
    return {
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        retail_price: item.product.retail_price,
        wholesale_price: item.product.wholesale_price,
        min_wholesale_qty: item.product.min_wholesale_qty,
        image_url: item.product.image_url
      },
      quantity: Math.max(1, Math.floor(item.quantity)),
      price: item.price,
      originalPrice,
      variation: item.variation,
      catalogType: item.catalogType || 'retail',
      isWholesalePrice: item.isWholesalePrice || false
    };
  } catch (error) {
    console.error('❌ Erro ao validar item do carrinho:', error, item);
    return null;
  }
};

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

  // Carregar itens do localStorage com validação
  useEffect(() => {
    const loadCartFromStorage = () => {
      try {
        const savedItems = localStorage.getItem('cart-items');
        if (savedItems) {
          const parsedItems = JSON.parse(savedItems);
          
          if (Array.isArray(parsedItems)) {
            console.log('🛒 Carregando itens do carrinho:', parsedItems.length);
            
            // Validar e filtrar itens válidos
            const validItems = parsedItems
              .map(validateCartItem)
              .filter((item): item is CartItem => item !== null);
            
            console.log('✅ Itens válidos encontrados:', validItems.length);
            
            if (validItems.length !== parsedItems.length) {
              console.warn('⚠️ Alguns itens do carrinho foram removidos por dados inválidos');
              toast({
                title: "Carrinho atualizado",
                description: "Alguns itens foram removidos devido a dados inconsistentes.",
                duration: 3000,
              });
            }
            
            // Recalcular preços ao carregar
            const recalculatedItems = recalculateItemPrices(validItems);
            setItems(recalculatedItems);
          } else {
            console.warn('⚠️ Dados do carrinho em formato inválido, limpando localStorage');
            localStorage.removeItem('cart-items');
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar carrinho do localStorage:', error);
        localStorage.removeItem('cart-items');
        toast({
          title: "Erro no carrinho",
          description: "Houve um problema ao carregar seu carrinho. Ele foi resetado.",
          variant: "destructive",
          duration: 4000,
        });
      }
    };

    loadCartFromStorage();
  }, [toast]);

  // Salvar no localStorage sempre que items mudarem
  useEffect(() => {
    try {
      localStorage.setItem('cart-items', JSON.stringify(items));
    } catch (error) {
      console.error('❌ Erro ao salvar carrinho:', error);
    }
  }, [items]);

  const addItem = (item: CartItem) => {
    // Validar item antes de adicionar
    const validatedItem = validateCartItem(item);
    if (!validatedItem) {
      console.error('❌ Tentativa de adicionar item inválido ao carrinho:', item);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar este item ao carrinho.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setItems(current => {
      const existingIndex = current.findIndex(
        cartItem => 
          cartItem.product.id === validatedItem.product.id && 
          cartItem.catalogType === validatedItem.catalogType &&
          // Comparar variações incluindo IDs se disponíveis
          ((!cartItem.variation && !validatedItem.variation) ||
           (cartItem.variation && validatedItem.variation && 
            cartItem.variation.id === validatedItem.variation.id &&
            cartItem.variation.color === validatedItem.variation.color &&
            cartItem.variation.size === validatedItem.variation.size))
      );

      let newItems;
      if (existingIndex >= 0) {
        newItems = [...current];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + validatedItem.quantity
        };
      } else {
        newItems = [...current, validatedItem];
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
        const variationText = item.variation ? 
          ` (${[item.variation.color, item.variation.size].filter(Boolean).join(', ')})` : '';
        toast({
          title: "Produto adicionado!",
          description: `${item.product.name}${variationText} foi adicionado ao carrinho.`,
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
        item.id === itemId ? { ...item, quantity: Math.max(1, Math.floor(quantity)) } : item
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

  // Calcular valores com validação de segurança
  const totalAmount = items.reduce((total, item) => {
    const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
    const itemQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
    return total + (itemPrice * itemQuantity);
  }, 0);

  const totalItems = items.reduce((total, item) => {
    const itemQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
    return total + itemQuantity;
  }, 0);

  // Calcular economia potencial se todos os itens fossem comprados no atacado
  const potentialSavings = items.reduce((total, item) => {
    if (item.product.wholesale_price && !item.isWholesalePrice) {
      const originalPrice = typeof item.originalPrice === 'number' ? item.originalPrice : 0;
      const wholesalePrice = typeof item.product.wholesale_price === 'number' ? item.product.wholesale_price : 0;
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
      const possibleSavings = (originalPrice - wholesalePrice) * quantity;
      return total + Math.max(0, possibleSavings);
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
