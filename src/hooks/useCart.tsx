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
  // Suporte a grade flexível
  flexibleGradeMode?: 'full' | 'half' | 'custom';
  customGradeSelection?: {
    items: Array<{
      color: string;
      size: string;
      quantity: number;
    }>;
    totalPairs: number;
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
  // ✅ LOADING STATE
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Função para validar estrutura de item do carrinho
const validateCartItem = (item: any): CartItem | null => {
  try {
    if (!item || typeof item !== "object") return null;

    // Debug log para verificar store_id
    console.log("🔍 validateCartItem - Debug store_id:", {
      inputStoreId: item.product?.store_id,
      productName: item.product?.name,
      productId: item.product?.id,
      hasGradeInfo: !!item.gradeInfo,
      gradeInfo: item.gradeInfo,
      itemPrice: item.price,
    });

    // Verificar propriedades obrigatórias
    if (!item.id || !item.product || typeof item.quantity !== "number") {
      console.warn("⚠️ validateCartItem - Faltando id/product/quantity:", item);
      return null;
    }
    
    if (typeof item.price !== "number" || isNaN(item.price)) {
      console.warn("⚠️ validateCartItem - Preço inválido:", item.price);
      return null;
    }
    
    if (!item.product.id || !item.product.name) {
      console.warn("⚠️ validateCartItem - Faltando product.id/name:", item.product);
      return null;
    }
    
    // ⭐ RELAXAR para grades: retail_price pode ser 0 se for grade
    const isGrade = item.variation?.is_grade || item.gradeInfo;
    if (!isGrade && (
      typeof item.product.retail_price !== "number" ||
      isNaN(item.product.retail_price)
    )) {
      console.warn("⚠️ validateCartItem - retail_price inválido (não é grade):", item.product.retail_price);
      return null;
    }

    // Garantir que originalPrice existe e é válido
    const originalPrice =
      item.originalPrice || item.product.retail_price || item.price;
    if (typeof originalPrice !== "number" || isNaN(originalPrice)) return null;

    const validatedItem = {
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        retail_price: item.product.retail_price,
        wholesale_price: item.product.wholesale_price,
        min_wholesale_qty: item.product.min_wholesale_qty,
        image_url: item.product.image_url,
        store_id: item.product.store_id, // Adicionar store_id
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
      // Preservar gradeInfo original do cartHelpers.ts
      gradeInfo:
        item.gradeInfo ||
        (item.variation?.grade_name
          ? {
              name: item.variation.grade_name,
              sizes: item.variation.grade_sizes || [],
              pairs: item.variation.grade_pairs || [],
            }
          : undefined),
    };

    console.log("🔍 validateCartItem - Item validado:", {
      outputStoreId: validatedItem.product.store_id,
      productName: validatedItem.product.name,
      hasGradeInfo: !!validatedItem.gradeInfo,
      gradeInfo: validatedItem.gradeInfo,
      validatedPrice: validatedItem.price,
    });

    return validatedItem;
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
  const [isLoading, setIsLoading] = useState(true); // Loading state
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
    console.log(
      "🔄 [recalculateItemPrices] INICIANDO - Itens recebidos:",
      cartItems.length
    );

    return cartItems.map((item) => {
      const product = item.product;
      const quantity = item.quantity;

      // 🔴 NOVO: Se for uma grade com modo flexível (meia grade ou custom), não recalcular o preço
      // O preço já foi calculado corretamente no cartHelpers baseado no modo selecionado
      if (item.gradeInfo && item.variation?.is_grade) {
        // Se tem flexibleGradeMode diferente de 'full', preservar o preço calculado
        if (item.flexibleGradeMode && item.flexibleGradeMode !== 'full') {
          console.log(
            `📦 [recalculateItemPrices] ${product.name}: Mantendo preço de ${item.flexibleGradeMode === 'half' ? 'meia grade' : 'grade customizada'} (R$${item.price})`
          );
          return {
            ...item,
            // Manter o preço original calculado para meia grade/custom
            isWholesalePrice: item.catalogType === "wholesale",
            currentTier: undefined,
            nextTier: undefined,
            nextTierQuantityNeeded: undefined,
            nextTierPotentialSavings: undefined,
          };
        }
        
        // Para grade completa, também preservar o preço (já calculado corretamente)
        console.log(
          `📦 [recalculateItemPrices] ${product.name}: Mantendo preço da grade completa (R$${item.price})`
        );
        return {
          ...item,
          // Manter o preço original da grade
          isWholesalePrice: item.catalogType === "wholesale",
          currentTier: undefined,
          nextTier: undefined,
          nextTierQuantityNeeded: undefined,
          nextTierPotentialSavings: undefined,
        };
      }

      // Debug para verificar se gradeInfo está chegando
      console.log(
        `🔍 [recalculateItemPrices] ${product.name}: Debug gradeInfo:`,
        {
          hasGradeInfo: !!item.gradeInfo,
          gradeInfo: item.gradeInfo,
          hasVariation: !!item.variation,
          variationIsGrade: item.variation?.is_grade,
          itemPrice: item.price,
          itemKeys: Object.keys(item),
        }
      );

      // Se for catálogo atacado ou apenas atacado, sempre usar preço de atacado
      if (
        item.catalogType === "wholesale" ||
        product.price_model === "wholesale_only"
      ) {
        const wholesalePrice =
          product.wholesale_price || product.retail_price || 0;
        console.log(
          `✅ [recalculateItemPrices] ${product.name}: Aplicando preço atacado (catalogType: ${item.catalogType}, price_model: ${product.price_model}): R$${wholesalePrice}`
        );
        return {
          ...item,
          price: wholesalePrice,
          originalPrice: wholesalePrice,
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

      // 🔴 CORREÇÃO CRÍTICA: Separar lógica de modalidade da lógica de quantidade mínima
      // Se catalogType é "retail", SEMPRE usar preço varejo, independente da quantidade
      if (item.catalogType === "retail") {
        console.log(
          `📋 [recalculateItemPrices] ${product.name}: MODO VAREJO - Mantendo preço varejo (qtd: ${quantity}): R$${item.originalPrice}`
        );
        return {
          ...item,
          price: item.originalPrice,
          isWholesalePrice: false,
        };
      }

      // Se catalogType é "wholesale", aplicar regra de quantidade mínima
      // Verificar preço atacado simples do produto (só se atacado gradativo estiver desativado)
      if (
        item.catalogType === "wholesale" &&
        !product.enable_gradual_wholesale && // Só atacado simples se gradativo estiver desativado
        product.wholesale_price &&
        product.min_wholesale_qty &&
        quantity >= product.min_wholesale_qty
      ) {
        console.log(
          `✅ [recalculateItemPrices] ${product.name}: MODO ATACADO - Aplicando preço atacado simples (qtd: ${product.min_wholesale_qty}+): R$${product.wholesale_price}`
        );
        return {
          ...item,
          price: product.wholesale_price,
          isWholesalePrice: true,
        };
      }

      // Se modo atacado mas quantidade < mínima, usar preço varejo como fallback
      if (item.catalogType === "wholesale") {
        console.log(
          `⚠️ [recalculateItemPrices] ${product.name}: MODO ATACADO - Quantidade insuficiente (qtd: ${quantity}, mín: ${product.min_wholesale_qty || 1}), usando preço varejo: R$${item.originalPrice}`
        );
        return {
          ...item,
          price: item.originalPrice,
          isWholesalePrice: false,
        };
      }

      // Fallback: usar preço original (varejo)
      console.log(
        `📋 [recalculateItemPrices] ${product.name}: Fallback - Mantendo preço varejo: R$${item.originalPrice}`
      );
      return {
        ...item,
        price: item.originalPrice,
        isWholesalePrice: false,
      };
    });

    // Log final para verificar se os preços foram recalculados
    const finalItems = cartItems.map((item) => {
      const product = item.product;
      const quantity = item.quantity;

      // Se for catálogo atacado ou apenas atacado, sempre usar preço de atacado
      if (
        item.catalogType === "wholesale" ||
        product.price_model === "wholesale_only"
      ) {
        // Debug para verificar por que não está entrando na condição da grade
        console.log(
          `🔍 [recalculateItemPrices] ${product.name}: Debug grade:`,
          {
            hasGradeInfo: !!item.gradeInfo,
            hasVariation: !!item.variation,
            variationIsGrade: item.variation?.is_grade,
            gradeInfo: item.gradeInfo,
            variation: item.variation,
          }
        );

        // Para grades, preservar o preço já calculado
        if (item.gradeInfo && item.variation?.is_grade) {
          console.log(
            `📦 [recalculateItemPrices] ${product.name}: Preservando preço da grade (R$${item.price})`
          );
          return {
            ...item,
            isWholesalePrice: true,
            currentTier: undefined,
            nextTier: undefined,
            nextTierQuantityNeeded: undefined,
            nextTierPotentialSavings: undefined,
          };
        }

        const wholesalePrice =
          product.wholesale_price || product.retail_price || 0;
        return {
          ...item,
          price: wholesalePrice,
          originalPrice: wholesalePrice,
          isWholesalePrice: true,
          currentTier: undefined,
          nextTier: undefined,
          nextTierQuantityNeeded: undefined,
          nextTierPotentialSavings: undefined,
        };
      }
      return item;
    });

    console.log(
      "🔄 [recalculateItemPrices] FINALIZANDO - Itens recalculados:",
      finalItems.map((item) => ({
        name: item.product.name,
        price: item.price,
        catalogType: item.catalogType,
        isWholesalePrice: item.isWholesalePrice,
      }))
    );

    return finalItems;
  };

  // Carregar itens do localStorage com validação (APENAS UMA VEZ)
  useEffect(() => {
    const loadCartFromStorage = async () => {
      try {
        console.log("🔄 [useCart] loadCartFromStorage DISPARADO");
        setIsLoading(true); // Iniciar loading
        const savedItems = localStorage.getItem("cart-items");
        console.log("📦 [useCart] localStorage.getItem resultado:", savedItems ? `${savedItems.substring(0, 100)}...` : "NULL");
        
        if (savedItems) {
          const parsedItems = JSON.parse(savedItems);

          if (Array.isArray(parsedItems)) {
            console.log("🛒 Carregando itens do carrinho do localStorage:", parsedItems.length);
            console.log("📋 Items do localStorage (RAW):", parsedItems);

            // Validar e filtrar itens válidos
            const validationResults = parsedItems.map((item, index) => {
              const validated = validateCartItem(item);
              return {
                index,
                original: item,
                validated,
                isValid: validated !== null,
              };
            });

            const validItems = validationResults
              .filter(r => r.validated !== null)
              .map(r => r.validated!);

            console.log("✅ Itens válidos encontrados:", validItems.length);
            console.log("📊 Resultado da validação:", validationResults.map(r => ({
              index: r.index,
              productName: r.original.product?.name,
              isValid: r.isValid,
              failedReason: !r.isValid ? "Ver logs acima de validateCartItem" : "OK",
            })));

            // ⭐ SÓ mostrar aviso se realmente removeu itens
            const removedCount = parsedItems.length - validItems.length;
            if (removedCount > 0) {
              const removedItems = validationResults.filter(r => !r.isValid);
              console.error(
                `❌ ${removedCount} itens REMOVIDOS por validação:`,
                removedItems.map(r => ({
                  productName: r.original.product?.name,
                  productId: r.original.product?.id,
                  price: r.original.price,
                  quantity: r.original.quantity,
                  hasGradeInfo: !!r.original.gradeInfo,
                  variation: r.original.variation,
                }))
              );
              
              // NÃO mostrar toast se for apenas 1 item e for validação normal
              // Evita spam de mensagens
              if (removedCount > 1 || parsedItems.length > 2) {
                toast({
                  title: "Carrinho atualizado",
                  description: `${removedCount} item${removedCount > 1 ? 'ns foram removidos' : ' foi removido'} por dados inconsistentes.`,
                  duration: 3000,
                });
              }
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
      } finally {
        setIsLoading(false); // Finalizar loading
      }
    };

    loadCartFromStorage();
  }, []); // ⭐ VAZIO - Carregar APENAS na montagem inicial do CartProvider

  // Salvar no localStorage sempre que items mudarem
  useEffect(() => {
    // ⚠️ IMPORTANTE: Não salvar array vazio no primeiro render
    // Isso evita sobrescrever carrinho existente antes de carregar do localStorage
    if (isLoading) {
      console.log("⏸️ [useCart] Aguardando carregamento do localStorage, não salvando ainda...");
      return;
    }

    try {
      console.log("💾 [useCart] Salvando items no localStorage:", {
        itemsCount: items.length,
        items: items.map(i => ({
          productName: i.product.name,
          quantity: i.quantity,
          price: i.price,
        })),
      });
      localStorage.setItem("cart-items", JSON.stringify(items));
      console.log("✅ [useCart] Items salvos no localStorage com sucesso!");
      
      // Verificar imediatamente se salvou
      const verify = localStorage.getItem("cart-items");
      console.log("🔍 [useCart] Verificação: localStorage tem", verify ? JSON.parse(verify).length : 0, "itens");
    } catch (error) {
      console.error("❌ Erro ao salvar carrinho:", error);
    }
  }, [items, isLoading]);

  // addItem agora recebe modelKey como parâmetro
  const addItem = (item: CartItem, modelKey?: CartPriceModelType) => {
    console.log("🔄 [addItem] Item recebido:", {
      itemId: item.id,
      itemPrice: item.price,
      hasGradeInfo: !!item.gradeInfo,
      gradeInfo: item.gradeInfo,
      hasVariation: !!item.variation,
      variationIsGrade: item.variation?.is_grade,
    });

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

    console.log("🔄 [addItem] Item validado:", {
      validatedId: validatedItem.id,
      validatedPrice: validatedItem.price,
      hasGradeInfo: !!validatedItem.gradeInfo,
      gradeInfo: validatedItem.gradeInfo,
      variationIsGrade: validatedItem.variation?.is_grade,
    });

    const minQty =
      modelKey === "wholesale_only"
        ? validatedItem.product.min_wholesale_qty || 1
        : 1;

    // Se for wholesale_only, garantir quantidade mínima e preço de atacado
    // MAS não sobrescrever preço de grades (já calculado corretamente)
    if (modelKey === "wholesale_only") {
      validatedItem.quantity = Math.max(minQty, validatedItem.quantity);

      // Não sobrescrever preço se for uma grade (já foi calculado corretamente no cartHelpers)
      if (!validatedItem.gradeInfo || !validatedItem.variation?.is_grade) {
        validatedItem.price = validatedItem.product.wholesale_price;
        validatedItem.originalPrice = validatedItem.product.wholesale_price;
      } else {
        console.log("🔄 [addItem] Preservando preço da grade:", {
          gradePrice: validatedItem.price,
          wholesalePrice: validatedItem.product.wholesale_price,
        });
      }
    }

    console.log("🔄 [addItem] Item final antes de adicionar:", {
      finalPrice: validatedItem.price,
      hasGradeInfo: !!validatedItem.gradeInfo,
      gradeInfo: validatedItem.gradeInfo,
    });

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
      console.log("🔄 [addItem] ANTES do recalculateItemPrices:", {
        newItemsCount: newItems.length,
        newItems: newItems.map((item) => ({
          name: item.product.name,
          price: item.price,
          catalogType: item.catalogType,
          isWholesalePrice: item.isWholesalePrice,
          hasGradeInfo: !!item.gradeInfo,
          gradeInfo: item.gradeInfo,
        })),
      });

      const recalculatedItems = recalculateItemPrices(newItems);

      console.log("🔄 [addItem] DEPOIS do recalculateItemPrices:", {
        recalculatedItemsCount: recalculatedItems.length,
        recalculatedItems: recalculatedItems.map((item) => ({
          name: item.product.name,
          price: item.price,
          catalogType: item.catalogType,
          isWholesalePrice: item.isWholesalePrice,
          hasGradeInfo: !!item.gradeInfo,
          gradeInfo: item.gradeInfo,
        })),
      });

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
  console.log("🛒 [useCart] DEBUG - Itens antes do cálculo:", {
    itemsCount: items.length,
    items: items.map((item) => ({
      id: item.id,
      name: item.product?.name,
      price: item.price,
      quantity: item.quantity,
      catalogType: item.catalogType,
      isWholesalePrice: item.isWholesalePrice,
      originalPrice: item.originalPrice,
      productWholesalePrice: item.product?.wholesale_price,
      productRetailPrice: item.product?.retail_price,
    })),
  });

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
    // ✅ LOADING STATE
    isLoading,
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
