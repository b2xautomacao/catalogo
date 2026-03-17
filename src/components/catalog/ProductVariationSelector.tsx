
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductVariation } from "@/types/variation";
import { Package, Palette } from "lucide-react";
import GradeVariationCard from "./GradeVariationCard";
import VariationInfoPanel from "./VariationInfoPanel";
import VariationSelectionAlert from "./VariationSelectionAlert";
import FlexibleGradeSelector from "./FlexibleGradeSelector";
import GradeFirstSelector from "./GradeFirstSelector";
import { hasFlexibleConfig, allowsMultiplePurchaseOptions } from "@/types/flexible-grade";
import type { CustomGradeSelection } from "@/types/flexible-grade";

interface ProductVariationSelectorProps {
  variations: ProductVariation[];
  selectedVariation: ProductVariation | null;
  onVariationChange: (variation: ProductVariation | null) => void;
  loading?: boolean;
  basePrice?: number;
  showPriceInCards?: boolean;
  showStock?: boolean;
  // 🔴 NOVO: Callbacks para expor estado de grade flexível
  onFlexibleGradeModeChange?: (mode: 'full' | 'half' | 'custom') => void;
  onCustomSelectionChange?: (selection: CustomGradeSelection | null) => void;
  // 🔴 NOVO: Callback para adicionar ao carrinho diretamente (para novo fluxo)
  onAddToCart?: (
    variation: ProductVariation,
    gradeMode: 'full' | 'half' | 'custom',
    customSelection?: CustomGradeSelection
  ) => void;
  // 🔴 NOVO: Cores já adicionadas ao carrinho (para sugestões)
  addedColors?: string[];
}

