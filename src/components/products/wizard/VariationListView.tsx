
import React from 'react';
import { ProductVariation } from '@/types/product';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { List, Edit, Trash2, Package } from 'lucide-react';

interface VariationListViewProps {
  variations: ProductVariation[];
  onVariationsChange: (variations: ProductVariation[]) => void;
}

const VariationListView: React.FC<VariationListViewProps> = ({
  variations,
  onVariationsChange
}) => {
  const updateVariation = (index: number, updates: Partial<ProductVariation>) => {
    const updated = variations.map((variation, i) => 
      i === index ? { ...variation, ...updates } : variation
    );
    onVariationsChange(updated);
  };

  const removeVariation = (index: number) => {
    const updated = variations.filter((_, i) => i !== index);
    onVariationsChange(updated);
  };

  if (variations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <List className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Nenhuma Variação Criada
              </h3>
              <p className="text-gray-600 mt-2">
                Use a aba "Grade" para criar variações do seu produto.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Lista de Variações ({variations.length})
        </h3>
        <Badge variant="secondary">
          {variations.filter(v => v.stock > 0).length} com estoque
        </Badge>
      </div>

      <div className="grid gap-4">
        {variations.map((variation, index) => (
          <Card key={variation.id || index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {[variation.color, variation.size, variation.material]
                    .filter(Boolean)
                    .join(' - ') || 'Variação sem nome'}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeVariation(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`stock-${index}`}>Estoque</Label>
                  <Input
                    id={`stock-${index}`}
                    type="number"
                    value={variation.stock}
                    onChange={(e) => updateVariation(index, { 
                      stock: parseInt(e.target.value) || 0 
                    })}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor={`price-${index}`}>Ajuste de Preço (R$)</Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    step="0.01"
                    value={variation.price_adjustment}
                    onChange={(e) => updateVariation(index, { 
                      price_adjustment: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor={`sku-${index}`}>SKU</Label>
                  <Input
                    id={`sku-${index}`}
                    type="text"
                    value={variation.sku}
                    onChange={(e) => updateVariation(index, { 
                      sku: e.target.value 
                    })}
                    placeholder="Código único"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VariationListView;
