import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductVariation } from "@/types/variation";
import { formatCurrency } from "@/lib/utils";
import { Package, AlertTriangle, Sparkles } from "lucide-react";
import { hasFlexibleConfig, allowsMultiplePurchaseOptions } from "@/types/flexible-grade";

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
  // Calcular preço para grade: preço unitário × total de pares
  let finalPrice = basePrice + (variation.price_adjustment || 0);

  if (variation.is_grade && variation.grade_pairs && variation.grade_sizes) {
    try {
      const totalPairs = Array.isArray(variation.grade_pairs)
        ? variation.grade_pairs.reduce(
            (sum: number, pairs: number) => sum + pairs,
            0
          )
        : 0;
      finalPrice = basePrice * totalPairs;

      console.log("📦 GradeVariationCard - Cálculo de preço:", {
        variationName: variation.grade_name,
        basePrice,
        totalPairs,
        finalPrice,
        gradeSizes: variation.grade_sizes,
        gradePairs: variation.grade_pairs,
      });
    } catch (error) {
      console.error("Erro ao calcular preço da grade:", error);
    }
  }

  const isOutOfStock = variation.stock === 0;
  
  // Detectar se tem configuração flexível
  const isFlexibleGrade = hasFlexibleConfig(variation);
  const hasMultipleOptions = isFlexibleGrade && allowsMultiplePurchaseOptions(variation.flexible_grade_config!);

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 ${
        isSelected
          ? "border-primary shadow-md bg-primary/5"
          : "border-border hover:border-primary/50 hover:shadow-sm"
      } ${isOutOfStock ? "opacity-60" : ""}`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            {/* Informações da variação - Melhor contraste e hierarquia */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Package className="h-5 w-5 text-primary" />
              
              {/* Badge de Grade Flexível */}
              {hasMultipleOptions && (
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  <span className="font-semibold">Múltiplas Opções</span>
                </Badge>
              )}

              {variation.color && (
                <Badge variant="outline" className="text-sm font-medium border-gray-300 bg-white">
                  {variation.hex_color && (
                    <div
                      className="w-4 h-4 rounded-full mr-1.5 border-2 border-gray-300"
                      style={{ backgroundColor: variation.hex_color }}
                    />
                  )}
                  <span className="text-gray-800">{variation.color}</span>
                </Badge>
              )}

              {variation.size && (
                <Badge variant="outline" className="text-sm font-medium border-gray-300 bg-white text-gray-800">
                  {variation.size}
                </Badge>
              )}

              {variation.material && (
                <Badge variant="outline" className="text-sm font-medium border-gray-300 bg-white text-gray-800">
                  {variation.material}
                </Badge>
              )}
            </div>

            {/* SKU - Melhor contraste */}
            {variation.sku && (
              <div className="text-sm text-gray-600 font-mono">
                SKU: <span className="font-semibold text-gray-800">{variation.sku}</span>
              </div>
            )}

            {/* Informações da Grade - Pares disponíveis */}
            {variation.is_grade &&
              variation.grade_sizes &&
              variation.grade_pairs && (
                <div className="space-y-3 mt-3">
                  {/* 🎨 MELHORIA UX: Título mais destacado */}
                  <div className="flex items-center gap-2">
                    <div className="text-base font-semibold text-gray-900">
                      Composição da Grade:
                    </div>
                    {variation.grade_name && (
                      <Badge variant="secondary" className="text-xs font-medium">
                        {variation.grade_name}
                      </Badge>
                    )}
                  </div>
                  
                  {/* 🎨 MELHORIA UX: Grid melhorado com mais contraste */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {variation.grade_sizes.map((size, index) => {
                      const pairs = variation.grade_pairs?.[index] || 0;
                      const totalPairs = Array.isArray(variation.grade_pairs)
                        ? variation.grade_pairs.reduce((sum, p) => sum + p, 0)
                        : 0;
                      
                      return (
                        <div
                          key={size}
                          className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 px-3 py-2.5 rounded-lg hover:shadow-md transition-shadow"
                        >
                          {/* 🎨 MELHORIA UX: Tamanho destacado */}
                          <div className="text-center mb-1.5">
                            <div className="text-lg font-bold text-gray-900 mb-0.5">
                              {size}
                            </div>
                            {/* 🎨 MELHORIA UX: Quantidade com destaque */}
                            <div className="text-sm font-semibold text-primary">
                              {pairs} {pairs === 1 ? 'par' : 'pares'}
                            </div>
                          </div>
                          
                          {/* 🎨 MELHORIA UX: Barra visual de proporção */}
                          {totalPairs > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{ width: `${(pairs / totalPairs) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 🎨 MELHORIA UX: Resumo total mais visível */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">
                      Total de pares:
                    </span>
                    <span className="text-base font-bold text-primary">
                      {Array.isArray(variation.grade_pairs)
                        ? variation.grade_pairs.reduce((sum, pairs) => sum + pairs, 0)
                        : 0} pares
                    </span>
                  </div>
                </div>
              )}

            {/* Estoque - apenas se showStock for true - Melhor contraste */}
            {showStock && (
              <div className="flex items-center gap-2.5 text-sm pt-1">
                <span className="font-medium text-gray-700">Estoque:</span>
                <span
                  className={`font-bold text-base ${
                    isOutOfStock ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {variation.stock} unidades
                </span>
                {isOutOfStock && (
                  <Badge variant="destructive" className="text-xs font-semibold">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Esgotado
                  </Badge>
                )}
              </div>
            )}

            {/* Preço */}
            {showPrice && (
              <div className="text-lg font-semibold text-primary">
                {formatCurrency(finalPrice)}
                {variation.is_grade && variation.grade_pairs && (
                  <div className="text-xs text-muted-foreground mt-1">
                    <div>Preço unitário: {formatCurrency(basePrice)}</div>
                    <div>
                      Total de pares:{" "}
                      {Array.isArray(variation.grade_pairs)
                        ? variation.grade_pairs.reduce(
                            (sum, pairs) => sum + pairs,
                            0
                          )
                        : 0}
                    </div>
                  </div>
                )}
                {variation.price_adjustment !== 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({variation.price_adjustment > 0 ? "+" : ""}
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
