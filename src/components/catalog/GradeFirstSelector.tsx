/**
 * Seletor de Grade com Fluxo Melhorado
 * 
 * Fluxo:
 * 1. Mostra preço unitário
 * 2. Seleciona tipo de grade (Completa, Meia, Flexível) - nível pai
 * 3. Mostra cores disponíveis - nível filho
 * 4. Permite adicionar múltiplas cores com mesmo tipo de grade
 * 5. Sugere outras cores após adicionar
 */

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  TrendingUp,
  Sparkles,
  CheckCircle,
  Plus,
  ShoppingCart,
  Palette,
  Info,
} from "lucide-react";
import type { ProductVariation } from "@/types/product";
import type {
  FlexibleGradeConfig,
  CustomGradeSelection,
  HalfGradeInfo,
} from "@/types/flexible-grade";
import {
  calculateHalfGradeInfo,
  allowsMultiplePurchaseOptions,
  hasFlexibleConfig,
} from "@/types/flexible-grade";
import { formatCurrency } from "@/lib/utils";
import CustomGradeBuilder from "./CustomGradeBuilder";

interface GradeFirstSelectorProps {
  /** Todas as variações de grade do produto */
  variations: ProductVariation[];
  /** Preço base do produto */
  basePrice: number;
  /** Callback quando item é adicionado ao carrinho */
  onAddToCart: (
    variation: ProductVariation,
    gradeMode: 'full' | 'half' | 'custom',
    customSelection?: CustomGradeSelection
  ) => void;
  /** Mostrar preços */
  showPrices?: boolean;
  /** Mostrar estoque */
  showStock?: boolean;
  /** Cores já adicionadas ao carrinho (para sugerir outras) */
  addedColors?: string[];
}

