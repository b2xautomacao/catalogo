
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ColorGroup {
  color: string;
  totalStock: number;
  variations: any[];
  isAvailable: boolean;
}

interface ColorStepProps {
  colorGroups: ColorGroup[];
  selectedColor: string | null;
  onColorSelect: (color: string) => void;
  showStock?: boolean;
  loading?: boolean;
}

const ColorStep: React.FC<ColorStepProps> = ({
  colorGroups,
  selectedColor,
  onColorSelect,
  showStock = true,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Escolha a cor
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center p-4 h-auto border rounded animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-16 mb-1" />
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
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Escolha a cor
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {colorGroups.map((colorGroup) => (
            <Button
              key={colorGroup.color}
              variant={selectedColor === colorGroup.color ? "default" : "outline"}
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => colorGroup.isAvailable && onColorSelect(colorGroup.color)}
              disabled={!colorGroup.isAvailable}
            >
              <div 
                className="w-8 h-8 rounded-full border-2 border-background shadow-sm mb-2"
                style={{ 
                  backgroundColor: colorGroup.variations[0]?.hex_color || '#666',
                  opacity: colorGroup.isAvailable ? 1 : 0.5 
                }}
              />
              <span className="text-sm font-medium">{colorGroup.color}</span>
              {showStock && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {colorGroup.totalStock} em estoque
                </Badge>
              )}
              {!colorGroup.isAvailable && (
                <Badge variant="destructive" className="text-xs mt-1">
                  Indisponível
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorStep;
