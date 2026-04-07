import { useMemo } from "react";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { Product } from "@/types/product";

interface UseProductDisplayPriceProps {
  product: Product;
  catalogType?: "retail" | "wholesale";
  quantity?: number;
  variation?: any | null;
}

export const useProductDisplayPrice = ({
  product,
  catalogType = "retail",
  quantity = 1,
  variation = null,
}: UseProductDisplayPriceProps) => {
  const { priceModel, loading } = useStorePriceModel(product.store_id);

  return useMemo(() => {
    const modelKey = priceModel?.price_model || "retail_only";
    const adjustment = variation?.price_adjustment || 0;

    const baseRetail = product.retail_price || 0;
    const baseWholesale = product.wholesale_price || baseRetail;
    const currentRetail = Math.max(0, baseRetail + adjustment);
    const currentWholesale = (baseRetail > 0)
      ? Math.max(0, currentRetail * (baseWholesale / baseRetail))
      : Math.max(0, baseWholesale + adjustment);

    // 🔴 GRADE com grade_price dedicado: exibir diretamente esse valor
    // É o preço fixo da grade inteira, salvo no banco via Wizard.
    if (variation?.is_grade && (variation as any).grade_price && (variation as any).grade_price > 0) {
      const gradePrice = (variation as any).grade_price as number;
      const totalPairs = Array.isArray((variation as any).grade_pairs)
        ? ((variation as any).grade_pairs as number[]).reduce((s, p) => s + p, 0)
        : ((variation as any).grade_quantity as number) || 1;

      return {
        displayPrice: gradePrice,
        originalPrice: gradePrice,
        minQuantity: 1,
        isWholesaleOnly: catalogType === "wholesale",
        shouldShowRetailPrice: false,
        shouldShowWholesaleInfo: true,
        modelKey,
        retailPrice: gradePrice,
        wholesalePrice: gradePrice,
        minWholesaleQty: 1,
        isLoading: false,
        gradePrice,
        totalPairs,
        pricePerPair: totalPairs > 0 ? gradePrice / totalPairs : gradePrice,
      };
    }

    // Se ainda está carregando o modelo de preço, usar fallback baseado no catalogType
    if (loading) {
      // Para catálogo atacado, usar preço de atacado como fallback
      if (catalogType === "wholesale") {
        return {
          displayPrice: currentWholesale,
          originalPrice: currentWholesale,
          minQuantity: product.min_wholesale_qty || 1,
          isWholesaleOnly: true,
          shouldShowRetailPrice: false,
          shouldShowWholesaleInfo: true,
          modelKey: "wholesale_only",
          retailPrice: currentRetail,
          wholesalePrice: currentWholesale,
          minWholesaleQty: product.min_wholesale_qty || 1,
          isLoading: true,
        };
      }

      // Para catálogo varejo, usar preço de varejo como fallback
      return {
        displayPrice: currentRetail,
        originalPrice: currentRetail,
        minQuantity: 1,
        isWholesaleOnly: false,
        shouldShowRetailPrice: true,
        shouldShowWholesaleInfo: false,
        modelKey: "retail_only",
        retailPrice: currentRetail,
        wholesalePrice: currentWholesale,
        minWholesaleQty: product.min_wholesale_qty || 1,
        isLoading: true,
      };
    }

    // Para catálogo atacado, sempre usar wholesale_price como fallback
    if (catalogType === "wholesale") {
      // Para catálogo atacado, SEMPRE usar preço de atacado, mesmo que seja 0
      const displayPrice = currentWholesale;
      const minQuantity = product.min_wholesale_qty || 1;

      console.log(
        "🎯 [useProductDisplayPrice] Catálogo ATACADO - Usando preço de atacado (com ajuste):",
        {
          productName: product.name,
          wholesalePrice: product.wholesale_price,
          retailPrice: product.retail_price,
          adjustment,
          displayPrice,
          catalogType,
        }
      );

      return {
        displayPrice: currentWholesale,
        originalPrice: currentWholesale,
        minQuantity: minQuantity,
        isWholesaleOnly: true,
        shouldShowRetailPrice: false,
        shouldShowWholesaleInfo: true,
        modelKey: "wholesale_only",
        retailPrice: currentRetail,
        wholesalePrice: currentWholesale,
        minWholesaleQty: minQuantity,
        isLoading: false,
      };
    }

    // Para wholesale_only, sempre usar wholesale_price
    if (modelKey === "wholesale_only") {
      const minQuantity = product.min_wholesale_qty || 1;

      return {
        displayPrice: currentWholesale,
        originalPrice: currentWholesale,
        minQuantity,
        isWholesaleOnly: true,
        shouldShowRetailPrice: false,
        shouldShowWholesaleInfo: true,
        modelKey,
        retailPrice: currentRetail,
        wholesalePrice: currentWholesale,
        minWholesaleQty: minQuantity,
        isLoading: false,
      };
    }

    // Para retail_only, sempre usar retail_price
    if (modelKey === "retail_only") {
      return {
        displayPrice: currentRetail,
        originalPrice: currentRetail,
        minQuantity: 1,
        isWholesaleOnly: false,
        shouldShowRetailPrice: true,
        shouldShowWholesaleInfo: false,
        modelKey,
        retailPrice: currentRetail,
        wholesalePrice: currentWholesale,
        minWholesaleQty: product.min_wholesale_qty || 1,
        isLoading: false,
      };
    }

    // Para modelos mistos (simple_wholesale, gradual_wholesale)
    const retailPrice = currentRetail;
    const wholesalePrice = currentWholesale;
    const minWholesaleQty = product.min_wholesale_qty || 1;

    let displayPrice = retailPrice;
    let minQuantity = 1;

    // Se catálogo é atacado ou quantidade atinge mínimo (para modelos mistos)
    if (
      (catalogType as string) === "wholesale" ||
      quantity >= minWholesaleQty
    ) {
      displayPrice = wholesalePrice;
      minQuantity = minWholesaleQty;
    }

    const shouldShowRetailPrice = retailPrice > 0;
    const shouldShowWholesaleInfo =
      wholesalePrice > 0 && wholesalePrice !== retailPrice;

    return {
      displayPrice,
      originalPrice: retailPrice,
      minQuantity,
      isWholesaleOnly: false,
      shouldShowRetailPrice,
      shouldShowWholesaleInfo,
      modelKey,
      retailPrice,
      wholesalePrice,
      minWholesaleQty,
      isLoading: false,
    };
  }, [product, catalogType, quantity, priceModel]);
};
