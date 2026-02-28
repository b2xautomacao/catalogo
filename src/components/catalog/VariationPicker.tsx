/**
 * VariationPicker
 * Seletor por etapas: Cor → Tamanho → Quantidade → Adicionar ao Carrinho
 * Após adicionar: card de confirmação com "Ver Carrinho" ou "Adicionar outra variação"
 */
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Eye,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { ProductVariation } from "@/types/product";
import { formatCurrency } from "@/lib/utils";

interface VariationPickerProps {
  variations: ProductVariation[];
  basePrice: number;
  onAddToCart: (variation: ProductVariation, quantity: number) => void;
  onViewCart: () => void;
}

/** Converte nome de cor para hex aproximado */
function colorToHex(colorName?: string): string {
  if (!colorName) return "#9CA3AF";
  const map: Record<string, string> = {
    preto: "#1a1a1a",
    branco: "#f5f5f5",
    vermelho: "#EF4444",
    azul: "#3B82F6",
    "azul marinho": "#1e3a8a",
    navy: "#1e3a8a",
    verde: "#22C55E",
    amarelo: "#EAB308",
    rosa: "#EC4899",
    "rosa bebê": "#fbcfe8",
    roxo: "#A855F7",
    laranja: "#F97316",
    cinza: "#6B7280",
    "cinza claro": "#d1d5db",
    marrom: "#92400E",
    bege: "#D4B896",
    caramelo: "#c48c3e",
    dourado: "#FFD700",
    prata: "#C0C0C0",
    nude: "#E8C8A0",
    vinho: "#7f1d1d",
    bordô: "#7f1d1d",
    turquesa: "#06b6d4",
    lilás: "#c084fc",
    creme: "#fef9c3",
    off: "#f5f0e8",
  };
  const lower = colorName.toLowerCase();
  for (const [key, hex] of Object.entries(map)) {
    if (lower.includes(key)) return hex;
  }
  return "#9CA3AF";
}

/** Determina se a cor de texto deve ser escura ou clara */
function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

