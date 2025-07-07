
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
} from "lucide-react";
import { useVariationMasterGroups } from "@/hooks/useVariationMasterGroups";
import { ProductVariation } from "@/types/product";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MasterVariationSelectorProps {
  variations: ProductVariation[];
  onVariationsChange: (variations: ProductVariation[]) => void;
}

const MasterVariationSelector: React.FC<MasterVariationSelectorProps> = ({
  variations,
  onVariationsChange,
}) => {
  const { groups, values, loading } = useVariationMasterGroups();
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<{
    [groupId: string]: string[];
  }>({});
  const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix");

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

        // Remover variações que dependem deste grupo
        const updatedVariations = variations.filter((variation) => {
          const group = groups.find((g) => g.id === groupId);
          if (group?.attribute_key === "color") return !variation.color;
          if (group?.attribute_key === "size") return !variation.size;
          if (group?.attribute_key === "material") return !variation.material;
          return true;
        });
        onVariationsChange(updatedVariations);

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

  const getValuesByGroup = (groupId: string) => {
    const selectedValueIds = selectedValues[groupId] || [];
    return selectedValueIds
      .map((valueId) => {
        const value = values.find((v) => v.id === valueId);
        return value?.value || "";
      })
      .filter(Boolean);
  };

  const createVariationIfNotExists = (color?: string, size?: string, material?: string) => {
    const existingVariation = variations.find(
      (v) => v.color === color && v.size === size && v.material === material
    );

    if (!existingVariation) {
      const uniqueId = `variation-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const newVariation: ProductVariation = {
        id: uniqueId,
        product_id: '',
        color,
        size,
        material,
        stock: 0,
        price_adjustment: 0,
        is_active: true,
        sku: "",
        image_url: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      onVariationsChange([...variations, newVariation]);
    }
  };

  const toggleVariationExists = (color?: string, size?: string, material?: string) => {
    const existingIndex = variations.findIndex(
      (v) => v.color === color && v.size === size && v.material === material
    );

    if (existingIndex >= 0) {
      // Remover variação
      const updatedVariations = variations.filter(
        (_, i) => i !== existingIndex
      );
      onVariationsChange(updatedVariations);
    } else {
      // Criar variação
      createVariationIfNotExists(color, size, material);
    }
  };

  const updateVariation = (
    variationId: string,
    updates: Partial<ProductVariation>
  ) => {
    const updatedVariations = variations.map((variation) =>
      variation.id === variationId ? { ...variation, ...updates } : variation
    );
    onVariationsChange(updatedVariations);
  };

  const getVariation = (color?: string, size?: string, material?: string) => {
    return variations.find((v) => v.color === color && v.size === size && v.material === material);
  };

  const colorGroup = groups.find((g) => g.attribute_key === "color");
  const sizeGroup = groups.find((g) => g.attribute_key === "size");
  const materialGroup = groups.find((g) => g.attribute_key === "material");
  
  const colorValues = colorGroup ? getValuesByGroup(colorGroup.id) : [];
  const sizeValues = sizeGroup ? getValuesByGroup(sizeGroup.id) : [];
  const materialValues = materialGroup ? getValuesByGroup(materialGroup.id) : [];

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
            <Card
              key={group.id}
              className={`cursor-pointer transition-colors ${
                selectedGroups.includes(group.id)
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-gray-50"
              }`}
            >
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Seleção de Valores */}
      {selectedGroups.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">
            2. Selecione os valores para cada tipo
          </h4>
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
                        onClick={() => handleValueToggle(groupId, value.id)}
                      >
                        <Checkbox
                          checked={
                            selectedValues[groupId]?.includes(value.id) || false
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

      {/* Resumo das Variaciones */}
      {variations.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {variations.filter((v) => v.is_active).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Variações Ativas
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {variations.filter((v) => !v.is_active).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Variações Inativas
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {variations.reduce((sum, v) => sum + v.stock, 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Estoque Total
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {variations.filter((v) => v.stock > 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Com Estoque</div>
              </div>
            </div>
          </CardContent>
        </Card>
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
