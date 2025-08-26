
import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Minus, ShoppingCart, Package, Palette } from "lucide-react";
import { ProductVariation } from "@/types/variation";
import { Product } from "@/types/product";

interface VariationSelection {
  variation: ProductVariation;
  quantity: number;
}

interface ColorGroup {
  color: string;
  hex_color?: string;
  variations: ProductVariation[];
  totalStock: number;
}

interface HierarchicalColorSizeSelectorProps {
  product: Product;
  variations: ProductVariation[];
  onAddToCart: (selections: VariationSelection[]) => void;
  catalogType?: "retail" | "wholesale";
}

const HierarchicalColorSizeSelector: React.FC<HierarchicalColorSizeSelectorProps> = ({
  product,
  variations,
  onAddToCart,
  catalogType = "retail",
}) => {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selections, setSelections] = useState<VariationSelection[]>([]);

  // Agrupar variações por cor
  const colorGroups = React.useMemo(() => {
    const groups: { [key: string]: ColorGroup } = {};
    
    variations.forEach((variation) => {
      const color = variation.color || 'Único';
      if (!groups[color]) {
        groups[color] = {
          color,
          hex_color: variation.color,
          variations: [],
          totalStock: 0,
        };
      }
      groups[color].variations.push(variation);
      groups[color].totalStock += variation.stock || 0;
    });

    return Object.values(groups);
  }, [variations]);

  const getVariationKey = (variation: ProductVariation) =>
    `${variation.color || ""}-${variation.size || ""}-${variation.id}`;

  const updateQuantity = useCallback((variationKey: string, quantity: number) => {
    setSelections((prev) =>
      prev
        .map((selection) => {
          if (getVariationKey(selection.variation) === variationKey) {
            const maxQty = selection.variation.stock;
            return {
              ...selection,
              quantity: Math.max(0, Math.min(quantity, maxQty)),
            };
          }
          return selection;
        })
        .filter((selection) => selection.quantity > 0)
    );
  }, []);

  const addVariationSelection = useCallback((variation: ProductVariation) => {
    const existingIndex = selections.findIndex(
      (s) => getVariationKey(s.variation) === getVariationKey(variation)
    );

    if (existingIndex >= 0) {
      const newSelections = [...selections];
      const maxQty = variation.stock;
      newSelections[existingIndex] = {
        ...newSelections[existingIndex],
        quantity: Math.min(newSelections[existingIndex].quantity + 1, maxQty),
      };
      setSelections(newSelections);
    } else {
      setSelections((prev) => [...prev, { variation, quantity: 1 }]);
    }
  }, [selections]);

  const handleAddAllToCart = () => {
    if (selections.length > 0) {
      onAddToCart(selections);
      setSelections([]);
    }
  };

  const selectedColorGroup = colorGroups.find(group => group.color === selectedColor);
  const totalItems = selections.reduce((sum, s) => sum + s.quantity, 0);

  // Calcular preço total baseado nas seleções
  const totalPrice = selections.reduce((sum, selection) => {
    const basePrice = catalogType === "wholesale" && product.wholesale_price
      ? product.wholesale_price
      : product.retail_price;
    const itemPrice = basePrice + (selection.variation.price_adjustment || 0);
    return sum + (itemPrice * selection.quantity);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Seleção de Cores */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Escolha a Cor:
        </h4>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {colorGroups.map((colorGroup) => {
            const isSelected = selectedColor === colorGroup.color;
            const isAvailable = colorGroup.totalStock > 0;
            
            return (
              <Button
                key={colorGroup.color}
                variant={isSelected ? "default" : "outline"}
                disabled={!isAvailable}
                onClick={() => setSelectedColor(colorGroup.color)}
                className="h-auto flex-col gap-1 p-2 relative"
              >
                {colorGroup.color !== 'Único' && (
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300 mx-auto"
                    style={{ 
                      backgroundColor: colorGroup.hex_color?.toLowerCase() || colorGroup.color.toLowerCase()
                    }}
                  />
                )}
                <span className="text-xs font-medium">
                  {colorGroup.color}
                </span>
                <span className="text-xs text-gray-500">
                  ({colorGroup.totalStock} un.)
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Seleção de Tamanhos da Cor Escolhida */}
      {selectedColorGroup && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Package className="h-4 w-4" />
            Tamanhos em {selectedColorGroup.color}:
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {selectedColorGroup.variations.map((variation) => {
              const isSelected = selections.some(
                (s) => getVariationKey(s.variation) === getVariationKey(variation)
              );
              const selectedQty = selections.find(
                (s) => getVariationKey(s.variation) === getVariationKey(variation)
              )?.quantity || 0;
              const isAvailable = variation.stock > 0;

              return (
                <Button
                  key={getVariationKey(variation)}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={!isAvailable}
                  onClick={() => addVariationSelection(variation)}
                  className="h-auto flex-col gap-1 p-2 relative text-xs"
                >
                  <span className="font-medium">
                    {variation.size || "Único"}
                  </span>
                  <span className="text-gray-500">
                    {variation.stock} un.
                  </span>
                  {selectedQty > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                    >
                      {selectedQty}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumo de Seleções */}
      {selections.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">
                {totalItems} {totalItems === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
              <div className="text-sm font-semibold text-blue-800">
                Total: R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Lista de Seleções */}
            <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
              {selections.map((selection) => {
                const variationKey = getVariationKey(selection.variation);
                const basePrice = catalogType === "wholesale" && product.wholesale_price
                  ? product.wholesale_price
                  : product.retail_price;
                const itemPrice = basePrice + (selection.variation.price_adjustment || 0);

                return (
                  <div
                    key={variationKey}
                    className="flex items-center justify-between text-xs bg-white rounded p-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {selection.variation.color && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {selection.variation.color}
                          </Badge>
                        )}
                        {selection.variation.size && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {selection.variation.size}
                          </Badge>
                        )}
                      </div>
                      <span className="text-gray-600">
                        R$ {itemPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-6 h-6 p-0"
                        onClick={() =>
                          updateQuantity(variationKey, selection.quantity - 1)
                        }
                      >
                        <Minus className="w-3 h-3" />
                      </Button>

                      <Input
                        type="number"
                        value={selection.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            variationKey,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-12 h-6 text-center text-xs"
                        min={0}
                        max={selection.variation.stock}
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-6 h-6 p-0"
                        onClick={() =>
                          updateQuantity(variationKey, selection.quantity + 1)
                        }
                        disabled={selection.quantity >= selection.variation.stock}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botão de Adicionar ao Carrinho */}
            <Button
              onClick={handleAddAllToCart}
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Adicionar ao Carrinho ({totalItems})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Estado Vazio */}
      {selections.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {!selectedColor 
              ? "Escolha uma cor para ver os tamanhos disponíveis"
              : "Selecione os tamanhos desejados"
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default HierarchicalColorSizeSelector;
