
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Ruler, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProductVariation } from '@/types/product';

interface SizeStepProps {
  selectedColor: string;
  availableVariations: ProductVariation[];
  selectedVariation: ProductVariation | null;
  onVariationSelect: (variation: ProductVariation) => void;
  onBackToColors: () => void;
  loading?: boolean;
}

const SizeStep: React.FC<SizeStepProps> = ({
  selectedColor,
  availableVariations,
  selectedVariation,
  onVariationSelect,
  onBackToColors,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4" />
          <span className="font-medium">Carregando tamanhos...</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (availableVariations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToColors}
            className="h-8 px-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar às cores
          </Button>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum tamanho disponível para {selectedColor}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToColors}
            className="h-8 px-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ 
              backgroundColor: availableVariations[0]?.hex_color || '#666666'
            }}
          />
          {selectedColor}
        </Badge>
      </div>

      {/* Title */}
      <div className="flex items-center gap-2">
        <Ruler className="h-5 w-5 text-primary" />
        <h4 className="font-semibold text-lg">Selecione o Tamanho</h4>
        <Badge variant="outline" className="ml-auto">
          {availableVariations.length} opções
        </Badge>
      </div>

      {/* Size Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {availableVariations.map((variation) => {
          const isSelected = selectedVariation?.id === variation.id;
          const isAvailable = variation.stock > 0;
          
          return (
            <Button
              key={variation.id}
              variant={isSelected ? "default" : "outline"}
              onClick={() => onVariationSelect(variation)}
              disabled={!isAvailable}
              className={`
                relative h-16 flex flex-col items-center justify-center gap-1 transition-all duration-200
                ${!isAvailable ? "opacity-50" : ""}
                ${isSelected ? 
                  "border-2 border-primary bg-primary/10 shadow-md scale-[1.05] ring-2 ring-primary/20" : 
                  "hover:border-primary/50 hover:shadow-sm hover:bg-muted/50"
                }
              `}
            >
              {/* Size */}
              <span className="font-semibold text-sm">
                {variation.size}
              </span>
              
              {/* Stock */}
              <div className="flex items-center gap-1 text-xs">
                <Package className="h-2.5 w-2.5" />
                <span className={isAvailable ? "text-muted-foreground" : "text-destructive"}>
                  {variation.stock}
                </span>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1">
                  <CheckCircle2 className="h-4 w-4 text-primary bg-background rounded-full" />
                </div>
              )}

              {/* Unavailable overlay */}
              {!isAvailable && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                  <AlertCircle className="h-3 w-3 text-destructive" />
                </div>
              )}
            </Button>
          );
        })}
      </div>

      {/* Selected variation info */}
      {selectedVariation && (
        <div className="p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">
                  {selectedColor} • Tamanho {selectedVariation.size}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedVariation.stock} unidades em estoque
                  {selectedVariation.sku && ` • SKU: ${selectedVariation.sku}`}
                </p>
              </div>
            </div>
            {selectedVariation.price_adjustment !== 0 && (
              <Badge variant={selectedVariation.price_adjustment > 0 ? "destructive" : "default"}>
                {selectedVariation.price_adjustment > 0 ? "+" : ""}
                R$ {selectedVariation.price_adjustment.toFixed(2)}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          ✨ Escolha um tamanho para continuar com o pedido
        </p>
      </div>
    </div>
  );
};

export default SizeStep;
