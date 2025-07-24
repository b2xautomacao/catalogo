import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ProductVariation } from "@/types/product";
import {
  Palette,
  Ruler,
  Package,
  Plus,
  Trash2,
  Save,
  X,
  Grid3X3,
  Layers,
  ShoppingBag,
} from "lucide-react";

export interface SimpleGradeWizardProps {
  productId: string;
  storeId: string;
  category: string;
  productName: string;
  onVariationsChange: (variations: ProductVariation[]) => void;
  onClose: () => void;
  onSave: (variations: ProductVariation[]) => void;
}

const SimpleGradeWizard: React.FC<SimpleGradeWizardProps> = ({
  productId,
  storeId,
  category,
  productName,
  onVariationsChange,
  onClose,
  onSave
}) => {
  const [wizardType, setWizardType] = useState<"variations" | "grade" | "single">("single");
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [gradeData, setGradeData] = useState({
    gradeName: "",
    gradeColor: "",
    gradeQuantity: 1,
    gradeSizes: ["35", "36", "37", "38", "39", "40"],
    gradePairs: [2, 2, 2, 2, 2, 2],
  });
  const { toast } = useToast();

  useEffect(() => {
    // Inicializar com uma variação simples se não houver nenhuma
    if (variations.length === 0) {
      const defaultVariation: ProductVariation = {
        id: `temp-${Date.now()}`,
        product_id: productId,
        color: "",
        size: "",
        sku: "",
        stock: 0,
        price_adjustment: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setVariations([defaultVariation]);
    }
  }, [productId]);

  const handleWizardTypeChange = (type: "variations" | "grade" | "single") => {
    setWizardType(type);
    
    if (type === "single") {
      // Resetar para uma única variação simples
      const singleVariation: ProductVariation = {
        id: `temp-${Date.now()}`,
        product_id: productId,
        color: "",
        size: "",
        sku: "",
        stock: 0,
        price_adjustment: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setVariations([singleVariation]);
    } else if (type === "variations") {
      // Manter variações existentes ou criar algumas básicas
      if (variations.length <= 1) {
        const basicVariations: ProductVariation[] = [
          {
            id: `temp-${Date.now()}-1`,
            product_id: productId,
            color: "Azul",
            size: "M",
            sku: "",
            stock: 0,
            price_adjustment: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: `temp-${Date.now()}-2`,
            product_id: productId,
            color: "Vermelho",
            size: "G",
            sku: "",
            stock: 0,
            price_adjustment: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        setVariations(basicVariations);
      }
    }
  };

  const addVariation = () => {
    const newVariation: ProductVariation = {
      id: `temp-${Date.now()}`,
      product_id: productId,
      color: "",
      size: "",
      sku: "",
      stock: 0,
      price_adjustment: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const updatedVariations = [...variations, newVariation];
    setVariations(updatedVariations);
    onVariationsChange(updatedVariations);
  };

  const removeVariation = (index: number) => {
    const updatedVariations = variations.filter((_, i) => i !== index);
    setVariations(updatedVariations);
    onVariationsChange(updatedVariations);
  };

  const updateVariation = (index: number, field: keyof ProductVariation, value: any) => {
    const updatedVariations = variations.map((variation, i) => {
      if (i === index) {
        return { ...variation, [field]: value };
      }
      return variation;
    });
    setVariations(updatedVariations);
    onVariationsChange(updatedVariations);
  };

  const generateGradeVariations = () => {
    const gradeVariations: ProductVariation[] = [];
    
    gradeData.gradeSizes.forEach((size, index) => {
      const pairs = gradeData.gradePairs[index] || 0;
      if (pairs > 0) {
        const variation: ProductVariation = {
          id: `grade-${Date.now()}-${index}`,
          product_id: productId,
          color: gradeData.gradeColor,
          size: size,
          sku: `${gradeData.gradeName}-${gradeData.gradeColor}-${size}`,
          stock: pairs,
          price_adjustment: 0,
          is_active: true,
          grade_name: gradeData.gradeName,
          grade_color: gradeData.gradeColor,
          grade_quantity: gradeData.gradeQuantity,
          grade_sizes: gradeData.gradeSizes,
          grade_pairs: gradeData.gradePairs,
          is_grade: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        gradeVariations.push(variation);
      }
    });

    setVariations(gradeVariations);
    onVariationsChange(gradeVariations);
    
    toast({
      title: "Grade criada!",
      description: `${gradeVariations.length} variações geradas para a grade ${gradeData.gradeName}`,
    });
  };

  const handleSave = () => {
    if (variations.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma variação",
        variant: "destructive",
      });
      return;
    }

    // Validar variações
    const invalidVariations = variations.filter(v => 
      wizardType !== "single" && (!v.color?.trim() || !v.size?.trim())
    );

    if (invalidVariations.length > 0) {
      toast({
        title: "Erro de validação",
        description: "Preencha cor e tamanho para todas as variações",
        variant: "destructive",
      });
      return;
    }

    onSave(variations);
    toast({
      title: "Variações salvas!",
      description: `${variations.length} variação(ões) configurada(s)`,
    });
  };

  const renderWizardTypeSelector = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5" />
          Tipo de Produto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant={wizardType === "single" ? "default" : "outline"}
            onClick={() => handleWizardTypeChange("single")}
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <Package className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Produto Simples</div>
              <div className="text-xs text-muted-foreground">
                Sem variações
              </div>
            </div>
          </Button>

          <Button
            variant={wizardType === "variations" ? "default" : "outline"}
            onClick={() => handleWizardTypeChange("variations")}
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <Layers className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Com Variações</div>
              <div className="text-xs text-muted-foreground">
                Cores, tamanhos, etc.
              </div>
            </div>
          </Button>

          <Button
            variant={wizardType === "grade" ? "default" : "outline"}
            onClick={() => handleWizardTypeChange("grade")}
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <ShoppingBag className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Grade Calçados</div>
              <div className="text-xs text-muted-foreground">
                Sistema de grades
              </div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderSingleProduct = () => (
    <Card>
      <CardHeader>
        <CardTitle>Produto Simples</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>SKU (opcional)</Label>
            <Input
              value={variations[0]?.sku || ""}
              onChange={(e) => updateVariation(0, "sku", e.target.value)}
              placeholder="Código do produto"
            />
          </div>
          
          <div>
            <Label>Estoque</Label>
            <Input
              type="number"
              value={variations[0]?.stock || 0}
              onChange={(e) => updateVariation(0, "stock", parseInt(e.target.value) || 0)}
              placeholder="Quantidade em estoque"
            />
          </div>

          <div>
            <Label>Ajuste de Preço (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={variations[0]?.price_adjustment || 0}
              onChange={(e) => updateVariation(0, "price_adjustment", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={variations[0]?.is_active || false}
              onCheckedChange={(checked) => updateVariation(0, "is_active", checked)}
            />
            <Label>Produto ativo</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderVariationsEditor = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Variações do Produto
          </span>
          <Button onClick={addVariation} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {variations.map((variation, index) => (
            <div key={variation.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Variação {index + 1}</Badge>
                {variations.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariation(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Cor</Label>
                  <Input
                    value={variation.color || ""}
                    onChange={(e) => updateVariation(index, "color", e.target.value)}
                    placeholder="Ex: Azul, Vermelho"
                  />
                </div>

                <div>
                  <Label>Tamanho</Label>
                  <Input
                    value={variation.size || ""}
                    onChange={(e) => updateVariation(index, "size", e.target.value)}
                    placeholder="Ex: P, M, G, 38, 40"
                  />
                </div>

                <div>
                  <Label>SKU</Label>
                  <Input
                    value={variation.sku || ""}
                    onChange={(e) => updateVariation(index, "sku", e.target.value)}
                    placeholder="Código único"
                  />
                </div>

                <div>
                  <Label>Estoque</Label>
                  <Input
                    type="number"
                    value={variation.stock || 0}
                    onChange={(e) => updateVariation(index, "stock", parseInt(e.target.value) || 0)}
                    placeholder="Quantidade"
                  />
                </div>

                <div>
                  <Label>Ajuste de Preço (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variation.price_adjustment || 0}
                    onChange={(e) => updateVariation(index, "price_adjustment", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={variation.is_active || false}
                    onCheckedChange={(checked) => updateVariation(index, "is_active", checked)}
                  />
                  <Label>Ativo</Label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderGradeEditor = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Configurar Grade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Informações da Grade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome da Grade</Label>
              <Input
                value={gradeData.gradeName}
                onChange={(e) => setGradeData(prev => ({ ...prev, gradeName: e.target.value }))}
                placeholder="Ex: Tênis Esportivo"
              />
            </div>

            <div>
              <Label>Cor da Grade</Label>
              <Input
                value={gradeData.gradeColor}
                onChange={(e) => setGradeData(prev => ({ ...prev, gradeColor: e.target.value }))}
                placeholder="Ex: Preto, Branco"
              />
            </div>
          </div>

          <Separator />

          {/* Configuração de Tamanhos e Pares */}
          <div>
            <Label className="text-base font-semibold">Distribuição por Tamanho</Label>
            <div className="mt-4 space-y-3">
              {gradeData.gradeSizes.map((size, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16">
                    <Label className="text-sm">Tam.</Label>
                    <Input
                      value={size}
                      onChange={(e) => {
                        const newSizes = [...gradeData.gradeSizes];
                        newSizes[index] = e.target.value;
                        setGradeData(prev => ({ ...prev, gradeSizes: newSizes }));
                      }}
                      className="text-center"
                    />
                  </div>
                  
                  <div className="w-20">
                    <Label className="text-sm">Pares</Label>
                    <Input
                      type="number"
                      min="0"
                      value={gradeData.gradePairs[index] || 0}
                      onChange={(e) => {
                        const newPairs = [...gradeData.gradePairs];
                        newPairs[index] = parseInt(e.target.value) || 0;
                        setGradeData(prev => ({ ...prev, gradePairs: newPairs }));
                      }}
                      className="text-center"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">
                      Total: {gradeData.gradePairs[index] || 0} pares
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <div className="font-semibold">Total da Grade</div>
              <div className="text-sm text-muted-foreground">
                {gradeData.gradePairs.reduce((sum, pairs) => sum + (pairs || 0), 0)} pares
              </div>
            </div>
            
            <Button onClick={generateGradeVariations}>
              <Grid3X3 className="h-4 w-4 mr-2" />
              Gerar Grade
            </Button>
          </div>

          {/* Preview das Variações Geradas */}
          {variations.length > 0 && variations[0]?.is_grade && (
            <div className="mt-6">
              <Label className="text-base font-semibold">Variações Geradas</Label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {variations.map((variation, index) => (
                  <div key={variation.id} className="border rounded p-2 text-center">
                    <div className="font-medium">{variation.size}</div>
                    <div className="text-sm text-muted-foreground">
                      {variation.stock} pares
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurar Variações</h2>
          <p className="text-muted-foreground">
            {productName} - {category}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Seletor de Tipo */}
      {renderWizardTypeSelector()}

      {/* Conteúdo baseado no tipo selecionado */}
      {wizardType === "single" && renderSingleProduct()}
      {wizardType === "variations" && renderVariationsEditor()}
      {wizardType === "grade" && renderGradeEditor()}

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">
                {variations.length} variação(ões) configurada(s)
              </div>
              <div className="text-sm text-muted-foreground">
                Estoque total: {variations.reduce((sum, v) => sum + (v.stock || 0), 0)} unidades
              </div>
            </div>
            
            <Badge variant={variations.length > 0 ? "default" : "secondary"}>
              {wizardType === "single" ? "Produto Simples" : 
               wizardType === "variations" ? "Com Variações" : "Grade"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleGradeWizard;
