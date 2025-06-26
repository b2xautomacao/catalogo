
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductVariation } from '@/types/variation';

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
  console.log('🎨 SELECTOR - Recebendo variações:', {
    total: variations?.length || 0,
    variations: variations?.map(v => ({
      id: v.id,
      color: v.color,
      size: v.size,
      stock: v.stock,
      hasImage: !!v.image_url
    })) || [],
    selectedVariation: selectedVariation ? {
      id: selectedVariation.id,
      color: selectedVariation.color,
      size: selectedVariation.size
    } : null
  });

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

  if (!variations || variations.length === 0) {
    console.log('⚠️ SELECTOR - Nenhuma variação disponível');
    return null;
  }

  // Agrupar variações por atributos
  const colors = [...new Set(variations.filter(v => v.color).map(v => v.color))];
  const sizes = [...new Set(variations.filter(v => v.size).map(v => v.size))];

  console.log('🎨 SELECTOR - Atributos agrupados:', {
    colors: colors.length,
    sizes: sizes.length,
    colorsArray: colors,
    sizesArray: sizes
  });

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
    
    console.log('🎯 SELECTOR - Seleção de atributo:', {
      color,
      size,
      matchingVariations: matchingVariations.length,
      variations: matchingVariations.map(v => ({ id: v.id, stock: v.stock }))
    });
    
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
              const stock = getAvailableStock(color as string, selectedVariation?.size || undefined);
              const isAvailable = stock > 0;

              return (
                <Button
                  key={color}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAttributeSelection(color as string, selectedVariation?.size || undefined)}
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
              const stock = getAvailableStock(selectedVariation?.color || undefined, size as string);
              const isAvailable = stock > 0;

              return (
                <Button
                  key={size}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAttributeSelection(selectedVariation?.color || undefined, size as string)}
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
            <div className="flex gap-2 items-center">
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
            <div className="text-sm flex items-center gap-2">
              <span className="font-medium">{selectedVariation.stock} em estoque</span>
              {selectedVariation.price_adjustment !== 0 && (
                <span className="text-primary">
                  {selectedVariation.price_adjustment > 0 ? '+' : ''}
                  R$ {selectedVariation.price_adjustment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>
          
          {/* Mostrar imagem da variação se disponível */}
          {selectedVariation.image_url && (
            <div className="mt-2">
              <img
                src={selectedVariation.image_url}
                alt={`${selectedVariation.color || ''} ${selectedVariation.size || ''}`.trim()}
                className="w-16 h-16 object-cover rounded border"
              />
            </div>
          )}
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
          <strong>🐛 DEBUG SELECTOR:</strong>
          <div>Total variações: {variations.length}</div>
          <div>Cores disponíveis: {colors.join(', ') || 'Nenhuma'}</div>
          <div>Tamanhos disponíveis: {sizes.join(', ') || 'Nenhum'}</div>
          <div>Variação selecionada: {selectedVariation ? `${selectedVariation.color || 'S/C'} ${selectedVariation.size || 'S/T'}` : 'Nenhuma'}</div>
        </div>
      )}
    </div>
  );
};

export default ProductVariationSelector;
