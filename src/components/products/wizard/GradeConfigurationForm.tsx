import React, { useState, useCallback } from "react";
import { ProductVariation } from "@/types/product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Package,
  Plus,
  Minus,
  Palette,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Eye,
  Settings,
  Info,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateUniqueProductSKU } from "@/utils/skuGenerator";
import FlexibleGradeConfigForm from "./FlexibleGradeConfigForm";
import ColorPickerPopover from "./ColorPickerPopover";
import type { FlexibleGradeConfig } from "@/types/flexible-grade";
import { DEFAULT_FLEXIBLE_GRADE_CONFIG } from "@/types/flexible-grade";
import { useStoreGrades } from "@/hooks/useStoreGrades";
import { useStoreColors } from "@/hooks/useStoreColors";
import { resolveColorHex } from "@/lib/colors";

interface GradeConfigurationFormProps {
  variations: ProductVariation[];
  onVariationsGenerated: (variations: ProductVariation[]) => void;
  productId?: string;
  storeId?: string;
  productName?: string;
}

interface SizePairConfig {
  size: string;
  pairs: number;
}

const GradeConfigurationForm: React.FC<GradeConfigurationFormProps> = ({
  variations,
  onVariationsGenerated,
  productId,
  storeId,
  productName = "Produto",
}) => {
  const { toast } = useToast();
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState("");
  const [sizePairConfigs, setSizePairConfigs] = useState<SizePairConfig[]>([]);
  const [gradeName, setGradeName] = useState("Grade Personalizada");

  const { grades: storeGrades } = useStoreGrades(storeId);
  const { colors: storeColors, syncDefaultColors } = useStoreColors(storeId);
  const [syncingDefaults, setSyncingDefaults] = useState(false);

  const handleSyncDefaults = async () => {
    setSyncingDefaults(true);
    try {
      const result = await syncDefaultColors();
      if ('count' in result && typeof result.count === 'number' && result.count > 0) {
        toast({
          title: "Cores importadas!",
          description: `${result.count} cores sugeridas foram adicionadas à sua loja.`,
        });
      } else {
        toast({
          title: "Sua loja já possui as cores sugeridas",
          description: "Nenhuma cor nova precisou ser adicionada.",
        });
      }
    } catch (error) {
      console.error("Erro ao sincronizar cores:", error);
      toast({
        title: "Erro ao importar cores",
        description: "Não foi possível carregar as cores sugeridas.",
        variant: "destructive",
      });
    } finally {
      setSyncingDefaults(false);
    }
  };

  // Estado para configuração de grade flexível
  const [showFlexibleConfig, setShowFlexibleConfig] = useState(false);
  const [flexibleGradeConfig, setFlexibleGradeConfig] = useState<FlexibleGradeConfig>(
    DEFAULT_FLEXIBLE_GRADE_CONFIG
  );

  const commonSizes = [
    "17/18", "19/20", "21/22", "23/24", "25/26", "26/27", "28/29", "30/31", "32/33",
    "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "P", "M", "G", "GG"
  ];



  const gradeTemplates = [
    {
      name: "Grade Baixa",
      sizes: ["35", "36", "37", "38", "39"],
      distribution: [1, 2, 2, 2, 1],
    },
    {
      name: "Grade Média",
      sizes: ["34", "35", "36", "37", "38", "39", "40"],
      distribution: [1, 2, 2, 3, 2, 2, 1],
    },
    {
      name: "Grade Alta",
      sizes: ["36", "37", "38", "39", "40", "41", "42"],
      distribution: [1, 2, 2, 3, 2, 2, 1],
    },
    {
      name: "Grade Masculina",
      sizes: ["38", "39", "40", "41", "42", "43", "44"],
      distribution: [1, 2, 3, 3, 2, 1, 1],
    },
    {
      name: "Grade Infantil Pequena",
      sizes: ["17/18", "19/20", "21/22", "23/24"],
      distribution: [3, 3, 3, 3],
    },
    {
      name: "Grade Infantil Média",
      sizes: ["21/22", "23/24", "25/26", "26/27"],
      distribution: [3, 3, 3, 3],
    },
    {
      name: "Grade Infantil Grande",
      sizes: ["26/27", "28/29", "30/31", "32/33"],
      distribution: [3, 3, 3, 3],
    },
    {
      name: "Grade Letras",
      sizes: ["P", "M", "G", "GG"],
      distribution: [2, 3, 3, 2],
    }
  ];

  // Cores da loja são as únicas disponíveis
  const availableColors = storeColors.map(c => c.name);

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const addCustomColor = () => {
    if (customColor && !selectedColors.includes(customColor)) {
      setSelectedColors((prev) => [...prev, customColor]);
      setCustomColor("");
    }
  };

  const applyGradeTemplate = (template: any) => {
    const templatePairs = template.distribution || template.default_quantities || [];
    const newConfigs: SizePairConfig[] = template.sizes.map((size, index) => ({
      size,
      pairs: templatePairs[index] || 1,
    }));
    setSizePairConfigs(newConfigs);
    setGradeName(template.name);
    toast({ 
      title: "Template Aplicado", 
      description: `${template.name} com ${newConfigs.reduce((s, c) => s + c.pairs, 0)} pares selecionada.` 
    });
  };

  const addSizePair = () => {
    const availableSizes = commonSizes.filter(
      (size) => !sizePairConfigs.some((config) => config.size === size)
    );

    if (availableSizes.length > 0) {
      setSizePairConfigs((prev) => [
        ...prev,
        { size: availableSizes[0], pairs: 1 },
      ]);
    }
  };

  const removeSizePair = (index: number) => {
    setSizePairConfigs((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSizePair = (
    index: number,
    field: keyof SizePairConfig,
    value: string | number
  ) => {
    setSizePairConfigs((prev) =>
      prev.map((config, i) =>
        i === index ? { ...config, [field]: value } : config
      )
    );
  };

  const adjustPairs = (index: number, delta: number) => {
    setSizePairConfigs((prev) =>
      prev.map((config, i) =>
        i === index
          ? { ...config, pairs: Math.max(0, config.pairs + delta) }
          : config
      )
    );
  };

  const resetConfiguration = () => {
    setSelectedColors([]);
    setSizePairConfigs([]);
    setGradeName("Grade Personalizada");
    setCustomColor("");
  };

  const generateOptimizedDistribution = useCallback(() => {
    if (sizePairConfigs.length === 0) return;

    const totalSizes = sizePairConfigs.length;
    const newConfigs = sizePairConfigs.map((config, index) => {
      let pairs: number;

      if (totalSizes <= 3) {
        pairs = 2;
      } else if (totalSizes <= 5) {
        pairs =
          index === Math.floor(totalSizes / 2)
            ? 3
            : index === 0 || index === totalSizes - 1
              ? 1
              : 2;
      } else {
        const middle = Math.floor(totalSizes / 2);
        const distance = Math.abs(index - middle);
        pairs = Math.max(1, 4 - distance);
      }

      return { ...config, pairs };
    });

    setSizePairConfigs(newConfigs);

    toast({
      title: "Distribuição otimizada!",
      description: "Aplicada curva ABC para melhor distribuição de estoque.",
    });
  }, [sizePairConfigs, toast]);

  const generateVariations = async () => {
    if (selectedColors.length === 0 || sizePairConfigs.length === 0) {
      toast({
        title: "Configuração incompleta",
        description: "Selecione pelo menos uma cor e configure os tamanhos.",
        variant: "destructive",
      });
      return;
    }

    console.log("🎨 GRADE - Gerando variações...");
    console.log("📋 Cores selecionadas:", selectedColors);
    console.log("📐 Configuração de pares:", sizePairConfigs);
    console.log("🔢 Total de cores para processar:", selectedColors.length);

    const newVariations: ProductVariation[] = [];
    const totalPairsPerColor = sizePairConfigs.reduce(
      (sum, config) => sum + config.pairs,
      0
    );

    try {
      // 🎯 DEBUGGING: Verificar se o loop está sendo executado corretamente
      console.log("🔄 INICIANDO LOOP DE CORES...");

      for (
        let colorIndex = 0;
        colorIndex < selectedColors.length;
        colorIndex++
      ) {
        const color = selectedColors[colorIndex];

        console.log(
          `🎨 [${colorIndex + 1}/${selectedColors.length
          }] Processando cor: "${color}"`
        );

        // Gerar SKU único para esta grade - corrigido para 2 argumentos
        console.log(`🔄 Gerando SKU para: ${productName}-${color}`);
        const uniqueSKU = await generateUniqueProductSKU(
          `${productName}-${color}`,
          productId
        );
        console.log(`✅ SKU gerado: ${uniqueSKU}`);

        console.log(
          `🎨 Criando grade para cor: ${color} com SKU: ${uniqueSKU}`
        );

        const gradeVariation: ProductVariation = {
          id: `grade-${Date.now()}-${colorIndex}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          product_id: productId || "",
          color,
          hex_color: resolveColorHex(color, storeColors.find(c => c.name.toLowerCase() === color.toLowerCase())?.hex_color),
          size: null,
          stock: totalPairsPerColor,
          price_adjustment: 0,
          is_active: true,
          sku: uniqueSKU,
          image_url: "",
          variation_type: "grade",
          is_grade: true,
          grade_name: `${gradeName} - ${color}`,
          grade_color: color,
          grade_sizes: sizePairConfigs.map((c) => c.size),
          grade_pairs: sizePairConfigs.map((c) => c.pairs),
          grade_quantity: totalPairsPerColor,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          display_order: colorIndex,
          // Adicionar configuração de grade flexível (se configurada)
          flexible_grade_config: showFlexibleConfig ? flexibleGradeConfig : undefined,
          grade_sale_mode: 'full',
        };

        console.log(`✅ Grade criada [${colorIndex + 1}]:`, {
          id: gradeVariation.id,
          color: gradeVariation.color,
          sku: gradeVariation.sku,
          totalStock: gradeVariation.stock,
          sizes: gradeVariation.grade_sizes,
          pairs: gradeVariation.grade_pairs,
        });

        newVariations.push(gradeVariation);
        console.log(`📊 Total de variações até agora: ${newVariations.length}`);
      }

      console.log(
        `🎯 RESULTADO FINAL: ${newVariations.length} grades criadas (uma por cor)`
      );
      console.log(
        `📋 Lista de variações criadas:`,
        newVariations.map((v) => ({ color: v.color, sku: v.sku }))
      );

      // 🎯 VERIFICAÇÃO ANTES DE CHAMAR CALLBACK
      if (newVariations.length === 0) {
        console.error("❌ ERRO: Nenhuma variação foi criada!");
        toast({
          title: "Erro na criação",
          description:
            "Nenhuma variação foi criada. Verifique os dados e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      console.log(
        `🚀 CHAMANDO CALLBACK com ${newVariations.length} variações...`
      );
      onVariationsGenerated(newVariations);

      toast({
        title: "Grades criadas com sucesso!",
        description: `${newVariations.length
          } grade(s) foram geradas com SKUs únicos, totalizando ${totalPairsPerColor * selectedColors.length
          } pares.`,
      });
    } catch (error) {
      console.error("❌ Erro ao gerar grades:", error);
      console.error("❌ Detalhes do erro:", {
        message: error.message,
        stack: error.stack,
        selectedColors,
        sizePairConfigs,
        productId,
        productName,
      });
      toast({
        title: "Erro ao gerar grades",
        description:
          "Ocorreu um erro durante a geração das grades. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const totalVariations = selectedColors.length;
  const totalPairs = sizePairConfigs.reduce(
    (sum, config) => sum + config.pairs,
    0
  );
  const totalPairsAllColors = totalPairs * selectedColors.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Configuração Avançada de Grades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nome da Grade */}
          <div>
            <Label htmlFor="grade-name" className="text-base font-semibold">
              Nome da Grade
            </Label>
            <Input
              id="grade-name"
              value={gradeName}
              onChange={(e) => setGradeName(e.target.value)}
              placeholder="Ex: Grade Verão 2024"
              className="mt-2"
            />
          </div>

          {/* Seleção de Cores */}
          <div>
            <Label className="text-base font-semibold">
              1. Escolha as Cores
            </Label>
            <p className="text-sm text-gray-600 mb-3">
              Selecione as cores disponíveis para este produto. Cada cor será
              uma grade separada.
            </p>

            {availableColors.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {availableColors.map((color) => {
                  const storeColorOpt = storeColors.find(c => c.name.toLowerCase() === color.toLowerCase());
                  return (
                    <Button
                      key={color}
                      variant={
                        selectedColors.includes(color) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => toggleColor(color)}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-gray-300 shadow-sm block"
                        style={{ backgroundColor: resolveColorHex(color, storeColorOpt?.hex_color) }}
                      />
                      {color}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg mb-4 text-center">
                <p className="text-sm text-blue-700 mb-3">
                  Sua loja ainda não possui cores cadastradas.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSyncDefaults}
                  disabled={syncingDefaults}
                  className="bg-white"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
                  {syncingDefaults ? "Importando..." : "Importar Cores Sugeridas"}
                </Button>
              </div>
            )}

            <div className="mt-4">
              <Label className="text-sm font-medium mb-2 block text-gray-700">
                Personalizar Cores
              </Label>
              <ColorPickerPopover 
                storeId={storeId}
                onColorSelect={(colorObj) => {
                  if (!selectedColors.includes(colorObj.name)) {
                    setSelectedColors(prev => [...prev, colorObj.name]);
                  }
                  toast({
                    title: colorObj.saved ? "Cor salva e selecionada!" : "Cor selecionada!",
                    description: `A cor "${colorObj.name}" foi adicionada.`,
                  });
                }}
                trigger={
                  <Button variant="outline" className="w-full flex items-center gap-2 border-dashed border-2 py-6 text-gray-500 hover:text-gray-700 hover:border-gray-400">
                    <Plus className="w-4 h-4" />
                    Adicionar Cor Personalizada ou da Loja
                  </Button>
                }
              />
            </div>

            {selectedColors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-2">Cores selecionadas:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedColors.map((color) => (
                    <Badge
                      key={color}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => toggleColor(color)}
                    >
                      {color} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Templates de Grade */}
          <div>
            <Label className="text-base font-semibold">
              2. Templates de Grade
            </Label>
            <p className="text-sm text-gray-600 mb-3">
              Use um template pronto ou configure manualmente os tamanhos e
              quantidades
            </p>

            {storeGrades && storeGrades.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 font-semibold uppercase mb-2">⭐️ Suas Grades Personalizadas</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {storeGrades.map((template) => (
                    <Button
                      key={template.id}
                      variant="default"
                      size="sm"
                      onClick={() => applyGradeTemplate(template)}
                      className="justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      <span className="truncate">{template.name}</span>
                      <Badge variant="secondary" className="ml-auto bg-emerald-500 text-white font-bold">
                        {((template as any).distribution || (template as any).default_quantities || []).reduce((a: number, b: number) => a + b, 0)} P
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Templates Padrão</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
              {gradeTemplates.map((template) => (
                <Button
                  key={template.name}
                  variant="outline"
                  size="sm"
                  onClick={() => applyGradeTemplate(template)}
                  className="justify-start text-gray-600"
                >
                  <Package className="w-4 h-4 mr-2 opacity-50" />
                  <span className="truncate">{template.name}</span>
                  <Badge variant="secondary" className="ml-auto opacity-75 font-bold">
                    {((template as any).distribution || (template as any).default_quantities || []).reduce((a: number, b: number) => a + b, 0)} P
                  </Badge>
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={generateOptimizedDistribution}
                disabled={sizePairConfigs.length === 0}
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Aplicar Curva ABC
              </Button>
              <Button
                variant="outline"
                onClick={resetConfiguration}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Limpar Tudo
              </Button>
            </div>
          </div>

          {/* Configuração Individual de Pares */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">
                3. Pares por Tamanho
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addSizePair}
                disabled={sizePairConfigs.length >= 30}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Tamanho
              </Button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Configure individualmente quantos pares de cada tamanho estarão na
              grade
            </p>

            {sizePairConfigs.length === 0 ? (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Use um template acima ou adicione tamanhos manualmente para
                  começar.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {sizePairConfigs.map((config, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Tamanho</Label>
                      <select
                        value={config.size}
                        onChange={(e) =>
                          updateSizePair(index, "size", e.target.value)
                        }
                        className="w-full mt-1 px-3 py-2 border rounded-md bg-white"
                      >
                        {commonSizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1">
                      <Label className="text-sm font-medium">Pares</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => adjustPairs(index, -1)}
                          disabled={config.pairs <= 0}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={config.pairs}
                          onChange={(e) =>
                            updateSizePair(
                              index,
                              "pairs",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-20 text-center"
                          min="0"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => adjustPairs(index, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSizePair(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview da Grade */}
          {selectedColors.length > 0 && sizePairConfigs.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview das Grades:
              </h4>

              <div className="space-y-3">
                {selectedColors.map((color, index) => (
                  <div key={color} className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">
                        Grade {index + 1}: {gradeName} - {color}
                      </h5>
                      <Badge variant="secondary">{totalPairs} pares</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Tamanhos:</strong>{" "}
                      {sizePairConfigs
                        .map((c) => `${c.size} (${c.pairs})`)
                        .join(", ")}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-green-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Grades: </span>
                    <span className="font-medium">{selectedColors.length}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Tamanhos por grade: </span>
                    <span className="font-medium">
                      {sizePairConfigs.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-700">Pares por grade: </span>
                    <span className="font-medium">{totalPairs}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Total geral: </span>
                    <span className="font-bold text-green-900 text-lg">
                      {totalPairsAllColors} pares
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Configuração de Grade Flexível */}
          {selectedColors.length > 0 && sizePairConfigs.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2 text-purple-700">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      Grade Flexível
                      <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700 text-xs">
                        ⭐ Novidade
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Permita que clientes comprem Grade Completa, Meia Grade ou Mesclagem Personalizada
                    </p>
                  </div>
                  <Button
                    variant={showFlexibleConfig ? "secondary" : "default"}
                    size="lg"
                    onClick={() => setShowFlexibleConfig(!showFlexibleConfig)}
                    className={showFlexibleConfig ? "" : "bg-purple-600 hover:bg-purple-700 text-white"}
                  >
                    {showFlexibleConfig ? "✓ Ativo" : "⚡ Ativar"}
                  </Button>
                </div>
              </CardHeader>

              {showFlexibleConfig && (
                <CardContent className="border-t-2 border-purple-200 bg-gradient-to-b from-purple-50/30 to-white">
                  <Alert className="mb-4 border-purple-300 bg-purple-50">
                    <Info className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-900">
                      <strong>Grade Flexível Ativa!</strong> Configure as opções de compra que seus clientes terão no catálogo.
                    </AlertDescription>
                  </Alert>

                  <FlexibleGradeConfigForm
                    config={flexibleGradeConfig}
                    onChange={(newConfig) => {
                      console.log("📝 Configuração de grade flexível atualizada:", newConfig);
                      setFlexibleGradeConfig(newConfig);
                    }}
                    fullGradeSizes={sizePairConfigs.map(c => c.size)}
                    fullGradePairs={sizePairConfigs.map(c => c.pairs)}
                    simplified={true}
                  />

                  <Alert className="mt-4 border-green-300 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-900">
                      Esta configuração será aplicada a todas as {selectedColors.length} grades que você gerar.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              )}
            </Card>
          )}

          {/* Botão de Geração */}
          <div className="pt-4">
            <Button
              onClick={generateVariations}
              className={`w-full h-12 text-lg ${showFlexibleConfig
                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                }`}
              disabled={
                selectedColors.length === 0 || sizePairConfigs.length === 0
              }
            >
              <Package className="w-5 h-5 mr-2" />
              Gerar {totalVariations} Grade{totalVariations > 1 ? "s" : ""} com SKUs Únicos
              {showFlexibleConfig && (
                <>
                  {" "}
                  <Sparkles className="w-4 h-4 mx-1 animate-pulse" />
                  + Opções Flexíveis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradeConfigurationForm;
