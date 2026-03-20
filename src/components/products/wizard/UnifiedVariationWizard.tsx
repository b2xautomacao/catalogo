import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Wand2,
  Settings,
  Zap,
  ArrowLeft,
  Sparkles,
  Info,
  Target,
  Package,
  Brain,
  CheckCircle,
} from "lucide-react";
import { ProductVariation } from "@/types/product";

// Importar todos os assistentes criados
import VariationTypeSelector from "./VariationTypeSelector";
import ColorOnlyWizard from "./ColorOnlyWizard";
import SizeOnlyWizard from "./SizeOnlyWizard";
import MaterialOnlyWizard from "./MaterialOnlyWizard";
import ColorSizeWizard from "./ColorSizeWizard";
import QuickVariationSetup from "./QuickVariationSetup";
import EnhancedProductTypeDetector from "./EnhancedProductTypeDetector";
import IntelligentVariationsForm from "./IntelligentVariationsForm";
import GradeConfigurationForm from "./GradeConfigurationForm";
import UnifiedGradeManager from "./UnifiedGradeManager";

interface UnifiedVariationWizardProps {
  variations: ProductVariation[];
  onVariationsChange: (variations: ProductVariation[]) => void;
  productId?: string;
  storeId?: string;
  category?: string;
  productName?: string;
}

type WizardMode =
  | "welcome"
  | "detector"
  | "quick"
  | "type_selector"
  | "color_only"
  | "size_only"
  | "material_only"
  | "color_size"
  | "grade_system"
  | "advanced";

interface VariationType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  fields: ("color" | "size" | "material")[];
  examples: string[];
  difficulty: "easy" | "medium" | "advanced";
  recommended: boolean;
}

