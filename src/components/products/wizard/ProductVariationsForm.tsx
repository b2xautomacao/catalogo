
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import ProductVariationsManager, { ProductVariation } from '../ProductVariationsManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

interface ProductVariationsFormProps {
  form: UseFormReturn<any>;
  variations: ProductVariation[];
  onVariationsChange: (variations: ProductVariation[]) => void;
}

const ProductVariationsForm: React.FC<ProductVariationsFormProps> = ({
  form,
  variations,
  onVariationsChange
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Variações do Produto</h3>
        <p className="text-sm text-muted-foreground">
          Adicione variações como tamanhos, cores ou materiais para seu produto.
          Cada variação pode ter ajuste de preço e estoque próprio.
        </p>
      </div>

      <ProductVariationsManager
        variations={variations}
        onChange={onVariationsChange}
      />

      {variations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resumo das Variações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Total de variações: {variations.length}</p>
              <p>Estoque total das variações: {variations.reduce((sum, v) => sum + v.stock, 0)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductVariationsForm;
