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
    price_tiers: product.enable_gradual_wholesale ? priceTiers : [], // Só usar tiers se atacado gradativo estiver ativo
    enable_gradual_wholesale: product.enable_gradual_wholesale, // Passar o toggle
  });

  const { priceModel, loading } = useStorePriceModel(product.store_id);
  const modelKey: import("@/types/price-models").PriceModelType =
    product.price_model || priceModel?.price_model || "retail_only";

  if (loading) {
    return <div className={className}>Carregando preço...</div>;
  }

  // Para wholesale_only, usar sempre item.price
  const totalPrice =
    modelKey === "wholesale_only"
      ? item.price * quantity
      : calculation.price * quantity;
  const totalRetailPrice = originalPrice * quantity;
  const totalSavings =
    modelKey === "wholesale_only"
      ? (originalPrice - item.price) * quantity
      : totalRetailPrice - totalPrice;

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Preço unitário atual */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Preço:</span>
        </div>
        <div className="flex items-center gap-1">
          {modelKey === "wholesale_only" ? (
            <span className="font-semibold text-orange-700">
              R$ {item.price?.toFixed(2).replace(".", ",")}
            </span>
          ) : (
            <>
              {calculation.percentage > 0 && (
                <span className="text-xs text-gray-400 line-through">
                  R$ {originalPrice.toFixed(2).replace(".", ",")}
                </span>
              )}
              <span className="font-semibold text-green-700">
                R$ {calculation.price.toFixed(2).replace(".", ",")}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Total ({quantity} un):</span>
        <div className="flex items-center gap-1">
          {modelKey !== "wholesale_only" && totalSavings > 0 && (
            <span className="text-xs text-gray-400 line-through">
              R$ {totalRetailPrice.toFixed(2).replace(".", ",")}
            </span>
          )}
          <span className="font-bold text-green-700">
            R$ {totalPrice.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      {/* Economia total - só para outros modelos */}
      {modelKey !== "wholesale_only" && totalSavings > 0 && (
        <div className="flex items-center justify-between text-xs bg-green-50 p-1 rounded">
          <span className="text-green-700 font-medium">
            {modelKey} Economia total:
          </span>
          <span className="text-green-700 font-bold">
            R$ {totalSavings.toFixed(2).replace(".", ",")}
          </span>
        </div>
      )}

      {/* Dica para próximo nível - INCENTIVO PRINCIPAL */}
      {modelKey !== "wholesale_only" && calculation.nextTierHint && (
        <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
          <ArrowUp className="h-3 w-3 flex-shrink-0" />
          <span className="flex-1">
            <strong>💡 Incentivo:</strong> Adicione{" "}
            <strong className="text-blue-800">
              +{calculation.nextTierHint.quantityNeeded}
            </strong>{" "}
            unidades para ativar o{" "}
            <strong>
              {calculation.nextTierHint ? "próximo nível" : "próximo nível"}
            </strong>{" "}
            e economizar{" "}
            <strong className="text-green-600">
              R${" "}
              {calculation.nextTierHint.potentialSavings
                .toFixed(2)
                .replace(".", ",")}
            </strong>{" "}
            por unidade!
          </span>
        </div>
      )}

      {/* Nível atual */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Info className="h-3 w-3" />
        <span>
          Nível atual:{" "}
          <strong>
            {modelKey === "wholesale_only"
              ? "Atacado"
              : calculation.currentTier.tier_name}
          </strong>
        </span>
      </div>
    </div>
  );
};

export default CartItemPriceDisplay;
