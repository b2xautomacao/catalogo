
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Users, Package } from 'lucide-react';

interface VariationModeSelectorProps {
  mode: 'single' | 'multiple';
  onModeChange: (mode: 'single' | 'multiple') => void;
  variationCount: number;
}

const VariationModeSelector: React.FC<VariationModeSelectorProps> = ({
  mode,
  onModeChange,
  variationCount,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Package className="h-4 w-4" />
          Modo de Seleção
        </h4>
        <Badge variant="outline" className="text-xs">
          {variationCount} variações
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={mode === 'single' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('single')}
          className="flex items-center gap-2 h-auto p-3"
        >
          <User className="h-4 w-4" />
          <div className="text-left">
            <div className="text-sm font-medium">Uma Variação</div>
            <div className="text-xs opacity-75">Escolher apenas uma opção</div>
          </div>
        </Button>
        
        <Button
          variant={mode === 'multiple' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('multiple')}
          className="flex items-center gap-2 h-auto p-3"
        >
          <Users className="h-4 w-4" />
          <div className="text-left">
            <div className="text-sm font-medium">Múltiplas</div>
            <div className="text-xs opacity-75">Escolher várias opções</div>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default VariationModeSelector;