const UnifiedVariationWizard: React.FC<UnifiedVariationWizardProps> = ({
  variations,
  onVariationsChange,
  productId,
  storeId,
  category = "",
  productName = "",
}) => {
  const [currentMode, setCurrentMode] = useState<WizardMode>("welcome");
  const [previousMode, setPreviousMode] = useState<WizardMode>("welcome");
  const [selectedType, setSelectedType] = useState<VariationType | null>(null);
  const [showDetector, setShowDetector] = useState(false);

  // Detectar se já existem variações
  const hasExistingVariations = variations.length > 0;

  useEffect(() => {
    // Se já tem variações, pular welcome e ir direto para seleção
    if (hasExistingVariations) {
      setCurrentMode("type_selector");
    } else if (category || productName) {
      // Se tem informações do produto, mostrar detector
      setShowDetector(true);
    }
  }, [hasExistingVariations, category, productName]);

  const navigateTo = (mode: WizardMode) => {
    setPreviousMode(currentMode);
    setCurrentMode(mode);
  };

  const goBack = () => {
    setCurrentMode(previousMode);
  };

  const handleTypeSelection = (type: VariationType) => {
    setSelectedType(type);

    // Navegar para o assistente específico
    switch (type.id) {
      case "color_only":
        navigateTo("color_only");
        break;
      case "size_only":
        navigateTo("size_only");
        break;
      case "material_only":
        navigateTo("material_only");
        break;
      case "color_size":
        navigateTo("color_size");
        break;
      case "grade_system":
        navigateTo("grade_system");
        break;
      case "advanced":
        navigateTo("advanced");
        break;
      default:
        navigateTo("type_selector");
    }
  };

  const handleDetectionResult = (type: string, result: any) => {
    // Simular seleção baseada na detecção
    const detectedType: VariationType = {
      id: type,
      name: result.recommendedAction || "Tipo Detectado",
      description: result.reasons[0] || "Baseado na análise",
      icon: result.icon,
      fields:
        type === "color_only"
          ? ["color"]
          : type === "size_only"
          ? ["size"]
          : type === "material_only"
          ? ["material"]
          : type === "color_size"
          ? ["color", "size"]
          : type === "grade_system"
          ? ["color", "size"]
          : ["color"],
      examples: result.suggestions || [],
      difficulty: "easy",
      recommended: true,
    };

    handleTypeSelection(detectedType);
  };

  const handleQuickVariationsGenerated = (
    newVariations: ProductVariation[]
  ) => {
    onVariationsChange(newVariations);
    // Pode navegar para uma visualização ou fechar o wizard
  };

  const renderContent = () => {
    switch (currentMode) {
      case "welcome":
        return (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Assistente de Variações
                </h1>
              </div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Vamos configurar as variações do seu produto de forma simples e
                intuitiva. Escolha como você prefere começar:
              </p>
            </div>

            {/* Detector automático se tiver informações */}
            {showDetector && (category || productName) && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <EnhancedProductTypeDetector
                    productName={productName}
                    productCategory={category}
                    onTypeSelected={handleDetectionResult}
                  />
                </CardContent>
              </Card>
            )}

            {/* Opções principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Configuração Rápida */}
              <Card
                className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-yellow-300 bg-yellow-50"
                onClick={() => navigateTo("quick")}
              >
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto p-3 bg-yellow-100 rounded-full w-fit mb-3">
                    <Zap className="w-8 h-8 text-yellow-600" />
                  </div>
                  <CardTitle className="text-lg">
                    ⚡ Configuração Rápida
                  </CardTitle>
                  <Badge className="mx-auto bg-yellow-200 text-yellow-800">
                    Recomendado
                  </Badge>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                  <p className="text-gray-600">
                    Templates prontos para configurar em segundos
                  </p>
                  <div className="text-sm text-gray-500">
                    ✨ Ideal para quem quer rapidez
                    <br />
                    ⏱️ Configure em menos de 1 minuto
                    <br />
                    🎯 Templates testados e otimizados
                  </div>
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>

              {/* Assistente Inteligente */}
              <Card
                className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-blue-300 bg-blue-50"
                onClick={() => navigateTo("detector")}
              >
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto p-3 bg-blue-100 rounded-full w-fit mb-3">
                    <Brain className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">
                    🧠 Assistente Inteligente
                  </CardTitle>
                  <Badge className="mx-auto bg-blue-200 text-blue-800">
                    Iniciantes
                  </Badge>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                  <p className="text-gray-600">
                    Deixe a IA analisar e sugerir o melhor tipo
                  </p>
                  <div className="text-sm text-gray-500">
                    🤖 Análise automática do produto
                    <br />
                    💡 Sugestões personalizadas
                    <br />
                    📋 Guiado passo a passo
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Analisar Produto
                  </Button>
                </CardContent>
              </Card>

              {/* Configuração Manual */}
              <Card
                className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-gray-300 bg-gray-50"
                onClick={() => navigateTo("type_selector")}
              >
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto p-3 bg-gray-100 rounded-full w-fit mb-3">
                    <Target className="w-8 h-8 text-gray-600" />
                  </div>
                  <CardTitle className="text-lg">🎯 Escolha Manual</CardTitle>
                  <Badge className="mx-auto bg-gray-200 text-gray-800">
                    Personalizado
                  </Badge>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                  <p className="text-gray-600">
                    Escolha exatamente o tipo de variação
                  </p>
                  <div className="text-sm text-gray-500">
                    ⚙️ Controle total sobre opções
                    <br />
                    🔧 Configuração personalizada
                    <br />
                    🎨 Máxima flexibilidade
                  </div>
                  <Button className="w-full bg-gray-600 hover:bg-gray-700">
                    Escolher Tipo
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Informações adicionais */}
            {hasExistingVariations && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Produto já possui variações.</strong> Você pode
                  editá-las ou recriar do zero. As variações atuais:{" "}
                  {variations.length} configuradas.
                </AlertDescription>
              </Alert>
            )}

            {/* Link para modo avançado */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => navigateTo("advanced")}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Modo Avançado (Sistema Completo)
              </Button>
            </div>
          </div>
        );

      case "detector":
        return (
          <div className="max-w-4xl mx-auto">
            <EnhancedProductTypeDetector
              productName={productName}
              productCategory={category}
              onTypeSelected={handleDetectionResult}
            />
          </div>
        );

      case "quick":
        return (
          <QuickVariationSetup
            onVariationsGenerated={handleQuickVariationsGenerated}
            onAdvancedMode={() => navigateTo("advanced")}
            productName={productName}
            storeId={storeId}
          />
        );

      case "type_selector":
        return (
          <VariationTypeSelector
            onTypeSelect={handleTypeSelection}
            productCategory={category}
            productName={productName}
            variations={variations}
            onVariationsChange={onVariationsChange}
          />
        );

      case "color_only":
        return (
          <ColorOnlyWizard
            variations={variations}
            onVariationsChange={onVariationsChange}
            onBack={goBack}
            productName={productName}
            storeId={storeId}
          />
        );

      case "size_only":
        return (
          <SizeOnlyWizard
            variations={variations}
            onVariationsChange={onVariationsChange}
            onBack={goBack}
            productName={productName}
          />
        );

      case "material_only":
        return (
          <MaterialOnlyWizard
            variations={variations}
            onVariationsChange={onVariationsChange}
            onBack={goBack}
            productName={productName}
          />
        );

      case "color_size":
        return (
          <ColorSizeWizard
            variations={variations}
            onVariationsChange={onVariationsChange}
            onBack={goBack}
            productName={productName}
            storeId={storeId}
          />
        );

      case "grade_system":
        return (
          <UnifiedGradeManager
            variations={variations}
            onVariationsChange={onVariationsChange}
            productId={productId}
            storeId={storeId}
            productName={productName}
            onComplete={() => {
              // Não navegar automaticamente, deixar o usuário decidir
              console.log(
                "✅ Grades configuradas com sucesso no UnifiedVariationWizard"
              );
            }}
            showPreview={true}
          />
        );

      case "advanced":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="outline" onClick={goBack} size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h2 className="text-xl font-bold">
                  Sistema Avançado de Variações
                </h2>
                <p className="text-gray-600 text-sm">
                  Acesso completo a todas as funcionalidades
                </p>
              </div>
            </div>

            <IntelligentVariationsForm
              variations={variations}
              onVariationsChange={onVariationsChange}
              productId={productId}
              storeId={storeId}
              initialViewMode="wizard"
            />
          </div>
        );

      default:
        return <div>Modo não encontrado</div>;
    }
  };

  return (
    <div className="min-h-[600px] space-y-6">
      {/* Header com navegação (apenas se não for welcome) */}
      {currentMode !== "welcome" && currentMode !== "advanced" && (
        <div className="flex items-center justify-between border-b pb-4">
          <Button
            variant="outline"
            onClick={goBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>

          <div className="text-center">
            <h2 className="text-lg font-semibold">
              {selectedType?.name || "Configurando Variações"}
            </h2>
            {productName && (
              <p className="text-sm text-gray-600">Produto: {productName}</p>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => navigateTo("welcome")}
            size="sm"
          >
            🏠 Início
          </Button>
        </div>
      )}

      {/* Conteúdo principal */}
      {renderContent()}
    </div>
  );
};

export default UnifiedVariationWizard;
