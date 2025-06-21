
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit, Check, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import VariationImageUpload from './VariationImageUpload';

export interface ProductVariation {
  id?: string;
  color?: string;
  size?: string;
  sku?: string;
  stock: number;
  price_adjustment: number;
  is_active: boolean;
  image_url?: string;
  image_file?: File;
}

interface ProductVariationsManagerProps {
  variations: ProductVariation[];
  onChange: (variations: ProductVariation[]) => void;
  disabled?: boolean;
}

const ProductVariationsManager: React.FC<ProductVariationsManagerProps> = ({
  variations,
  onChange,
  disabled = false
}) => {
  const [newVariation, setNewVariation] = useState<ProductVariation>({
    color: '',
    size: '',
    sku: '',
    stock: 0,
    price_adjustment: 0,
    is_active: true,
    image_url: '',
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingVariation, setEditingVariation] = useState<ProductVariation | null>(null);

  const addVariation = () => {
    if (!newVariation.color && !newVariation.size) {
      return;
    }

    const variationToAdd = {
      ...newVariation,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    console.log('➕ Adicionando variação:', variationToAdd);
    onChange([...variations, variationToAdd]);
    
    setNewVariation({
      color: '',
      size: '',
      sku: '',
      stock: 0,
      price_adjustment: 0,
      is_active: true,
      image_url: '',
    });
  };

  const removeVariation = (index: number) => {
    const updatedVariations = variations.filter((_, i) => i !== index);
    console.log('🗑️ Removendo variação, nova lista:', updatedVariations);
    onChange(updatedVariations);
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingVariation({ ...variations[index] });
  };

  const saveEdit = () => {
    if (editingIndex !== null && editingVariation) {
      const updatedVariations = [...variations];
      updatedVariations[editingIndex] = editingVariation;
      console.log('💾 Salvando edição da variação:', editingVariation);
      onChange(updatedVariations);
      setEditingIndex(null);
      setEditingVariation(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingVariation(null);
  };

  const formatVariationName = (variation: ProductVariation) => {
    const parts = [];
    if (variation.color) parts.push(variation.color);
    if (variation.size) parts.push(variation.size);
    return parts.join(' - ') || 'Variação';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleNewVariationImageUpload = (file: File) => {
    console.log('📤 Nova imagem para variação:', file.name);
    setNewVariation(prev => ({
      ...prev,
      image_file: file,
      image_url: URL.createObjectURL(file)
    }));
  };

  const handleNewVariationImageRemove = () => {
    console.log('🗑️ Removendo imagem da nova variação');
    setNewVariation(prev => ({
      ...prev,
      image_file: undefined,
      image_url: ''
    }));
  };

  const handleEditVariationImageUpload = (file: File) => {
    if (editingVariation) {
      console.log('📤 Nova imagem para variação em edição:', file.name);
      setEditingVariation({
        ...editingVariation,
        image_file: file,
        image_url: URL.createObjectURL(file)
      });
    }
  };

  const handleEditVariationImageRemove = () => {
    if (editingVariation) {
      console.log('🗑️ Removendo imagem da variação em edição');
      setEditingVariation({
        ...editingVariation,
        image_file: undefined,
        image_url: ''
      });
    }
  };

  const handleStockChange = (value: string, isEditing: boolean = false) => {
    const numericValue = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
    
    if (isEditing && editingVariation) {
      setEditingVariation({ ...editingVariation, stock: numericValue });
    } else {
      setNewVariation({ ...newVariation, stock: numericValue });
    }
  };

  const handlePriceAdjustmentChange = (value: number, isEditing: boolean = false) => {
    if (isEditing && editingVariation) {
      setEditingVariation({ ...editingVariation, price_adjustment: value });
    } else {
      setNewVariation({ ...newVariation, price_adjustment: value });
    }
  };

  return (
    <div className="space-y-6">
      {/* Form para adicionar nova variação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Nova Variação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-color">Cor</Label>
              <Input
                id="new-color"
                placeholder="Ex: Azul, Vermelho"
                value={newVariation.color || ''}
                onChange={(e) => setNewVariation({ ...newVariation, color: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="new-size">Tamanho</Label>
              <Input
                id="new-size"
                placeholder="Ex: P, M, G, XG"
                value={newVariation.size || ''}
                onChange={(e) => setNewVariation({ ...newVariation, size: e.target.value })}
                disabled={disabled}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="new-sku">SKU</Label>
              <Input
                id="new-sku"
                placeholder="Código interno"
                value={newVariation.sku || ''}
                onChange={(e) => setNewVariation({ ...newVariation, sku: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="new-stock">Estoque</Label>
              <Input
                id="new-stock"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={newVariation.stock === 0 ? '' : newVariation.stock.toString()}
                onChange={(e) => handleStockChange(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="new-price-adjustment">Ajuste de Preço</Label>
              <CurrencyInput
                value={newVariation.price_adjustment || 0}
                onChange={(value) => handlePriceAdjustmentChange(value)}
                placeholder="0,00"
                disabled={disabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <VariationImageUpload
              imageUrl={newVariation.image_url}
              onImageUpload={handleNewVariationImageUpload}
              onImageRemove={handleNewVariationImageRemove}
              disabled={disabled}
            />
          </div>
          
          <Button
            type="button"
            onClick={addVariation}
            disabled={disabled || (!newVariation.color && !newVariation.size)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Variação
          </Button>
        </CardContent>
      </Card>

      {/* Lista de variações existentes */}
      {variations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Variações Cadastradas ({variations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {variations.map((variation, index) => (
                <div key={variation.id || index} className="border rounded-lg p-4">
                  {editingIndex === index ? (
                    // Modo de edição
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Cor</Label>
                          <Input
                            value={editingVariation?.color || ''}
                            onChange={(e) => setEditingVariation(prev => prev ? { ...prev, color: e.target.value } : null)}
                            disabled={disabled}
                          />
                        </div>
                        <div>
                          <Label>Tamanho</Label>
                          <Input
                            value={editingVariation?.size || ''}
                            onChange={(e) => setEditingVariation(prev => prev ? { ...prev, size: e.target.value } : null)}
                            disabled={disabled}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>SKU</Label>
                          <Input
                            value={editingVariation?.sku || ''}
                            onChange={(e) => setEditingVariation(prev => prev ? { ...prev, sku: e.target.value } : null)}
                            disabled={disabled}
                          />
                        </div>
                        <div>
                          <Label>Estoque</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={editingVariation?.stock === 0 ? '' : editingVariation?.stock?.toString() || ''}
                            onChange={(e) => handleStockChange(e.target.value, true)}
                            disabled={disabled}
                          />
                        </div>
                        <div>
                          <Label>Ajuste de Preço</Label>
                          <CurrencyInput
                            value={editingVariation?.price_adjustment || 0}
                            onChange={(value) => handlePriceAdjustmentChange(value, true)}
                            disabled={disabled}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <VariationImageUpload
                          imageUrl={editingVariation?.image_url}
                          onImageUpload={handleEditVariationImageUpload}
                          onImageRemove={handleEditVariationImageRemove}
                          disabled={disabled}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={saveEdit}
                          disabled={disabled}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={disabled}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Modo de visualização
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {variation.image_url && (
                          <img
                            src={variation.image_url}
                            alt={formatVariationName(variation)}
                            className="w-12 h-12 object-cover rounded border"
                          />
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {formatVariationName(variation)}
                            </Badge>
                            {variation.sku && (
                              <Badge variant="secondary">
                                SKU: {variation.sku}
                              </Badge>
                            )}
                            {variation.id?.startsWith('temp_') && (
                              <Badge variant="destructive">
                                Novo
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex gap-4">
                            <span>Estoque: {variation.stock}</span>
                            <span>
                              Ajuste: {variation.price_adjustment > 0 ? '+' : ''}
                              {formatCurrency(variation.price_adjustment)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(index)}
                          disabled={disabled}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeVariation(index)}
                          disabled={disabled}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductVariationsManager;
