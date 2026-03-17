import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart,
  Plus,
  Minus,
  Package,
  ArrowLeft,
  Palette,
  Ruler,
  CheckCircle2,
} from "lucide-react";
import { Product, ProductVariation } from "@/types/product";
import { resolveColorHex } from "@/lib/colors";
import { CatalogType } from "@/hooks/useCatalog";
import ColorStep from "./ColorStep";
import SizeStep from "./SizeStep";
import { useToast } from "@/components/ui/use-toast";

interface HierarchicalColorSizeSelectorProps {
  product: Product;
  variations: ProductVariation[];
  onAddToCart: (selections: VariationSelection[]) => void;
  catalogType: CatalogType;
  showStock?: boolean;
  onQuickAdd?: (variation: ProductVariation, quantity: number) => void;
}

interface VariationSelection {
  variation: ProductVariation;
  quantity: number;
}

interface ColorGroup {
  color: string;
  totalStock: number;
  variations: ProductVariation[];
  isAvailable: boolean;
}

interface SizeGroup {
  size: string;
  variation: ProductVariation;
  isAvailable: boolean;
}

const HierarchicalColorSizeSelector: React.FC<
  HierarchicalColorSizeSelectorProps
> = ({
  product,
  variations,
  onAddToCart,
  catalogType,
  showStock = true,
  onQuickAdd,
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"color" | "size" | "quantity">("color");

  // Estado para lista de variações selecionadas
  const [selectedVariations, setSelectedVariations] = useState<
    VariationSelection[]
  >([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] =
    useState<ProductVariation | null>(null);
  // Debug para verificar catalogType
  console.log("🔍 HierarchicalColorSizeSelector - Debug:", {
    catalogType,
    productMinWholesaleQty: product.min_wholesale_qty,
    productName: product.name,
  });

  // Quantidade mínima
  const minQuantity: number =
    catalogType === "wholesale" && product.min_wholesale_qty
      ? product.min_wholesale_qty
      : 1;

  const [quantity, setQuantity] = useState(minQuantity);
  const [cart, setCart] = useState<VariationSelection[]>([]);

  // Função para adicionar variação à lista
  const addVariationToList = (
    variation: ProductVariation,
    qty: number = minQuantity
  ) => {
    const existingIndex = selectedVariations.findIndex(
      (item) => item.variation.id === variation.id
    );

    if (existingIndex >= 0) {
      // Se já existe, atualizar quantidade
      setSelectedVariations((prev) => {
        const updated = [...prev];
        updated[existingIndex].quantity += qty;
        return updated;
      });
    } else {
      // Se não existe, adicionar novo
      setSelectedVariations((prev) => [...prev, { variation, quantity: qty }]);
    }

    toast({
      title: "Adicionado à lista!",
      description: `${qty}x ${variation.color} ${variation.size} adicionado.`,
      duration: 2000,
    });
  };

  // Função para remover variação da lista
  const removeVariationFromList = (variationId: string) => {
    setSelectedVariations((prev) =>
      prev.filter((item) => item.variation.id !== variationId)
    );
  };

  // Função para atualizar quantidade de uma variação
  const updateVariationQuantity = (
    variationId: string,
    newQuantity: number
  ) => {
    if (newQuantity <= 0) {
      removeVariationFromList(variationId);
      return;
    }

    setSelectedVariations((prev) =>
      prev.map((item) =>
        item.variation.id === variationId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Função para adicionar todas as variações ao carrinho
  const addAllToCart = () => {
    if (selectedVariations.length === 0) {
      toast({
        title: "Lista vazia",
        description: "Adicione pelo menos uma variação à lista.",
        variant: "destructive",
      });
      return;
    }

    onAddToCart(selectedVariations);
    setSelectedVariations([]);

    toast({
      title: "Produtos adicionados!",
      description: `${selectedVariations.length} variações adicionadas ao carrinho.`,
    });
  };

  // Agrupar variações por cor
  const colorGroups = useMemo<ColorGroup[]>(() => {
    const groups = variations.reduce<Record<string, ColorGroup>>(
      (acc, variation) => {
        const color = variation.color || variation.hex_color || "Sem cor";

        if (!acc[color]) {
          acc[color] = {
            color,
            totalStock: 0,
            variations: [],
            isAvailable: false,
          };
        }

        acc[color].totalStock += variation.stock || 0;
        acc[color].variations.push(variation);
        acc[color].isAvailable = acc[color].totalStock > 0;

        return acc;
      },
      {}
    );

    return Object.values(groups).sort((a, b) => b.totalStock - a.totalStock);
  }, [variations]);

  // Obter tamanhos disponíveis para a cor selecionada
  const availableSizes = useMemo<SizeGroup[]>(() => {
    if (!selectedColor) return [];

    const colorGroup = colorGroups.find(
      (group) => group.color === selectedColor
    );
    if (!colorGroup) return [];

    return colorGroup.variations
      .map((variation) => ({
        size: variation.size || "Único",
        variation,
        isAvailable: (variation.stock || 0) > 0,
      }))
      .sort((a, b) => {
        // Ordenar tamanhos numericamente quando possível
        const aNum = parseInt(a.size);
        const bNum = parseInt(b.size);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.size.localeCompare(b.size);
      });
  }, [selectedColor, colorGroups]);

  // Preço baseado no catálogo
  const getVariationPrice = (variation: ProductVariation) => {
    // As variações usam price_adjustment sobre o preço base do produto
    const basePrice =
      catalogType === "wholesale" && product.wholesale_price
        ? product.wholesale_price
        : product.retail_price;

    return basePrice + (variation.price_adjustment || 0);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setSelectedSize(null);
    setSelectedVariation(null);
    setStep("size");
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const variation = availableSizes.find((s) => s.size === size)?.variation;
    if (variation) {
      setSelectedVariation(variation);
      // Adicionar automaticamente à lista com quantidade mínima
      addVariationToList(variation, minQuantity);

      // Reset para permitir nova seleção
      setSelectedColor(null);
      setSelectedSize(null);
      setSelectedVariation(null);
      setStep("color");
    }
  };

  const handleQuickAddVariation = (variation: ProductVariation) => {
    if (onQuickAdd) {
      onQuickAdd(variation, minQuantity);
    }
  };

  const handleAddToSelection = () => {
    if (!selectedVariation) return;

    const maxStock = selectedVariation.stock || 0;
    if (showStock && quantity > maxStock) {
      toast({
        title: "Quantidade indisponível",
        description: `Estoque máximo disponível: ${maxStock} unidades`,
        variant: "destructive",
      });
      return;
    }

    const newSelection: VariationSelection = {
      variation: selectedVariation,
      quantity,
    };

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.variation.id === selectedVariation.id
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      return [...prev, newSelection];
    });

    toast({
      title: "Produto adicionado",
      description: `${quantity}x ${selectedColor} - ${selectedSize}`,
    });

    // Reset para permitir nova seleção
    setStep("color");
    setSelectedColor(null);
    setSelectedSize(null);
    setSelectedVariation(null);
    setQuantity(minQuantity);
  };

  const handleRemoveFromCart = (variationId: string) => {
    setCart((prev) => prev.filter((item) => item.variation.id !== variationId));
  };

  const handleFinalize = () => {
    if (cart.length === 0) return;
    onAddToCart(cart);
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const price = getVariationPrice(item.variation);
    return sum + price * item.quantity;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Instruções para o usuário */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-sm">💡</span>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Como funciona:</h4>
            <p className="text-sm text-blue-700">
              Selecione uma cor e depois um tamanho. A variação será adicionada
              automaticamente à sua lista. Você pode ajustar as quantidades e
              adicionar quantas variações quiser antes de finalizar.
            </p>
            {minQuantity > 1 && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-700 font-medium">
                  ⚠️ Quantidade mínima: {minQuantity} unidades por variação
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === "color"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Palette className="h-4 w-4" />
        </div>
        <div className="w-8 h-0.5 bg-muted" />
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === "size"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Ruler className="h-4 w-4" />
        </div>
        <div className="w-8 h-0.5 bg-muted" />
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === "quantity"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Package className="h-4 w-4" />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {step === "color" && (
          <ColorStep
            colorGroups={colorGroups}
            selectedColor={selectedColor}
            onColorSelect={handleColorSelect}
            showStock={showStock}
            onQuickAdd={onQuickAdd ? handleQuickAddVariation : undefined}
          />
        )}

        {step === "size" && selectedColor && (
          <SizeStep
            sizeGroups={availableSizes}
            selectedSize={selectedSize}
            onSizeSelect={handleSizeSelect}
            onBack={() => setStep("color")}
            selectedColor={selectedColor}
            showStock={showStock}
            onQuickAdd={onQuickAdd ? handleQuickAddVariation : undefined}
          />
        )}

        {step === "quantity" && selectedVariation && (
          <div className="space-y-6">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("size")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos tamanhos
            </Button>

            {/* Selected Variation Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                  style={{
                    backgroundColor: resolveColorHex(selectedColor || undefined, selectedVariation.hex_color),
                  }}
                />
                <div>
                  <span className="font-semibold">{selectedColor}</span>
                  <span className="mx-2">•</span>
                  <span className="font-semibold">{selectedSize}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-primary">
                  R${" "}
                  {getVariationPrice(selectedVariation).toLocaleString(
                    "pt-BR",
                    { minimumFractionDigits: 2 }
                  )}
                </div>
                {showStock && (
                  <Badge variant="outline" className="text-sm">
                    {selectedVariation.stock} disponível
                  </Badge>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Quantidade</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setQuantity(Math.max(minQuantity, quantity - 1))
                  }
                  disabled={quantity <= minQuantity}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || minQuantity;
                    const maxStock = showStock
                      ? selectedVariation.stock || 0
                      : 999999;
                    setQuantity(Math.min(maxStock, Math.max(minQuantity, val)));
                  }}
                  className="w-20 text-center"
                  min={minQuantity}
                  max={showStock ? selectedVariation.stock || 0 : undefined}
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const maxStock = showStock
                      ? selectedVariation.stock || 0
                      : 999999;
                    setQuantity(Math.min(maxStock, quantity + 1));
                  }}
                  disabled={
                    showStock && quantity >= (selectedVariation.stock || 0)
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {showStock && (
                <p className="text-sm text-muted-foreground">
                  Máximo disponível: {selectedVariation.stock} unidades
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToSelection}
              >
                <Plus className="h-5 w-5 mr-2" />
                Adicionar à Seleção
              </Button>

              {onQuickAdd && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleQuickAddVariation(selectedVariation)}
                  title="Adicionar direto ao carrinho"
                >
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lista de Variações Selecionadas */}
      {selectedVariations.length > 0 && (
        <div className="border-t pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Sua Lista (
                {selectedVariations.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                )}{" "}
                itens)
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVariations([])}
                className="text-xs"
              >
                Limpar Lista
              </Button>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              {selectedVariations.map((item) => (
                <div
                  key={item.variation.id}
                  className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{
                        backgroundColor: resolveColorHex(item.variation.color || undefined, item.variation.hex_color),
                      }}
                    />
                    <div>
                      <div className="font-medium text-sm">
                        {item.variation.color} - {item.variation.size}
                      </div>
                      <div className="text-xs text-gray-600">
                        R${" "}
                        {getVariationPrice(item.variation).toLocaleString(
                          "pt-BR",
                          { minimumFractionDigits: 2 }
                        )}{" "}
                        cada
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Controles de quantidade */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateVariationQuantity(
                            item.variation.id!,
                            Math.max(minQuantity, item.quantity - 1)
                          )
                        }
                        className="h-6 w-6 p-0"
                        disabled={item.quantity <= minQuantity}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateVariationQuantity(
                            item.variation.id!,
                            item.quantity + 1
                          )
                        }
                        className="h-6 w-6 p-0"
                        disabled={
                          showStock &&
                          item.quantity >= (item.variation.stock || 0)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Preço total do item */}
                    <div className="text-sm font-semibold text-green-700 min-w-[60px] text-right">
                      R${" "}
                      {(
                        getVariationPrice(item.variation) * item.quantity
                      ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>

                    {/* Botão remover */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        removeVariationFromList(item.variation.id!)
                      }
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo e botão final */}
            <div className="bg-green-100 border border-green-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-green-800">
                  Total: R${" "}
                  {selectedVariations
                    .reduce(
                      (sum, item) =>
                        sum + getVariationPrice(item.variation) * item.quantity,
                      0
                    )
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                <Badge className="bg-green-600 text-white">
                  {selectedVariations.length} variações
                </Badge>
              </div>

              <Button
                onClick={addAllToCart}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Adicionar Lista ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HierarchicalColorSizeSelector;
