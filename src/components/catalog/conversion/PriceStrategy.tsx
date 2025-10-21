import React from "react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, CreditCard, Truck } from "lucide-react";

interface PriceStrategyProps {
  originalPrice: number;
  currentPrice: number;
  minQuantity?: number;
  showInstallments?: boolean;
  showSavings?: boolean;
  showFreeShipping?: boolean;
  freeShippingThreshold?: number;
  cartTotal?: number;
}

const PriceStrategy: React.FC<PriceStrategyProps> = ({
  originalPrice,
  currentPrice,
  minQuantity = 1,
  showInstallments = true,
  showSavings = true,
  showFreeShipping = true,
  freeShippingThreshold = 200,
  cartTotal = 0,
}) => {
  const discountPercentage = originalPrice > currentPrice 
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const savings = originalPrice - currentPrice;
  const installmentValue = currentPrice / 12;
  const isFreeShipping = cartTotal >= freeShippingThreshold;

  return (
    <div className="space-y-2">
      {/* Preços principais */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">
          {formatCurrency(currentPrice)}
        </span>
        
        {originalPrice > currentPrice && (
          <span className="text-lg text-gray-500 line-through">
            {formatCurrency(originalPrice)}
          </span>
        )}
      </div>

      {/* Badge de desconto */}
      {discountPercentage > 0 && showSavings && (
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="bg-red-500 text-white">
            <TrendingDown className="h-3 w-3 mr-1" />
            {discountPercentage}% OFF
          </Badge>
          <span className="text-sm text-green-600 font-medium">
            Economize {formatCurrency(savings)}
          </span>
        </div>
      )}

      {/* Parcelamento */}
      {showInstallments && installmentValue >= 5 && (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <CreditCard className="h-4 w-4" />
          <span>
            ou 12x de {formatCurrency(installmentValue)} sem juros
          </span>
        </div>
      )}

      {/* Frete grátis */}
      {showFreeShipping && (
        <div className="flex items-center gap-1 text-sm">
          {isFreeShipping ? (
            <div className="flex items-center gap-1 text-green-600">
              <Truck className="h-4 w-4" />
              <span className="font-medium">Frete grátis!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-500">
              <Truck className="h-4 w-4" />
              <span>
                Frete grátis a partir de {formatCurrency(freeShippingThreshold)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Quantidade mínima para atacado */}
      {minQuantity > 1 && (
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          Quantidade mínima: {minQuantity} unidades
        </div>
      )}
    </div>
  );
};

export default PriceStrategy;
