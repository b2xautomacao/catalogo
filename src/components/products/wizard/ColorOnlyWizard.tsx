import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Palette,
  Plus,
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Eye,
  Package,
} from "lucide-react";
import ColorPickerPopover from "./ColorPickerPopover";

interface ColorOnlyWizardProps {
  variations: ProductVariation[];
  onVariationsChange: (variations: ProductVariation[]) => void;
  onBack: () => void;
  productName?: string;
  storeId?: string;
}

interface ColorConfig {
  name: string;
  selected: boolean;
  stock: number;
  priceAdjustment: number;
  hex?: string;
}

const ColorOnlyWizard: React.FC<ColorOnlyWizardProps> = ({
  variations,
  onVariationsChange,
  onBack,
  productName = "Produto",
  storeId,
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [customColorInput, setCustomColorInput] = useState("");
  const [colorConfigs, setColorConfigs] = useState<ColorConfig[]>([]);

  // Cores pré-definidas populares
  const predefinedColors = [
    { name: "Preto", hex: "#000000" },
    { name: "Branco", hex: "#FFFFFF" },
    { name: "Azul", hex: "#2563EB" },
    { name: "Vermelho", hex: "#DC2626" },
    { name: "Verde", hex: "#16A34A" },
    { name: "Amarelo", hex: "#EAB308" },
    { name: "Rosa", hex: "#EC4899" },
    { name: "Roxo", hex: "#9333EA" },
    { name: "Marrom", hex: "#A16207" },
    { name: "Cinza", hex: "#6B7280" },
    { name: "Laranja", hex: "#EA580C" },
    { name: "Azul Claro", hex: "#0EA5E9" },
  ];

  // Inicializar configurações de cores se não existirem
  React.useEffect(() => {
    if (colorConfigs.length === 0) {
      const initialConfigs = predefinedColors.map((color) => ({
        name: color.name,
        selected: false,
        stock: 10,
        priceAdjustment: 0,
        hex: color.hex,
      }));
      setColorConfigs(initialConfigs);
    }
  }, []);

  const steps = [
    {
      id: 0,
      title: "Selecionar Cores",
      description: "Escolha as cores disponíveis para seu produto",
    },
    {
      id: 1,
      title: "Configurar Estoque",
      description: "Defina quantidade e preços para cada cor",
    },
    {
      id: 2,
      title: "Revisar e Finalizar",
      description: "Confirme as variações criadas",
    },
  ];

  const selectedColors = colorConfigs.filter((color) => color.selected);

  const toggleColor = (colorName: string) => {
    setColorConfigs((prev) =>
      prev.map((color) =>
        color.name === colorName
          ? { ...color, selected: !color.selected }
          : color
      )
    );
  };

  const handleAddCustomColor = (colorObj: { name: string; hex: string; saved?: boolean }) => {
    if (
      colorConfigs.find(
        (c) => c.name.toLowerCase() === colorObj.name.toLowerCase()
      )
    ) {
      toast({
        title: "Cor já existe",
        description: "Esta cor já foi adicionada à lista.",
        variant: "destructive",
      });
      return;
    }

    setColorConfigs((prev) => [
      ...prev,
      {
        name: colorObj.name,
        selected: true,
        stock: 10,
        priceAdjustment: 0,
        hex: colorObj.hex,
      },
    ]);
  };

  const updateColorConfig = (
    colorName: string,
    field: "stock" | "priceAdjustment",
    value: number
  ) => {
    setColorConfigs((prev) =>
      prev.map((color) =>
        color.name === colorName ? { ...color, [field]: value } : color
      )
    );
  };

  const generateVariations = useCallback(() => {
    const newVariations: ProductVariation[] = selectedColors.map(
      (color, index) => ({
        id: `color-${Date.now()}-${index}`,
        product_id: "",
        color: color.name,
        hex_color: color.hex || "#CCCCCC",
        sku: `${color.name.toLowerCase().replace(/\s+/g, "-")}`,
        stock: color.stock,
        price_adjustment: color.priceAdjustment,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        display_order: index + 1,
        variation_type: "color_only",
      })
    );

    onVariationsChange(newVariations);

    toast({
      title: "✅ Variações criadas!",
      description: `${newVariations.length} variações de cor foram configuradas.`,
    });
  }, [selectedColors, onVariationsChange, toast]);

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return selectedColors.length > 0;
      case 1:
        return selectedColors.every((color) => color.stock >= 0);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      if (currentStep === 1) {
        generateVariations();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {/* Header do passo */}
            <div className="text-center">
              <Palette className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold">Selecione as Cores</h3>
              <p className="text-gray-600">
                Escolha todas as cores em que seu produto está disponível
              </p>
            </div>

            {/* Cores pré-definidas */}
            <div>
              <Label className="text-sm font-medium">Cores Populares</Label>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-2">
                {predefinedColors.map((color) => {
                  const config = colorConfigs.find(
                    (c) => c.name === color.name
                  );
                  const isSelected = config?.selected || false;

                  return (
                    <div
                      key={color.name}
                      onClick={() => toggleColor(color.name)}
                      className={`relative cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full border mx-auto mb-2"
                        style={{
                          backgroundColor: color.hex,
                          borderColor:
                            color.hex === "#FFFFFF" ? "#e5e7eb" : color.hex,
                        }}
                      />
                      <p className="text-xs text-center font-medium">
                        {color.name}
                      </p>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Adicionar cor customizada */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Personalizar Cores
              </Label>
              <ColorPickerPopover 
                storeId={storeId}
                onColorSelect={handleAddCustomColor}
                trigger={
                  <Button variant="outline" className="w-full flex items-center gap-2 border-dashed border-2 py-6">
                    <Plus className="w-4 h-4" />
                    Adicionar Cor Personalizada ou da Loja
                  </Button>
                }
              />
            </div>

            {/* Cores selecionadas */}
            {selectedColors.length > 0 && (
              <div>
                <Label className="text-sm font-medium">
                  Cores Selecionadas ({selectedColors.length})
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedColors.map((color) => (
                    <Badge
                      key={color.name}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Palette className="w-3 h-3" />
                      {color.name}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-500"
                        onClick={() => toggleColor(color.name)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            {/* Header do passo */}
            <div className="text-center">
              <Package className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold">
                Configure Estoque e Preços
              </h3>
              <p className="text-gray-600">
                Defina a quantidade e ajustes de preço para cada cor
              </p>
            </div>

            {/* Configurações por cor */}
            <div className="space-y-4">
              {selectedColors.map((color) => (
                <Card key={color.name} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">{color.name}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Quantidade em Estoque</Label>
                      <Input
                        type="number"
                        min="0"
                        value={color.stock}
                        onChange={(e) =>
                          updateColorConfig(
                            color.name,
                            "stock",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Ajuste de Preço (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={color.priceAdjustment}
                        onChange={(e) =>
                          updateColorConfig(
                            color.name,
                            "priceAdjustment",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="mt-1"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Deixe 0 para mesmo preço, ou adicione valor extra
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Header do passo */}
            <div className="text-center">
              <Eye className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold">Revisar Variações</h3>
              <p className="text-gray-600">
                Confirme as variações que serão criadas para {productName}
              </p>
            </div>

            {/* Resumo */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">
                  {selectedColors.length} variações de cor configuradas
                </span>
              </div>
              <p className="text-sm text-green-700">
                Total de unidades:{" "}
                {selectedColors.reduce((sum, color) => sum + color.stock, 0)}
              </p>
            </div>

            {/* Lista de variações */}
            <div className="space-y-3">
              {selectedColors.map((color, index) => (
                <Card key={color.name} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">
                        {productName} - {color.name}
                      </span>
                    </div>
                    <div className="text-right text-sm">
                      <div>
                        Estoque: <strong>{color.stock}</strong>
                      </div>
                      {color.priceAdjustment !== 0 && (
                        <div
                          className={
                            color.priceAdjustment > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {color.priceAdjustment > 0 ? "+" : ""}R${" "}
                          {color.priceAdjustment.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <strong>Pronto!</strong> Suas variações serão criadas
                automaticamente ao finalizar. Você poderá editá-las
                individualmente depois se necessário.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            🎨 Assistente de Cores
          </h2>
          <Badge variant="outline">
            Passo {currentStep + 1} de {steps.length}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="flex items-center space-x-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center ${
                  index <= currentStep ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index < currentStep
                      ? "bg-blue-600 text-white"
                      : index === currentStep
                      ? "bg-blue-100 text-blue-600 border-2 border-blue-600"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="ml-2 text-sm font-medium hidden md:block">
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 rounded ${
                    index < currentStep ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 0 ? onBack : prevStep}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentStep === 0 ? "Voltar" : "Anterior"}
        </Button>

        <div className="flex items-center gap-3">
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceedToNext()}
              className="flex items-center gap-2"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                toast({
                  title: "🎉 Sucesso!",
                  description: "Variações de cor configuradas com sucesso!",
                });
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4" />
              Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColorOnlyWizard;
