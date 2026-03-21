import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  Grid3X3,
  List,
  Palette,
  Info,
  Sparkles,
  CheckCircle,
  Bug,
} from "lucide-react";
import { ProductVariation } from "@/types/product";
import { useAdvancedVariationManager } from "@/hooks/useAdvancedVariationManager";
import { useVariationMasterGroups } from "@/hooks/useVariationMasterGroups";
import { useToast } from "@/hooks/use-toast";
import VariationWizardPanel from "./VariationWizardPanel";
import VariationMatrixForm from "./VariationMatrixForm";
import VariationListView from "./VariationListView";
import GradeConfigurationForm from "./GradeConfigurationForm";
import UnifiedVariationWizard from "./UnifiedVariationWizard";
import UnifiedGradeManager from "./UnifiedGradeManager";
import GradeDebugPanel from "./GradeDebugPanel";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

interface IntelligentVariationsFormProps {
  variations: ProductVariation[];
  onVariationsChange: (variations: ProductVariation[]) => void;
  productId?: string;
  storeId?: string;
  initialViewMode?:
    | "wizard"
    | "matrix"
    | "list"
    | "grade"
    | "unified"
    | "debug";
  onViewModeChange?: (
    mode: "wizard" | "matrix" | "list" | "grade" | "unified" | "debug"
  ) => void;
}

type ViewMode = "wizard" | "matrix" | "list" | "grade" | "unified" | "debug";

