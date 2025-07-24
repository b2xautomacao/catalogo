
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

  const { priceModel, loading } = useStorePriceModel(product.store_id);

  if (loading) {
    return <div className={className}>Carregando...</div>;
  }

  const modelType = priceModel?.price_model || "retail_only";

  // Função para obter informações de exibição baseada no modelo
  const getDisplayInfo = () => {
    switch (modelType) {
      case "retail_only":
        return {
          currentPrice: product.retail_price,
          totalPrice: product.retail_price * quantity,
          tierLabel: "Varejo",
          showIncentive: false,
          showOriginalPrice: false,
        };

      case "wholesale_only":
        const wholesalePrice = product.wholesale_price || product.retail_price;
        return {
          currentPrice: wholesalePrice,
          totalPrice: wholesalePrice * quantity,
          tierLabel: "Atacado",
          showIncentive: false,
          showOriginalPrice: false,
        };

      case "simple_wholesale":
        const minQty = product.min_wholesale_qty || 1;
        const isWholesale = quantity >= minQty;
        const currentPrice = isWholesale ? product.wholesale_price : product.retail_price;
        
        return {
          currentPrice,
          totalPrice: currentPrice * quantity,
          tierLabel: isWholesale ? "Atacado" : "Varejo",
          showIncentive: !isWholesale && product.wholesale_price,
          showOriginalPrice: isWholesale && product.wholesale_price < product.retail_price,
          incentiveData: !isWholesale ? {
            needed: minQty - quantity,
            savings: (product.retail_price - product.wholesale_price) * minQty
          } : null
        };

      case "gradual_wholesale":
        // Para gradativo, usar o hook de cálculo
        const { tiers } = useProductPriceTiers(product.id, {
          wholesale_price: product.wholesale_price,
          min_wholesale_qty: product.min_wholesale_qty,
          retail_price: product.retail_price,
        });

        const calculation = usePriceCalculation(product.store_id, {
          product_id: product.id,
          retail_price: product.retail_price,
          wholesale_price: product.wholesale_price,
          min_wholesale_qty: product.min_wholesale_qty,
          quantity,
          price_tiers: tiers,
          enable_gradual_wholesale: true,
        });

        return {
          currentPrice: calculation.price,
          totalPrice: calculation.total,
          tierLabel: calculation.currentTier.tier_name,
          showIncentive: !!calculation.nextTierHint,
          showOriginalPrice: calculation.savings > 0,
          incentiveData: calculation.nextTierHint ? {
            needed: calculation.nextTierHint.quantityNeeded,
            savings: calculation.nextTierHint.potentialSavings * (quantity + calculation.nextTierHint.quantityNeeded)
          } : null
        };

      default:
        return {
          currentPrice: product.retail_price,
          totalPrice: product.retail_price * quantity,
          tierLabel: "Varejo",
          showIncentive: false,
          showOriginalPrice: false,
        };
    }
  };

  const displayInfo = getDisplayInfo();

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Preço unitário */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Preço unitário:</span>
        <div className="flex items-center gap-2">
          {displayInfo.showOriginalPrice && (
            <span className="text-xs text-gray-400 line-through">
              R$ {product.retail_price.toFixed(2).replace(".", ",")}
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
        <span className="font-bold text-green-700 text-lg">
          R$ {displayInfo.totalPrice.toFixed(2).replace(".", ",")}
        </span>
      </div>

      {/* Economia */}
      {displayInfo.showOriginalPrice && (
        <div className="flex items-center justify-between text-xs bg-green-50 p-2 rounded">
          <span className="text-green-700 font-medium flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            Economia:
          </span>
          <span className="text-green-700 font-bold">
            R$ {((product.retail_price - displayInfo.currentPrice) * quantity).toFixed(2).replace(".", ",")}
          </span>
        </div>
      )}

      {/* Incentivo para próximo nível */}
      {displayInfo.showIncentive && displayInfo.incentiveData && (
        <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 p-3 rounded border border-blue-200">
          <ArrowUp className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium mb-1">
              💡 Adicione mais {displayInfo.incentiveData.needed} unidade{displayInfo.incentiveData.needed > 1 ? 's' : ''} 
              {modelType === 'simple_wholesale' ? ' para ativar preço de atacado!' : ' para o próximo nível!'}
            </div>
            {displayInfo.incentiveData.savings > 0 && (
              <div className="text-green-600 font-bold">
                Economize R$ {displayInfo.incentiveData.savings.toFixed(2).replace(".", ",")} no total!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nível atual */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-gray-500">
          <Info className="h-3 w-3" />
          <span>Nível:</span>
        </div>
        <Badge variant="outline" className="text-xs font-medium">
          {displayInfo.tierLabel}
        </Badge>
      </div>
    </div>
  );
};

export default CartItemPriceDisplay;
