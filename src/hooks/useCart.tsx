import { useState, useEffect, createContext, useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import { ProductVariation } from "@/types/variation";
import { usePriceCalculation } from "./usePriceCalculation";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";

export interface CartItem {
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
    enable_gradual_wholesale?: boolean; // Toggle de atacado gradativo
    price_model?: string; // Adicionado para controlar o modelo de preço
  };
  quantity: number;
  price: number;
  originalPrice: number;
  variation?: ProductVariation;
  catalogType: "retail" | "wholesale";
  isWholesalePrice?: boolean;
  currentTier?: {
    tier_name: string;
    min_quantity: number;
    price: number;
    tier_order: number;
  };
  nextTier?: {
    tier_name: string;
    min_quantity: number;
    price: number;
    tier_order: number;
  };
  nextTierQuantityNeeded?: number | null;
  nextTierPotentialSavings?: number | null;
  // Informações de grade da variação
  gradeInfo?: {
    name: string;
    sizes: string[];
    pairs: number[];
  };
}

// Novo tipo para modelo de preço
export type CartPriceModelType =
  | "retail_only"
  | "simple_wholesale"
  | "gradual_wholesale"
  | "wholesale_only";

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem, modelKey?: CartPriceModelType) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (
    itemId: string,
    quantity: number,
    modelKey?: CartPriceModelType,
    minWholesaleQty?: number
  ) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
  isOpen: boolean;
  toggleCart: () => void;
  closeCart: () => void;
  potentialSavings: number;
  canGetWholesalePrice: boolean;
  itemsToWholesale: number;
  // ✅ NOVAS PROPRIEDADES PARA NÍVEIS DE PREÇO
  currentTierLevel: number;
  nextTierLevel: number | null;
  nextTierSavings: number;
  itemsToNextTier: number;
  tierProgress: {
    [productId: string]: {
      current: number;
      next: number | null;
      savings: number;
    };
  };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Função para validar estrutura de item do carrinho
