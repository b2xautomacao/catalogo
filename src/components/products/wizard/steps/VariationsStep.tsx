
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Palette, Ruler } from 'lucide-react';
import { WizardFormData } from '@/hooks/useImprovedProductFormWizard';
import VariationImageUpload from '@/components/products/VariationImageUpload';

interface Variation {
  id: string;
  type: 'color' | 'size' | 'other';
  name: string;
  value: string;
  stock: number;
  price_adjustment: number;
  image?: File;
}

interface VariationsStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

const VariationsStep: React.FC<VariationsStepProps> = ({ formData, updateFormData }) => {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariation, setNewVariation] = useState<Partial<Variation>>({
    type: 'color',
    name: '',
    value: '',
    stock: 0,
    price_adjustment: 0
  });

  const addVariation = () => {
    if (!newVariation.name || !newVariation.value) return;

    const variation: Variation = {
      id: Math.random().toString(36).substr(2, 9),
      type: newVariation.type as 'color' | 'size' | 'other',
      name: newVariation.name!,
      value: newVariation.value!,
      stock: newVariation.stock || 0,
      price_adjustment: newVariation.price_adjustment || 0
    };

    const updatedVariations = [...variations, variation];
    setVariations(updatedVariations);
    updateFormData({ variations: updatedVariations });
    
    setNewVariation({
      type: 'color',
      name: '',
      value: '',
      stock: 0,
      price_adjustment: 0
    });
    setShowAddForm(false);
  };

  const removeVariation = (id: string) => {
    const updatedVariations = variations.filter(v => v.id !== id);
    setVariations(updatedVariations);
    updateFormData({ variations: updatedVariations });
  };

  const updateVariation = (id: string, updates: Partial<Variation>) => {
    const updatedVariations = variations.map(v => 
      v.id === id ? { ...v, ...updates } : v
    );
    setVariations(updatedVariations);
    updateFormData({ variations: updatedVariations });
  };

  const getVariationIcon = (type: string) => {
    switch (type) {
      case 'color': return <Palette className="h-4 w-4" />;
      case 'size': return <Ruler className="h-4 w-4" />;
      default: return <Plus className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Variações do Produto</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Variação
        </Button>
      </div>

      {variations.length === 0 && !showAddForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Palette className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p className="font-medium">Nenhuma variação adicionada</p>
                <p className="text-sm text-muted-foreground">
                  Adicione variações como cores, tamanhos ou outros atributos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova Variação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select
                  value={newVariation.type}
                  onChange={(e) => setNewVariation({ ...newVariation, type: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="color">Cor</option>
                  <option value="size">Tamanho</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={newVariation.name}
                  onChange={(e) => setNewVariation({ ...newVariation, name: e.target.value })}
                  placeholder="Ex: Cor, Tamanho"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  value={newVariation.value}
                  onChange={(e) => setNewVariation({ ...newVariation, value: e.target.value })}
                  placeholder="Ex: Azul, M, 500ml"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estoque</Label>
                <Input
                  type="number"
                  value={newVariation.stock}
                  onChange={(e) => setNewVariation({ ...newVariation, stock: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Ajuste de Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newVariation.price_adjustment}
                  onChange={(e) => setNewVariation({ ...newVariation, price_adjustment: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={addVariation} disabled={!newVariation.name || !newVariation.value}>
                Adicionar
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {variations.map((variation) => (
        <Card key={variation.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getVariationIcon(variation.type)}
                <CardTitle className="text-base">
                  {variation.name}: {variation.value}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {variation.type}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeVariation(variation.id)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estoque</Label>
                <Input
                  type="number"
                  value={variation.stock}
                  onChange={(e) => updateVariation(variation.id, { stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ajuste de Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={variation.price_adjustment}
                  onChange={(e) => updateVariation(variation.id, { price_adjustment: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Imagem da Variação</Label>
              <VariationImageUpload
                imageUrl={variation.image ? URL.createObjectURL(variation.image) : null}
                onImageUpload={(file) => updateVariation(variation.id, { image: file })}
                onImageRemove={() => updateVariation(variation.id, { image: undefined })}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {variations.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">
            {variations.length} variações adicionadas
          </h4>
          <p className="text-sm text-green-800">
            As variações serão criadas quando o produto for salvo
          </p>
        </div>
      )}
    </div>
  );
};

export default VariationsStep;
