
import React from "react";
import { Badge } from "../ui/badge";
import { TrendingDown, ArrowUp, Info } from "lucide-react";
import { useCartPriceCalculation } from "@/hooks/useCartPriceCalculation";

interface CartItemPriceDisplayProps {
  item: any;
  className?: string;
}

const CartItemPriceDisplay: React.FC<CartItemPriceDisplayProps> = ({
  item,
  className = "",
}) => {
  const priceCalculation = useCartPriceCalculation(item);
  const product = item.product;
  const quantity = item.quantity;

  const {
    total,
    savings,
    formattedTotal,
    formattedSavings,
    currentTier,
    nextTierHint
  } = priceCalculation;

  const showSavings = savings > 0;
  const showIncentive = nextTierHint && nextTierHint.quantityNeeded > 0;
  const showTierBadge = currentTier.tier_name !== 'Varejo' || (currentTier.tier_name === 'Varejo' && item.catalogType === 'wholesale');

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Preço unitário */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Preço unitário:</span>
        <div className="flex items-center gap-2">
          {showSavings && (
            <span className="text-xs text-gray-400 line-through">
              R$ {product.retail_price.toFixed(2).replace(".", ",")}
            </span>
          )}
          <span className="font-semibold text-green-700">
            R$ {currentTier.price.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Total ({quantity} un):</span>
        <span className="font-bold text-green-700 text-lg">
          {formattedTotal}
        </span>
      </div>

      {/* Economia */}
      {showSavings && (
        <div className="flex items-center justify-between text-xs bg-green-50 p-2 rounded">
          <span className="text-green-700 font-medium flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            Economia:
          </span>
          <span className="text-green-700 font-bold">
            {formattedSavings}
          </span>
        </div>
      )}

      {/* Incentivo para próximo nível */}
      {showIncentive && (
        <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 p-3 rounded border border-blue-200">
          <ArrowUp className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium mb-1">
              💡 Adicione mais {nextTierHint.quantityNeeded} unidade{nextTierHint.quantityNeeded > 1 ? 's' : ''} para preço de atacado!
            </div>
            {nextTierHint.potentialSavings > 0 && (
              <div className="text-green-600 font-bold">
                Economize R$ {nextTierHint.potentialSavings.toFixed(2).replace(".", ",")} no total!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Identificador do nível atual */}
      {showTierBadge && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-500">
            <Info className="h-3 w-3" />
            <span>Nível:</span>
          </div>
          <Badge 
            variant={currentTier.tier_name === "Atacado" ? "default" : "outline"} 
            className={`text-xs font-medium ${
              currentTier.tier_name === "Atacado" 
                ? "bg-green-600 hover:bg-green-700" 
                : ""
            }`}
          >
            {currentTier.tier_name}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default CartItemPriceDisplay;
