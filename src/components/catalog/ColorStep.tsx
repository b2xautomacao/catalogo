
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { ProductVariation } from '@/types/product';
import { resolveColorHex } from '@/lib/colors';

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
  showStock?: boolean;
  onQuickAdd?: (variation: ProductVariation) => void;
}

const ColorStep: React.FC<ColorStepProps> = ({
  colorGroups,
  selectedColor,
  onColorSelect,
  showStock = true,
  onQuickAdd
}) => {
  const handleQuickAdd = (e: React.MouseEvent, colorGroup: ColorGroup) => {
    e.stopPropagation();
    if (onQuickAdd && colorGroup.variations.length === 1) {
      onQuickAdd(colorGroup.variations[0]);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg">Escolha a Cor</h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {colorGroups.map((colorGroup) => (
          <div
            key={colorGroup.color}
            className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
              selectedColor === colorGroup.color
                ? 'border-primary bg-primary/5'
                : colorGroup.isAvailable
                ? 'border-border hover:border-primary/50'
                : 'border-border opacity-50 cursor-not-allowed'
            }`}
            onClick={() => colorGroup.isAvailable && onColorSelect(colorGroup.color)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                  style={{ backgroundColor: resolveColorHex(colorGroup.color, colorGroup.variations[0]?.hex_color) }}
                />
                <div>
                  <div className="font-medium">{colorGroup.color}</div>
                  {showStock && (
                    <div className="text-sm text-muted-foreground">
                      {colorGroup.totalStock} disponível
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {colorGroup.variations.length} opções
                </Badge>
                
                {onQuickAdd && colorGroup.variations.length === 1 && colorGroup.isAvailable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleQuickAdd(e, colorGroup)}
                    className="h-8 w-8 p-0"
                    title="Adicionar rapidamente"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {!colorGroup.isAvailable && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <span className="text-sm font-medium text-muted-foreground">Indisponível</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorStep;
