
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Trash2, Plus, Copy, Image } from 'lucide-react';
import { HierarchicalVariation, VariationTemplate } from '@/types/variation';
import VariationImageUpload from './VariationImageUpload';

interface HierarchicalVariationSetupProps {
  template: VariationTemplate;
  variations: HierarchicalVariation[];
  onChange: (variations: HierarchicalVariation[]) => void;
}

const HierarchicalVariationSetup: React.FC<HierarchicalVariationSetupProps> = ({
  template,
  variations,
  onChange
}) => {
  const [selectedMainIndex, setSelectedMainIndex] = useState<number>(0);

  console.log('🎯 HIERARCHICAL SETUP - Renderizando:', {
    template: template.label,
    variationsCount: variations.length,
    selectedMainIndex
  });

  const addMainVariation = () => {
    const newVariation: HierarchicalVariation = {
      variation_type: 'main',
      variation_value: '',
      color: template.primary === 'color' ? '' : null,
      size: template.primary === 'size' ? '' : null,
      sku: '',
      stock: 0,
      price_adjustment: 0,
      is_active: true,
      display_order: variations.length,
      children: []
    };
    
    onChange([...variations, newVariation]);
    setSelectedMainIndex(variations.length);
  };

  const updateMainVariation = (index: number, updates: Partial<HierarchicalVariation>) => {
    const updatedVariations = variations.map((variation, i) => 
      i === index ? { ...variation, ...updates } : variation
    );
    onChange(updatedVariations);
  };

  const removeMainVariation = (index: number) => {
    const variation = variations[index];
    
    // Revogar blob URLs se existirem
    if (variation.image_url && variation.image_url.startsWith('blob:')) {
      URL.revokeObjectURL(variation.image_url);
    }
    variation.children?.forEach(child => {
      if (child.image_url && child.image_url.startsWith('blob:')) {
        URL.revokeObjectURL(child.image_url);
      }
    });
    
    const updatedVariations = variations.filter((_, i) => i !== index);
    onChange(updatedVariations);
    
    if (selectedMainIndex >= updatedVariations.length) {
      setSelectedMainIndex(Math.max(0, updatedVariations.length - 1));
    }
  };

  const addSubVariation = (mainIndex: number) => {
    if (!template.secondary) return;

    const newSubVariation: HierarchicalVariation = {
      variation_type: 'sub',
      variation_value: '',
      color: template.secondary === 'color' ? '' : variations[mainIndex].color,
      size: template.secondary === 'size' ? '' : variations[mainIndex].size,
      sku: '',
      stock: 0,
      price_adjustment: 0,
      is_active: true,
      display_order: variations[mainIndex].children?.length || 0
    };

    const updatedVariations = [...variations];
    if (!updatedVariations[mainIndex].children) {
      updatedVariations[mainIndex].children = [];
    }
    updatedVariations[mainIndex].children!.push(newSubVariation);
    onChange(updatedVariations);
  };

  const updateSubVariation = (mainIndex: number, subIndex: number, updates: Partial<HierarchicalVariation>) => {
    const updatedVariations = [...variations];
    if (updatedVariations[mainIndex].children) {
      updatedVariations[mainIndex].children![subIndex] = {
        ...updatedVariations[mainIndex].children![subIndex],
        ...updates
      };
      onChange(updatedVariations);
    }
  };

  const removeSubVariation = (mainIndex: number, subIndex: number) => {
    const updatedVariations = [...variations];
    if (updatedVariations[mainIndex].children) {
      const subVariation = updatedVariations[mainIndex].children[subIndex];
      
      // Revogar blob URL se existir
      if (subVariation.image_url && subVariation.image_url.startsWith('blob:')) {
        URL.revokeObjectURL(subVariation.image_url);
      }
      
      updatedVariations[mainIndex].children!.splice(subIndex, 1);
      onChange(updatedVariations);
    }
  };

  const copySubVariationsFrom = (sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex || !variations[sourceIndex].children) return;

    const sourceChildren = variations[sourceIndex].children!;
    const copiedChildren = sourceChildren.map(child => ({
      ...child,
      id: undefined, // Nova subvariação
      color: template.secondary === 'color' ? child.color : variations[targetIndex].color,
      size: template.secondary === 'size' ? child.size : variations[targetIndex].size,
      stock: 0 // Zerar estoque ao copiar
    }));

    const updatedVariations = [...variations];
    updatedVariations[targetIndex].children = copiedChildren;
    onChange(updatedVariations);
  };

  const handleMainImageUpload = (index: number, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    updateMainVariation(index, { 
      image_file: file,
      image_url: previewUrl
    });
  };

  const handleMainImageRemove = (index: number) => {
    const variation = variations[index];
    if (variation.image_url && variation.image_url.startsWith('blob:')) {
      URL.revokeObjectURL(variation.image_url);
    }
    updateMainVariation(index, { 
      image_file: undefined,
      image_url: null
    });
  };

  const getAttributeLabel = (attribute: string) => {
    const labels: Record<string, string> = {
      color: 'Cor',
      size: 'Tamanho',
      material: 'Material',
      style: 'Estilo',
      weight: 'Peso'
    };
    return labels[attribute] || attribute;
  };

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Configuração: {template.label}</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Atributo principal: <strong>{getAttributeLabel(template.primary)}</strong></p>
          {template.secondary && (
            <p>• Atributo secundário: <strong>{getAttributeLabel(template.secondary)}</strong></p>
          )}
          <p>• {variations.length} variação(ões) principal(is) configurada(s)</p>
        </div>
      </div>

      {/* Lista de variações principais */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">
            {getAttributeLabel(template.primary)} Disponíveis
          </h4>
          <Button onClick={addMainVariation} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar {getAttributeLabel(template.primary)}
          </Button>
        </div>

        {variations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Nenhum(a) {getAttributeLabel(template.primary).toLowerCase()} adicionado(a)
              </p>
              <Button onClick={addMainVariation} variant="outline" size="sm">
                Adicionar primeiro(a) {getAttributeLabel(template.primary).toLowerCase()}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {variations.map((variation, index) => (
              <Card key={`main-${index}`} className={selectedMainIndex === index ? 'ring-2 ring-primary' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {getAttributeLabel(template.primary)} {index + 1}
                      {!variation.is_active && (
                        <Badge variant="secondary" className="ml-2">Inativa</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {template.secondary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMainIndex(index)}
                        >
                          Configurar {getAttributeLabel(template.secondary)}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMainVariation(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`main-${index}-value`}>
                        {getAttributeLabel(template.primary)}
                      </Label>
                      <Input
                        id={`main-${index}-value`}
                        value={variation.variation_value}
                        onChange={(e) => updateMainVariation(index, { 
                          variation_value: e.target.value,
                          [template.primary]: e.target.value
                        })}
                        placeholder={`Ex: ${template.primary === 'color' ? 'Azul' : template.primary === 'size' ? 'M' : 'Valor'}`}
                      />
                    </div>
                    
                    {!template.secondary && (
                      <>
                        <div>
                          <Label htmlFor={`main-${index}-stock`}>Estoque</Label>
                          <Input
                            id={`main-${index}-stock`}
                            type="number"
                            min="0"
                            value={variation.stock.toString()}
                            onChange={(e) => updateMainVariation(index, { stock: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`main-${index}-price`}>Ajuste de Preço</Label>
                          <CurrencyInput
                            value={variation.price_adjustment}
                            onChange={(value) => updateMainVariation(index, { price_adjustment: value })}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`main-${index}-active`}
                        checked={variation.is_active}
                        onCheckedChange={(checked) => updateMainVariation(index, { is_active: checked })}
                      />
                      <Label htmlFor={`main-${index}-active`}>Ativo</Label>
                    </div>
                  </div>

                  <VariationImageUpload
                    imageUrl={variation.image_url}
                    onImageUpload={(file) => handleMainImageUpload(index, file)}
                    onImageRemove={() => handleMainImageRemove(index)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Configuração de subvariações */}
      {template.secondary && variations.length > 0 && selectedMainIndex < variations.length && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {getAttributeLabel(template.secondary)} para: {variations[selectedMainIndex]?.variation_value || 'Selecionado'}
              </CardTitle>
              <div className="flex items-center gap-2">
                {variations.some((v, i) => i !== selectedMainIndex && v.children && v.children.length > 0) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const sourceIndex = variations.findIndex((v, i) => i !== selectedMainIndex && v.children && v.children.length > 0);
                      if (sourceIndex !== -1) {
                        copySubVariationsFrom(sourceIndex, selectedMainIndex);
                      }
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar de outra {getAttributeLabel(template.primary).toLowerCase()}
                  </Button>
                )}
                <Button
                  onClick={() => addSubVariation(selectedMainIndex)}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar {getAttributeLabel(template.secondary)}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!variations[selectedMainIndex]?.children || variations[selectedMainIndex].children!.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-3">
                  Nenhum {getAttributeLabel(template.secondary).toLowerCase()} adicionado para esta {getAttributeLabel(template.primary).toLowerCase()}
                </p>
                <Button onClick={() => addSubVariation(selectedMainIndex)} variant="outline" size="sm">
                  Adicionar primeiro {getAttributeLabel(template.secondary).toLowerCase()}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {variations[selectedMainIndex].children!.map((subVariation, subIndex) => (
                  <div key={`sub-${selectedMainIndex}-${subIndex}`} className="border rounded-lg p-4 space-y-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">{getAttributeLabel(template.secondary!)}</Label>
                        <Input
                          value={subVariation.variation_value}
                          onChange={(e) => updateSubVariation(selectedMainIndex, subIndex, { 
                            variation_value: e.target.value,
                            [template.secondary!]: e.target.value
                          })}
                          placeholder={`Ex: ${template.secondary === 'size' ? '38' : 'Valor'}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Estoque</Label>
                        <Input
                          type="number"
                          min="0"
                          value={subVariation.stock.toString()}
                          onChange={(e) => updateSubVariation(selectedMainIndex, subIndex, { stock: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Ajuste Preço</Label>
                        <CurrencyInput
                          value={subVariation.price_adjustment}
                          onChange={(value) => updateSubVariation(selectedMainIndex, subIndex, { price_adjustment: value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">SKU</Label>
                        <Input
                          value={subVariation.sku || ''}
                          onChange={(e) => updateSubVariation(selectedMainIndex, subIndex, { sku: e.target.value })}
                          placeholder="Opcional"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={subVariation.is_active}
                          onCheckedChange={(checked) => updateSubVariation(selectedMainIndex, subIndex, { is_active: checked })}
                        />
                        <Label className="text-xs">Ativo</Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubVariation(selectedMainIndex, subIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <VariationImageUpload
                      imageUrl={subVariation.image_url}
                      onImageUpload={(file) => {
                        const previewUrl = URL.createObjectURL(file);
                        updateSubVariation(selectedMainIndex, subIndex, { 
                          image_file: file,
                          image_url: previewUrl
                        });
                      }}
                      onImageRemove={() => {
                        if (subVariation.image_url && subVariation.image_url.startsWith('blob:')) {
                          URL.revokeObjectURL(subVariation.image_url);
                        }
                        updateSubVariation(selectedMainIndex, subIndex, { 
                          image_file: undefined,
                          image_url: null
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HierarchicalVariationSetup;
