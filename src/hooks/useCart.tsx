import { useState, useEffect, createContext, useContext, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { ProductVariation } from "@/types/variation";
import { usePriceCalculation } from "./usePriceCalculation";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { useCatalogStoreId } from "@/contexts/CatalogStoreIdContext";

export interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    description?: string; // Descrição para exibir no resumo de pedido
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

/** Garante que todo item tenha product.store_id (usa o primeiro da lista ou fallback) */
function normalizeCartItemsStoreId(
  cartItems: CartItem[],
  fallbackStoreId?: string
): CartItem[] {
  const firstStoreId =
    cartItems.find((i) => i.product?.store_id)?.product?.store_id ??
    fallbackStoreId;
  if (!firstStoreId) return cartItems;
  return cartItems.map((item) =>
    item.product?.store_id
      ? item
      : {
        ...item,
        product: { ...item.product, store_id: firstStoreId },
      }
  );
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const { toast } = useToast();
  const catalogStoreId = useCatalogStoreId()?.storeId;
  const storeIdForModel = catalogStoreId || items[0]?.product?.store_id;
  const { priceModel } = useStorePriceModel(storeIdForModel);

  // Cache para níveis de preço
  const [priceTiersCache, setPriceTiersCache] = useState<Record<string, any[]>>(
    {}
  );

  // Cache para modelos de preço das lojas
  const [priceModelCache, setPriceModelCache] = useState<Record<string, any>>(
    {}
  );

  // Função para buscar modelo de preço de uma loja
  const fetchStorePriceModel = async (storeId: string, skipCache = false) => {
    if (!storeId) return null;

    if (!skipCache && priceModelCache[storeId]) {
      return priceModelCache[storeId];
    }

    try {
      const { supabase } = await import("../integrations/supabase/client");
      type Row = {
        id: string;
        store_id: string;
        price_model: string;
        simple_wholesale_min_qty?: number;
        simple_wholesale_by_cart_total?: boolean;
        simple_wholesale_cart_min_qty?: number;
      };
      const client = supabase as unknown as {
        from: (t: string) => { select: (c: string) => { eq: (col: string, val: string) => { limit: (n: number) => Promise<{ data: Row[] | null; error: unknown }> } } };
      };
      const res = await client
        .from("store_price_models")
        .select("id, store_id, price_model, simple_wholesale_min_qty, simple_wholesale_by_cart_total, simple_wholesale_cart_min_qty")
        .eq("store_id", storeId)
        .limit(1);
      if (res.error || !res.data || res.data.length === 0) return null;
      const priceModel = res.data[0];
      setPriceModelCache((prev) => ({ ...prev, [storeId]: priceModel }));
      return priceModel;
    } catch (error) {
      console.error("Erro ao buscar modelo de preço:", error);
    }
    return null;
  };

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
  const recalculateItemPrices = async (cartItems: CartItem[], options?: { skipCache?: boolean }): Promise<CartItem[]> => {
    const skipCache = options?.skipCache ?? false;
    console.log(
      "🔄 [recalculateItemPrices] INICIANDO - Itens recebidos:",
      cartItems.length
    );

    // Normalizar store_id: se nenhum item tem, usar catalogStoreId como fallback
    const itemsWithStore = cartItems.map((item) => {
      const sid = item.product?.store_id ?? catalogStoreId;
      if (!sid) return item;
      return item.product?.store_id ? item : { ...item, product: { ...item.product, store_id: sid } };
    });

    let storeIds = [...new Set(itemsWithStore.map(item => item.product?.store_id ?? catalogStoreId).filter(Boolean))] as string[];
    if (storeIds.length === 0 && catalogStoreId) {
      storeIds = [catalogStoreId];
      console.log("🔄 [recalculateItemPrices] Usando catalogStoreId como fallback:", catalogStoreId);
    }
    if (storeIds.length === 0) {
      console.warn("⚠️ [recalculateItemPrices] Nenhum item tem product.store_id e catalogStoreId indisponível.");
    }
    const fetchedModels = await Promise.all(storeIds.map(sid => fetchStorePriceModel(sid, skipCache)));
    type PriceModelRow = {
      id: string;
      store_id: string;
      price_model: string;
      simple_wholesale_min_qty?: number;
      simple_wholesale_by_cart_total?: boolean;
      simple_wholesale_cart_min_qty?: number;
    };
    const modelByStoreId: Record<string, PriceModelRow | null> = {};
    storeIds.forEach((id, i) => { modelByStoreId[id] = fetchedModels[i]; });

    // Total de unidades por loja (soma de TODOS os itens da loja)
    const totalUnitsByStore: Record<string, number> = {};
    storeIds.forEach((id) => {
      totalUnitsByStore[id] = itemsWithStore
        .filter((item) => (item.product?.store_id ?? catalogStoreId) === id)
        .reduce((sum, i) => sum + (typeof i.quantity === "number" && !isNaN(i.quantity) ? i.quantity : 0), 0);
    });
    console.log("🔄 [recalculateItemPrices] Modelos e totais por loja:", {
      storeIds,
      hasModels: storeIds.map((id) => !!modelByStoreId[id]),
      totalUnitsByStore,
    });

    const recalculatedItems = itemsWithStore.map((item) => {
      const product = item.product;
      const quantity = typeof item.quantity === "number" && !isNaN(item.quantity) ? item.quantity : 0;
      const storeId = product?.store_id ?? catalogStoreId ?? undefined;

      // Usar modelo buscado nesta execução (não o cache do estado)
      const priceModel = storeId ? modelByStoreId[storeId] : null;
      const priceModelType = priceModel?.price_model || product.price_model;

      // 🐛 DEBUG: Log detalhado para entender o fluxo
      console.log(`🔍 [recalculateItemPrices] Processando ${product.name}:`, {
        storeId,
        priceModelType,
        priceModel: priceModel ? { ...priceModel } : null,
        quantity,
        catalogType: item.catalogType,
        enable_gradual_wholesale: product.enable_gradual_wholesale,
        wholesale_price: product.wholesale_price,
        min_wholesale_qty: product.min_wholesale_qty,
        retail_price: product.retail_price,
        itemPriceAtual: item.price,
        originalPrice: item.originalPrice,
        hasGradeInfo: !!item.gradeInfo,
      });

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

      // Se for catálogo atacado ou apenas atacado, sempre usar preço de atacado
      // MAS: se tiver atacado gradativo ativo, deixar a lógica de tiers processar primeiro
      if (
        (item.catalogType === "wholesale" || priceModelType === "wholesale_only") &&
        !product.enable_gradual_wholesale // Só aplicar diretamente se não tiver gradativo
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
              `➡️ [recalculateItemPrices] ${product.name}: Faltam ${nextTier.min_quantity - quantity
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

      // 🎯 CORRIGIDO: Verificar se é simple_wholesale e aplicar a regra correta
      if (
        priceModelType === "simple_wholesale" &&
        !product.enable_gradual_wholesale &&
        product.wholesale_price
      ) {
        const isByCartTotal = priceModel?.simple_wholesale_by_cart_total === true;
        const cartMinQty = priceModel?.simple_wholesale_cart_min_qty ?? 10;
        const totalUnitsInCart = storeId ? (totalUnitsByStore[storeId] ?? 0) : 0;
        const minQtyForProduct = product.min_wholesale_qty ?? priceModel?.simple_wholesale_min_qty ?? 10;

        console.log(`🔍 [recalculateItemPrices] ${product.name} - Verificando atacado:`, {
          priceModelType,
          isByCartTotal,
          cartMinQty,
          totalUnitsInCart,
          productMinQty: product.min_wholesale_qty,
          modelMinQty: priceModel?.simple_wholesale_min_qty,
          minQtyForProduct,
          quantity,
          storeId,
        });

        // Opção 1: Por carrinho (total de unidades)
        if (isByCartTotal && storeId && totalUnitsInCart >= cartMinQty) {
          console.log(
            `✅ [recalculateItemPrices] ${product.name}: SIMPLE_WHOLESALE (por carrinho) - Total loja: ${totalUnitsInCart} >= ${cartMinQty}: R$${product.wholesale_price}`
          );
          return {
            ...item,
            price: product.wholesale_price,
            isWholesalePrice: true,
          };
        }

        // Opção 2: Por produto (quantidade individual)
        if (!isByCartTotal && quantity >= minQtyForProduct) {
          console.log(
            `✅ [recalculateItemPrices] ${product.name}: SIMPLE_WHOLESALE (por produto) - qtd: ${quantity} >= ${minQtyForProduct}: R$${product.wholesale_price}`
          );
          return {
            ...item,
            price: product.wholesale_price,
            isWholesalePrice: true,
          };
        }

        // Se não atingiu nenhum mínimo, usar varejo
        console.log(
          `⚠️ [recalculateItemPrices] ${product.name}: SIMPLE_WHOLESALE - Não atingiu mínimo (por ${isByCartTotal ? 'carrinho' : 'produto'}), usando varejo: R$${item.originalPrice}`
        );
        return {
          ...item,
          price: item.originalPrice,
          isWholesalePrice: false,
        };
      }

      // Se catalogType é "retail" e não é simple_wholesale, usar preço varejo
      if (item.catalogType === "retail" && priceModelType !== "simple_wholesale") {
        console.log(
          `📋 [recalculateItemPrices] ${product.name}: MODO VAREJO - Mantendo preço varejo (qtd: ${quantity}): R$${item.originalPrice}`
        );
        return {
          ...item,
          price: item.originalPrice,
          isWholesalePrice: false,
        };
      }

      // Se catalogType é "wholesale" (mas não é wholesale_only), aplicar regra de quantidade mínima
      // Verificar preço atacado simples do produto (só se atacado gradativo estiver desativado)
      if (
        item.catalogType === "wholesale" &&
        priceModelType !== "wholesale_only" && // Não é wholesale_only
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

      // Nota: A lógica de simple_wholesale já foi tratada acima (por produto ou por carrinho)

      // Se modo atacado mas quantidade < mínima (e não é wholesale_only), usar preço varejo como fallback
      if (
        item.catalogType === "wholesale" &&
        priceModelType !== "wholesale_only"
      ) {
        console.log(
          `⚠️ [recalculateItemPrices] ${product.name}: MODO ATACADO - Quantidade insuficiente (qtd: ${quantity}, mín: ${product.min_wholesale_qty || 1}), usando preço varejo: R$${item.originalPrice}`
        );
        return {
          ...item,
          price: item.originalPrice,
          isWholesalePrice: false,
        };
      }

      // Se é wholesale_only mas não entrou na condição anterior (porque tem gradativo), aplicar preço de atacado diretamente
      if (priceModelType === "wholesale_only") {
        const wholesalePrice =
          product.wholesale_price || product.retail_price || 0;
        console.log(
          `✅ [recalculateItemPrices] ${product.name}: WHOLESALE_ONLY - Aplicando preço atacado: R$${wholesalePrice}`
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

      // Fallback: usar preço original (varejo)
      const isByCartTotalFallback = priceModel?.simple_wholesale_by_cart_total === true;
      console.warn(
        `⚠️ [recalculateItemPrices] ${product.name}: FALLBACK - Nenhuma condição aplicou atacado! Mantendo preço varejo: R$${item.originalPrice}`,
        {
          priceModelType,
          catalogType: item.catalogType,
          enable_gradual_wholesale: product.enable_gradual_wholesale,
          wholesale_price: product.wholesale_price,
          min_wholesale_qty: product.min_wholesale_qty,
          quantity,
          isByCartTotal: isByCartTotalFallback,
          hasTiers: !!(product.enable_gradual_wholesale && priceTiersCache[product.id]),
        }
      );
      return {
        ...item,
        price: item.originalPrice,
        isWholesalePrice: false,
      };
    });

    console.log(
      "🔄 [recalculateItemPrices] FINALIZANDO - Itens recalculados:",
      recalculatedItems.map((item) => ({
        name: item.product.name,
        price: item.price,
        catalogType: item.catalogType,
        isWholesalePrice: item.isWholesalePrice,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }))
    );

    return recalculatedItems;
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

            let validItems = validationResults
              .filter(r => r.validated !== null)
              .map(r => r.validated!);

            // Garantir store_id em todos os itens (para recalculateItemPrices aplicar atacado)
            const firstStoreId = validItems.find((i) => i.product?.store_id)?.product?.store_id;
            if (firstStoreId) {
              validItems = validItems.map((i) => ({
                ...i,
                product: {
                  ...i.product,
                  store_id: i.product?.store_id || firstStoreId,
                },
              }));
            }

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
            const recalculatedItems = await recalculateItemPrices(validItems);
            setItems(normalizeCartItemsStoreId(recalculatedItems, catalogStoreId));
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

  // Quando o catálogo informa storeId: normalizar e recalcular preços (corrige total atacado)
  const prevCatalogStoreIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (isLoading || items.length === 0 || !catalogStoreId) return;
    const hasMissing = items.some((i) => !i.product?.store_id);
    const catalogJustLoaded = prevCatalogStoreIdRef.current === undefined;
    prevCatalogStoreIdRef.current = catalogStoreId;

    // Recalcular quando: (1) há itens sem store_id, ou (2) catalogStoreId acabou de ficar disponível
    const shouldRecalc = hasMissing || catalogJustLoaded;
    if (!shouldRecalc) return;

    const toRecalc = normalizeCartItemsStoreId(items, catalogStoreId);
    recalculateItemPrices(toRecalc, { skipCache: true }).then((rec) =>
      setItems(normalizeCartItemsStoreId(rec, catalogStoreId))
    );
  }, [catalogStoreId, isLoading, items]);

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
  const addItem = async (item: CartItem, modelKey?: CartPriceModelType) => {
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

    const currentItems = items;
    const existingIndex = currentItems.findIndex(
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
      newItems = [...currentItems];
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
      newItems = [...currentItems, validatedItem];
    }

    // Garantir store_id em todos os itens ANTES de recalcular (para aplicar atacado corretamente)
    const itemsToRecalc = normalizeCartItemsStoreId(newItems);
    console.log("🔄 [addItem] ANTES do recalculateItemPrices:", {
      newItemsCount: itemsToRecalc.length,
      newItems: itemsToRecalc.map((item) => ({
        name: item.product.name,
        price: item.price,
        store_id: item.product?.store_id,
        catalogType: item.catalogType,
        isWholesalePrice: item.isWholesalePrice,
        hasGradeInfo: !!item.gradeInfo,
        gradeInfo: item.gradeInfo,
      })),
    });

    const recalculatedItems = await recalculateItemPrices(itemsToRecalc);

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
        description: `Você economizou R$ ${savings.toFixed(2)} com ${itemWithWholesalePrice.product.name
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

    setItems(normalizeCartItemsStoreId(recalculatedItems, catalogStoreId));
  };

  const removeItem = async (itemId: string) => {
    const currentItems = items;
    const newItems = currentItems.filter((item) => item.id !== itemId);
    const recalculatedItems = await recalculateItemPrices(newItems);
    setItems(normalizeCartItemsStoreId(recalculatedItems, catalogStoreId));
  };

  // updateQuantity agora recebe modelKey como parâmetro
  const updateQuantity = async (
    itemId: string,
    quantity: number,
    modelKey?: CartPriceModelType,
    minWholesaleQty?: number
  ) => {
    const currentItems = items;
    const item = currentItems.find((i) => i.id === itemId);
    if (!item) return;
    const minQty = modelKey === "wholesale_only" ? minWholesaleQty || 1 : 1;
    let newQuantity = Math.max(minQty, Math.floor(quantity));
    if (newQuantity <= 0) {
      const newItems = currentItems.filter((i) => i.id !== itemId);
      const itemsToRecalc = normalizeCartItemsStoreId(newItems, catalogStoreId);
      const recalculatedItems = await recalculateItemPrices(itemsToRecalc);
      setItems(normalizeCartItemsStoreId(recalculatedItems, catalogStoreId));
      return;
    }
    const newItems = currentItems.map((i) =>
      i.id === itemId ? { ...i, quantity: newQuantity } : i
    );
    const itemsToRecalc = normalizeCartItemsStoreId(newItems, catalogStoreId);
    const recalculatedItems = await recalculateItemPrices(itemsToRecalc);
    setItems(normalizeCartItemsStoreId(recalculatedItems, catalogStoreId));
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

  // Total SEMPRE com base em item.price (preço já recalculado por recalculateItemPrices)
  const totalAmount = useMemo(() => {
    const totalUnitsInCart = items.reduce((s, i) => s + (typeof i.quantity === "number" && !isNaN(i.quantity) ? i.quantity : 0), 0);
    const modelType = priceModel?.price_model;
    const isByCartTotal = priceModel?.simple_wholesale_by_cart_total === true;
    const cartMinQty = priceModel?.simple_wholesale_cart_min_qty ?? 10;
    const getEffectiveUnitPrice = (it: CartItem): number => {
      const q = typeof it.quantity === "number" && !isNaN(it.quantity) ? it.quantity : 0;
      const ret = it.product?.retail_price ?? it.originalPrice ?? 0;
      const whl = it.product?.wholesale_price;
      const minQ = it.product?.min_wholesale_qty ?? priceModel?.simple_wholesale_min_qty ?? 10;
      if (it.gradeInfo && it.variation?.is_grade) return typeof it.price === "number" && !isNaN(it.price) ? it.price : ret;
      if (modelType === "wholesale_only" && whl) return whl;
      if (modelType === "retail_only") return ret;
      if (modelType === "simple_wholesale" && whl) {
        if (isByCartTotal && totalUnitsInCart >= cartMinQty) return whl;
        if (!isByCartTotal && q >= minQ) return whl;
      }
      if (modelType === "gradual_wholesale" && it.currentTier?.price != null) return it.currentTier.price;
      return typeof it.price === "number" && !isNaN(it.price) ? it.price : ret;
    };
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
        hasGradeInfo: !!item.gradeInfo,
        currentTier: item.currentTier?.tier_name,
      })),
    });

    const calculatedTotal = items.reduce((total, item) => {
      const itemPrice = getEffectiveUnitPrice(item);
      const itemQuantity =
        typeof item.quantity === "number" && !isNaN(item.quantity)
          ? item.quantity
          : 0;

      // 🔴 CORREÇÃO: Para grades, o item.price já é o preço total da grade
      // Multiplicar pela quantidade de grades adicionadas
      let subtotal: number;
      if (item.gradeInfo && item.variation?.is_grade) {
        // Para grades: item.price já é o total de uma grade, multiplicar pela quantidade de grades
        subtotal = itemPrice * itemQuantity;
        console.log(
          `💰 [useCart] Grade ${item.product?.name
          }: ${itemQuantity} grade(s) x R$${itemPrice} (preço total da grade) = R$${subtotal}`
        );
      } else {
        // Para produtos normais: multiplicar preço unitário pela quantidade
        // O item.price já deve estar atualizado com o preço correto (varejo ou atacado)
        subtotal = itemPrice * itemQuantity;

        // Verificar se o preço está correto comparando com o preço esperado
        const expectedPrice = item.isWholesalePrice
          ? (item.product?.wholesale_price || item.originalPrice)
          : (item.originalPrice || item.product?.retail_price || 0);

        if (Math.abs(itemPrice - expectedPrice) > 0.01) {
          console.warn(
            `⚠️ [useCart] PREÇO DESATUALIZADO para ${item.product?.name}:`,
            {
              itemPrice,
              expectedPrice,
              isWholesalePrice: item.isWholesalePrice,
              catalogType: item.catalogType,
              quantity: itemQuantity,
              minWholesaleQty: item.product?.min_wholesale_qty,
            }
          );
        }

        console.log(
          `💰 [useCart] Item ${item.product?.name
          }: ${itemQuantity} x R$${itemPrice} = R$${subtotal} | Tier: ${item.currentTier?.tier_name || "-"
          } | isWholesale: ${item.isWholesalePrice || false} | expectedPrice: R$${expectedPrice}`
        );
      }

      return total + subtotal;
    }, 0);

    console.log(`🟩 [useCart] TOTAL calculado: R$${calculatedTotal}`);

    return calculatedTotal;
  }, [items, priceModel]); // Recalcular quando items ou priceModel mudar

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
