/**
 * Seletor de Grade Flexível
 * 
 * Permite ao cliente escolher como comprar a grade:
 * - Grade Completa
 * - Meia Grade
 * - Mesclagem Personalizada (montar própria grade)
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  TrendingUp,
  Users,
  CheckCircle,
  Info,
  Sparkles,
  DollarSign,
} from "lucide-react";
import type { ProductVariation } from "@/types/product";
import type {
  FlexibleGradeConfig,
  CustomGradeSelection,
  HalfGradeInfo,
} from "@/types/flexible-grade";
import { calculateHalfGradeInfo, allowsMultiplePurchaseOptions } from "@/types/flexible-grade";
import { formatCurrency } from "@/lib/utils";
import CustomGradeBuilder from "./CustomGradeBuilder";

interface FlexibleGradeSelectorProps {
  /** Variação de grade com configuração flexível */
  variation: ProductVariation;
  /** Todas as variações de grade do produto (para obter todas as cores disponíveis) */
  allVariations?: ProductVariation[];
  /** Callback quando modo é selecionado */
  onModeSelect: (mode: 'full' | 'half' | 'custom') => void;
  /** Callback quando seleção customizada é feita */
  onCustomSelection?: (selection: CustomGradeSelection) => void;
  /** Preço base do produto */
  basePrice: number;
  /** Modo selecionado atualmente */
  selectedMode?: 'full' | 'half' | 'custom';
  /** Mostrar preços */
  showPrices?: boolean;
}

