
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Palette, Shirt, Package, Sparkles } from 'lucide-react';
import { useVariationMasterGroups } from '@/hooks/useVariationMasterGroups';
import QuickValueAdd from '@/components/variations/QuickValueAdd';
import { ProductVariation } from '@/types/variation';

interface MasterVariationSelectorProps {
  variations: ProductVariation[];
  onVariationsChange: (variations: ProductVariation[]) => void;
}

const MasterVariationSelector: React.FC<MasterVariationSelectorProps> = ({
  variations,
  onVariationsChange
}) => {
  const { groups, values, loading, refetch } = useVariationMasterGroups();
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<{[groupId: string]: string[]}>({});
  const [stockValues, setStockValues] = useState<{[key: string]: number}>({});

  const getGroupIcon = (attributeKey: string) => {
    switch (attributeKey) {
      case 'color': return <Palette className="w-4 h-4" />;
      case 'size': return <Shirt className="w-4 h-4" />;
      case 'material': return <Package className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev => {
      if (prev.includes(groupId)) {
        // Remover grupo e seus valores selecionados
        const newSelected = prev.filter(id => id !== groupId);
        const newSelectedValues = { ...selectedValues };
        delete newSelectedValues[groupId];
        setSelectedValues(newSelectedValues);
        return newSelected;
      } else {
        return [...prev, groupId];
      }
    });
  };

  const handleValueToggle = (groupId: string, valueId: string) => {
    setSelectedValues(prev => ({
      ...prev,
      [groupId]: prev[groupId]?.includes(valueId)
        ? prev[groupId].filter(id => id !== valueId)
        : [...(prev[groupId] || []), valueId]
    }));
  };

  const generateVariations = () => {
    if (selectedGroups.length === 0) {
      onVariationsChange([]);
      return;
    }

    const groupCombinations: string[][] = [];
    
    if (selectedGroups.length === 1) {
      // Um grupo apenas - cada valor é uma variação
      const groupId = selectedGroups[0];
      const groupValues = selectedValues[groupId] || [];
      groupValues.forEach(valueId => {
        const value = values.find(v => v.id === valueId);
        if (value) {
          groupCombinations.push([value.value]);
        }
      });
    } else {
      // Múltiplos grupos - combinações cartesianas
      const valuesByGroup = selectedGroups.map(groupId => {
        const groupValues = selectedValues[groupId] || [];
        return groupValues.map(valueId => {
          const value = values.find(v => v.id === valueId);
          return value?.value || '';
        }).filter(Boolean);
      });

      const cartesianProduct = (arr: string[][]): string[][] => {
        return arr.reduce((acc, curr) => {
          const result: string[][] = [];
          acc.forEach(a => {
            curr.forEach(c => {
              result.push([...a, c]);
            });
          });
          return result;
        }, [[]] as string[][]);
      };

      if (valuesByGroup.every(group => group.length > 0)) {
        groupCombinations.push(...cartesianProduct(valuesByGroup));
      }
    }

    const newVariations: ProductVariation[] = groupCombinations.map((combination, index) => {
      const variationKey = combination.join(' - ');
      const stock = stockValues[variationKey] || 0;

      return {
        id: `variation-${index}`,
        variation_type: 'master',
        color: combination.length > 0 ? combination[0] : undefined,
        size: combination.length > 1 ? combination[1] : undefined,
        stock,
        price_adjustment: 0,
        is_active: true,
        sku: '',
        image_url: null,
        image_file: null
      };
    });

    onVariationsChange(newVariations);
  };

  const handleStockChange = (variationKey: string, stock: number) => {
    setStockValues(prev => ({
      ...prev,
      [variationKey]: stock
    }));
  };

  useEffect(() => {
    generateVariations();
  }, [selectedGroups, selectedValues]);

  const handleValueAdded = () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seleção de Grupos */}
      <div className="space-y-4">
        <h4 className="font-medium">1. Selecione os tipos de variação</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {groups.map((group) => (
            <Card key={group.id} className={`cursor-pointer transition-colors ${
              selectedGroups.includes(group.id) ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-gray-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedGroups.includes(group.id)}
                    onCheckedChange={() => handleGroupToggle(group.id)}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    {getGroupIcon(group.attribute_key)}
                    <div>
                      <p className="font-medium">{group.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {values.filter(v => v.group_id === group.id && v.is_active).length} valores
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Seleção de Valores */}
      {selectedGroups.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">2. Selecione os valores para cada tipo</h4>
          {selectedGroups.map((groupId) => {
            const group = groups.find(g => g.id === groupId);
            const groupValues = values.filter(v => v.group_id === groupId && v.is_active);
            
            if (!group) return null;

            return (
              <Card key={groupId}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getGroupIcon(group.attribute_key)}
                      {group.name}
                    </div>
                    <QuickValueAdd group={group} onValueAdded={handleValueAdded} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {groupValues.map((value) => (
                      <div
                        key={value.id}
                        className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                          selectedValues[groupId]?.includes(value.id)
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleValueToggle(groupId, value.id)}
                      >
                        <Checkbox
                          checked={selectedValues[groupId]?.includes(value.id) || false}
                          onCheckedChange={() => handleValueToggle(groupId, value.id)}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          {value.hex_color && (
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: value.hex_color }}
                            />
                          )}
                          <span className="text-sm">{value.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Variações Geradas */}
      {variations.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">3. Configure o estoque para cada variação</h4>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {variations.map((variation, index) => {
                  const variationLabel = [variation.color, variation.size].filter(Boolean).join(' - ');
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{variationLabel}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`stock-${index}`} className="text-sm">Estoque:</Label>
                        <Input
                          id={`stock-${index}`}
                          type="number"
                          min="0"
                          value={stockValues[variationLabel] || 0}
                          onChange={(e) => {
                            const stock = parseInt(e.target.value) || 0;
                            handleStockChange(variationLabel, stock);
                            // Atualizar a variação no array
                            const updatedVariations = [...variations];
                            updatedVariations[index] = { ...variation, stock };
                            onVariationsChange(updatedVariations);
                          }}
                          className="w-20"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedGroups.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Selecione pelo menos um tipo de variação para começar
          </p>
        </div>
      )}
    </div>
  );
};

export default MasterVariationSelector;
