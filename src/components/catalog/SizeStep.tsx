
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus } from 'lucide-react';
import { ProductVariation } from '@/types/product';

interface SizeGroup {
  size: string;
  variation: ProductVariation;
  isAvailable: boolean;
}

interface SizeStepProps {
  sizeGroups: SizeGroup[];
  selectedSize: string | null;
  onSizeSelect: (size: string) => void;
  onBack: () => void;
  selectedColor: string;
  showStock?: boolean;
  onQuickAdd?: (variation: ProductVariation) => void;
  allowBack?: boolean;
}

const SizeStep: React.FC<SizeStepProps> = ({
  sizeGroups,
  selectedSize,
  onSizeSelect,
  onBack,
  selectedColor,
  showStock = true,
  onQuickAdd,
  allowBack = true
}) => {
  const handleQuickAdd = (e: React.MouseEvent, sizeGroup: SizeGroup) => {
    e.stopPropagation();
    if (onQuickAdd && sizeGroup.isAvailable) {
      onQuickAdd(sizeGroup.variation);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {allowBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        )}
        <h4 className="font-semibold text-lg">
          {allowBack ? `Escolha o Tamanho - ${selectedColor}` : 'Escolha o Tamanho'}
        </h4>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sizeGroups.map((sizeGroup) => (
          <div
            key={sizeGroup.size}
            className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
              selectedSize === sizeGroup.size
                ? 'border-primary bg-primary/5'
                : sizeGroup.isAvailable
                ? 'border-border hover:border-primary/50'
                : 'border-border opacity-50 cursor-not-allowed'
            }`}
            onClick={() => sizeGroup.isAvailable && onSizeSelect(sizeGroup.size)}
          >
            <div className="text-center">
              <div className="font-medium text-lg">{sizeGroup.size}</div>
              {showStock && (
                <div className="text-sm text-muted-foreground mt-1">
                  {sizeGroup.variation.stock} disponível
                </div>
              )}
              
              {onQuickAdd && sizeGroup.isAvailable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleQuickAdd(e, sizeGroup)}
                  className="mt-2 h-6 w-6 p-0"
                  title="Adicionar rapidamente"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>

            {!sizeGroup.isAvailable && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                <span className="text-xs font-medium text-muted-foreground">Indisponível</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SizeStep;