const GradeFirstSelector: React.FC<GradeFirstSelectorProps> = ({
  variations,
  basePrice,
  onAddToCart,
  showPrices = true,
  showStock = false,
  addedColors = [],
}) => {
  // Estado principal
  const [selectedGradeMode, setSelectedGradeMode] = useState<'full' | 'half' | 'custom' | null>(null);
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customSelection, setCustomSelection] = useState<CustomGradeSelection | null>(null);
  const [lastAddedColor, setLastAddedColor] = useState<string | null>(null);

  // Pegar primeira variação para obter configuração (todas devem ter a mesma config)
  const firstVariation = variations[0];
  const config = firstVariation?.flexible_grade_config;

  // Verificar se tem configuração flexível
  const hasFlexible = config && allowsMultiplePurchaseOptions(config);

  // Agrupar variações por cor
  const colorGroups = useMemo(() => {
    const groups = new Map<string, ProductVariation[]>();
    variations.forEach((v) => {
      const color = v.grade_color || v.color || 'Sem Cor';
      if (!groups.has(color)) {
        groups.set(color, []);
      }
      groups.get(color)!.push(v);
    });
    return Array.from(groups.entries()).map(([color, vars]) => ({
      color,
      variation: vars[0], // Todas as variações da mesma cor têm mesma estrutura
      stock: vars.reduce((sum, v) => sum + (v.stock || 0), 0),
    }));
  }, [variations]);

  // Calcular informações de meia grade
  const halfGradeInfo: HalfGradeInfo | null = useMemo(() => {
    if (!config?.allow_half_grade || !firstVariation?.grade_sizes || !firstVariation?.grade_pairs) {
      return null;
    }
    return calculateHalfGradeInfo(
      firstVariation.grade_sizes,
      firstVariation.grade_pairs,
      config
    );
  }, [config, firstVariation]);

  // Calcular preços para cada modo
  const prices = useMemo(() => {
    const fullGradeTotalPairs = firstVariation?.grade_quantity || 0;
    const fullGradePrice = basePrice * fullGradeTotalPairs;

    let halfGradePrice = 0;
    let halfGradeUnitPrice = basePrice;
    if (halfGradeInfo && config?.allow_half_grade) {
      const discount = (config.half_grade_discount_percentage || 0) / 100;
      halfGradeUnitPrice = basePrice * (1 - discount);
      halfGradePrice = halfGradeUnitPrice * halfGradeInfo.totalPairs;
    }

    const customMixAdjustment = config?.custom_mix_price_adjustment || 0;
    const customMixUnitPrice = basePrice + customMixAdjustment;

    return {
      full: {
        total: fullGradePrice,
        unit: basePrice,
        pairs: fullGradeTotalPairs,
      },
      half: halfGradeInfo && config?.allow_half_grade ? {
        total: halfGradePrice,
        unit: halfGradeUnitPrice,
        pairs: halfGradeInfo.totalPairs,
        discount: config.half_grade_discount_percentage || 0,
      } : null,
      custom: {
        unit: customMixUnitPrice,
        adjustment: customMixAdjustment,
      },
    };
  }, [basePrice, config, halfGradeInfo, firstVariation]);

  // Handler para seleção de modo de grade
  const handleGradeModeSelect = (mode: 'full' | 'half' | 'custom') => {
    if (mode === 'custom') {
      setShowCustomBuilder(true);
    } else {
      setShowCustomBuilder(false);
      setSelectedGradeMode(mode);
      setCustomSelection(null);
    }
  };

  // Handler para seleção de cor
  const handleColorToggle = (color: string) => {
    const newSelected = new Set(selectedColors);
    if (newSelected.has(color)) {
      newSelected.delete(color);
    } else {
      newSelected.add(color);
    }
    setSelectedColors(newSelected);
  };

  // Handler para adicionar ao carrinho
  const handleAddColorToCart = (color: string) => {
    if (!selectedGradeMode) return;

    const colorGroup = colorGroups.find(g => g.color === color);
    if (!colorGroup) return;

    const variation = colorGroup.variation;

    // Se for custom, precisa ter seleção customizada
    if (selectedGradeMode === 'custom' && !customSelection) {
      return;
    }

    onAddToCart(variation, selectedGradeMode, customSelection || undefined);
    setLastAddedColor(color);
    
    // Limpar seleção de cor específica, mas manter modo de grade
    setSelectedColors(prev => {
      const newSet = new Set(prev);
      newSet.delete(color);
      return newSet;
    });
  };

  // Handler para adicionar todas as cores selecionadas
  const handleAddAllSelected = () => {
    selectedColors.forEach(color => {
      handleAddColorToCart(color);
    });
  };

  // Handler para seleção customizada completa
  const handleCustomSelectionComplete = (selection: CustomGradeSelection) => {
    setCustomSelection(selection);
    setShowCustomBuilder(false);
    setSelectedGradeMode('custom');
  };

  // Cores disponíveis para sugestão (não adicionadas ainda)
  const availableColorsForSuggestion = colorGroups
    .filter(g => !addedColors.includes(g.color))
    .map(g => g.color);

  // Se está no builder customizado, mostrar apenas ele
  if (showCustomBuilder && firstVariation) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setShowCustomBuilder(false)}
          className="mb-4"
        >
          ← Voltar às Opções
        </Button>
        
        <CustomGradeBuilder
          variation={firstVariation}
          config={config!}
          basePrice={basePrice}
          onComplete={handleCustomSelectionComplete}
          onCancel={() => setShowCustomBuilder(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preço Unitário */}
      {showPrices && (
        <div className="text-center p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground mb-1">Preço Unitário</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(basePrice)}</p>
          <p className="text-xs text-muted-foreground mt-1">por par</p>
        </div>
      )}

      {/* Seleção de Tipo de Grade - NÍVEL PAI */}
      <div className="space-y-3">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Escolha o Tipo de Grade
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Grade Completa */}
          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedGradeMode === 'full'
                ? 'border-primary border-2 bg-primary/5 shadow-md'
                : 'border-gray-200 hover:border-primary/50'
            }`}
            onClick={() => handleGradeModeSelect('full')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-6 h-6 text-primary" />
                {selectedGradeMode === 'full' && (
                  <CheckCircle className="w-5 h-5 text-primary" />
                )}
              </div>
              <h5 className="font-bold text-lg mb-1">Grade Completa</h5>
              {showPrices && prices.full && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {prices.full.pairs} pares
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(prices.full.total)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(prices.full.unit)}/par
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meia Grade */}
          {config?.allow_half_grade && prices.half && (
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedGradeMode === 'half'
                  ? 'border-orange-500 border-2 bg-orange-50 shadow-md'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
              onClick={() => handleGradeModeSelect('half')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                  {selectedGradeMode === 'half' && (
                    <CheckCircle className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <h5 className="font-bold text-lg mb-1">Meia Grade</h5>
                {showPrices && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {prices.half.pairs} pares ({config.half_grade_percentage}%)
                    </p>
                    <p className="text-xl font-bold">
                      {formatCurrency(prices.half.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(prices.half.unit)}/par
                    </p>
                    {prices.half.discount > 0 && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        -{prices.half.discount}%
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Grade Flexível/Custom */}
          {config?.allow_custom_mix && (
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedGradeMode === 'custom'
                  ? 'border-purple-500 border-2 bg-purple-50 shadow-md'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => handleGradeModeSelect('custom')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  {selectedGradeMode === 'custom' && (
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                <h5 className="font-bold text-lg mb-1">Montar Grade</h5>
                {showPrices && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Escolha seus pares
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(prices.custom.unit)}/par
                      {prices.custom.adjustment !== 0 && (
                        <span className={prices.custom.adjustment > 0 ? 'text-red-600' : 'text-green-600'}>
                          {prices.custom.adjustment > 0 ? ' +' : ' '}
                          {formatCurrency(Math.abs(prices.custom.adjustment))}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Seleção de Cores - NÍVEL FILHO (só aparece após selecionar tipo de grade) */}
      {selectedGradeMode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Selecione as Cores
            </h4>
            {selectedColors.size > 0 && (
              <Badge variant="secondary">
                {selectedColors.size} selecionada{selectedColors.size > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {colorGroups.map(({ color, variation, stock }) => {
              const isSelected = selectedColors.has(color);
              const isAdded = addedColors.includes(color);
              const isAvailable = stock > 0 || !showStock;

              return (
                <Card
                  key={color}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? 'border-primary border-2 bg-primary/5 shadow-md'
                      : isAdded
                      ? 'border-green-300 border-2 bg-green-50'
                      : 'border-gray-200 hover:border-primary/50'
                  } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => isAvailable && !isAdded && handleColorToggle(color)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                      {isAdded && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                          No carrinho
                        </Badge>
                      )}
                    </div>
                    <h5 className="font-semibold text-base mb-2">{color}</h5>
                    {showStock && (
                      <p className="text-xs text-muted-foreground">
                        {isAvailable ? `${stock} disponível` : 'Indisponível'}
                      </p>
                    )}
                    {isAdded && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddColorToCart(color);
                        }}
                      >
                        Adicionar novamente
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Botão para adicionar todas as cores selecionadas */}
          {selectedColors.size > 0 && (
            <div className="flex gap-2">
              <Button
                onClick={handleAddAllSelected}
                className="flex-1"
                size="lg"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Adicionar {selectedColors.size} cor{selectedColors.size > 1 ? 'es' : ''} ao carrinho
              </Button>
            </div>
          )}

          {/* Botão para adicionar cor individual (se apenas 1 selecionada) */}
          {selectedColors.size === 1 && (
            <Button
              onClick={() => handleAddColorToCart(Array.from(selectedColors)[0])}
              className="w-full"
              size="lg"
              disabled={selectedGradeMode === 'custom' && !customSelection}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Adicionar ao carrinho
            </Button>
          )}

          {/* Alerta para grade customizada */}
          {selectedGradeMode === 'custom' && !customSelection && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Clique em "Montar Grade" novamente para configurar sua seleção personalizada.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Sugestão de outras cores após adicionar */}
      {lastAddedColor && availableColorsForSuggestion.length > 0 && (
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Adicione a mesma grade em outras cores: {availableColorsForSuggestion.slice(0, 3).join(', ')}
              {availableColorsForSuggestion.length > 3 && ` e mais ${availableColorsForSuggestion.length - 3}`}
            </span>
            <div className="flex gap-2 ml-4">
              {availableColorsForSuggestion.slice(0, 3).map(color => (
                <Button
                  key={color}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedColors(new Set([color]));
                    handleAddColorToCart(color);
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {color}
                </Button>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Informações adicionais */}
      {selectedGradeMode && firstVariation && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h5 className="font-semibold mb-2">Informações da Grade</h5>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <strong>Tamanhos:</strong> {firstVariation.grade_sizes?.join(', ') || 'N/A'}
            </p>
            {selectedGradeMode === 'half' && halfGradeInfo && (
              <p>
                <strong>Meia Grade:</strong> {halfGradeInfo.totalPairs} pares
                ({halfGradeInfo.percentage}% da grade completa)
              </p>
            )}
            {selectedGradeMode === 'custom' && customSelection && (
              <p>
                <strong>Grade Personalizada:</strong> {customSelection.totalPairs} pares
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeFirstSelector;
