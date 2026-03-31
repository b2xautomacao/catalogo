/**
 * Seletor de Grades Melhorado
 * Agrupa grades por cor e mostra opções de cada cor
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductVariation } from "@/types/product";
import { Package, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { resolveColorHex } from "@/lib/colors";
import FlexibleGradeSelector from "./FlexibleGradeSelector";
import { hasFlexibleConfig, allowsMultiplePurchaseOptions } from "@/types/flexible-grade";

interface ImprovedGradeSelectorProps {
  variations: ProductVariation[];
  selectedVariation: ProductVariation | null;
  onVariationChange: (variation: ProductVariation | null) => void;
  basePrice: number;
  showPrices?: boolean;
  showStock?: boolean;
}

interface ColorGroup {
  color: string;
  grades: ProductVariation[];
}

const ImprovedGradeSelector: React.FC<ImprovedGradeSelectorProps> = ({
  variations,
  selectedVariation,
  onVariationChange,
  basePrice,
  showPrices = true,
  showStock = true,
}) => {
  const [expandedColors, setExpandedColors] = useState<Set<string>>(new Set());
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Agrupar grades por cor
  const colorGroups = useMemo(() => {
    const groups: ColorGroup[] = [];
    const colorMap = new Map<string, ProductVariation[]>();

    variations
      .filter(v => v.is_grade)
      .forEach(variation => {
        const color = variation.grade_color || variation.color || 'Sem Cor';
        
        if (!colorMap.has(color)) {
          colorMap.set(color, []);
        }
        colorMap.get(color)!.push(variation);
      });

    colorMap.forEach((grades, color) => {
      groups.push({ color, grades });
    });

    return groups.sort((a, b) => a.color.localeCompare(b.color));
  }, [variations]);

  // Auto-seleção se houver apenas uma cor
  React.useEffect(() => {
    if (colorGroups.length === 1 && !selectedColor) {
      const { color, grades } = colorGroups[0];
      setSelectedColor(color);
      setExpandedColors(new Set([color]));
      // Se houver apenas uma grade nessa cor, auto-seleciona ela também
      if (grades.length === 1 && (!selectedVariation || selectedVariation.id !== grades[0].id)) {
        onVariationChange(grades[0]);
      }
    }
  }, [colorGroups, selectedColor, selectedVariation, onVariationChange]);

  const toggleColor = (color: string) => {
    const newExpanded = new Set(expandedColors);
    if (newExpanded.has(color)) {
      newExpanded.delete(color);
    } else {
      newExpanded.add(color);
    }
    setExpandedColors(newExpanded);
  };

  const selectColorAndGrade = (color: string, grade: ProductVariation) => {
    setSelectedColor(color);
    onVariationChange(grade);
    
    // Expandir automaticamente
    setExpandedColors(new Set([color]));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Package className="w-4 h-4" />
        {colorGroups.length > 1 ? "Selecione a Cor e Grade" : "Selecione a Grade"}
      </h3>

      {/* Lista de Cores */}
      <div className="space-y-3">
        {colorGroups.map(({ color, grades }) => {
          const isExpanded = expandedColors.has(color);
          const isSelected = selectedColor === color;
          const gradeCount = grades.length;
          const hasFlexible = grades.some(g => 
            hasFlexibleConfig(g) && allowsMultiplePurchaseOptions(g.flexible_grade_config!)
          );

          return (
            <Card key={color} className={`border-2 transition-all ${
              isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'
            }`}>
              {/* Header da Cor - Ocultar se houver apenas uma cor para simplificar */}
              {colorGroups.length > 1 && (
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleColor(color)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Amostra de Cor */}
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                        style={{ 
                          backgroundColor: resolveColorHex(color, grades[0]?.hex_color)
                        }}
                      />

                      <div>
                        <h4 className="font-semibold text-gray-900">{color}</h4>
                        <p className="text-sm text-gray-600">
                          {gradeCount} opç{gradeCount > 1 ? 'ões' : 'ão'} de grade
                          {hasFlexible && (
                            <span className="ml-2">
                              <Sparkles className="w-3 h-3 inline text-purple-600" />
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <Badge className="bg-blue-600">Selecionado</Badge>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Opções de Grade (expandível) */}
              {isExpanded && (
                <CardContent className="border-t bg-gray-50 pt-4">
                  <div className="space-y-2">
                    {grades.map((grade) => {
                      const isGradeSelected = selectedVariation?.id === grade.id;
                      const totalPairs = grade.grade_quantity || 
                        (grade.grade_pairs?.reduce((sum, p) => sum + p, 0) || 0);

                      return (
                        <Button
                          key={grade.id}
                          variant={isGradeSelected ? "default" : "outline"}
                          className="w-full justify-start h-auto py-3 px-4"
                          onClick={() => selectColorAndGrade(color, grade)}
                        >
                          <div className="w-full text-left space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {grade.grade_name || `Grade ${color}`}
                              </span>
                              {grade.stock && showStock && (
                                <Badge variant="outline" className="text-xs">
                                  {grade.stock} un
                                </Badge>
                              )}
                            </div>
                            
                            <div className="text-xs text-gray-600 flex items-center justify-between">
                              <span>{totalPairs} pares</span>
                              {showPrices && basePrice > 0 && (
                                <span className="font-semibold text-blue-600">
                                  {formatCurrency(basePrice * totalPairs)}
                                </span>
                              )}
                            </div>

                            {/* Tamanhos da Grade */}
                            {grade.grade_sizes && grade.grade_sizes.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Tamanhos: {grade.grade_sizes.slice(0, 4).join(', ')}
                                {grade.grade_sizes.length > 4 && `... (+${grade.grade_sizes.length - 4})`}
                              </div>
                            )}
                          </div>
                        </Button>
                      );
                    })}
                  </div>

                  {/* Grade Flexível (se aplicável) */}
                  {selectedVariation && 
                    selectedColor === color &&
                    hasFlexibleConfig(selectedVariation) &&
                    allowsMultiplePurchaseOptions(selectedVariation.flexible_grade_config!) && (
                    <div className="mt-4 pt-4 border-t">
                      <FlexibleGradeSelector
                        variation={selectedVariation}
                        onModeSelect={(mode) => console.log("Modo selecionado:", mode)}
                        onCustomSelection={(selection) => console.log("Seleção custom:", selection)}
                        basePrice={basePrice}
                        selectedMode="full"
                        showPrices={showPrices}
                      />
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ImprovedGradeSelector;