const validateCartItem = (item: any): CartItem | null => {
  try {
    if (!item || typeof item !== "object") return null;

    // Verificar propriedades obrigatórias
    if (!item.id || !item.product || typeof item.quantity !== "number")
      return null;
    if (typeof item.price !== "number" || isNaN(item.price)) return null;
    if (!item.product.id || !item.product.name) return null;
    if (
      typeof item.product.retail_price !== "number" ||
      isNaN(item.product.retail_price)
    )
      return null;

    // Garantir que originalPrice existe e é válido
    const originalPrice =
      item.originalPrice || item.product.retail_price || item.price;
    if (typeof originalPrice !== "number" || isNaN(originalPrice)) return null;

    return {
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        retail_price: item.product.retail_price,
        wholesale_price: item.product.wholesale_price,
        min_wholesale_qty: item.product.min_wholesale_qty,
        image_url: item.product.image_url,
        stock: item.product.stock ?? 0,
        allow_negative_stock: item.product.allow_negative_stock ?? false,
        enable_gradual_wholesale:
          item.product.enable_gradual_wholesale ?? false,
        price_model: item.product.price_model, // Adicionado para controlar o modelo de preço
      },
      quantity: Math.max(1, Math.floor(item.quantity)),
      price: item.price,
      originalPrice,
      variation: item.variation,
      catalogType: item.catalogType || "retail",
      isWholesalePrice: item.isWholesalePrice || false,
      // Extrair informações de grade da variação
      gradeInfo: item.variation?.grade_name
        ? {
            name: item.variation.grade_name,
            sizes: item.variation.grade_sizes || [],
            pairs: item.variation.grade_pairs || [],
          }
        : undefined,
    };
  } catch (error) {
    console.error("❌ Erro ao validar item do carrinho:", error, item);
    return null;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Cache para níveis de preço
  const [priceTiersCache, setPriceTiersCache] = useState<Record<string, any[]>>(
    {}
  );

  // Função para buscar níveis de preço de um produto
  const fetchProductTiers = async (productId: string) => {
    if (priceTiersCache[productId]) {
      return priceTiersCache[productId];
    }

    try {
      const { supabase } = await import("../integrations/supabase/client");
      const { data: tiers } = await supabase
        .from("product_price_tiers")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("tier_order", { ascending: false });

      if (tiers) {
        setPriceTiersCache((prev) => ({ ...prev, [productId]: tiers }));
        return tiers;
      }
    } catch (error) {
      console.error("Erro ao buscar níveis de preço:", error);
    }
    return [];
  };

  // Função para recalcular preços baseado na quantidade (lógica híbrida)
  const recalculateItemPrices = (cartItems: CartItem[]): CartItem[] => {
    return cartItems.map((item) => {
      const product = item.product;
      const quantity = item.quantity;

      // Se for apenas atacado, sempre usar preço de atacado
      if (product.price_model === "wholesale_only") {
        return {
          ...item,
          price: product.wholesale_price,
          isWholesalePrice: true,
          currentTier: undefined,
          nextTier: undefined,
          nextTierQuantityNeeded: undefined,
          nextTierPotentialSavings: undefined,
        };
      }

      // LOG: Estado do cache de tiers
      console.log(
        `🟦 [recalculateItemPrices] Tiers cache para ${product.name}:`,
        priceTiersCache[product.id]
      );

      // Verificar se temos níveis em cache (só se atacado gradativo estiver ativo)
      const tiers = product.enable_gradual_wholesale
        ? priceTiersCache[product.id]
        : null;

      if (tiers && tiers.length > 0) {
        // Ordenar por quantidade mínima (crescente) para encontrar o nível correto
        const sortedTiers = [...tiers].sort(
          (a, b) => a.min_quantity - b.min_quantity
        );

        // Selecionar todos os tiers elegíveis
        const eligibleTiers = sortedTiers.filter(
          (tier) => quantity >= tier.min_quantity
        );
        // O melhor tier é o de maior min_quantity atingido
        const bestTier =
          eligibleTiers.length > 0
            ? eligibleTiers[eligibleTiers.length - 1]
            : sortedTiers[0];
        // Encontrar o próximo tier
        const nextTier = sortedTiers.find(
          (tier) => quantity < tier.min_quantity
        );

        if (bestTier) {
          console.log(
            `✅ [recalculateItemPrices] ${product.name}: Aplicando tier '${bestTier.tier_name}' (qtd: ${bestTier.min_quantity}+): R$${bestTier.price}`
          );
          if (nextTier) {
            console.log(
              `➡️ [recalculateItemPrices] ${product.name}: Faltam ${
                nextTier.min_quantity - quantity
              } para '${nextTier.tier_name}' (R$${nextTier.price})`
            );
          }
          return {
            ...item,
            price: bestTier.price,
            isWholesalePrice: bestTier.tier_order > 1,
            currentTier: bestTier,
            nextTier: nextTier || null,
            nextTierQuantityNeeded: nextTier
              ? nextTier.min_quantity - quantity
              : null,
            nextTierPotentialSavings:
              nextTier && bestTier.price > nextTier.price
                ? bestTier.price - nextTier.price
                : null,
          };
        }
      }

      // Verificar preço atacado simples do produto (só se atacado gradativo estiver desativado)
      if (
        !product.enable_gradual_wholesale && // Só atacado simples se gradativo estiver desativado
        product.wholesale_price &&
        product.min_wholesale_qty &&
        quantity >= product.min_wholesale_qty
      ) {
        console.log(
          `✅ [recalculateItemPrices] ${product.name}: Aplicando preço atacado simples (qtd: ${product.min_wholesale_qty}+): R$${product.wholesale_price}`
        );
        return {
          ...item,
          price: product.wholesale_price,
          isWholesalePrice: true,
        };
      }

      // Usar preço original (varejo)
      console.log(
        `📋 [recalculateItemPrices] ${product.name}: Mantendo preço varejo: R$${item.originalPrice}`
      );
      return {
        ...item,
        price: item.originalPrice,
        isWholesalePrice: false,
      };
    });
  };

  // Carregar itens do localStorage com validação
  useEffect(() => {
    const loadCartFromStorage = () => {
      try {
        const savedItems = localStorage.getItem("cart-items");
        if (savedItems) {
          const parsedItems = JSON.parse(savedItems);

          if (Array.isArray(parsedItems)) {
            console.log("🛒 Carregando itens do carrinho:", parsedItems.length);

            // Validar e filtrar itens válidos
            const validItems = parsedItems
              .map(validateCartItem)
              .filter((item): item is CartItem => item !== null);

            console.log("✅ Itens válidos encontrados:", validItems.length);

            if (validItems.length !== parsedItems.length) {
              console.warn(
                "⚠️ Alguns itens do carrinho foram removidos por dados inválidos"
              );
              toast({
                title: "Carrinho atualizado",
                description:
                  "Alguns itens foram removidos devido a dados inconsistentes.",
                duration: 3000,
              });
            }

            // Recalcular preços ao carregar
            const recalculatedItems = recalculateItemPrices(validItems);
            setItems(recalculatedItems);
          } else {
            console.warn(
              "⚠️ Dados do carrinho em formato inválido, limpando localStorage"
            );
            localStorage.removeItem("cart-items");
          }
        }
      } catch (error) {
        console.error("❌ Erro ao carregar carrinho do localStorage:", error);
        localStorage.removeItem("cart-items");
        toast({
          title: "Erro no carrinho",
          description:
            "Houve um problema ao carregar seu carrinho. Ele foi resetado.",
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
      localStorage.setItem("cart-items", JSON.stringify(items));
    } catch (error) {
      console.error("❌ Erro ao salvar carrinho:", error);
    }
  }, [items]);

  // addItem agora recebe modelKey como parâmetro
  const addItem = (item: CartItem, modelKey?: CartPriceModelType) => {
    // Validar item antes de adicionar
    const validatedItem = validateCartItem(item);
    if (!validatedItem) {
      console.error(
        "❌ Tentativa de adicionar item inválido ao carrinho:",
        item
      );
      toast({
        title: "Erro",
        description: "Não foi possível adicionar este item ao carrinho.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const minQty =
      modelKey === "wholesale_only"
        ? validatedItem.product.min_wholesale_qty || 1
        : 1;

    // Se for wholesale_only, garantir quantidade mínima e preço de atacado
    if (modelKey === "wholesale_only") {
      validatedItem.quantity = Math.max(minQty, validatedItem.quantity);
      validatedItem.price = validatedItem.product.wholesale_price;
      validatedItem.originalPrice = validatedItem.product.wholesale_price;
    }

    // Buscar níveis de preço se não estiverem em cache
    if (!priceTiersCache[validatedItem.product.id]) {
      fetchProductTiers(validatedItem.product.id);
    }

    setItems((current) => {
      const existingIndex = current.findIndex(
        (cartItem) =>
          cartItem.product.id === validatedItem.product.id &&
          cartItem.catalogType === validatedItem.catalogType &&
          // Comparar variações incluindo IDs se disponíveis
          ((!cartItem.variation && !validatedItem.variation) ||
            (cartItem.variation &&
              validatedItem.variation &&
              cartItem.variation.id === validatedItem.variation.id &&
              cartItem.variation.color === validatedItem.variation.color &&
              cartItem.variation.size === validatedItem.variation.size))
      );

      let newItems;
      if (existingIndex >= 0) {
        newItems = [...current];
        // Se for wholesale_only, garantir que a soma nunca fique abaixo do mínimo
        if (validatedItem.product.price_model === "wholesale_only") {
          newItems[existingIndex].quantity = Math.max(
            validatedItem.product.min_wholesale_qty || 1,
            newItems[existingIndex].quantity + validatedItem.quantity
          );
        } else {
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + validatedItem.quantity,
          };
        }
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
        const savings =
          (itemWithWholesalePrice.originalPrice -
            itemWithWholesalePrice.price) *
          itemWithWholesalePrice.quantity;
        toast({
          title: "🎉 Preço de atacado ativado!",
          description: `Você economizou R$ ${savings.toFixed(2)} com ${
            itemWithWholesalePrice.product.name
          }`,
          duration: 4000,
        });
      } else {
        const variationText = item.variation
          ? ` (${[item.variation.color, item.variation.size]
              .filter(Boolean)
              .join(", ")})`
          : "";
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
    setItems((current) => {
      const newItems = current.filter((item) => item.id !== itemId);
      return recalculateItemPrices(newItems);
    });
  };

  // updateQuantity agora recebe modelKey como parâmetro
  const updateQuantity = (
    itemId: string,
    quantity: number,
    modelKey?: CartPriceModelType,
    minWholesaleQty?: number
  ) => {
    setItems((current) => {
      const item = current.find((i) => i.id === itemId);
      if (!item) return current;
      const minQty = modelKey === "wholesale_only" ? minWholesaleQty || 1 : 1;
      let newQuantity = Math.max(minQty, Math.floor(quantity));
      if (newQuantity <= 0) {
        return current.filter((i) => i.id !== itemId);
      }
      const newItems = current.map((i) =>
        i.id === itemId ? { ...i, quantity: newQuantity } : i
      );
      return recalculateItemPrices(newItems);
    });
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart-items");
  };

  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  const closeCart = () => {
    setIsOpen(false);
  };

  // Calcular valores com validação de segurança
  // LOG: Total do carrinho e detalhes dos itens
  const totalAmount = items.reduce((total, item) => {
    const itemPrice =
      typeof item.price === "number" && !isNaN(item.price) ? item.price : 0;
    const itemQuantity =
      typeof item.quantity === "number" && !isNaN(item.quantity)
        ? item.quantity
        : 0;
    const subtotal = itemPrice * itemQuantity;
    console.log(
      `💰 [useCart] Item ${
        item.product?.name
      }: ${itemQuantity} x R$${itemPrice} = R$${subtotal} | Tier: ${
        item.currentTier?.tier_name || "-"
      }`
    );
    return total + subtotal;
  }, 0);
  console.log(`🟩 [useCart] TOTAL calculado: R$${totalAmount}`);

  const totalItems = items.reduce((total, item) => {
    const itemQuantity =
      typeof item.quantity === "number" && !isNaN(item.quantity)
        ? item.quantity
        : 0;
    return total + itemQuantity;
  }, 0);

  console.log(`🛒 useCart totals: ${totalItems} items, R$${totalAmount}`);

  // Calcular economia potencial se todos os itens fossem comprados no atacado
  const potentialSavings = items.reduce((total, item) => {
    if (item.product.wholesale_price && !item.isWholesalePrice) {
      const originalPrice =
        typeof item.originalPrice === "number" ? item.originalPrice : 0;
      const wholesalePrice =
        typeof item.product.wholesale_price === "number"
          ? item.product.wholesale_price
          : 0;
      const quantity = typeof item.quantity === "number" ? item.quantity : 0;
      const possibleSavings = (originalPrice - wholesalePrice) * quantity;
      return total + Math.max(0, possibleSavings);
    }
    return total;
  }, 0);

  // Verificar se há itens que podem obter preço de atacado
  const canGetWholesalePrice = items.some(
    (item) =>
      item.product.wholesale_price &&
      item.product.min_wholesale_qty &&
      item.quantity < item.product.min_wholesale_qty
  );

  // Calcular quantos itens faltam para atingir preço de atacado
  const itemsToWholesale = items.reduce((total, item) => {
    if (
      item.product.min_wholesale_qty &&
      item.quantity < item.product.min_wholesale_qty
    ) {
      return total + (item.product.min_wholesale_qty - item.quantity);
    }
    return total;
  }, 0);

  // ✅ CALCULAR PROGRESSO DOS NÍVEIS DE PREÇO
  const calculateTierProgress = () => {
    const progress: {
      [productId: string]: {
        current: number;
        next: number | null;
        savings: number;
      };
    } = {};

    items.forEach((item) => {
      const tiers = priceTiersCache[item.product.id];
      if (!tiers || tiers.length === 0) return;

      // Ordenar níveis por quantidade mínima
      const sortedTiers = [...tiers].sort(
        (a, b) => a.min_quantity - b.min_quantity
      );

      // Encontrar nível atual
      const currentTier = sortedTiers.find(
        (tier) => item.quantity >= tier.min_quantity
      );
      const currentLevel = currentTier ? currentTier.tier_order : 1;

      // Encontrar próximo nível
      const nextTier = sortedTiers.find(
        (tier) => item.quantity < tier.min_quantity
      );
      const nextLevel = nextTier ? nextTier.tier_order : null;

      // Calcular economia potencial do próximo nível
      let potentialSavings = 0;
      if (nextTier) {
        const currentPrice = currentTier
          ? currentTier.price
          : item.originalPrice;
        potentialSavings = (currentPrice - nextTier.price) * item.quantity;
      }

      progress[item.product.id] = {
        current: currentLevel,
        next: nextLevel,
        savings: Math.max(0, potentialSavings),
      };
    });

    return progress;
  };

  // ✅ CALCULAR NÍVEL ATUAL DO CARRINHO
  const calculateCurrentTierLevel = () => {
    const progress = calculateTierProgress();
    const levels = Object.values(progress).map((p) => p.current);
    return levels.length > 0 ? Math.min(...levels) : 1;
  };

  // ✅ CALCULAR PRÓXIMO NÍVEL DISPONÍVEL
  const calculateNextTierLevel = () => {
    const progress = calculateTierProgress();
    const nextLevels = Object.values(progress)
      .map((p) => p.next)
      .filter((level) => level !== null);

    return nextLevels.length > 0 ? Math.min(...nextLevels) : null;
  };

  // ✅ CALCULAR ECONOMIA DO PRÓXIMO NÍVEL
  const calculateNextTierSavings = () => {
    const progress = calculateTierProgress();
    return Object.values(progress).reduce((total, p) => total + p.savings, 0);
  };

  // ✅ CALCULAR ITENS NECESSÁRIOS PARA PRÓXIMO NÍVEL
  const calculateItemsToNextTier = () => {
    let totalItemsNeeded = 0;

    items.forEach((item) => {
      const tiers = priceTiersCache[item.product.id];
      if (!tiers || tiers.length === 0) return;

      const sortedTiers = [...tiers].sort(
        (a, b) => a.min_quantity - b.min_quantity
      );
      const nextTier = sortedTiers.find(
        (tier) => item.quantity < tier.min_quantity
      );

      if (nextTier) {
        totalItemsNeeded += nextTier.min_quantity - item.quantity;
      }
    });

    return totalItemsNeeded;
  };

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
    itemsToWholesale,
    // ✅ NOVAS PROPRIEDADES PARA NÍVEIS DE PREÇO
    currentTierLevel: calculateCurrentTierLevel(),
    nextTierLevel: calculateNextTierLevel(),
    nextTierSavings: calculateNextTierSavings(),
    itemsToNextTier: calculateItemsToNextTier(),
    tierProgress: calculateTierProgress(),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
