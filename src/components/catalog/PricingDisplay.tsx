
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Tag, Gift } from "lucide-react";

interface PricingDisplayProps {
  currentPrice: number;
  originalPrice?: number;
  savings?: number;
  tierName: string;
  nextTierHint?: {
    quantityNeeded: number;
    potentialSavings: number;
  };
  showTierInfo?: boolean;
}

const PricingDisplay: React.FC<PricingDisplayProps> = ({
  currentPrice,
  originalPrice,
  savings = 0,
  tierName,
  nextTierHint,
  showTierInfo = true,
}) => {
  const hasDiscount = savings > 0 && originalPrice && originalPrice > currentPrice;
  const savingsPercentage = hasDiscount 
    ? ((originalPrice! - currentPrice) / originalPrice!) * 100 
    : 0;

  return (
    <div className="space-y-3">
      {/* Preço Principal */}
      <div className="text-center">
        <div className="text-2xl font-bold text-primary">
          R$ {currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
        
        {hasDiscount && (
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-sm text-gray-500 line-through">
              R$ {originalPrice!.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <Badge className="bg-green-100 text-green-800">
              -{savingsPercentage.toFixed(0)}%
            </Badge>
          </div>
        )}
      </div>

      {/* Informações do Tier */}
      {showTierInfo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Tag className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-medium">
                Nível: {tierName}
              </span>
            </div>
            {savings > 0 && (
              <div className="flex items-center justify-center gap-2 mt-1 text-sm">
                <Gift className="w-4 h-4 text-green-600" />
                <span className="text-green-700">
                  Economia: R$ {savings.toFixed(2)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dica para Próximo Nível */}
      {nextTierHint && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-3">
            <div className="text-center text-sm">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-orange-800 font-medium">
                   Dica de Economia
                </span>
              </div>
              <p className="text-orange-700">
                Adicione mais {nextTierHint.quantityNeeded} {nextTierHint.quantityNeeded === 1 ? 'item' : 'itens'} 
                e economize R$ {nextTierHint.potentialSavings.toFixed(2)} por item!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PricingDisplay;
