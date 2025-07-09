import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import { ProductPriceTier } from "@/types/product";

interface ProductPriceDisplayProps {
  storeId: string;
  productId: string;
  retailPrice: number;
  wholesalePrice?: number;
  minWholesaleQty?: number;
  quantity?: number;
  priceTiers?: ProductPriceTier[];
  catalogType?: "retail" | "wholesale";
  showSavings?: boolean;
  showNextTierHint?: boolean;
  showTierName?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ProductPriceDisplay: React.FC<ProductPriceDisplayProps> = ({
  storeId,
  productId,
  retailPrice,
  wholesalePrice,
  minWholesaleQty,
  quantity = 1,
  priceTiers,
  catalogType = "retail",
  showSavings = true,
  showNextTierHint = true,
  showTierName = true,
  size = "md",
  className = "",
}) => {
  const priceCalculation = usePriceCalculation(storeId, {
    product_id: productId,
    retail_price: retailPrice,
    wholesale_price: wholesalePrice,
    min_wholesale_qty: minWholesaleQty,
    quantity,
    price_tiers: priceTiers,
  });

  const displayPrice =
    catalogType === "wholesale" && wholesalePrice
      ? wholesalePrice
      : priceCalculation.price;

  const sizeClasses = {
    sm: {
      mainPrice: "text-lg font-bold",
      secondaryPrice: "text-sm",
      badge: "text-xs",
      hint: "text-xs",
    },
    md: {
      mainPrice: "text-xl font-bold",
      secondaryPrice: "text-sm",
      badge: "text-xs",
      hint: "text-xs",
    },
    lg: {
      mainPrice: "text-2xl font-bold",
      secondaryPrice: "text-base",
      badge: "text-sm",
      hint: "text-sm",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Preço Principal */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className={`text-primary ${classes.mainPrice}`}>
            {formatCurrency(displayPrice)}
          </span>

          {/* Preço Atacado Destaque */}
          {catalogType === "retail" && priceCalculation.isWholesale && (
            <div className="flex items-center gap-1">
              {showTierName && (
                <span
                  className={`text-green-600 font-semibold ${classes.secondaryPrice}`}
                >
                  {priceCalculation.currentTier.tier_name}:{" "}
                  {formatCurrency(priceCalculation.currentTier.price)}
                </span>
              )}
              {showSavings && priceCalculation.percentage > 0 && (
                <Badge
                  variant="secondary"
                  className={`bg-green-100 text-green-700 ${classes.badge}`}
                >
                  <TrendingDown className="h-3 w-3 mr-1" />-
                  {priceCalculation.percentage.toFixed(0)}%
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dica para Próximo Nível */}
      {showNextTierHint && priceCalculation.nextTierHint && (
        <div className={`text-blue-600 ${classes.hint}`}>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>
              +{priceCalculation.nextTierHint.quantityNeeded} un. para próximo
              nível
            </span>
          </div>
        </div>
      )}

      {/* Informações Adicionais */}
      {quantity > 1 && (
        <div className={`text-gray-600 ${classes.secondaryPrice}`}>
          <div className="flex items-center justify-between">
            <span>Total ({quantity} un):</span>
            <span className="font-semibold">
              {formatCurrency(priceCalculation.total)}
            </span>
          </div>
          {showSavings && priceCalculation.savings > 0 && (
            <div className="flex items-center justify-between text-green-600">
              <span>Economia:</span>
              <span className="font-semibold">
                {formatCurrency(priceCalculation.savings)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductPriceDisplay;