const FlexibleGradeSelector: React.FC<FlexibleGradeSelectorProps> = ({
  variation,
  allVariations,
  onModeSelect,
  onCustomSelection,
  basePrice,
  selectedMode,
  showPrices = true,
}) => {
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  
  const config = variation.flexible_grade_config;

  // Se não tem configuração flexível ou só permite uma opção, não mostrar seletor
  if (!config || !allowsMultiplePurchaseOptions(config)) {
    return null;
  }

  // Calcular informações de meia grade
  const halfGradeInfo: HalfGradeInfo | null = useMemo(() => {
    if (!config.allow_half_grade || !variation.grade_sizes || !variation.grade_pairs) {
      return null;
    }
    return calculateHalfGradeInfo(variation.grade_sizes, variation.grade_pairs, config);
  }, [config, variation.grade_sizes, variation.grade_pairs]);

  // Calcular preços
  const prices = useMemo(() => {
    const fullGradeTotalPairs = variation.grade_quantity || 0;
    const currentAdjustment = variation.price_adjustment || 0;
    const adjustedBasePrice = basePrice + currentAdjustment;

    // Tentar obter preço da grade
    let fullGradePrice = 0;
    let fullGradeUnitPrice = adjustedBasePrice;

    // 1️⃣ grade_price dedicado (campo do banco — pós migração)
    const gp = (variation as any).grade_price;
    if (gp && gp > 0) {
      fullGradePrice = gp;
      fullGradeUnitPrice = fullGradeTotalPairs > 0 ? gp / fullGradeTotalPairs : gp;
    } else {
      // 2️⃣ Fallback: heurística para não multiplicar em lojas onde basePrice já é o valor total
      const seemsLikeGradePrice = adjustedBasePrice >= fullGradeTotalPairs * 3;
      if (seemsLikeGradePrice) {
        fullGradePrice = adjustedBasePrice;
        fullGradeUnitPrice = fullGradeTotalPairs > 0 ? adjustedBasePrice / fullGradeTotalPairs : adjustedBasePrice;
      } else {
        fullGradePrice = adjustedBasePrice * fullGradeTotalPairs;
        fullGradeUnitPrice = adjustedBasePrice;
      }
    }

    let halfGradePrice = 0;
    let halfGradeUnitPrice = fullGradeUnitPrice;
    if (halfGradeInfo) {
      const discount = (config.half_grade_discount_percentage || 0) / 100;
      halfGradeUnitPrice = fullGradeUnitPrice * (1 - discount);
      halfGradePrice = halfGradeUnitPrice * halfGradeInfo.totalPairs;
    }

    const customMixAdjustment = config.custom_mix_price_adjustment || 0;
    const customMixUnitPrice = fullGradeUnitPrice + customMixAdjustment;

    return {
      full: {
        total: fullGradePrice,
        unit: fullGradeUnitPrice,
        pairs: fullGradeTotalPairs,
      },
      half: halfGradeInfo ? {
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
  }, [basePrice, config, halfGradeInfo, variation.grade_quantity]);

  // Handler para seleção de modo
  const handleModeSelection = (mode: 'full' | 'half' | 'custom') => {
    console.log('🔍 FlexibleGradeSelector - handleModeSelection chamado:', mode);
    
    if (mode === 'custom') {
      setShowCustomBuilder(true);
    } else {
      setShowCustomBuilder(false);
      // 🔴 CORREÇÃO: Garantir que onModeSelect seja chamado para todos os modos
      console.log('✅ FlexibleGradeSelector - Chamando onModeSelect com modo:', mode);
      onModeSelect(mode);
    }
  };

  // Handler para seleção customizada completa
  const handleCustomSelectionComplete = (selection: CustomGradeSelection) => {
    setShowCustomBuilder(false);
    onModeSelect('custom');
    if (onCustomSelection) {
      onCustomSelection(selection);
    }
  };

  // Se está no builder customizado, mostrar apenas ele
  if (showCustomBuilder) {
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
          variation={variation}
          allVariations={allVariations}
          config={config}
          basePrice={basePrice}
          onComplete={handleCustomSelectionComplete}
          onCancel={() => setShowCustomBuilder(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Escolha como comprar:</h3>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Este produto oferece múltiplas formas de compra. Escolha a opção que melhor atende suas necessidades.
        </AlertDescription>
      </Alert>

      {/* Opções de Compra */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Grade Completa */}
        {config.allow_full_grade && (
          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedMode === 'full' 
                ? 'border-blue-500 border-2 bg-blue-50' 
                : 'border-gray-200'
            }`}
            onClick={() => handleModeSelection('full')}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Ícone e Título */}
                <div className="flex items-center justify-between">
                  <Package className="w-8 h-8 text-blue-600" />
                  {selectedMode === 'full' && (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-xl text-gray-900">Grade Completa</h4>
                  <p className="text-base font-medium text-gray-700 mt-1.5">
                    {prices.full.pairs} pares
                  </p>
                </div>

                {/* Preço - Melhor contraste */}
                {showPrices && (
                  <div className="space-y-1.5">
                    <div className="text-3xl font-bold text-blue-700">
                      {formatCurrency(prices.full.total)}
                    </div>
                    <div className="text-base font-medium text-gray-700">
                      {formatCurrency(prices.full.unit)}/par
                    </div>
                  </div>
                )}

                {/* Benefícios - Melhor contraste */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2.5 text-green-700 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    <span>Melhor custo-benefício</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-700 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    <span>Sortimento completo</span>
                  </div>
                </div>

                {/* Badge de Recomendação */}
                <Badge className="w-full justify-center bg-blue-600">
                  Recomendado
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meia Grade */}
        {config.allow_half_grade && prices.half && (
          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedMode === 'half' 
                ? 'border-orange-500 border-2 bg-orange-50' 
                : 'border-gray-200'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🖱️ FlexibleGradeSelector - Card Meia Grade clicado');
              handleModeSelection('half');
            }}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Ícone e Título */}
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                  {selectedMode === 'half' && (
                    <CheckCircle className="w-6 h-6 text-orange-600" />
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-xl text-gray-900">Meia Grade</h4>
                  <p className="text-base font-medium text-gray-700 mt-1.5">
                    {prices.half.pairs} pares ({config.half_grade_percentage}%)
                  </p>
                </div>

                {/* Preço - Melhor contraste */}
                {showPrices && (
                  <div className="space-y-1.5">
                    <div className="text-3xl font-bold text-orange-700">
                      {formatCurrency(prices.half.total)}
                    </div>
                    <div className="text-base font-medium text-gray-700 flex items-center gap-2">
                      <span>{formatCurrency(prices.half.unit)}/par</span>
                      {prices.half.discount > 0 && (
                        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 font-semibold">
                          -{prices.half.discount}%
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Benefícios */}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Menor investimento inicial</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Sortimento balanceado</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mesclagem Personalizada */}
        {config.allow_custom_mix && (
          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedMode === 'custom' 
                ? 'border-purple-500 border-2 bg-purple-50' 
                : 'border-gray-200'
            }`}
            onClick={() => handleModeSelection('custom')}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Ícone e Título */}
                <div className="flex items-center justify-between">
                  <Users className="w-8 h-8 text-purple-600" />
                  {selectedMode === 'custom' && (
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-lg">Monte Sua Grade</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Mínimo {config.custom_mix_min_pairs} pares
                  </p>
                </div>

                {/* Preço */}
                {showPrices && (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-purple-600">
                      A partir de
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(prices.custom.unit)}/par
                      {prices.custom.adjustment !== 0 && (
                        <Badge variant="outline" className="ml-2">
                          {prices.custom.adjustment > 0 ? '+' : ''}
                          {formatCurrency(Math.abs(prices.custom.adjustment))}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Benefícios */}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Sparkles className="w-4 h-4" />
                    <span>Personalização total</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Até {config.custom_mix_max_colors} cores</span>
                  </div>
                </div>

                {/* Badge */}
                <Badge variant="outline" className="w-full justify-center border-purple-600 text-purple-600">
                  Flexível
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detalhes da Seleção */}
      {selectedMode && selectedMode !== 'custom' && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            {selectedMode === 'full' && (
              <>
                <strong>Grade Completa Selecionada:</strong> Você receberá todos os {prices.full.pairs} pares 
                com tamanhos: {variation.grade_sizes?.join(', ')}
              </>
            )}
            {selectedMode === 'half' && halfGradeInfo && (
              <>
                <strong>Meia Grade Selecionada:</strong> Você receberá {halfGradeInfo.totalPairs} pares 
                com tamanhos: {halfGradeInfo.sizes.join(', ')}
                {prices.half && prices.half.discount > 0 && (
                  <span className="text-green-600 ml-2">
                    (Economia de {prices.half.discount}%)
                  </span>
                )}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FlexibleGradeSelector;

