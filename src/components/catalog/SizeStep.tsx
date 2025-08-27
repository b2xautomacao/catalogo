
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

interface SizeGroup {
  size: string;
  variation: any;
  isAvailable: boolean;
}

interface SizeStepProps {
  sizeGroups: SizeGroup[];
  selectedSize: string | null;
  onSizeSelect: (size: string) => void;
  onBack: () => void;
  selectedColor: string;
  showStock?: boolean;
}

const SizeStep: React.FC<SizeStepProps> = ({
  sizeGroups,
  selectedSize,
  onSizeSelect,
  onBack,
  selectedColor,
  showStock = true
}) => {
  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar às cores
      </Button>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Escolha o tamanho para {selectedColor}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sizeGroups.map((sizeGroup) => (
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
