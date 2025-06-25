
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Image } from 'lucide-react';
import { ProductVariation } from '@/hooks/useProductFormWizard';
import VariationImageUpload from './VariationImageUpload';

interface ProductVariationsManagerProps {
  variations: ProductVariation[];
  onChange: (variations: ProductVariation[]) => void;
}

const ProductVariationsManager: React.FC<ProductVariationsManagerProps> = ({
  variations,
  onChange
}) => {
  const [showForm, setShowForm] = useState(false);

  const addVariation = () => {
    const newVariation: ProductVariation = {
      color: '',
      size: '',
      sku: '',
      stock: 0,
      price_adjustment: 0,
      is_active: true,
      image_url: ''
    };
    
    onChange([...variations, newVariation]);
    setShowForm(true);
  };

  const updateVariation = (index: number, updates: Partial<ProductVariation>) => {
    const updatedVariations = variations.map((variation, i) => 
      i === index ? { ...variation, ...updates } : variation
    );
    onChange(updatedVariations);
  };

  const removeVariation = (index: number) => {
    const updatedVariations = variations.filter((_, i) => i !== index);
    onChange(updatedVariations);
    if (updatedVariations.length === 0) {
      setShowForm(false);
    }
  };

  const handleImageUpload = (index: number, file: File) => {
    // Criar URL temporária para preview
    const previewUrl = URL.createObjectURL(file);
    updateVariation(index, { 
      image_file: file,
      image_url: previewUrl
    });
  };

  const handleImageRemove = (index: number) => {
    updateVariation(index, { 
      image_file: undefined,
      image_url: ''
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Variações do Produto</h3>
          <p className="text-sm text-muted-foreground">
            Adicione diferentes opções como cores, tamanhos ou materiais
          </p>
        </div>
        <Button onClick={addVariation} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Variação
        </Button>
      </div>

      {variations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Nenhuma variação criada</h3>
            <p className="text-sm text-gray-500 mb-4 text-center">
              Variações permitem oferecer o mesmo produto em diferentes opções
            </p>
            <Button onClick={addVariation} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira variação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {variations.map((variation, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Variação {index + 1}
                    {!variation.is_active && (
                      <Badge variant="secondary" className="ml-2">Inativa</Badge>
                    )}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariation(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`color-${index}`}>Cor</Label>
                    <Input
                      id={`color-${index}`}
                      value={variation.color || ''}
                      onChange={(e) => updateVariation(index, { color: e.target.value })}
                      placeholder="Ex: Azul, Vermelho"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`size-${index}`}>Tamanho</Label>
                    <Input
                      id={`size-${index}`}
                      value={variation.size || ''}
                      onChange={(e) => updateVariation(index, { size: e.target.value })}
                      placeholder="Ex: P, M, G, GG"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`sku-${index}`}>SKU</Label>
                    <Input
                      id={`sku-${index}`}
                      value={variation.sku || ''}
                      onChange={(e) => updateVariation(index, { sku: e.target.value })}
                      placeholder="Código único"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`stock-${index}`}>Estoque</Label>
                    <Input
                      id={`stock-${index}`}
                      type="number"
                      min="0"
                      value={variation.stock}
                      onChange={(e) => updateVariation(index, { stock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`price-adjustment-${index}`}>Ajuste de Preço (R$)</Label>
                    <Input
                      id={`price-adjustment-${index}`}
                      type="number"
                      step="0.01"
                      value={variation.price_adjustment}
                      onChange={(e) => updateVariation(index, { price_adjustment: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Valor a ser somado/subtraído do preço base
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={`active-${index}`}>Variação Ativa</Label>
                      <p className="text-sm text-muted-foreground">
                        Variações inativas não aparecem no catálogo
                      </p>
                    </div>
                    <Switch
                      id={`active-${index}`}
                      checked={variation.is_active}
                      onCheckedChange={(checked) => updateVariation(index, { is_active: checked })}
                    />
                  </div>

                  <VariationImageUpload
                    imageUrl={variation.image_url}
                    onImageUpload={(file) => handleImageUpload(index, file)}
                    onImageRemove={() => handleImageRemove(index)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {variations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Dicas para variações:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use nomes descritivos para cores e tamanhos</li>
            <li>• O estoque da variação é independente do estoque principal</li>
            <li>• Ajustes de preço podem ser positivos ou negativos</li>
            <li>• Cada variação pode ter sua própria imagem</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProductVariationsManager;
