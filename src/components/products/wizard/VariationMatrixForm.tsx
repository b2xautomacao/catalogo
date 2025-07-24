
import React from 'react';
import { ProductVariation } from '@/types/product';
import { Card, CardContent } from '@/components/ui/card';
import { Grid3X3 } from 'lucide-react';

interface VariationMatrixFormProps {
  variations: ProductVariation[];
  onVariationsChange: (variations: ProductVariation[]) => void;
  groups?: any[];
  values?: any[];
}

const VariationMatrixForm: React.FC<VariationMatrixFormProps> = ({
  variations,
  onVariationsChange,
  groups = [],
  values = []
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Grid3X3 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Matriz de Variações
            </h3>
            <p className="text-gray-600 mt-2">
              Use o sistema de grades para uma configuração mais eficiente.
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

export default VariationMatrixForm;
