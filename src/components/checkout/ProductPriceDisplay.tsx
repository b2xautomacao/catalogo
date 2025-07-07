
import React from "react";
import { usePriceCalculation } from "../../hooks/usePriceCalculation";
import { Badge } from "../ui/badge";
import { TrendingDown, ArrowUp, Info } from "lucide-react";

interface ProductPriceDisplayProps {
  productId: string;
  storeId: string;
  quantity: number;
  retailPrice: number;
  className?: string;
}

const ProductPriceDisplay: React.FC<ProductPriceDisplayProps> = ({
  productId,
  storeId,
  quantity,
  retailPrice,
  className = "",
}) => {
  const calculation = usePriceCalculation(storeId, {
    product_id: productId,
    retail_price: retailPrice,
    quantity
  });

  const totalPrice = calculation.price * quantity;
  const totalRetailPrice = retailPrice * quantity;
  const totalSavings = totalRetailPrice - totalPrice;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Preço unitário atual */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Preço unitário:</span>
          {calculation.percentage > 0 && (
            <Badge
              variant="secondary"
              className="text-xs bg-green-100 text-green-700"
            >
              <TrendingDown className="h-3 w-3 mr-1" />-
              {calculation.percentage.toFixed(0)}%
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {calculation.percentage > 0 && (
            <span className="text-sm text-gray-400 line-through">
              R$ {retailPrice.toFixed(2).replace(".", ",")}
            </span>
          )}
          <span className="font-semibold text-green-700">
            R$ {calculation.price.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      {/* Nível atual */}
      {calculation.currentTier.tier_name !== "Varejo" && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Nível atual:</span>
          <span className="font-medium text-gray-800">
            {calculation.currentTier.tier_name}
          </span>
        </div>
      )}

      {/* Total */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <span className="font-medium">Total ({quantity} un):</span>
        <div className="flex items-center gap-2">
          {totalSavings > 0 && (
            <span className="text-sm text-gray-400 line-through">
              R$ {totalRetailPrice.toFixed(2).replace(".", ",")}
            </span>
          )}
          <span className="font-bold text-lg text-green-700">
            R$ {totalPrice.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      {/* Economia total */}
      {totalSavings > 0 && (
        <div className="flex items-center justify-between text-sm bg-green-50 p-2 rounded-lg">
          <span className="text-green-700 font-medium">Economia total:</span>
          <span className="text-green-700 font-bold">
            R$ {totalSavings.toFixed(2).replace(".", ",")}
          </span>
        </div>
      )}

      {/* Dica para próximo nível */}
      {calculation.nextTierHint && (
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
          <ArrowUp className="h-3 w-3" />
          <span>
            Adicione mais {calculation.nextTierHint.quantityNeeded} unidade(s)
            para economizar R${" "}
            {calculation.nextTierHint.potentialSavings
              .toFixed(2)
              .replace(".", ",")}
            por unidade
          </span>
        </div>
      )}

      {/* Informação sobre níveis */}
      {calculation.currentTier.tier_name !== "Varejo" && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Info className="h-3 w-3" />
          <span>Preço baseado na quantidade: {quantity} unidade(s)</span>
        </div>
      )}
    </div>
  );
};

export default ProductPriceDisplay;
