/**
 * MultiVariationSelector
 * Permite selecionar quantidades de múltiplas variações de uma vez
 * Ex: Preto 34 (2 un), Preto 36 (1 un), Branco 34 (3 un) → Adicionar ao Carrinho
 */
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Package } from "lucide-react";
import { ProductVariation } from "@/types/product";
import { formatCurrency } from "@/lib/utils";

interface VariationQuantity {
  variation: ProductVariation;
  quantity: number;
}

interface MultiVariationSelectorProps {
  variations: ProductVariation[];
  basePrice: number;
  onAddToCart: (items: VariationQuantity[]) => void;
}

const MultiVariationSelector: React.FC<MultiVariationSelectorProps> = ({
  variations,
  basePrice,
  onAddToCart,
}) => {
  // Estado: mapa de id → quantidade selecionada
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const activeVariations = useMemo(
    () => variations.filter((v) => v.is_active !== false && !v.is_grade),
    [variations]
  );

  // Agrupar por cor (se existir)
  const groupedByColor = useMemo(() => {
    const groups: Record<string, ProductVariation[]> = {};
    activeVariations.forEach((v) => {
      const key = v.color || "Sem Cor";
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    });
    return groups;
  }, [activeVariations]);

  const hasColors = activeVariations.some((v) => v.color);
  const hasSizes = activeVariations.some((v) => v.size);

  const setQty = (id: string, qty: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, qty),
    }));
  };

  const increment = (id: string) => {
    const variation = activeVariations.find((v) => v.id === id);
    const maxStock = variation?.stock ?? 999;
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.min((prev[id] || 0) + 1, maxStock),
    }));
  };

  const decrement = (id: string) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) - 1),
    }));
  };

  // Itens selecionados (qty > 0)
  const selectedItems = useMemo(
    () =>
      activeVariations
        .filter((v) => (quantities[v.id] || 0) > 0)
        .map((v) => ({ variation: v, quantity: quantities[v.id] })),
    [activeVariations, quantities]
  );

  const totalUnits = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = selectedItems.reduce((sum, i) => {
    const price = basePrice + (i.variation.price_adjustment || 0);
    return sum + price * i.quantity;
  }, 0);

  const handleAddToCart = () => {
    if (selectedItems.length === 0) return;
    onAddToCart(selectedItems);
    // Resetar quantidades após adicionar
    setQuantities({});
  };

  if (activeVariations.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Package className="w-4 h-4" />
        <span>Selecione a quantidade de cada variação</span>
      </div>

      {/* Tabela de variações agrupadas por cor */}
      {hasColors ? (
        <div className="space-y-4">
          {Object.entries(groupedByColor).map(([color, vars]) => (
            <div key={color}>
              {/* Cabeçalho da cor */}
              <div className="flex items-center gap-2 mb-2">
                {color !== "Sem Cor" && (
                  <div
                    className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0"
                    style={{
                      backgroundColor:
                        vars[0]?.hex_color || colorToHex(color),
                    }}
                  />
                )}
                <span className="font-semibold text-sm text-gray-700">
                  {color}
                </span>
              </div>

              {/* Variações desta cor */}
              <div className="space-y-2 pl-2">
                {vars.map((variation) => {
                  const qty = quantities[variation.id] || 0;
                  const price = basePrice + (variation.price_adjustment || 0);
                  const outOfStock =
                    variation.stock !== undefined && variation.stock <= 0;

                  return (
                    <div
                      key={variation.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        qty > 0
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 bg-gray-50"
                      } ${outOfStock ? "opacity-50" : ""}`}
                    >
                      {/* Tamanho + Preço */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {hasSizes && variation.size && (
                            <Badge
                              variant={qty > 0 ? "default" : "secondary"}
                              className="text-xs font-bold"
                            >
                              {variation.size}
                            </Badge>
                          )}
                          {variation.price_adjustment !== 0 && (
                            <span className="text-sm font-semibold text-primary">
                              {formatCurrency(price)}
                            </span>
                          )}
                          {outOfStock && (
                            <span className="text-xs text-red-500">
                              Sem estoque
                            </span>
                          )}
                          {!outOfStock && variation.stock !== undefined && variation.stock <= 5 && variation.stock > 0 && (
                            <span className="text-xs text-orange-500">
                              Últimas {variation.stock} un.
                            </span>
                          )}
                        </div>
                        {qty > 0 && (
                          <p className="text-xs text-primary mt-0.5 font-medium">
                            Subtotal: {formatCurrency(price * qty)}
                          </p>
                        )}
                      </div>

                      {/* Controle de quantidade */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => decrement(variation.id)}
                          disabled={qty === 0 || outOfStock}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span
                          className={`text-sm font-bold w-8 text-center ${
                            qty > 0 ? "text-primary" : "text-gray-400"
                          }`}
                        >
                          {qty}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => increment(variation.id)}
                          disabled={outOfStock || qty >= (variation.stock || 999)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Sem agrupamento por cor — lista simples */
        <div className="space-y-2">
          {activeVariations.map((variation) => {
            const qty = quantities[variation.id] || 0;
            const price = basePrice + (variation.price_adjustment || 0);
            const outOfStock =
              variation.stock !== undefined && variation.stock <= 0;

            return (
              <div
                key={variation.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  qty > 0
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 bg-gray-50"
                } ${outOfStock ? "opacity-50" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {variation.size && (
                      <Badge
                        variant={qty > 0 ? "default" : "secondary"}
                        className="text-xs font-bold"
                      >
                        {variation.size}
                      </Badge>
                    )}
                    {variation.price_adjustment !== 0 && (
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(price)}
                      </span>
                    )}
                    {outOfStock && (
                      <span className="text-xs text-red-500">Sem estoque</span>
                    )}
                  </div>
                  {qty > 0 && (
                    <p className="text-xs text-primary mt-0.5 font-medium">
                      Subtotal: {formatCurrency(price * qty)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => decrement(variation.id)}
                    disabled={qty === 0 || outOfStock}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span
                    className={`text-sm font-bold w-8 text-center ${
                      qty > 0 ? "text-primary" : "text-gray-400"
                    }`}
                  >
                    {qty}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => increment(variation.id)}
                    disabled={outOfStock || qty >= (variation.stock || 999)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rodapé com resumo + botão */}
      {totalUnits > 0 && (
        <>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-semibold">{totalUnits} unidade{totalUnits > 1 ? "s" : ""} selecionada{totalUnits > 1 ? "s" : ""}</span>
              <span className="text-gray-500 ml-2">
                • {selectedItems.length} variação{selectedItems.length > 1 ? "ões" : ""}
              </span>
            </div>
            <span className="font-bold text-primary text-base">
              {formatCurrency(totalPrice)}
            </span>
          </div>
        </>
      )}

      <Button
        onClick={handleAddToCart}
        disabled={totalUnits === 0}
        className="w-full gap-2"
        size="lg"
      >
        <ShoppingCart className="w-5 h-5" />
        {totalUnits === 0
          ? "Selecione as quantidades"
          : `Adicionar ${totalUnits} item${totalUnits > 1 ? "s" : ""} ao Carrinho`}
      </Button>
    </div>
  );
};

/** Converte nome de cor comum para hexadecimal aproximado */
function colorToHex(colorName: string): string {
  const map: Record<string, string> = {
    preto: "#000000",
    branco: "#FFFFFF",
    vermelho: "#EF4444",
    azul: "#3B82F6",
    verde: "#22C55E",
    amarelo: "#EAB308",
    rosa: "#EC4899",
    roxo: "#A855F7",
    laranja: "#F97316",
    cinza: "#6B7280",
    marrom: "#92400E",
    bege: "#D2B48C",
    dourado: "#FFD700",
    prata: "#C0C0C0",
    navy: "#001F5B",
    nude: "#E8C8A0",
  };
  return map[colorName.toLowerCase()] || "#9CA3AF";
}

export default MultiVariationSelector;
