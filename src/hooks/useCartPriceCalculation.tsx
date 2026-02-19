import { useMemo } from "react";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { useCart } from "@/hooks/useCart";
import { useCurrentStoreId } from "@/contexts/CurrentStoreIdContext";

interface CartItem {
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
  };
  quantity: number;
  price: number;
  originalPrice: number;
  variation?: any;
  catalogType: string;
  gradeInfo?: {
    name: string;
    sizes: string[];
    pairs: number[];
  };
}

interface PriceCalculationResult {
  total: number;
  savings: number;
  formattedTotal: string;
  formattedSavings: string;
  currentTier: {
    tier_name: string;
    price: number;
  };
  nextTierHint?: {
    quantityNeeded: number;
    potentialSavings: number;
    /** Quando true, refere-se ao total de unidades no carrinho (atacado por carrinho) */
    byCartTotal?: boolean;
  };
  priceModel?: string;
}

export const useCartPriceCalculation = (
  item: CartItem
): PriceCalculationResult => {
  const { items } = useCart();
  const currentStoreId = useCurrentStoreId();
  const storeId =
    item.product?.store_id ??
    items.find((i) => i.product?.store_id)?.product?.store_id ??
    currentStoreId;
  const { priceModel, loading } = useStorePriceModel(storeId);

  return useMemo(() => {
    // Se ainda está carregando ou não tem modelo, não calcula nada
    if (loading || !priceModel) {
      return {
        total: 0,
        savings: 0,
        formattedTotal: "",
        formattedSavings: "",
        currentTier: null,
        nextTierHint: undefined,
        priceModel: null,
      };
    }

    const quantity = item.quantity;
    const retailPrice = item.product.retail_price;
    const wholesalePrice = item.product.wholesale_price;
    const minWholesaleQty = item.product.min_wholesale_qty || 1;

    let finalPrice = retailPrice;
    let currentTierName = "Varejo";
    let savings = 0;
    let nextTierHint:
      | { quantityNeeded: number; potentialSavings: number }
      | undefined;

    // O modelo de preço SEMPRE vem da loja
    const modelType = priceModel.price_model;

    // Debug logs para verificar o modelo sendo usado
    console.log("🔍 useCartPriceCalculation: Debug dados:", {
      storeId: item.product.store_id,
      productName: item.product.name,
      priceModel: priceModel,
      priceModelType: priceModel?.price_model,
      retailPrice,
      wholesalePrice,
      quantity,
      // Debug específico para grade
      hasGradeInfo: !!item.gradeInfo,
      gradeInfo: item.gradeInfo,
      hasVariation: !!item.variation,
      variationIsGrade: item.variation?.is_grade,
      itemPrice: item.price,
    });

    console.log(
      "🔍 useCartPriceCalculation: Modelo final sendo usado:",
      modelType
    );

    switch (modelType) {
      case "retail_only":
        // Apenas varejo - usar sempre o preço de varejo
        finalPrice = retailPrice;
        currentTierName = "Varejo";
        break;

      case "wholesale_only":
        // Apenas atacado - usar sempre o preço de atacado
        finalPrice = wholesalePrice || retailPrice;
        currentTierName = "Atacado";
        savings = 0; // Não mostrar economia para wholesale_only
        break;

      case "simple_wholesale": {
        const totalUnitsInCart = items.reduce((s, i) => s + (typeof i.quantity === "number" ? i.quantity : 0), 0);
        const isByCartTotal = priceModel.simple_wholesale_by_cart_total === true;
        const cartMinQty = priceModel.simple_wholesale_cart_min_qty ?? 10;
        const minQtyProduct = item.product.min_wholesale_qty ?? priceModel.simple_wholesale_min_qty ?? 10;
        const qualifiesWholesale = wholesalePrice && (
          (isByCartTotal && totalUnitsInCart >= cartMinQty) ||
          (!isByCartTotal && quantity >= minQtyProduct)
        );
        if (qualifiesWholesale) {
          finalPrice = wholesalePrice!;
          currentTierName = "Atacado";
          savings = (retailPrice - wholesalePrice) * quantity;
        } else {
          finalPrice = retailPrice;
          currentTierName = "Varejo";

          // Dica para próximo nível
          const neededQty = isByCartTotal ? Math.max(0, cartMinQty - totalUnitsInCart) : Math.max(0, minQtyProduct - quantity);
          if (wholesalePrice && neededQty > 0) {
            const potentialSavings = isByCartTotal
              ? (retailPrice - wholesalePrice) * quantity
              : (retailPrice - wholesalePrice) * neededQty;
            nextTierHint = { quantityNeeded: neededQty, potentialSavings, byCartTotal: isByCartTotal };
          }
        }
        break;
      }

      case "gradual_wholesale":
        // Para gradativo, usar preço exato do item calculado (já vem correto do carrinho)
        finalPrice = item.price || retailPrice;

        // Determinar nível baseado no preço final vs preço de varejo
        if (finalPrice < retailPrice) {
          if (wholesalePrice && finalPrice <= wholesalePrice) {
            currentTierName = priceModel?.simple_wholesale_name || "Atacado";
          } else {
            currentTierName = "Atacarejo";
          }
          savings = (retailPrice - finalPrice) * quantity;
        } else {
          currentTierName = "Varejo";
        }

        // Dica para próximo nível no gradativo
        if (wholesalePrice && quantity < minWholesaleQty) {
          const neededQty = minWholesaleQty - quantity;
          const potentialSavings =
            (retailPrice - wholesalePrice) * minWholesaleQty;
          nextTierHint = {
            quantityNeeded: neededQty,
            potentialSavings,
          };
        }
        break;

      default:
        // Fallback para usar o preço do item se disponível, senão varejo
        finalPrice = item.price || retailPrice;
        currentTierName = "Varejo";
    }

    // Validar finalPrice para evitar valores inválidos
    if (!finalPrice || finalPrice <= 0) {
      finalPrice = retailPrice || 0;
    }

    // Para grades, usar o preço já calculado (não multiplicar por quantidade)
    // Para produtos normais, multiplicar preço unitário por quantidade
    let total;
    if (item.gradeInfo && item.variation?.is_grade) {
      // Para grades, o preço já é o total da grade
      total = item.price || finalPrice;
    } else {
      // Para produtos normais, multiplicar preço unitário por quantidade
      total = finalPrice * quantity;
    }

    return {
      total,
      savings,
      formattedTotal: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(total),
      formattedSavings: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(savings),
      currentTier: {
        tier_name: currentTierName,
        price: finalPrice,
      },
      nextTierHint,
      priceModel: modelType, // Adicionar modelo de preço para uso nos componentes
    };
  }, [item, priceModel, loading, items]);
};
