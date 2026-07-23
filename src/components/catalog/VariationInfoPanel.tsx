import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductVariation } from "@/types/variation";
import { formatCurrency } from "@/lib/utils";
import { Package, Palette, Info, AlertTriangle } from "lucide-react";

export interface VariationInfoPanelProps {
  variation: ProductVariation;
  basePrice?: number;
  showAdvancedInfo?: boolean;
  showStock?: boolean;
}

const VariationInfoPanel: React.FC<VariationInfoPanelProps> = ({
  variation,
  basePrice = 0,
  showAdvancedInfo = false,
  showStock = false,
}) => {
  // Calcular preço para grade: preço unitário × total de pares
  let finalPrice = basePrice + (variation.price_adjustment || 0);
  let totalPairs = 0;

  if (variation.is_grade && variation.grade_pairs && variation.grade_sizes) {
    try {
      totalPairs = Array.isArray(variation.grade_pairs)
        ? variation.grade_pairs.reduce(
            (sum: number, pairs: number) => sum + pairs,
            0
          )
        : 0;
      finalPrice = basePrice * totalPairs;

      console.log(" VariationInfoPanel - Cálculo de preço da grade:", {
        variationName: variation.grade_name,
        basePrice,
        totalPairs,
        finalPrice,
        gradeSizes: variation.grade_sizes,
        gradePairs: variation.grade_pairs,
      });
    } catch (error) {
      console.error(
        "Erro ao calcular preço da grade no VariationInfoPanel:",
        error
      );
    }
  }

  const isOutOfStock = variation.stock === 0;

  return <></>;
};

export default VariationInfoPanel;
