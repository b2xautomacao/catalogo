
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductVariation } from '@/hooks/useProductVariations';

interface ProductVariationSelectorProps {
  variations: ProductVariation[];
  selectedVariation: ProductVariation | null;
  onVariationChange: (variation: ProductVariation | null) => void;
  loading?: boolean;
}

const ProductVariationSelector: React.FC<ProductVariationSelectorProps> = ({
  variations,
  selectedVariation,
  onVariationChange,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-2 flex-wrap">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-20" />
          ))}
        </div>
      </div>
    );
  }

  if (variations.length === 0) {
    return null;
  }

  // Agrupar variações por atributos
  const colors = [...new Set(variations.filter(v => v.color).map(v => v.color))];
  const sizes = [...new Set(variations.filter(v => v.size).map(v => v.size))];

  const getVariationsForAttributes = (color?: string, size?: string) => {
    return variations.filter(v => 
      (!color || v.color === color) && 
      (!size || v.size === size)
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
      const availableVariation = matchingVariations.find(v => v.stock > 0);
      onVariationChange(availableVariation || matchingVariations[0]);
    } else {
      onVariationChange(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Color Selection */}
      {colors.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Cor</h4>
          <div className="flex gap-2 flex-wrap">
            {colors.map((color) => {
              const isSelected = selectedVariation?.color === color;
              const stock = getAvailableStock(color, selectedVariation?.size);
              const isAvailable = stock > 0;

              return (
                <Button
                  key={color}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAttributeSelection(color, selectedVariation?.size)}
                  disabled={!isAvailable}
                  className={`relative ${!isAvailable ? 'opacity-50' : ''}`}
                >
                  {color}
                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-px bg-gray-400 transform rotate-45" />
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
        <div>
          <h4 className="font-medium mb-2">Tamanho</h4>
          <div className="flex gap-2 flex-wrap">
            {sizes.map((size) => {
              const isSelected = selectedVariation?.size === size;
              const stock = getAvailableStock(selectedVariation?.color, size);
              const isAvailable = stock > 0;

              return (
                <Button
                  key={size}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAttributeSelection(selectedVariation?.color, size)}
                  disabled={!isAvailable}
                  className={`relative ${!isAvailable ? 'opacity-50' : ''}`}
                >
                  {size}
                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-px bg-gray-400 transform rotate-45" />
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
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {selectedVariation.color && (
                <Badge variant="outline">{selectedVariation.color}</Badge>
              )}
              {selectedVariation.size && (
                <Badge variant="outline">{selectedVariation.size}</Badge>
              )}
              {selectedVariation.sku && (
                <Badge variant="outline">SKU: {selectedVariation.sku}</Badge>
              )}
            </div>
            <div className="text-sm">
              <span className="font-medium">{selectedVariation.stock} em estoque</span>
              {selectedVariation.price_adjustment !== 0 && (
                <span className="ml-2 text-primary">
                  {selectedVariation.price_adjustment > 0 ? '+' : ''}
                  R$ {selectedVariation.price_adjustment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariationSelector;
