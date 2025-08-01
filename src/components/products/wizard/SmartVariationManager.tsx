import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  Info,
  Wand2,
  List,
  Settings,
  Package,
  Palette,
  Ruler,
  Package2,
  RefreshCw,
  Edit,
  EyeOff,
  Eye,
} from "lucide-react";
import { ProductVariation } from "@/types/product";
import UnifiedVariationWizard from "./UnifiedVariationWizard";
import VariationEditDialog from "./VariationEditDialog";
import { useToast } from "@/hooks/use-toast";
import { useProductVariations } from "@/hooks/useProductVariations";

interface SmartVariationManagerProps {
  variations: ProductVariation[];
  onVariationsChange: (variations: ProductVariation[]) => void;
  productId?: string;
  storeId?: string;
  category?: string;
  productName?: string;
  isEditing?: boolean; // Novo prop para indicar se é edição
}

type ViewMode = "list" | "wizard" | "add_form";

const SmartVariationManager: React.FC<SmartVariationManagerProps> = ({
  variations,
  onVariationsChange,
  productId,
  storeId,
  category = "",
  productName = "",
  isEditing = false,
}) => {
  const { toast } = useToast();
  const { deleteVariationById } = useProductVariations(productId);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingVariation, setEditingVariation] =
    useState<ProductVariation | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newVariation, setNewVariation] = useState({
    color: "",
    size: "",
    material: "",
    sku: "",
    stock: 0,
    price_adjustment: 0,
  });

  const hasVariations = variations.length > 0;
  const isCreating = !isEditing || !hasVariations;

  // Se é criação ou produto sem variações, mostrar wizard direto
  if (isCreating) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600">
          <Wand2 className="w-5 h-5" />
          <span className="font-medium">
            {isEditing ? "Configurar Variações" : "Criar Variações"}
          </span>
        </div>

        <UnifiedVariationWizard
          variations={variations}
          onVariationsChange={onVariationsChange}
          productId={productId}
          storeId={storeId}
          category={category}
          productName={productName}
        />
      </div>
    );
  }

  // Função para adicionar variação individual
  const addSingleVariation = () => {
    if (!newVariation.color && !newVariation.size && !newVariation.material) {
      toast({
        title: "Dados obrigatórios",
        description:
          "Preencha pelo menos uma característica (cor, tamanho ou material).",
        variant: "destructive",
      });
      return;
    }

    const variation: ProductVariation = {
      id: `new-${Date.now()}`,
      product_id: productId || "",
      ...newVariation,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      display_order: variations.length + 1,
      variation_type: "custom",
    };

    onVariationsChange([...variations, variation]);

    setNewVariation({
      color: "",
      size: "",
      material: "",
      sku: "",
      stock: 0,
      price_adjustment: 0,
    });

    setViewMode("list");

    toast({
      title: "✅ Variação adicionada!",
      description: "Nova variação foi adicionada à lista.",
    });
  };

  const removeVariation = async (index: number) => {
    const variation = variations[index];

    if (!variation) return;

    try {
      // Se a variação tem ID real (não é temporária), excluir do banco
      if (
        variation.id &&
        !variation.id.startsWith("new-") &&
        !variation.id.startsWith("variation-")
      ) {
        const success = await deleteVariationById(variation.id);
        if (!success) {
          toast({
            title: "❌ Erro ao excluir",
            description:
              "Não foi possível excluir a variação do banco de dados.",
            variant: "destructive",
          });
          return;
        }
      }

      // Remover da lista local
      const updatedVariations = variations.filter((_, i) => i !== index);
      onVariationsChange(updatedVariations);

      toast({
        title: "✅ Variação excluída!",
        description: "A variação foi removida com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir variação:", error);
      toast({
        title: "❌ Erro ao excluir",
        description: "Ocorreu um erro ao excluir a variação.",
        variant: "destructive",
      });
    }
  };

  const updateVariation = (
    index: number,
    field: keyof ProductVariation,
    value: any
  ) => {
    const updatedVariations = variations.map((variation, i) =>
      i === index ? { ...variation, [field]: value } : variation
    );
    onVariationsChange(updatedVariations);
  };

  const openEditDialog = (variation: ProductVariation) => {
    setEditingVariation(variation);
    setIsEditDialogOpen(true);
  };

  const handleSaveVariation = (updatedVariation: ProductVariation) => {
    const index = variations.findIndex((v) => v.id === updatedVariation.id);
    if (index !== -1) {
      const updatedVariations = variations.map((v, i) =>
        i === index ? updatedVariation : v
      );
      onVariationsChange(updatedVariations);
    }
  };

  const getVariationIcon = (variation: ProductVariation) => {
    if (variation.color && !variation.size && !variation.material)
      return <Palette className="w-4 h-4" />;
    if (variation.size && !variation.color && !variation.material)
      return <Ruler className="w-4 h-4" />;
    if (variation.material && !variation.color && !variation.size)
      return <Package2 className="w-4 h-4" />;
    return <Package className="w-4 h-4" />;
  };

  const getVariationLabel = (variation: ProductVariation) => {
    const parts = [variation.color, variation.size, variation.material].filter(
      Boolean
    );
    return parts.length > 0 ? parts.join(" - ") : variation.sku || "Variação";
  };

  const recreateWithWizard = () => {
    setViewMode("wizard");
  };

  // Renderizar baseado no modo atual
  switch (viewMode) {
    case "wizard":
      return (
        <div className="space-y-4">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Atenção:</strong> Usar o wizard irá substituir todas as
              variações existentes. As {variations.length} variações atuais
              serão perdidas.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setViewMode("list")}>
              Cancelar
            </Button>
          </div>

          <UnifiedVariationWizard
            variations={[]} // Começar do zero
            onVariationsChange={(newVariations) => {
              onVariationsChange(newVariations);
              setViewMode("list");
            }}
            productId={productId}
            storeId={storeId}
            category={category}
            productName={productName}
          />
        </div>
      );

    case "add_form":
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Nova Variação
            </h3>
            <Button variant="outline" onClick={() => setViewMode("list")}>
              Voltar à Lista
            </Button>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Cor</Label>
                  <Input
                    placeholder="Ex: Azul"
                    value={newVariation.color}
                    onChange={(e) =>
                      setNewVariation({
                        ...newVariation,
                        color: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Tamanho</Label>
                  <Input
                    placeholder="Ex: M"
                    value={newVariation.size}
                    onChange={(e) =>
                      setNewVariation({ ...newVariation, size: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Material</Label>
                  <Input
                    placeholder="Ex: Algodão"
                    value={newVariation.material}
                    onChange={(e) =>
                      setNewVariation({
                        ...newVariation,
                        material: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>SKU</Label>
                  <Input
                    placeholder="Ex: PROD-001-AZ-M"
                    value={newVariation.sku}
                    onChange={(e) =>
                      setNewVariation({ ...newVariation, sku: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Estoque</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newVariation.stock}
                    onChange={(e) =>
                      setNewVariation({
                        ...newVariation,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Ajuste de Preço (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newVariation.price_adjustment}
                    onChange={(e) =>
                      setNewVariation({
                        ...newVariation,
                        price_adjustment: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={addSingleVariation}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Variação
                </Button>
                <Button variant="outline" onClick={() => setViewMode("list")}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    default: // 'list'
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <List className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold">Variações do Produto</h3>
                <p className="text-sm text-gray-600">
                  {variations.length} variação
                  {variations.length !== 1 ? "ões" : ""} configurada
                  {variations.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setViewMode("add_form")}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
              <Button
                variant="outline"
                onClick={recreateWithWizard}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Recriar com Wizard
              </Button>
            </div>
          </div>

          {/* Info sobre modos */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Modo Edição:</strong> Você pode adicionar novas variações
              individuais ou recriar todas usando o wizard (substituirá as
              existentes).
            </AlertDescription>
          </Alert>

          {/* Lista de variações */}
          <div className="space-y-3">
            {variations.map((variation, index) => (
              <Card key={variation.id || index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getVariationIcon(variation)}
                      <div>
                        <div className="font-medium">
                          {getVariationLabel(variation)}
                        </div>
                        <div className="text-sm text-gray-600">
                          SKU: {variation.sku || "Não definido"} • Estoque:{" "}
                          {variation.stock} •
                          {variation.price_adjustment !== 0 && (
                            <span
                              className={
                                variation.price_adjustment > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              Ajuste:{" "}
                              {variation.price_adjustment > 0 ? "+" : ""}R${" "}
                              {variation.price_adjustment.toFixed(2)}
                            </span>
                          )}
                          {variation.price_adjustment === 0 &&
                            "Sem ajuste de preço"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={variation.is_active ? "default" : "secondary"}
                      >
                        {variation.is_active ? "Ativo" : "Inativo"}
                      </Badge>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(variation)}
                          title="Editar variação"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateVariation(
                              index,
                              "is_active",
                              !variation.is_active
                            )
                          }
                          title={variation.is_active ? "Desativar" : "Ativar"}
                        >
                          {variation.is_active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariation(index)}
                          className="text-red-500 hover:text-red-700"
                          title="Excluir variação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Ações rápidas */}
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-6 text-center">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Plus className="w-5 h-5" />
                  <span>Adicionar mais variações</span>
                </div>

                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setViewMode("add_form")}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Variação Individual
                  </Button>
                  <Button
                    variant="outline"
                    onClick={recreateWithWizard}
                    className="flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Wizard Completo
                  </Button>
                </div>

                <p className="text-xs text-gray-500">
                  Use "Individual" para adicionar uma variação ou "Wizard" para
                  recriar todas
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
  }

  return (
    <>
      {/* Diálogo de edição */}
      <VariationEditDialog
        variation={editingVariation}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingVariation(null);
        }}
        onSave={handleSaveVariation}
        productId={productId}
      />
    </>
  );
};

export default SmartVariationManager;