const IntelligentVariationsForm: React.FC<IntelligentVariationsFormProps> = ({
  variations,
  onVariationsChange,
  productId,
  storeId,
  initialViewMode = "wizard",
  onViewModeChange,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const { toast } = useToast();

  const {
    variations: managedVariations,
    createAllCombinations,
    clearAllVariations,
    getStatistics,
  } = useAdvancedVariationManager(variations, onVariationsChange);

  const { groups, values, loading: groupsLoading } = useVariationMasterGroups();

  // Sincronizar viewMode com prop externa
  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  const handleViewModeChange = (newMode: ViewMode) => {
    console.log(`🔄 Mudando viewMode de ${viewMode} para ${newMode}`);
    setViewMode(newMode);
    if (onViewModeChange) {
      onViewModeChange(newMode);
    }
  };

  const handleNavigateToGrade = () => {
    console.log("🎯 Navegando para Grade via handleNavigateToGrade");
    handleViewModeChange("grade");
  };

  const handleGradeGenerated = (gradeVariations: ProductVariation[]) => {
    console.log(
      "✅ Grade gerada, navegando para Lista:",
      gradeVariations.length
    );

    // 🎯 IMPORTANTE: Garantir que as variações sejam passadas corretamente
    onVariationsChange(gradeVariations);

    // Navegar para a lista para mostrar as variações criadas
    handleViewModeChange("list");

    toast({
      title: "Grade criada com sucesso!",
      description: `${gradeVariations.length} variações foram geradas e salvas.`,
    });
  };

  const stats = getStatistics();

  const renderTabTrigger = (
    value: ViewMode,
    icon: React.ReactNode,
    label: string,
    count?: number
  ) => (
    <TabsTrigger
      value={value}
      className="flex items-center gap-2"
      onClick={() => handleViewModeChange(value)}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className="ml-1">
          {count}
        </Badge>
      )}
    </TabsTrigger>
  );

  const isTabDisabled = stats.total === 0;

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header com estatísticas */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Sistema Inteligente de Variações
            </h2>
            <p className="text-gray-600">
              Configure variações com assistente, matriz ou grades
            </p>
          </div>
          {stats.total > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </div>
                <div className="text-xs text-gray-500">Variações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.withStock}
                </div>
                <div className="text-xs text-gray-500">Com Estoque</div>
              </div>
            </div>
          )}
        </div>

        {/* Sistema de Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Central de Configuração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={viewMode}
              onValueChange={handleViewModeChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-6">
                {renderTabTrigger(
                  "wizard",
                  <Sparkles className="w-4 h-4" />,
                  "Assistente"
                )}
                {renderTabTrigger(
                  "matrix",
                  <Grid3X3 className="w-4 h-4" />,
                  "Matriz"
                )}
                {renderTabTrigger(
                  "list",
                  <List className="w-4 h-4" />,
                  "Lista",
                  stats.total
                )}
                {renderTabTrigger(
                  "grade",
                  <Package className="w-4 h-4" />,
                  "Grade"
                )}
                {renderTabTrigger(
                  "unified",
                  <Palette className="w-4 h-4" />,
                  "Novo Sistema"
                )}
                {renderTabTrigger(
                  "debug",
                  <Bug className="w-4 h-4" />,
                  "Debug"
                )}
              </TabsList>

              <div className="mt-6">
                <TabsContent value="wizard" className="space-y-4">
                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Assistente Inteligente:</strong> Deixe que nós
                      guiemos você na criação das variações do seu produto de
                      forma simples e intuitiva.
                    </AlertDescription>
                  </Alert>
                  <VariationWizardPanel
                    variations={managedVariations}
                    onVariationsChange={onVariationsChange}
                    groups={groups}
                    values={values}
                    loading={groupsLoading}
                    onNavigateToGrade={handleNavigateToGrade}
                  />
                </TabsContent>

                <TabsContent value="matrix" className="space-y-4">
                  <Alert>
                    <Grid3X3 className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Matriz de Variações:</strong> Visualize e
                      configure todas as combinações possíveis em uma matriz
                      intuitiva.
                    </AlertDescription>
                  </Alert>
                  <VariationMatrixForm
                    variations={managedVariations}
                    onVariationsChange={onVariationsChange}
                    groups={groups}
                    values={values}
                  />
                </TabsContent>

                <TabsContent value="list" className="space-y-4">
                  {stats.total > 0 ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Lista de Variações:</strong> Gerencie
                        individualmente cada variação com controle total sobre
                        estoque, preços e imagens.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Nenhuma variação criada:</strong> Use o
                        Assistente ou a Matriz para criar variações primeiro.
                      </AlertDescription>
                    </Alert>
                  )}
                  <VariationListView
                    variations={managedVariations}
                    onVariationsChange={onVariationsChange}
                  />
                </TabsContent>

                <TabsContent value="grade" className="space-y-4">
                  <Alert>
                    <Package className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Sistema de Grades:</strong> Configure grades de
                      tamanhos para produtos como calçados, ideais para vendas
                      por atacado.
                    </AlertDescription>
                  </Alert>
                  <UnifiedGradeManager
                    variations={managedVariations}
                    onVariationsChange={onVariationsChange}
                    productId={productId}
                    storeId={storeId}
                    productName=""
                    onComplete={() => handleViewModeChange("list")}
                    showPreview={true}
                  />
                </TabsContent>

                <TabsContent value="unified" className="space-y-4">
                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      <strong>🚀 Novo Sistema Unificado:</strong> Experiência
                      completamente reformulada com assistentes específicos,
                      configuração rápida e detecção automática. Ideal para
                      todos os tipos de usuários.
                    </AlertDescription>
                  </Alert>
                  <UnifiedVariationWizard
                    variations={managedVariations}
                    onVariationsChange={onVariationsChange}
                    productId={productId}
                    storeId={storeId}
                    category=""
                    productName=""
                  />
                </TabsContent>

                <TabsContent value="debug" className="space-y-4">
                  <Alert>
                    <Bug className="h-4 w-4" />
                    <AlertDescription>
                      <strong>🐛 Painel de Debug:</strong> Teste e debug do
                      sistema de variações de grade para identificar problemas.
                    </AlertDescription>
                  </Alert>
                  <GradeDebugPanel
                    variations={managedVariations}
                    onVariationsChange={onVariationsChange}
                    productId={productId}
                    storeId={storeId}
                    productName=""
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default IntelligentVariationsForm;