const VariationPicker: React.FC<VariationPickerProps> = ({
  variations,
  basePrice,
  onAddToCart,
  onViewCart,
}) => {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState<{
    variation: ProductVariation;
    quantity: number;
  } | null>(null);

  const activeVariations = useMemo(
    () => variations.filter((v) => v.is_active !== false && !v.is_grade),
    [variations]
  );

  const hasColors = activeVariations.some((v) => v.color);
  const hasSizes = activeVariations.some((v) => v.size);

  // Cores únicas
  const uniqueColors = useMemo(() => {
    const seen = new Set<string>();
    return activeVariations
      .filter((v) => v.color)
      .filter((v) => {
        if (seen.has(v.color!)) return false;
        seen.add(v.color!);
        return true;
      })
      .map((v) => v.color!);
  }, [activeVariations]);

  // Tamanhos disponíveis para a cor selecionada
  const availableSizes = useMemo(() => {
    const filtered = selectedColor
      ? activeVariations.filter((v) => v.color === selectedColor)
      : activeVariations;
    const seen = new Set<string>();
    return filtered
      .filter((v) => v.size)
      .filter((v) => {
        if (seen.has(v.size!)) return false;
        seen.add(v.size!);
        return true;
      })
      .map((v) => ({ size: v.size!, stock: v.stock ?? 0 }));
  }, [activeVariations, selectedColor]);

  // Variação correspondente à seleção
  const selectedVariation = useMemo(() => {
    if (hasColors && hasSizes) {
      if (!selectedColor || !selectedSize) return null;
      return (
        activeVariations.find(
          (v) => v.color === selectedColor && v.size === selectedSize
        ) || null
      );
    }
    if (hasColors && !hasSizes) {
      if (!selectedColor) return null;
      return activeVariations.find((v) => v.color === selectedColor) || null;
    }
    if (!hasColors && hasSizes) {
      if (!selectedSize) return null;
      return activeVariations.find((v) => v.size === selectedSize) || null;
    }
    return activeVariations[0] || null;
  }, [activeVariations, selectedColor, selectedSize, hasColors, hasSizes]);

  const effectivePrice =
    basePrice + (selectedVariation?.price_adjustment || 0);

  const stockAvailable = selectedVariation?.stock ?? 0;
  const maxQty = stockAvailable > 0 ? stockAvailable : 999;
  const isOutOfStock = selectedVariation && stockAvailable <= 0;
  const isLowStock =
    selectedVariation && stockAvailable > 0 && stockAvailable <= 5;

  const canAdd = !!selectedVariation && !isOutOfStock;

  const handleColorSelect = (color: string) => {
    if (selectedColor === color) {
      setSelectedColor(null);
      setSelectedSize(null);
    } else {
      setSelectedColor(color);
      setSelectedSize(null); // Reset size when color changes
    }
    setQuantity(1);
    setJustAdded(null);
  };

  const handleSizeSelect = (size: string, stock: number) => {
    if (stock <= 0) return; // Sem estoque
    if (selectedSize === size) {
      setSelectedSize(null);
    } else {
      setSelectedSize(size);
    }
    setQuantity(1);
    setJustAdded(null);
  };

  const handleAdd = () => {
    if (!selectedVariation || !canAdd) return;
    onAddToCart(selectedVariation, quantity);
    setJustAdded({ variation: selectedVariation, quantity });
  };

  const handleAddAnother = () => {
    setJustAdded(null);
    setSelectedColor(null);
    setSelectedSize(null);
    setQuantity(1);
  };

  if (activeVariations.length === 0) return null;

  // ── Card de confirmação após adicionar ──────────────────────────────────────
  if (justAdded) {
    const addedColor = justAdded.variation.color;
    const addedSize = justAdded.variation.size;
    const addedPrice = basePrice + (justAdded.variation.price_adjustment || 0);
    const label = [addedColor, addedSize].filter(Boolean).join(" / ");

    return (
      <div className="space-y-4">
        {/* Confirmation card */}
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-900">
                Adicionado ao carrinho!
              </p>
              <p className="text-sm text-green-700 mt-0.5">
                <span className="font-medium">{label}</span> —{" "}
                {justAdded.quantity}x {formatCurrency(addedPrice)}
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                Total: {formatCurrency(addedPrice * justAdded.quantity)}
              </p>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleAddAnother}
            className="gap-2 border-primary text-primary hover:bg-primary/5"
          >
            <Plus className="w-4 h-4" />
            Adicionar outra
          </Button>
          <Button
            onClick={onViewCart}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <ShoppingCart className="w-4 h-4" />
            Ver Carrinho
          </Button>
        </div>
      </div>
    );
  }

  // ── Seletor principal ───────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ETAPA 1 — Cor */}
      {hasColors && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">
              Cor
              {selectedColor && (
                <span className="ml-2 font-normal text-gray-500">
                  — {selectedColor}
                </span>
              )}
            </span>
            {selectedColor && (
              <button
                onClick={() => {
                  setSelectedColor(null);
                  setSelectedSize(null);
                }}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Limpar
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {uniqueColors.map((color) => {
              const hex = colorToHex(color);
              const isLight = isLightColor(hex);
              const isSelected = selectedColor === color;
              // Verificar se tem ao menos 1 variação disponível nessa cor
              const hasStock = activeVariations.some(
                (v) =>
                  v.color === color && (v.stock === undefined || v.stock > 0)
              );

              return (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                  className={`
                    relative flex flex-col items-center gap-1.5 group
                    transition-transform duration-150
                    ${isSelected ? "scale-105" : "hover:scale-105"}
                    ${!hasStock ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                  `}
                  disabled={!hasStock}
                >
                  {/* Círculo de cor */}
                  <div
                    className={`
                      w-10 h-10 rounded-full border-2 shadow-sm flex items-center justify-center
                      transition-all duration-150
                      ${isSelected
                        ? "border-primary ring-2 ring-primary/30 ring-offset-1"
                        : "border-gray-300 group-hover:border-gray-400"
                      }
                    `}
                    style={{ backgroundColor: hex }}
                  >
                    {isSelected && (
                      <Check
                        className={`w-4 h-4 ${isLight ? "text-gray-800" : "text-white"}`}
                      />
                    )}
                    {!hasStock && (
                      <div className="absolute inset-0 rounded-full flex items-center justify-center">
                        <div
                          className="w-full h-px bg-gray-500 rotate-45"
                          style={{ transformOrigin: "center" }}
                        />
                      </div>
                    )}
                  </div>
                  {/* Nome da cor */}
                  <span
                    className={`text-xs leading-tight text-center max-w-[52px] truncate ${
                      isSelected ? "font-semibold text-primary" : "text-gray-600"
                    }`}
                  >
                    {color}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ETAPA 2 — Tamanho (aparece após cor ou direto se sem cor) */}
      {hasSizes && (!hasColors || selectedColor) && (
        <>
          {hasColors && <Separator />}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">
                Tamanho
                {selectedSize && (
                  <span className="ml-2 font-normal text-gray-500">
                    — {selectedSize}
                  </span>
                )}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableSizes.map(({ size, stock }) => {
                const isSelected = selectedSize === size;
                const outOfStock = stock <= 0;
                const lowStock = stock > 0 && stock <= 5;

                return (
                  <button
                    key={size}
                    onClick={() => handleSizeSelect(size, stock)}
                    disabled={outOfStock}
                    className={`
                      relative min-w-[48px] h-10 px-3 rounded-lg border-2 text-sm font-semibold
                      transition-all duration-150
                      ${isSelected
                        ? "border-primary bg-primary text-white shadow-md"
                        : outOfStock
                          ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                          : "border-gray-300 bg-white text-gray-700 hover:border-primary hover:text-primary"
                      }
                    `}
                  >
                    {size}
                    {/* Ponto de estoque baixo */}
                    {!outOfStock && lowStock && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-400 border border-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="flex items-center gap-3 mt-2">
              {availableSizes.some((s) => s.stock > 0 && s.stock <= 5) && (
                <span className="text-xs text-orange-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                  Poucas unidades
                </span>
              )}
              {availableSizes.some((s) => s.stock <= 0) && (
                <span className="text-xs text-gray-400">
                  Riscado = sem estoque
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {/* ETAPA 3 — Quantidade + CTA (aparece quando variação está selecionada) */}
      {(selectedVariation || (!hasColors && !hasSizes)) && (
        <>
          <Separator />

          {/* Preço da variação selecionada */}
          {selectedVariation && selectedVariation.price_adjustment !== 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Preço desta opção:</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(effectivePrice)}
              </span>
            </div>
          )}

          {/* Aviso de estoque baixo */}
          {isLowStock && (
            <div className="flex items-center gap-2 text-orange-600 bg-orange-50 rounded-lg px-3 py-2 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                Últimas <strong>{stockAvailable}</strong> unidade
                {stockAvailable > 1 ? "s" : ""} em estoque!
              </span>
            </div>
          )}

          {/* Sem estoque */}
          {isOutOfStock && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Esta opção está sem estoque no momento.</span>
            </div>
          )}

          {/* Controle de quantidade + Botão */}
          {!isOutOfStock && (
            <div className="flex items-center gap-3">
              {/* Qty */}
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  className="w-9 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-gray-900 text-sm">
                  {quantity}
                </span>
                <button
                  className="w-9 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  onClick={() => setQuantity((q) => Math.min(q + 1, maxQty))}
                  disabled={quantity >= maxQty}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Botão principal */}
              <Button
                onClick={handleAdd}
                disabled={!canAdd}
                className="flex-1 gap-2 font-semibold"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5" />
                Adicionar ao Carrinho
                {quantity > 1 && (
                  <Badge variant="secondary" className="ml-1 bg-white/20 text-white text-xs">
                    {quantity}x
                  </Badge>
                )}
              </Button>
            </div>
          )}

          {/* Total parcial */}
          {!isOutOfStock && quantity > 1 && (
            <p className="text-right text-sm text-gray-500">
              Total:{" "}
              <span className="font-semibold text-gray-800">
                {formatCurrency(effectivePrice * quantity)}
              </span>
            </p>
          )}
        </>
      )}

      {/* Guia quando nada selecionado */}
      {hasColors && !selectedColor && (
        <p className="text-sm text-gray-400 flex items-center gap-1">
          <ChevronRight className="w-4 h-4" />
          Selecione uma cor para continuar
        </p>
      )}
      {hasColors && selectedColor && hasSizes && !selectedSize && (
        <p className="text-sm text-gray-400 flex items-center gap-1">
          <ChevronRight className="w-4 h-4" />
          Agora selecione o tamanho
        </p>
      )}
    </div>
  );
};

export default VariationPicker;