const ProductVariationSelector: React.FC<ProductVariationSelectorProps> = ({
  variations,
  selectedVariation,
  onVariationChange,
  loading = false,
  basePrice = 0,
  showPriceInCards = false,
  showStock = false,
  onFlexibleGradeModeChange,
  onCustomSelectionChange,
  onAddToCart,
  addedColors = [],
}) => {
  // Estado para grade flexível
  const [flexibleGradeMode, setFlexibleGradeMode] = useState<'full' | 'half' | 'custom'>('full');
  const [customSelection, setCustomSelection] = useState<CustomGradeSelection | null>(null);
  
  // 🔴 CORREÇÃO: Atualizar callbacks quando o modo ou seleção customizada mudar
  const handleModeSelect = (mode: 'full' | 'half' | 'custom') => {
    setFlexibleGradeMode(mode);
    if (onFlexibleGradeModeChange) {
      onFlexibleGradeModeChange(mode);
    }
  };
  
  const handleCustomSelection = (selection: CustomGradeSelection | null) => {
    setCustomSelection(selection);
    if (onCustomSelectionChange) {
      onCustomSelectionChange(selection);
    }
  };
  
  // 🔴 CORREÇÃO: Resetar modo quando a variação selecionada mudar
  React.useEffect(() => {
    if (selectedVariation) {
      setFlexibleGradeMode('full');
      setCustomSelection(null);
    }
  }, [selectedVariation?.id]);
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-20" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!variations || variations.length === 0) {
    return null;
  }

  // Verificar se são variações de grade
  const hasGradeVariations = variations.some(
    (v) => v.variation_type === "grade" || v.is_grade
  );
  
  console.log("🔍 ProductVariationSelector - Detecção de grades:", {
    totalVariations: variations.length,
    hasGradeVariations,
    variations: variations.map(v => ({
      id: v.id,
      is_grade: v.is_grade,
      variation_type: v.variation_type,
      grade_name: v.grade_name,
      color: v.grade_color || v.color || (v.hex_color ? `Cor ${v.hex_color}` : 'Sem Cor'),
    })),
    hasOnAddToCart: !!onAddToCart,
  });

  // Calcular informações sobre tipos de variação
  const colors = [
    ...new Set(
      variations
        .filter((v) => v.color || v.hex_color)
        .map((v) => v.color || v.hex_color || "Sem Cor") // Prioriza color, depois hex_color, fallback para "Sem Cor"
    ),
  ];
  const sizes = [
    ...new Set(variations.filter((v) => v.size).map((v) => v.size)),
  ];
  const grades = variations.filter(
    (v) => v.is_grade || v.variation_type === "grade"
  );

  const variationInfo = {
    hasColors: colors.length > 0,
    hasSizes: sizes.length > 0,
    hasGrades: grades.length > 0,
    colorCount: colors.length,
    sizeCount: sizes.length,
    gradeCount: grades.length,
  };

  // 🐛 DEBUG: Log apenas se houver problema (menos de 2 cores ou tamanhos)
  if (colors.length < 2 && sizes.length < 2 && variations.length > 1) {
    console.warn("🚨 PROBLEMA: Produto com múltiplas variações mas poucas cores/tamanhos:", {
      totalVariations: variations.length,
      colors: colors.length,
      sizes: sizes.length,
      variations: variations.map(v => ({ color: v.color, size: v.size, is_grade: v.is_grade }))
    });
  }

  if (hasGradeVariations) {
    // 🔴 NOVO: Sempre usar novo fluxo para grades (melhor UX)
    // Se tem callback onAddToCart, usar GradeFirstSelector completo
    if (onAddToCart) {
      console.log("✅ ProductVariationSelector - Usando GradeFirstSelector (novo fluxo)", {
        gradesCount: grades.length,
        hasOnAddToCart: !!onAddToCart,
        addedColorsCount: addedColors?.length || 0,
        grades: grades.map(g => ({
          id: g.id?.substring(0, 8),
          grade_name: g.grade_name,
          grade_color: g.grade_color,
        })),
      });
      return (
        <GradeFirstSelector
          variations={grades}
          basePrice={basePrice}
          onAddToCart={onAddToCart}
          showPrices={showPriceInCards}
          showStock={showStock}
          addedColors={addedColors || []}
        />
      );
    }
    
    console.log("⚠️ ProductVariationSelector - onAddToCart não fornecido, usando fluxo antigo", {
      gradesCount: grades.length,
      onAddToCart: typeof onAddToCart,
    });
    
    // Fluxo antigo (compatibilidade)
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <h4 className="font-semibold text-base sm:text-lg flex items-center gap-2">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Selecione a Grade
          </h4>
          <Badge
            variant="outline"
            className="text-xs sm:text-sm self-start sm:self-center"
          >
            {variations.length} opções
          </Badge>
        </div>

        {/* Alert de seleção */}
        {!selectedVariation && (
          <VariationSelectionAlert
            type="select"
            variationCount={variations.length}
            hasGrades={variationInfo.hasGrades}
            hasColors={variationInfo.hasColors}
            hasSizes={variationInfo.hasSizes}
          />
        )}

        {/* Grade Cards */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {variations.map((variation) => (
            <GradeVariationCard
              key={variation.id}
              variation={variation}
              isSelected={selectedVariation?.id === variation.id}
              onSelect={() => onVariationChange(variation)}
              showPrice={showPriceInCards}
              basePrice={basePrice}
              showStock={showStock}
            />
          ))}
        </div>

        {/* Informações da variação selecionada */}
        {selectedVariation && (
          <VariationInfoPanel
            variation={selectedVariation}
            basePrice={basePrice}
            showAdvancedInfo={true}
            showStock={showStock}
          />
        )}

        {/* Seletor de Grade Flexível (se disponível) */}
        {selectedVariation && (() => {
          // 🔴 CORREÇÃO: Verificar se é realmente uma grade antes de mostrar opções flexíveis
          const isGradeVariation = selectedVariation.is_grade || 
                                   selectedVariation.variation_type === "grade" ||
                                   (selectedVariation.grade_name && selectedVariation.grade_sizes);
          
          const hasConfig = hasFlexibleConfig(selectedVariation);
          const allowsMultiple = selectedVariation.flexible_grade_config 
            ? allowsMultiplePurchaseOptions(selectedVariation.flexible_grade_config)
            : false;
          
          // 🔍 DEBUG: Log detalhado
          console.log("🔍 FlexibleGradeSelector - Verificação:", {
            isGradeVariation,
            gradeSelected: selectedVariation.grade_name,
            hasConfig,
            allowsMultiple,
            config: selectedVariation.flexible_grade_config,
            is_grade: selectedVariation.is_grade,
            variation_type: selectedVariation.variation_type,
            willRender: isGradeVariation && hasConfig && allowsMultiple,
          });
          
          // 🔴 CORREÇÃO: Só mostrar se for realmente uma grade
          if (isGradeVariation && hasConfig && allowsMultiple) {
            return (
              <FlexibleGradeSelector
                variation={selectedVariation}
                allVariations={variations}
                onModeSelect={handleModeSelect}
                onCustomSelection={handleCustomSelection}
                basePrice={basePrice}
                selectedMode={flexibleGradeMode}
                showPrices={showPriceInCards}
              />
            );
          }
          
          // Se for produto unitário, não mostrar opções de grade
          if (!isGradeVariation) {
            console.log("ℹ️ ProductVariationSelector - Produto unitário detectado, não mostrando grade flexível");
          }
          
          return null;
        })()}
      </div>
    );
  }

  // Renderizar seletor tradicional para variações normais
  const getVariationsForAttributes = (color?: string, size?: string) => {
    return variations.filter(
      (v) => (!color || (v.color === color || v.hex_color === color)) && (!size || v.size === size)
    );
  };

  const getAvailableStock = (color?: string, size?: string) => {
    const matchingVariations = getVariationsForAttributes(color, size);
    return matchingVariations.reduce((total, v) => total + (v.stock || 0), 0);
  };

  const handleAttributeSelection = (color?: string, size?: string) => {
    const matchingVariations = getVariationsForAttributes(color, size);

    if (matchingVariations.length === 1) {
      onVariationChange(matchingVariations[0]);
    } else if (matchingVariations.length > 1) {
      // Se há múltiplas variações, escolher a primeira disponível
      const availableVariation = matchingVariations.find((v) => (v.stock || 0) > 0);
      onVariationChange(availableVariation || matchingVariations[0]);
    } else {
      onVariationChange(null);
    }
  };

  // 🔍 DEBUG: Log quando cai no fluxo antigo
  console.log("⚠️ ProductVariationSelector - CAINDO NO FLUXO ANTIGO (cores primeiro):", {
    hasGradeVariations,
    gradesCount: grades.length,
    hasOnAddToCart: !!onAddToCart,
    colorsCount: colors.length,
    sizesCount: sizes.length,
    variations: variations.map(v => ({
      id: v.id?.substring(0, 8),
      is_grade: v.is_grade,
      variation_type: v.variation_type,
      color: v.color,
    })),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Opções Disponíveis
        </h4>
        <Badge variant="outline" className="text-sm">
          {variations.length} variações
        </Badge>
      </div>

      {/* Alert de seleção */}
      {!selectedVariation && (
        <VariationSelectionAlert
          type="select"
          variationCount={variations.length}
          hasColors={variationInfo.hasColors}
          hasSizes={variationInfo.hasSizes}
        />
      )}

      {/* Color Selection */}
      {colors.length > 0 && (
        <div className="space-y-3">
          <h5 className="font-medium text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Cor
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {colors.map((color) => {
              const isSelected = selectedVariation?.color === color || selectedVariation?.hex_color === color;
              const stock = getAvailableStock(
                color as string,
                selectedVariation?.size || undefined
              );
              const isAvailable = stock > 0;
              const displayColor = variations.find(v => v.color === color || v.hex_color === color);

              return (
                <Button
                  key={color}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    handleAttributeSelection(
                      color as string,
                      selectedVariation?.size || undefined
                    )
                  }
                  disabled={showStock && !isAvailable}
                  className={`relative h-12 transition-all ${
                    showStock && !isAvailable ? "opacity-50" : ""
                  } ${
                    isSelected
                      ? "border-2 border-primary shadow-lg bg-primary text-primary-foreground font-semibold"
                      : "hover:border-primary/70 hover:bg-primary/5 border-gray-300 bg-white text-gray-900"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      {displayColor?.hex_color && (
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                          style={{ backgroundColor: displayColor.hex_color }}
                        />
                      )}
                      <span className={`font-semibold ${isSelected ? "text-white" : "text-gray-900"}`}>
                        {displayColor?.color || displayColor?.hex_color || color}
                      </span>
                    </div>
                    {showStock && (
                      <span className={`text-xs ${isSelected ? "text-primary-foreground/80" : "text-gray-600"}`}>
                        {isAvailable ? "Disponível" : "Indisponível"}
                      </span>
                    )}
                  </div>
                  {showStock && !isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-px bg-destructive transform rotate-45" />
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {sizes.length > 0 && (
        <div className="space-y-3">
          <h5 className="font-medium text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Tamanho
          </h5>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {sizes.map((size) => {
              const isSelected = selectedVariation?.size === size;
              const stock = getAvailableStock(
                selectedVariation?.color || undefined,
                size as string
              );
              const isAvailable = stock > 0;

              return (
                <Button
                  key={size}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    handleAttributeSelection(
                      selectedVariation?.color || undefined,
                      size as string
                    )
                  }
                  disabled={showStock && !isAvailable}
                  className={`relative h-12 transition-all ${
                    showStock && !isAvailable ? "opacity-50" : ""
                  } ${
                    isSelected
                      ? "border-2 border-primary shadow-lg bg-primary text-primary-foreground font-semibold"
                      : "hover:border-primary/70 hover:bg-primary/5 border-gray-300 bg-white text-gray-900"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className={`font-semibold ${isSelected ? "text-white" : "text-gray-900"}`}>
                      {size}
                    </span>
                    {showStock && (
                      <span className={`text-xs ${isSelected ? "text-primary-foreground/80" : "text-gray-600"}`}>
                        {isAvailable ? "Disponível" : "Indisponível"}
                      </span>
                    )}
                  </div>
                  {showStock && !isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-px bg-destructive transform rotate-45" />
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Variation Info */}
      {selectedVariation && (
        <VariationInfoPanel
          variation={selectedVariation}
          basePrice={basePrice}
          showAdvancedInfo={false}
          showStock={showStock}
        />
      )}
    </div>
  );
};

export default ProductVariationSelector;
