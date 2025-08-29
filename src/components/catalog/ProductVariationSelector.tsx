
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductVariation } from "@/types/variation";
import { Package, Palette } from "lucide-react";
import GradeVariationCard from "./GradeVariationCard";
import VariationInfoPanel from "./VariationInfoPanel";
import VariationSelectionAlert from "./VariationSelectionAlert";

interface ProductVariationSelectorProps {
  variations: ProductVariation[];
  selectedVariation: ProductVariation | null;
  onVariationChange: (variation: ProductVariation | null) => void;
  loading?: boolean;
  basePrice?: number;
  showPriceInCards?: boolean;
}

const ProductVariationSelector: React.FC<ProductVariationSelectorProps> = ({
  variations,
  selectedVariation,
  onVariationChange,
  loading = false,
  basePrice = 0,
  showPriceInCards = false,
}) => {
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

  // Calcular informações sobre tipos de variação
  const colors = [
    ...new Set(variations.filter((v) => v.color).map((v) => v.color)),
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

  if (hasGradeVariations) {
    // Renderizar seletor para variações de grade
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
            />
          ))}
        </div>

        {/* Informações da variação selecionada */}
        {selectedVariation && (
          <VariationInfoPanel
            variation={selectedVariation}
            basePrice={basePrice}
            showAdvancedInfo={true}
          />
        )}
      </div>
    );
  }

  // Renderizar seletor tradicional para variações normais
  const getVariationsForAttributes = (color?: string, size?: string) => {
    return variations.filter(
      (v) => (!color || v.color === color) && (!size || v.size === size)
    );
  };

  const getAvailableStock = (color?: string, size?: string) => {
    const matchingVariations = getVariationsForAttributes(color, size);
    return matchingVariations.reduce((total, v) => total + v.stock, 0);
  };

  const handleAttributeSelection = (color?: string, size?: string) => {
    const matchingVariations = getVariationsForAttributes(color, size);

    if (matchingVariations.length === 1) {
      onVariationChange(matchingVariations[0]);
    } else if (matchingVariations.length > 1) {
      // Se há múltiplas variações, escolher a primeira disponível
      const availableVariation = matchingVariations.find((v) => v.stock > 0);
      onVariationChange(availableVariation || matchingVariations[0]);
    } else {
      onVariationChange(null);
    }
  };

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
              const isSelected = selectedVariation?.color === color;
              const stock = getAvailableStock(
                color as string,
                selectedVariation?.size || undefined
              );
              const isAvailable = stock > 0;

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
                  disabled={!isAvailable}
                  className={`relative h-12 ${
                    !isAvailable ? "opacity-50" : ""
                  } ${
                    isSelected
                      ? "border-primary shadow-md"
                      : "hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-medium">{color}</span>
                    <span className="text-xs text-muted-foreground">
                      Disponível
                    </span>
                  </div>
                  {!isAvailable && (
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
            Pares
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
                  disabled={!isAvailable}
                  className={`relative h-12 ${
                    !isAvailable ? "opacity-50" : ""
                  } ${
                    isSelected
                      ? "border-primary shadow-md"
                      : "hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-medium">{size}</span>
                    <span className="text-xs text-muted-foreground">
                      Disponível
                    </span>
                  </div>
                  {!isAvailable && (
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
        />
      )}
    </div>
  );
};

export default ProductVariationSelector;
