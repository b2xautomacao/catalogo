
import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import { useProductDisplayPrice } from "@/hooks/useProductDisplayPrice";
import { ProductPriceTier } from "@/types/product";
import { Product } from "@/types/product";

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
  // Corrigir o tipo da prop product para incluir propriedades obrigatórias
  product?: Pick<Product, 'id' | 'name' | 'stock' | 'retail_price' | 'wholesale_price' | 'min_wholesale_qty' | 'store_id'>;
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
  product,
}) => {
  // Criar objeto produto para o hook se não fornecido
  const productForHook = product || {
    id: productId,
    name: 'Produto',
    stock: 0,
    retail_price: retailPrice,
    wholesale_price: wholesalePrice,
    min_wholesale_qty: minWholesaleQty,
    store_id: storeId,
  };

  const priceInfo = useProductDisplayPrice({
    product: productForHook,
    catalogType,
    quantity,
  });

  const priceCalculation = usePriceCalculation(storeId, {
    product_id: productId,
    retail_price: retailPrice,
    wholesale_price: wholesalePrice,
    min_wholesale_qty: minWholesaleQty,
    quantity,
    price_tiers: priceTiers,
  });

  // Usar o preço correto baseado no modelo
  const displayPrice = priceInfo.displayPrice;

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

      {/* Preços Varejo e Atacado (quando ambos estão disponíveis e diferentes) */}
      {priceInfo.shouldShowWholesaleInfo && 
       priceInfo.shouldShowRetailPrice && 
       !priceInfo.isWholesaleOnly && 
       priceInfo.retailPrice !== priceInfo.wholesalePrice && (
        <div className="space-y-1 pt-2 border-t border-border/20">
          {/* Preço Varejo */}
          <div className="flex items-center justify-between">
            <span className={`text-muted-foreground ${classes.secondaryPrice}`}>
              Varejo:
            </span>
            <span className={`font-medium ${classes.secondaryPrice}`}>
              {formatCurrency(priceInfo.retailPrice || 0)}
            </span>
          </div>

          {/* Preço Atacado */}
          <div className="flex items-center justify-between">
            <span className={`text-muted-foreground ${classes.secondaryPrice}`}>
              Atacado:
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`font-medium text-green-600 ${classes.secondaryPrice}`}
              >
                {formatCurrency(priceInfo.wholesalePrice || 0)}
              </span>
              {priceInfo.minWholesaleQty && priceInfo.minWholesaleQty > 1 && (
                <Badge
                  variant="secondary"
                  className={`bg-orange-100 text-orange-700 ${classes.badge}`}
                >
                  mín. {priceInfo.minWholesaleQty}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Informação de quantidade mínima para wholesale_only */}
      {priceInfo.isWholesaleOnly && priceInfo.minQuantity > 1 && (
        <div className={`text-orange-600 ${classes.secondaryPrice}`}>
          <span>Quantidade mínima: {priceInfo.minQuantity} unidades</span>
        </div>
      )}

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
