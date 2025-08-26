
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Package } from 'lucide-react';
import { ProductVariation } from '@/types/product';

interface ColorGroup {
  color: string;
  totalStock: number;
  variations: ProductVariation[];
  isAvailable: boolean;
}

interface ColorStepProps {
  colorGroups: ColorGroup[];
  selectedColor: string | null;
  onColorSelect: (color: string) => void;
  loading?: boolean;
}

const ColorStep: React.FC<ColorStepProps> = ({
  colorGroups,
  selectedColor,
  onColorSelect,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <span className="font-medium">Carregando cores...</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (colorGroups.length === 0) {
    return (
      <div className="text-center py-8">
        <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Nenhuma cor disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-primary" />
        <h4 className="font-semibold text-lg">Selecione a Cor</h4>
        <Badge variant="outline" className="ml-auto">
          {colorGroups.length} cores
        </Badge>
      </div>

      {/* Color Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {colorGroups.map((colorGroup) => {
          const isSelected = selectedColor === colorGroup.color;
          
          return (
            <Button
              key={colorGroup.color}
              variant={isSelected ? "default" : "outline"}
              onClick={() => onColorSelect(colorGroup.color)}
              disabled={!colorGroup.isAvailable}
              className={`
                relative h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200
                ${!colorGroup.isAvailable ? "opacity-50" : ""}
                ${isSelected ? 
                  "border-2 border-primary bg-primary/10 shadow-md scale-[1.02] ring-2 ring-primary/20" : 
                  "hover:border-primary/50 hover:shadow-sm hover:bg-muted/50"
                }
              `}
            >
              {/* Color Preview */}
              <div className="w-8 h-8 rounded-full border-2 border-background shadow-sm flex-shrink-0">
                <div 
                  className="w-full h-full rounded-full"
                  style={{ 
                    backgroundColor: colorGroup.variations[0]?.hex_color || '#666666'
                  }}
                />
              </div>

              {/* Color Name */}
              <div className="text-center">
                <span className="font-medium text-sm">{colorGroup.color}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Package className="h-3 w-3" />
                  <span>{colorGroup.totalStock} disponível</span>
                </div>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-background rounded-full" />
                  </div>
                </div>
              )}

              {/* Unavailable overlay */}
              {!colorGroup.isAvailable && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                  <span className="text-xs font-medium text-destructive">Esgotado</span>
                </div>
              )}
            </Button>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          💡 Escolha uma cor para ver os tamanhos disponíveis
        </p>
      </div>
    </div>
  );
};

export default ColorStep;
