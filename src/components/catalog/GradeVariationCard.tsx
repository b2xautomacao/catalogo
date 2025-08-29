
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductVariation } from "@/types/variation";
import { formatCurrency } from "@/lib/utils";
import { Package, AlertTriangle } from "lucide-react";

export interface GradeVariationCardProps {
  variation: ProductVariation;
  isSelected: boolean;
  onSelect: () => void;
  showPrice?: boolean;
  basePrice?: number;
  showStock?: boolean;
}

const GradeVariationCard: React.FC<GradeVariationCardProps> = ({
  variation,
  isSelected,
  onSelect,
  showPrice = false,
  basePrice = 0,
  showStock = false,
}) => {
  const finalPrice = basePrice + (variation.price_adjustment || 0);
  const isOutOfStock = variation.stock === 0;

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-primary shadow-md bg-primary/5' 
          : 'border-border hover:border-primary/50 hover:shadow-sm'
      } ${isOutOfStock ? 'opacity-60' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            {/* Informações da variação */}
            <div className="flex flex-wrap items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              
              {variation.color && (
                <Badge variant="outline" className="text-xs">
                  {variation.hex_color && (
                    <div
                      className="w-3 h-3 rounded-full mr-1 border"
                      style={{ backgroundColor: variation.hex_color }}
                    />
                  )}
                  {variation.color}
                </Badge>
              )}
              
              {variation.size && (
                <Badge variant="outline" className="text-xs">
                  {variation.size}
                </Badge>
              )}
              
              {variation.material && (
                <Badge variant="outline" className="text-xs">
                  {variation.material}
                </Badge>
              )}
            </div>

            {/* SKU */}
            {variation.sku && (
              <div className="text-sm text-muted-foreground">
                SKU: {variation.sku}
              </div>
            )}

            {/* Estoque - apenas se showStock for true */}
            {showStock && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Estoque:</span>
                <span className={`font-medium ${
                  isOutOfStock ? 'text-red-600' : 'text-green-600'
                }`}>
                  {variation.stock} unidades
                </span>
                {isOutOfStock && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Esgotado
                  </Badge>
                )}
              </div>
            )}

            {/* Preço */}
            {showPrice && (
              <div className="text-lg font-semibold text-primary">
                {formatCurrency(finalPrice)}
                {variation.price_adjustment !== 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({variation.price_adjustment > 0 ? '+' : ''}
                    {formatCurrency(variation.price_adjustment)})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Indicador de seleção */}
          {isSelected && (
            <div className="ml-3">
              <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
          )}
        </div>

        {/* Botão de seleção para itens fora de estoque */}
        {isOutOfStock && !isSelected && (
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelect}
              className="w-full text-xs"
            >
              Selecionar (Fora de Estoque)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GradeVariationCard;
