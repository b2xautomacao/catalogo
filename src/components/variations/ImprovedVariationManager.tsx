
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { QuantityInput } from '@/components/ui/quantity-input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { 
  Plus, 
  Trash2, 
  Palette, 
  Package, 
  Eye, 
  EyeOff,
  Copy,
  Wand2
} from 'lucide-react';
import { ProductVariation } from '@/types/product';

interface ImprovedVariationManagerProps {
  variations: ProductVariation[];
  onVariationsChange: (variations: ProductVariation[]) => void;
}

const ImprovedVariationManager: React.FC<ImprovedVariationManagerProps> = ({
  variations,
  onVariationsChange,
}) => {
  const [bulkStock, setBulkStock] = useState<number>(0);

  const addVariation = () => {
    const newVariation: ProductVariation = {
      id: `new-${Date.now()}`,
      product_id: '',
      color: '',
      size: '',
      sku: '',
      stock: 0,
      price_adjustment: 0,
      is_active: true,
      image_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onVariationsChange([...variations, newVariation]);
  };

  const updateVariation = (id: string, field: keyof ProductVariation, value: any) => {
    const updatedVariations = variations.map(variation =>
      variation.id === id ? { ...variation, [field]: value } : variation
    );
    onVariationsChange(updatedVariations);
  };

  const removeVariation = (id: string) => {
    const filteredVariations = variations.filter(variation => variation.id !== id);
    onVariationsChange(filteredVariations);
  };

  const duplicateVariation = (variation: ProductVariation) => {
    const newVariation: ProductVariation = {
      ...variation,
      id: `copy-${Date.now()}`,
      sku: `${variation.sku}-copy`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    onVariationsChange([...variations, newVariation]);
  };

  const applyBulkStock = () => {
    if (bulkStock < 0) return;
    
    const updatedVariations = variations.map(variation => ({
      ...variation,
      stock: bulkStock
    }));
    
    onVariationsChange(updatedVariations);
    setBulkStock(0);
  };

  const toggleVariationStatus = (id: string) => {
    const updatedVariations = variations.map(variation =>
      variation.id === id ? { ...variation, is_active: !variation.is_active } : variation
    );
    onVariationsChange(updatedVariations);
  };

  const generateSKU = (variation: ProductVariation) => {
    const colorCode = variation.color?.substring(0, 2).toUpperCase() || 'XX';
    const sizeCode = variation.size?.substring(0, 2).toUpperCase() || 'XX';
    const timestamp = Date.now().toString().slice(-4);
    const newSKU = `${colorCode}${sizeCode}-${timestamp}`;
    
    updateVariation(variation.id, 'sku', newSKU);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Gerenciamento de Variações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button onClick={addVariation} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Variação
            </Button>
            
            {variations.length > 0 && (
              <div className="flex items-center gap-2">
                <Label htmlFor="bulk-stock" className="whitespace-nowrap">
                  Estoque em massa:
                </Label>
                <QuantityInput
                  id="bulk-stock"
                  value={bulkStock}
                  onChange={setBulkStock}
                  min={0}
                  className="w-24"
                />
                <Button 
                  onClick={applyBulkStock}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Aplicar
                </Button>
              </div>
            )}
          </div>

          {variations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma variação adicionada ainda.</p>
              <p className="text-sm">Clique em "Nova Variação" para começar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {variations.map((variation, index) => (
                <Card key={variation.id} className={`${!variation.is_active ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Variação #{index + 1}</Badge>
                        {!variation.is_active && (
                          <Badge variant="secondary">Inativa</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => toggleVariationStatus(variation.id)}
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          {variation.is_active ? (
                            <>
                              <EyeOff className="h-4 w-4" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              Ativar
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => duplicateVariation(variation)}
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Copy className="h-4 w-4" />
                          Duplicar
                        </Button>
                        <Button
                          onClick={() => removeVariation(variation.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`color-${variation.id}`}>Cor</Label>
                        <Input
                          id={`color-${variation.id}`}
                          value={variation.color || ''}
                          onChange={(e) => updateVariation(variation.id, 'color', e.target.value)}
                          placeholder="Ex: Azul, Vermelho"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`size-${variation.id}`}>Tamanho</Label>
                        <Input
                          id={`size-${variation.id}`}
                          value={variation.size || ''}
                          onChange={(e) => updateVariation(variation.id, 'size', e.target.value)}
                          placeholder="Ex: P, M, G, 42"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`sku-${variation.id}`}>SKU</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`sku-${variation.id}`}
                            value={variation.sku || ''}
                            onChange={(e) => updateVariation(variation.id, 'sku', e.target.value)}
                            placeholder="Código único"
                          />
                          <Button
                            onClick={() => generateSKU(variation)}
                            variant="outline"
                            size="sm"
                            type="button"
                          >
                            <Wand2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`stock-${variation.id}`}>Estoque</Label>
                        <QuantityInput
                          id={`stock-${variation.id}`}
                          value={variation.stock || 0}
                          onChange={(value) => updateVariation(variation.id, 'stock', value)}
                          min={0}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`price-adjustment-${variation.id}`}>Ajuste de Preço</Label>
                        <CurrencyInput
                          id={`price-adjustment-${variation.id}`}
                          value={variation.price_adjustment || 0}
                          onChange={(value) => updateVariation(variation.id, 'price_adjustment', value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`image-url-${variation.id}`}>URL da Imagem</Label>
                        <Input
                          id={`image-url-${variation.id}`}
                          value={variation.image_url || ''}
                          onChange={(e) => updateVariation(variation.id, 'image_url', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {variations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo das Variações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {variations.length}
                </div>
                <div className="text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {variations.filter(v => v.is_active).length}
                </div>
                <div className="text-gray-600">Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {variations.filter(v => !v.is_active).length}
                </div>
                <div className="text-gray-600">Inativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {variations.reduce((sum, v) => sum + (v.stock || 0), 0)}
                </div>
                <div className="text-gray-600">Estoque Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImprovedVariationManager;
