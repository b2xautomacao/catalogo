
import React from 'react';
import { ProductVariation } from '@/types/product';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';

interface VariationWizardPanelProps {
  variations: ProductVariation[];
  onVariationsChange: (variations: ProductVariation[]) => void;
  groups?: any[];
  values?: any[];
  loading?: boolean;
}

const VariationWizardPanel: React.FC<VariationWizardPanelProps> = ({
  variations,
  onVariationsChange,
  groups = [],
  values = [],
  loading = false
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Wand2 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Assistente de Variações
            </h3>
            <p className="text-gray-600 mt-2">
              Use o sistema de grades para configurar suas variações de forma mais eficiente.
            </p>
          </div>
          <div className="pt-4">
            <p className="text-sm text-gray-500">
              Para configurar variações, utilize a aba "Grade" ao lado.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VariationWizardPanel;
