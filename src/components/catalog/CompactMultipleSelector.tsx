
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProductVariation } from "@/types/variation";
import { Product } from "@/types/product";
import { ShoppingCart, Plus, Minus, Package } from "lucide-react";
import { resolveColorHex } from "@/lib/colors";

interface VariationSelection {
  variation: ProductVariation;
  quantity: number;
}

interface CompactMultipleSelectorProps {
  product: Product;
  variations: ProductVariation[];
  onAddToCart: (selections: VariationSelection[]) => void;
  catalogType?: "retail" | "wholesale";
}

const CompactMultipleSelector: React.FC<CompactMultipleSelectorProps> = ({
  product,
  variations,
  onAddToCart,
  catalogType = "retail"
}) => {
  const [selections, setSelections] = useState<{ [variationId: string]: number }>({});

  // Agrupar variações por cor
  const groupedVariations = variations.reduce((groups, variation) => {
    const color = variation.color || "Sem cor";
    if (!groups[color]) {
      groups[color] = [];
    }
    groups[color].push(variation);
    return groups;
  }, {} as { [color: string]: ProductVariation[] });

  const basePrice = catalogType === "wholesale" && product.wholesale_price 
    ? product.wholesale_price 
    : product.retail_price;

  const handleQuantityChange = (variationId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelections = { ...selections };
      delete newSelections[variationId];
      setSelections(newSelections);
    } else {
      setSelections(prev => ({
        ...prev,
        [variationId]: quantity
      }));
    }
  };

  const getVariationPrice = (variation: ProductVariation) => {
    return basePrice + (variation.price_adjustment || 0);
  };

  const selectedItems = Object.entries(selections)
    .map(([variationId, quantity]) => {
      const variation = variations.find(v => v.id === variationId);
      return variation ? { variation, quantity } : null;
    })
    .filter(Boolean) as VariationSelection[];

  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = selectedItems.reduce((sum, item) => {
    const price = getVariationPrice(item.variation);
    return sum + (price * item.quantity);
  }, 0);

  const handleAddToCart = () => {
    if (selectedItems.length > 0) {
      onAddToCart(selectedItems);
      setSelections({});
    }
  };

  return (
    <div className="space-y-6">
      {/* Grouped Variations */}
      <div className="space-y-4">
        {Object.entries(groupedVariations).map(([color, colorVariations]) => (
          <Card key={color} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Color Header */}
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    {color !== "Sem cor" && (
                      <div 
                        className="w-4 h-4 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: resolveColorHex(color, colorVariations[0]?.hex_color) }}
                      />
                    )}
                    <h4 className="font-medium text-sm">{color}</h4>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {colorVariations.length} tamanhos
                  </Badge>
                </div>

                {/* Size Variations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {colorVariations.map((variation) => {
                    const currentQuantity = selections[variation.id || ''] || 0;
                    const price = getVariationPrice(variation);
                    const isAvailable = variation.stock > 0;

                    return (
                      <div 
                        key={variation.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          currentQuantity > 0 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-border/80'
                        } ${!isAvailable ? 'opacity-50' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {variation.size || 'Tamanho único'}
                            </span>
                            {variation.sku && (
                              <Badge variant="outline" className="text-xs">
                                {variation.sku}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Package className="h-3 w-3" />
                            <span>{variation.stock} disponível</span>
                            <span>•</span>
                            <span className="font-medium text-primary">
                              R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 ml-3">
                          {currentQuantity > 0 ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleQuantityChange(variation.id || '', currentQuantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              
                              <Input
                                type="number"
                                value={currentQuantity}
                                onChange={(e) => handleQuantityChange(variation.id || '', parseInt(e.target.value) || 0)}
                                className="h-8 w-16 text-center text-sm"
                                min="0"
                                max={variation.stock}
                              />
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleQuantityChange(variation.id || '', Math.min(currentQuantity + 1, variation.stock))}
                                disabled={currentQuantity >= variation.stock}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(variation.id || '', 1)}
                              disabled={!isAvailable}
                              className="h-8 px-3 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Adicionar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary and Action */}
      {totalItems > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Resumo da Seleção</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelections({})}
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar tudo
                </Button>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {selectedItems.map(({ variation, quantity }) => (
                  <div key={variation.id} className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {variation.color} - {variation.size} × {quantity}
                    </span>
                    <span className="font-medium">
                      R$ {(getVariationPrice(variation) * quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between items-center font-semibold">
                <span>Total ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</span>
                <span className="text-lg text-primary">
                  R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <Button 
                onClick={handleAddToCart}
                className="w-full"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Adicionar ao Carrinho
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {variations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma variação disponível para este produto</p>
        </div>
      )}
    </div>
  );
};

export default CompactMultipleSelector;
