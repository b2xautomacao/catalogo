
import React from "react";
import { Badge } from "../ui/badge";
import { TrendingDown, ArrowUp, Info } from "lucide-react";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import { useProductPriceTiers } from "@/hooks/useProductPriceTiers";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";

interface CartItemPriceDisplayProps {
  item: any;
  className?: string;
}

const CartItemPriceDisplay: React.FC<CartItemPriceDisplayProps> = ({
  item,
  className = "",
}) => {
  const product = item.product;
  const quantity = item.quantity;
  const originalPrice = item.originalPrice || product.retail_price;

  // Buscar tiers do produto
  const { tiers: priceTiers } = useProductPriceTiers(product.id, {
    wholesale_price: product.wholesale_price,
    min_wholesale_qty: product.min_wholesale_qty,
    retail_price: product.retail_price,
  });

  // Usar hook padronizado
  const calculation = usePriceCalculation(product.store_id, {
    product_id: product.id,
    retail_price: product.retail_price,
    wholesale_price: product.wholesale_price,
    min_wholesale_qty: product.min_wholesale_qty,
    quantity,
    price_tiers: product.enable_gradual_wholesale ? priceTiers : [],
    enable_gradual_wholesale: product.enable_gradual_wholesale,
  });

  const { priceModel, loading } = useStorePriceModel(product.store_id);
  const modelKey = product.price_model || priceModel?.price_model || "retail_only";

  if (loading) {
    return <div className={className}>Carregando preço...</div>;
  }

  // Calcular preços baseado no modelo
  const getDisplayInfo = () => {
    switch (modelKey) {
      case "wholesale_only":
        return {
          currentPrice: item.price || product.wholesale_price,
          totalPrice: (item.price || product.wholesale_price) * quantity,
          showOriginalPrice: false,
          tierName: "Atacado",
          showIncentive: false,
        };

      case "simple_wholesale":
        const isWholesale = quantity >= (product.min_wholesale_qty || 1);
        return {
          currentPrice: isWholesale ? product.wholesale_price : product.retail_price,
          totalPrice: (isWholesale ? product.wholesale_price : product.retail_price) * quantity,
          showOriginalPrice: isWholesale && product.wholesale_price < product.retail_price,
          tierName: isWholesale ? "Atacado" : "Varejo",
          showIncentive: !isWholesale && product.wholesale_price,
          incentiveText: !isWholesale ? `Adicione mais ${(product.min_wholesale_qty || 1) - quantity} para atacado` : null,
        };

      case "gradual_wholesale":
        return {
          currentPrice: calculation.price,
          totalPrice: calculation.price * quantity,
          showOriginalPrice: calculation.percentage > 0,
          tierName: calculation.currentTier.tier_name,
          showIncentive: !!calculation.nextTierHint,
          incentiveText: calculation.nextTierHint ? 
            `Adicione mais ${calculation.nextTierHint.quantityNeeded} para próximo nível` : null,
        };

      default: // retail_only
        return {
          currentPrice: product.retail_price,
          totalPrice: product.retail_price * quantity,
          showOriginalPrice: false,
          tierName: "Varejo",
          showIncentive: false,
        };
    }
  };

  const displayInfo = getDisplayInfo();
  const totalSavings = displayInfo.showOriginalPrice ? 
    (originalPrice - displayInfo.currentPrice) * quantity : 0;

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Preço unitário atual */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Preço:</span>
        </div>
        <div className="flex items-center gap-1">
          {displayInfo.showOriginalPrice && (
            <span className="text-xs text-gray-400 line-through">
              R$ {originalPrice.toFixed(2).replace(".", ",")}
            </span>
          )}
          <span className="font-semibold text-green-700">
            R$ {displayInfo.currentPrice.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Total ({quantity} un):</span>
        <div className="flex items-center gap-1">
          {displayInfo.showOriginalPrice && totalSavings > 0 && (
            <span className="text-xs text-gray-400 line-through">
              R$ {(originalPrice * quantity).toFixed(2).replace(".", ",")}
            </span>
          )}
          <span className="font-bold text-green-700">
            R$ {displayInfo.totalPrice.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      {/* Economia total */}
      {totalSavings > 0 && (
        <div className="flex items-center justify-between text-xs bg-green-50 p-1 rounded">
          <span className="text-green-700 font-medium">Economia total:</span>
          <span className="text-green-700 font-bold">
            R$ {totalSavings.toFixed(2).replace(".", ",")}
          </span>
        </div>
      )}

      {/* Incentivo para próximo nível */}
      {displayInfo.showIncentive && displayInfo.incentiveText && (
        <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
          <ArrowUp className="h-3 w-3 flex-shrink-0" />
          <span className="flex-1">
            <strong>💡 Dica:</strong> {displayInfo.incentiveText}
            {modelKey === "simple_wholesale" && product.wholesale_price && (
              <span className="ml-1 text-green-600 font-bold">
                Economize R$ {((product.retail_price - product.wholesale_price) * (product.min_wholesale_qty || 1)).toFixed(2)} no total!
              </span>
            )}
          </span>
        </div>
      )}

      {/* Nível atual */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Info className="h-3 w-3" />
        <span>
          Nível atual: <strong>{displayInfo.tierName}</strong>
        </span>
      </div>
    </div>
  );
};

export default CartItemPriceDisplay;
