/**
 * EnhancedPriceDisplay - Exibição de Preço Otimizada para Conversão
 * Preço em destaque com desconto visual e parcelamento
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { TrendingDown, CreditCard } from "lucide-react";

interface EnhancedPriceDisplayProps {
  currentPrice: number;
  originalPrice?: number;
  discountPercentage?: number;
  installments?: number;
  installmentValue?: number;
  showInstallments?: boolean;
  catalogType?: 'retail' | 'wholesale';
  minQuantity?: number;
}

const EnhancedPriceDisplay: React.FC<EnhancedPriceDisplayProps> = ({
  currentPrice,
  originalPrice,
  discountPercentage,
  installments = 12,
  installmentValue,
  showInstallments = true,
  catalogType = 'retail',
  minQuantity,
}) => {
  const hasDiscount = originalPrice && originalPrice > currentPrice;
  const calculatedInstallment = installmentValue || (currentPrice / installments);
  const calculatedDiscount = discountPercentage || (
    hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0
  );

  return (
    <div className="space-y-3 mb-6">
      {/* Preço Original (se houver desconto) */}
      {hasDiscount && (
        <div className="flex items-center gap-3">
          <span className="text-2xl text-gray-400 line-through">
            De: {formatCurrency(originalPrice)}
          </span>
          {calculatedDiscount > 0 && (
            <Badge className="bg-red-600 text-white text-lg px-4 py-1 font-bold">
              <TrendingDown className="w-4 h-4 mr-1" />
              -{calculatedDiscount}% OFF
            </Badge>
          )}
        </div>
      )}

      {/* Preço Atual em Destaque */}
      <div className="flex items-baseline gap-3">
        <span className="text-6xl font-bold text-green-600 leading-none">
          {formatCurrency(currentPrice)}
        </span>
        
        {catalogType === 'wholesale' && minQuantity && (
          <Badge className="bg-orange-600 text-white text-sm px-3 py-1">
            Atacado (mín. {minQuantity} un)
          </Badge>
        )}
      </div>

      {/* Parcelamento */}
      {showInstallments && currentPrice > 50 && (
        <div className="flex items-center gap-2 text-lg">
          <CreditCard className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">
            ou{' '}
            <span className="font-bold text-green-700 text-xl">
              {installments}x de {formatCurrency(calculatedInstallment)}
            </span>
            {' '}sem juros
          </span>
        </div>
      )}

      {/* Economia Total (se desconto) */}
      {hasDiscount && (
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
          <span className="text-green-800 font-semibold">
            Você economiza {formatCurrency(originalPrice - currentPrice)}
          </span>
        </div>
      )}
    </div>
  );
};

export default EnhancedPriceDisplay;

