/**
 * Construtor de Grade Personalizada
 * 
 * Permite ao cliente montar sua própria grade selecionando:
 * - Cores específicas
 * - Tamanhos específicos
 * - Quantidades por item
 */

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  Package,
  Palette,
  Ruler,
} from "lucide-react";
import type { ProductVariation } from "@/types/product";
import type {
  FlexibleGradeConfig,
  CustomGradeSelection,
  CustomGradeItem,
} from "@/types/flexible-grade";
import { FlexibleGradeValidator, normalizeCustomSelection, mergeCustomSelectionItems } from "@/lib/validators/flexibleGradeValidator";
import { formatCurrency } from "@/lib/utils";

interface CustomGradeBuilderProps {
  /** Variação de grade base */
  variation: ProductVariation;
  /** Todas as variações de grade do produto (para obter todas as cores disponíveis) */
  allVariations?: ProductVariation[];
  /** Configuração de grade flexível */
  config: FlexibleGradeConfig;
  /** Preço base por par */
  basePrice: number;
  /** Callback quando seleção está completa */
  onComplete: (selection: CustomGradeSelection) => void;
  /** Callback para cancelar */
  onCancel: () => void;
}

const CustomGradeBuilder: React.FC<CustomGradeBuilderProps> = ({
  variation,
  allVariations,
  config,
  basePrice,
  onComplete,
  onCancel,
}) => {
  // Estado da seleção
  const [items, setItems] = useState<CustomGradeItem[]>([]);
  
  // Estado para adicionar novo item
  const [newItem, setNewItem] = useState<{
    color: string;
    size: string;
    quantity: number;
  }>({
    color: '',
    size: '',
    quantity: 1,
  });

  // Cores e tamanhos disponíveis
  const availableColors = useMemo(() => {
    // 🔴 NOVO: Obter todas as cores disponíveis de todas as variações de grade
    const colorsSet = new Set<string>();
    
    // Se temos todas as variações, usar todas as cores
    if (allVariations && allVariations.length > 0) {
      allVariations.forEach(v => {
        const color = v.grade_color || v.color;
        if (color) {
          colorsSet.add(color);
        }
      });
    } else {
      // Fallback: usar apenas a cor da variação atual
      const color = variation.grade_color || variation.color;
      if (color) {
        colorsSet.add(color);
      }
    }
    
    // Se não encontrou nenhuma cor, usar 'Padrão'
    if (colorsSet.size === 0) {
      colorsSet.add('Padrão');
    }
    
    return Array.from(colorsSet).sort();
  }, [variation, allVariations]);

  const availableSizes = useMemo(() => {
    if (config.custom_mix_allow_any_size && variation.grade_sizes) {
      return variation.grade_sizes;
    }
    return config.custom_mix_preset_sizes || variation.grade_sizes || [];
  }, [config, variation.grade_sizes]);

  // Calcular totais e validações
  const summary = useMemo(() => {
    const totalPairs = items.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueColors = new Set(items.map(item => item.color)).size;
    const meetsMinimum = totalPairs >= config.custom_mix_min_pairs;
    const withinColorLimit = uniqueColors <= config.custom_mix_max_colors;
    
    const unitPrice = basePrice + (config.custom_mix_price_adjustment || 0);
    const estimatedPrice = totalPairs * unitPrice;

    return {
      totalPairs,
      uniqueColors,
      meetsMinimum,
      withinColorLimit,
      unitPrice,
      estimatedPrice,
      isValid: meetsMinimum && withinColorLimit && items.length > 0,
    };
  }, [items, config, basePrice]);

  // Validação da seleção atual
  const validation = useMemo(() => {
    if (items.length === 0) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const selection: CustomGradeSelection = {
      items,
      totalPairs: summary.totalPairs,
      meetsMinimum: summary.meetsMinimum,
      estimatedPrice: summary.estimatedPrice,
    };

    return FlexibleGradeValidator.validateCustomSelection(selection, config, availableSizes);
  }, [items, summary, config, availableSizes]);

  // Adicionar item
  const addItem = () => {
    if (!newItem.color || !newItem.size || newItem.quantity <= 0) {
      return;
    }

    const item: CustomGradeItem = {
      ...newItem,
      unitPrice: summary.unitPrice,
    };

    setItems(prev => {
      const merged = mergeCustomSelectionItems([...prev, item]);
      return merged;
    });

    // Resetar formulário
    setNewItem({
      color: '',
      size: '',
      quantity: 1,
    });
  };

  // Atualizar quantidade de um item
  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }

    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  };

  // Remover item
  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Finalizar seleção
  const handleComplete = () => {
    if (!summary.isValid) {
      return;
    }

    const selection: CustomGradeSelection = normalizeCustomSelection({
      items,
      totalPairs: summary.totalPairs,
      meetsMinimum: summary.meetsMinimum,
      estimatedPrice: summary.estimatedPrice,
    });

    onComplete(selection);
  };

  // Progress em relação ao mínimo
  const progressPercentage = Math.min(100, (summary.totalPairs / config.custom_mix_min_pairs) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            Monte Sua Grade Personalizada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Regras */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-600" />
                <span>Mínimo: {config.custom_mix_min_pairs} pares</span>
              </div>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-600" />
                <span>Máx. {config.custom_mix_max_colors} cores</span>
              </div>
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-purple-600" />
                <span>{availableSizes.length} tamanhos disponíveis</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso:</span>
                <span className={summary.meetsMinimum ? "text-green-600 font-medium" : "text-gray-600"}>
                  {summary.totalPairs} / {config.custom_mix_min_pairs} pares
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Adição */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Cor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cor</label>
              <select
                value={newItem.color}
                onChange={(e) => setNewItem(prev => ({ ...prev, color: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Selecione...</option>
                {availableColors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            {/* Tamanho */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tamanho</label>
              <select
                value={newItem.size}
                onChange={(e) => setNewItem(prev => ({ ...prev, size: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Selecione...</option>
                {availableSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            {/* Quantidade */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade</label>
              <Input
                type="number"
                min="1"
                value={newItem.quantity}
                onChange={(e) => setNewItem(prev => ({ 
                  ...prev, 
                  quantity: parseInt(e.target.value) || 1 
                }))}
              />
            </div>

            {/* Botão Adicionar */}
            <div className="space-y-2">
              <label className="text-sm font-medium invisible">Ação</label>
              <Button
                onClick={addItem}
                className="w-full"
                disabled={!newItem.color || !newItem.size}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Itens Selecionados */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Itens Selecionados ({items.length})</span>
              <Badge variant="outline">{summary.totalPairs} pares</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{item.color}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-gray-500" />
                      <span>Tamanho {item.size}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Controles de Quantidade */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(index, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-12 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(index, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Botão Remover */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validação e Avisos */}
      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validation.warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validation.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Resumo e Ações */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Total de Pares</div>
                <div className="text-2xl font-bold text-purple-600">
                  {summary.totalPairs}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Cores Diferentes</div>
                <div className="text-2xl font-bold">
                  {summary.uniqueColors}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Preço Unitário</div>
                <div className="text-xl font-bold">
                  {formatCurrency(summary.unitPrice)}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Total Estimado</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.estimatedPrice)}
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!summary.isValid}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar Seleção
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ajuda */}
      {items.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Como funciona:</strong> Selecione cores e tamanhos individuais para montar sua grade personalizada. 
            Você precisa de no mínimo {config.custom_mix_min_pairs} pares e pode escolher até {config.custom_mix_max_colors} cores diferentes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CustomGradeBuilder;

