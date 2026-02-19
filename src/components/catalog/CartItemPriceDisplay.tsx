import React, { useState } from "react";
import { Badge } from "../ui/badge";
import {
  TrendingDown,
  ArrowUp,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useCartPriceCalculation } from "@/hooks/useCartPriceCalculation";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";

interface CartItemPriceDisplayProps {
  item: any;
  className?: string;
}

const CartItemPriceDisplay: React.FC<CartItemPriceDisplayProps> = ({
  item,
  className = "",
}) => {
  const [showGradeDetails, setShowGradeDetails] = useState(false);
  const priceCalculation = useCartPriceCalculation(item);
  const product = item.product;
  const quantity = item.quantity;

  const {
    total,
    savings,
    formattedTotal,
    formattedSavings,
    currentTier,
    nextTierHint,
  } = priceCalculation;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Preço unitário */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {item.gradeInfo ? "Preço da grade:" : "Preço unitário:"}
        </span>
        <div className="flex items-center gap-2">
          {item.gradeInfo ? (
            // Para grades, mostrar informações específicas
            <div className="text-right">
              <span className="font-semibold text-green-700">
                R$ {item.price.toFixed(2).replace(".", ",")}
              </span>
              <div className="text-xs text-gray-500">{item.gradeInfo.name}</div>
            </div>
          ) : priceCalculation.priceModel === "wholesale_only" ? (
            product.wholesale_price && product.wholesale_price > 0 ? (
              <span className="font-semibold text-green-700">
                R$ {product.wholesale_price.toFixed(2).replace(".", ",")}
              </span>
            ) : (
              <span className="text-red-500 text-xs">
                Preço não configurado
              </span>
            )
          ) : (
            <span className="font-semibold text-gray-900">
              R${" "}
              {currentTier
                ? currentTier.price.toFixed(2).replace(".", ",")
                : (total / quantity).toFixed(2).replace(".", ",")}
            </span>
          )}

          {/* Indicador de tier atual */}
          {currentTier && !item.gradeInfo && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {currentTier.tier_name}
            </span>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{item.gradeInfo ? "Total da grade:" : "Total:"}</span>
        <span className="text-lg font-bold text-gray-900">
          {item.gradeInfo
            ? `R$ ${item.price.toFixed(2).replace(".", ",")}`
            : formattedTotal}
        </span>
      </div>

      {/* Informações da grade */}
      {item.gradeInfo && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <button
            onClick={() => setShowGradeDetails(!showGradeDetails)}
            className="flex items-center justify-between w-full text-left font-medium mb-1 hover:text-gray-700"
          >
            <span>Composição da Grade:</span>
            {showGradeDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showGradeDetails && (
            <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t border-gray-200">
              {item.gradeInfo.sizes &&
                item.gradeInfo.pairs &&
                item.gradeInfo.sizes.map((size, index) => (
                  <div key={index} className="flex justify-between">
                    <span>Tamanho {size}:</span>
                    <span className="font-medium">
                      {item.gradeInfo.pairs[index]} pares
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Economia */}
      {savings > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Economia:</span>
          <span className="text-green-600 font-semibold">
            {formattedSavings}
          </span>
        </div>
      )}

      {/* Dica do próximo tier */}
      {nextTierHint && (
        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
          {nextTierHint.byCartTotal ? (
            nextTierHint.quantityNeeded === 1 ? (
              <>Adicione mais 1 unidade no carrinho para preço de atacado em todos os itens</>
            ) : (
              <>Adicione mais {nextTierHint.quantityNeeded} unidades no carrinho para preço de atacado em todos os itens</>
            )
          ) : (
            <>
              {nextTierHint.quantityNeeded === 1
                ? `Adicione mais 1 unidade para economizar R$ ${nextTierHint.potentialSavings.toFixed(2).replace(".", ",")}`
                : `Adicione mais ${nextTierHint.quantityNeeded} unidades para economizar R$ ${nextTierHint.potentialSavings.toFixed(2).replace(".", ",")}`}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CartItemPriceDisplay;
