import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Palette,
  Shirt,
  Package,
  Sparkles,
  Trash2,
  Grid,
  List,
  Eye,
  EyeOff,
  Wand2,
  Copy,
  Settings,
} from "lucide-react";
import { useStoreVariations } from "@/hooks/useStoreVariations";
import { ProductVariation } from "@/types/product";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface IntelligentVariationsFormProps {
  variations: ProductVariation[];
  onVariationsChange: (variations: ProductVariation[]) => void;
  productId?: string;
  storeId?: string;
}

const IntelligentVariationsForm: React.FC<IntelligentVariationsFormProps> = ({
  variations,
  onVariationsChange,
  productId,
  storeId,
}) => {
  const { groups, values, loading, refetch } = useStoreVariations(storeId);
  const { toast } = useToast();

  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<{
    [groupId: string]: string[];
  }>({});
  const [viewMode, setViewMode] = useState<"wizard" | "matrix" | "list">(
    "wizard"
  );
  const [autoGenerateMode, setAutoGenerateMode] = useState(true);
  const [bulkStock, setBulkStock] = useState<number>(0);
  const [bulkPriceAdjustment, setBulkPriceAdjustment] = useState<number>(0);

  // Detectar e carregar variações existentes
  useEffect(() => {
    if (variations.length > 0 && groups.length > 0 && values.length > 0) {
      console.log(
        "🔄 Inicializando com variações existentes:",
        variations.length
      );

      // Detectar grupos usados nas variações existentes
      const usedGroups: string[] = [];
      const usedValues: { [groupId: string]: string[] } = {};

      variations.forEach((variation) => {
        // Detectar cor
        if (variation.color) {
          const colorGroup = groups.find((g) => g.attribute_key === "color");
          if (colorGroup && !usedGroups.includes(colorGroup.id)) {
            usedGroups.push(colorGroup.id);
            usedValues[colorGroup.id] = [];
          }

          const colorValue = values.find(
            (v) => v.group_id === colorGroup?.id && v.value === variation.color
          );
          if (
            colorValue &&
            colorGroup &&
            !usedValues[colorGroup.id].includes(colorValue.id)
          ) {
            usedValues[colorGroup.id].push(colorValue.id);
          }
        }

        // Detectar tamanho
        if (variation.size) {
          const sizeGroup = groups.find((g) => g.attribute_key === "size");
          if (sizeGroup && !usedGroups.includes(sizeGroup.id)) {
            usedGroups.push(sizeGroup.id);
            usedValues[sizeGroup.id] = [];
          }

          const sizeValue = values.find(
            (v) => v.group_id === sizeGroup?.id && v.value === variation.size
          );
          if (
            sizeValue &&
            sizeGroup &&
            !usedValues[sizeGroup.id].includes(sizeValue.id)
          ) {
            usedValues[sizeGroup.id].push(sizeValue.id);
          }
        }
      });

      setSelectedGroups(usedGroups);
      setSelectedValues(usedValues);
      setAutoGenerateMode(false); // Modo manual quando há variações existentes
    }
  }, [variations, groups, values]);

  const getGroupIcon = (attributeKey: string) => {
    switch (attributeKey) {
      case "color":
        return <Palette className="w-4 h-4" />;
      case "size":
        return <Shirt className="w-4 h-4" />;
      case "material":
        return <Package className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups((prev) => {
      if (prev.includes(groupId)) {
        const newSelected = prev.filter((id) => id !== groupId);
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
    setSelectedValues((prev) => ({
      ...prev,
      [groupId]: prev[groupId]?.includes(valueId)
        ? prev[groupId].filter((id) => id !== valueId)
        : [...(prev[groupId] || []), valueId],
    }));
  };

  // ✅ GERAÇÃO INTELIGENTE DE COMBINAÇÕES
  const generateAllCombinations = () => {
    if (selectedGroups.length === 0) {
      onVariationsChange([]);
      return;
    }

    const groupCombinations: string[][] = [];

    if (selectedGroups.length === 1) {
      // Um grupo apenas - cada valor é uma variação
      const groupId = selectedGroups[0];
      const groupValues = selectedValues[groupId] || [];
      groupValues.forEach((valueId) => {
        const value = values.find((v) => v.id === valueId);
        if (value) {
          groupCombinations.push([value.value]);
        }
      });
    } else {
      // Múltiplos grupos - combinações cartesianas
      const valuesByGroup = selectedGroups.map((groupId) => {
        const groupValues = selectedValues[groupId] || [];
        return groupValues
          .map((valueId) => {
            const value = values.find((v) => v.id === valueId);
            return value?.value || "";
          })
          .filter(Boolean);
      });

      const cartesianProduct = (arr: string[][]): string[][] => {
        return arr.reduce(
          (acc, curr) => {
            const result: string[][] = [];
            acc.forEach((a) => {
              curr.forEach((c) => {
                result.push([...a, c]);
              });
            });
            return result;
          },
          [[]] as string[][]
        );
      };

      if (valuesByGroup.every((group) => group.length > 0)) {
        groupCombinations.push(...cartesianProduct(valuesByGroup));
      }
    }

    // Converter combinações em variações
    const newVariations: ProductVariation[] = groupCombinations.map(
      (combination, index) => {
        const variation: ProductVariation = {
          id: `variation-${Date.now()}-${index}`,
          product_id: productId || "",
          sku: "",
          stock: bulkStock,
          price_adjustment: bulkPriceAdjustment,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Mapear valores para propriedades específicas
        selectedGroups.forEach((groupId, groupIndex) => {
          const group = groups.find((g) => g.id === groupId);
          if (!group) return;

          const value = combination[groupIndex];
          if (!value) return;

          switch (group.attribute_key) {
            case "color":
              variation.color = value;
              // Buscar hex_color se disponível
              const colorValue = values.find(
                (v) => v.group_id === groupId && v.value === value
              );
              if (colorValue?.hex_color) {
                variation.hex_color = colorValue.hex_color;
              }
              break;
            case "size":
              variation.size = value;
              break;
            case "material":
              variation.material = value;
              break;
            default:
              variation.variation_value = value;
              break;
          }
        });

        return variation;
      }
    );

    onVariationsChange(newVariations);

    toast({
      title: "✅ Variações geradas com sucesso!",
      description: `${newVariations.length} combinações criadas automaticamente.`,
      duration: 3000,
    });
  };

  // ✅ OPERAÇÕES EM MASSA
  const applyBulkStock = () => {
    if (bulkStock < 0) return;

    const updatedVariations = variations.map((variation) => ({
      ...variation,
      stock: bulkStock,
    }));

    onVariationsChange(updatedVariations);
    setBulkStock(0);

    toast({
      title: "✅ Estoque aplicado em massa!",
      description: `${variations.length} variações atualizadas.`,
      duration: 2000,
    });
  };

  const applyBulkPriceAdjustment = () => {
    const updatedVariations = variations.map((variation) => ({
      ...variation,
      price_adjustment: bulkPriceAdjustment,
    }));

    onVariationsChange(updatedVariations);
    setBulkPriceAdjustment(0);

    toast({
      title: "✅ Ajuste de preço aplicado em massa!",
      description: `${variations.length} variações atualizadas.`,
      duration: 2000,
    });
  };

  const duplicateVariation = (variation: ProductVariation) => {
    const newVariation: ProductVariation = {
      ...variation,
      id: `copy-${Date.now()}`,
      sku: `${variation.sku}-copy`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onVariationsChange([...variations, newVariation]);

    toast({
      title: "✅ Variação duplicada!",
      description: "Uma cópia foi criada com sucesso.",
      duration: 2000,
    });
  };

  const removeVariation = (id: string) => {
    const filteredVariations = variations.filter(
      (variation) => variation.id !== id
    );
    onVariationsChange(filteredVariations);
  };

  const updateVariation = (
    id: string,
    field: keyof ProductVariation,
    value: any
  ) => {
    const updatedVariations = variations.map((variation) =>
      variation.id === id ? { ...variation, [field]: value } : variation
    );
    onVariationsChange(updatedVariations);
  };

  const toggleVariationStatus = (id: string) => {
    const updatedVariations = variations.map((variation) =>
      variation.id === id
        ? { ...variation, is_active: !variation.is_active }
        : variation
    );
    onVariationsChange(updatedVariations);
  };

  // ✅ GERAÇÃO INTELIGENTE DE SKU
  const generateSKU = (variation: ProductVariation) => {
    const colorCode = variation.color?.substring(0, 2).toUpperCase() || "XX";
    const sizeCode = variation.size?.substring(0, 2).toUpperCase() || "XX";
    const timestamp = Date.now().toString().slice(-4);
    const newSKU = `${colorCode}${sizeCode}-${timestamp}`;

    updateVariation(variation.id, "sku", newSKU);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Variações Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando variações...</div>
        </CardContent>
      </Card>
    );
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Variações Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Nenhum grupo de variação encontrado para sua loja. Configure
              grupos de variação (cores, tamanhos, etc.) para usar a criação
              inteligente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Variações Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as any)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wizard">Assistente</TabsTrigger>
            <TabsTrigger value="matrix">Matriz</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>

          {/* ✅ MODO ASSISTENTE INTELIGENTE */}
          <TabsContent value="wizard" className="space-y-6">
            {/* Configuração de Modo */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Modo de Criação</Label>
                <p className="text-xs text-muted-foreground">
                  {autoGenerateMode
                    ? "Geração automática de todas as combinações"
                    : "Configuração manual de variações específicas"}
                </p>
              </div>
              <Switch
                checked={autoGenerateMode}
                onCheckedChange={setAutoGenerateMode}
              />
            </div>

            {/* Seleção de Grupos */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">
                1. Selecione os tipos de variação
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedGroups.includes(group.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleGroupToggle(group.id)}
                  >
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
                            {
                              values.filter(
                                (v) => v.group_id === group.id && v.is_active
                              ).length
                            }{" "}
                            valores
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seleção de Valores */}
            {selectedGroups.length > 0 && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  2. Selecione os valores para cada tipo
                </Label>
                {selectedGroups.map((groupId) => {
                  const group = groups.find((g) => g.id === groupId);
                  const groupValues = values.filter(
                    (v) => v.group_id === groupId && v.is_active
                  );

                  if (!group) return null;

                  return (
                    <Card key={groupId}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          {getGroupIcon(group.attribute_key)}
                          {group.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {groupValues.map((value) => (
                            <div
                              key={value.id}
                              className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                                selectedValues[groupId]?.includes(value.id)
                                  ? "bg-primary/10 border-primary"
                                  : "hover:bg-gray-50"
                              }`}
                              onClick={() =>
                                handleValueToggle(groupId, value.id)
                              }
                            >
                              <Checkbox
                                checked={
                                  selectedValues[groupId]?.includes(value.id) ||
                                  false
                                }
                                onCheckedChange={() =>
                                  handleValueToggle(groupId, value.id)
                                }
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

            {/* Configurações em Massa */}
            {selectedGroups.length > 0 && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  3. Configurações em massa (opcional)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-stock">Estoque padrão</Label>
                    <div className="flex gap-2">
                      <Input
                        id="bulk-stock"
                        type="number"
                        min="0"
                        value={bulkStock}
                        onChange={(e) =>
                          setBulkStock(parseInt(e.target.value) || 0)
                        }
                        placeholder="0"
                      />
                      <Button
                        onClick={applyBulkStock}
                        size="sm"
                        variant="outline"
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulk-price">Ajuste de preço padrão</Label>
                    <div className="flex gap-2">
                      <Input
                        id="bulk-price"
                        type="number"
                        step="0.01"
                        value={bulkPriceAdjustment}
                        onChange={(e) =>
                          setBulkPriceAdjustment(
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0.00"
                      />
                      <Button
                        onClick={applyBulkPriceAdjustment}
                        size="sm"
                        variant="outline"
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botão de Geração */}
            {selectedGroups.length > 0 && (
              <div className="flex justify-center">
                <Button
                  onClick={generateAllCombinations}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Wand2 className="w-5 h-5" />
                  {autoGenerateMode
                    ? "Gerar Todas as Combinações"
                    : "Gerar Combinações Selecionadas"}
                  {selectedGroups.reduce((total, groupId) => {
                    const groupValueCount =
                      selectedValues[groupId]?.length || 0;
                    return total === 0
                      ? groupValueCount
                      : total * groupValueCount;
                  }, 0) > 0 && (
                    <Badge variant="secondary">
                      {selectedGroups.reduce((total, groupId) => {
                        const groupValueCount =
                          selectedValues[groupId]?.length || 0;
                        return total === 0
                          ? groupValueCount
                          : total * groupValueCount;
                      }, 0)}{" "}
                      variações
                    </Badge>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ✅ MODO MATRIZ */}
          <TabsContent value="matrix" className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <Grid className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Modo matriz em desenvolvimento</p>
              <p className="text-sm">
                Use o modo assistente para criar variações
              </p>
            </div>
          </TabsContent>

          {/* ✅ MODO LISTA */}
          <TabsContent value="list" className="space-y-4">
            {variations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma variação criada ainda</p>
                <p className="text-sm">
                  Use o modo assistente para criar variações
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {variations.map((variation, index) => (
                  <Card
                    key={variation.id}
                    className={`${!variation.is_active ? "opacity-60" : ""}`}
                  >
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
                          >
                            {variation.is_active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => duplicateVariation(variation)}
                            variant="ghost"
                            size="sm"
                          >
                            <Copy className="h-4 w-4" />
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

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <Label>Cor</Label>
                          <Input
                            value={variation.color || ""}
                            onChange={(e) =>
                              updateVariation(
                                variation.id,
                                "color",
                                e.target.value
                              )
                            }
                            placeholder="Ex: Azul"
                          />
                        </div>
                        <div>
                          <Label>Tamanho</Label>
                          <Input
                            value={variation.size || ""}
                            onChange={(e) =>
                              updateVariation(
                                variation.id,
                                "size",
                                e.target.value
                              )
                            }
                            placeholder="Ex: M"
                          />
                        </div>
                        <div>
                          <Label>SKU</Label>
                          <div className="flex gap-2">
                            <Input
                              value={variation.sku || ""}
                              onChange={(e) =>
                                updateVariation(
                                  variation.id,
                                  "sku",
                                  e.target.value
                                )
                              }
                              placeholder="Código único"
                            />
                            <Button
                              onClick={() => generateSKU(variation)}
                              size="sm"
                              variant="outline"
                            >
                              <Wand2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label>Estoque</Label>
                          <Input
                            type="number"
                            min="0"
                            value={variation.stock}
                            onChange={(e) =>
                              updateVariation(
                                variation.id,
                                "stock",
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Ajuste de Preço</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={variation.price_adjustment}
                            onChange={(e) =>
                              updateVariation(
                                variation.id,
                                "price_adjustment",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default IntelligentVariationsForm;
