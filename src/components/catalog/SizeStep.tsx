
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { ProductVariation } from '@/types/product';

interface SizeGroup {
  size: string;
  variation: any;
  isAvailable: boolean;
}

interface SizeStepProps {
  sizeGroups?: SizeGroup[];
  selectedSize: string | null;
  onSizeSelect: (size: string) => void;
  onBack: () => void;
  selectedColor: string;
  showStock?: boolean;
  loading?: boolean;
  // Props alternativas para HierarchicalVariationSelector
  availableVariations?: ProductVariation[];
  selectedVariation?: ProductVariation | null;
  onVariationSelect?: (variation: ProductVariation) => void;
  onBackToColors?: () => void;
}

const SizeStep: React.FC<SizeStepProps> = ({
  sizeGroups,
  selectedSize,
  onSizeSelect,
  onBack,
  selectedColor,
  showStock = true,
  loading = false,
  // Props alternativas
  availableVariations,
  selectedVariation,
  onVariationSelect,
  onBackToColors
}) => {
  // Se estamos usando availableVariations (HierarchicalVariationSelector)
  if (availableVariations && onVariationSelect) {
    const backHandler = onBackToColors || onBack;
    
    if (loading) {
      return (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={backHandler} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar às cores
          </Button>
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Escolha o tamanho para {selectedColor}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center p-4 h-auto border rounded animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-8 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={backHandler} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar às cores
        </Button>

        <div>
          <h3 className="text-lg font-semibold mb-4">
            Escolha o tamanho para {selectedColor}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {availableVariations.map((variation) => (
              <Button
                key={variation.id}
                variant={selectedVariation?.id === variation.id ? "default" : "outline"}
                className="flex flex-col items-center p-4 h-auto"
                onClick={() => (variation.stock || 0) > 0 && onVariationSelect(variation)}
                disabled={(variation.stock || 0) === 0}
              >
                <span className="text-lg font-bold mb-1">{variation.size || 'Único'}</span>
                {showStock && (variation.stock || 0) > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {variation.stock} disponível
                  </Badge>
                )}
                {(variation.stock || 0) === 0 && (
                  <Badge variant="destructive" className="text-xs">
                    Esgotado
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Uso normal com sizeGroups (HierarchicalColorSizeSelector)
  if (loading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar às cores
        </Button>
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Escolha o tamanho para {selectedColor}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center p-4 h-auto border rounded animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-8 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar às cores
      </Button>

      <div>
        <h3 className="text-lg font-semibold mb-4">
          Escolha o tamanho para {selectedColor}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(sizeGroups || []).map((sizeGroup) => (
            <Button
              key={sizeGroup.size}
              variant={selectedSize === sizeGroup.size ? "default" : "outline"}
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => sizeGroup.isAvailable && onSizeSelect(sizeGroup.size)}
              disabled={!sizeGroup.isAvailable}
            >
              <span className="text-lg font-bold mb-1">{sizeGroup.size}</span>
              {showStock && sizeGroup.isAvailable && (
                <Badge variant="secondary" className="text-xs">
                  {sizeGroup.variation.stock} disponível
                </Badge>
              )}
              {!sizeGroup.isAvailable && (
                <Badge variant="destructive" className="text-xs">
                  Esgotado
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SizeStep;
