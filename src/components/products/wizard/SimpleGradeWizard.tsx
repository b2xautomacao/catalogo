
import React, { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Grid, 
  Package, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Save,
  AlertCircle 
} from "lucide-react";
import { ProductVariation } from "@/types/product";

type GradeMode = "single" | "variations" | "grade";

export interface SimpleGradeWizardProps {
  onClose: () => void;
  onSave: (variations: ProductVariation[]) => void;
  initialVariations?: ProductVariation[];
  variations?: ProductVariation[];
  onVariationsChange?: (variations: ProductVariation[]) => void;
  productId?: string;
  storeId?: string;
  category?: string;
  productName?: string;
}

const SimpleGradeWizard: React.FC<SimpleGradeWizardProps> = ({
  onClose,
  onSave,
  initialVariations = [],
  variations: propVariations,
  onVariationsChange,
}) => {
  const [mode, setMode] = useState<GradeMode>("single");
  const [variations, setVariations] = useState<ProductVariation[]>(
    propVariations || initialVariations
  );
  const [gradeConfig, setGradeConfig] = useState({
    name: "",
    colors: [""],
    sizes: [""],
    quantities: [0],
  });

  const handleModeSelect = useCallback((selectedMode: GradeMode) => {
    setMode(selectedMode);
  }, []);

  const addGradeColor = () => {
    setGradeConfig(prev => ({
      ...prev,
      colors: [...prev.colors, ""],
    }));
  };

  const addGradeSize = () => {
    setGradeConfig(prev => ({
      ...prev,
      sizes: [...prev.sizes, ""],
      quantities: [...prev.quantities, 0],
    }));
  };

  const updateGradeColor = (index: number, value: string) => {
    setGradeConfig(prev => ({
      ...prev,
      colors: prev.colors.map((color, i) => i === index ? value : color),
    }));
  };

  const updateGradeSize = (index: number, value: string) => {
    setGradeConfig(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => i === index ? value : size),
    }));
  };

  const updateGradeQuantity = (index: number, value: number) => {
    setGradeConfig(prev => ({
      ...prev,
      quantities: prev.quantities.map((qty, i) => i === index ? value : qty),
    }));
  };

  const removeGradeColor = (index: number) => {
    setGradeConfig(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  const removeGradeSize = (index: number) => {
    setGradeConfig(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
      quantities: prev.quantities.filter((_, i) => i !== index),
    }));
  };

  const generateGradeVariations = () => {
    const newVariations: ProductVariation[] = [];
    
    gradeConfig.colors.forEach((color, colorIndex) => {
      if (!color.trim()) return;
      
      gradeConfig.sizes.forEach((size, sizeIndex) => {
        if (!size.trim()) return;
        
        const variation: ProductVariation = {
          id: `grade-${colorIndex}-${sizeIndex}-${Date.now()}`,
          product_id: "",
          color: color.trim(),
          size: size.trim(),
          stock: gradeConfig.quantities[sizeIndex] || 0,
          price_adjustment: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_grade: true,
          grade_name: gradeConfig.name,
          grade_color: color.trim(),
          grade_quantity: gradeConfig.quantities[sizeIndex] || 0,
        };
        
        newVariations.push(variation);
      });
    });
    
    setVariations(newVariations);
  };

  const handleSave = () => {
    if (mode === "grade") {
      generateGradeVariations();
    }
    if (onVariationsChange) {
      onVariationsChange(variations);
    }
    onSave(variations);
  };

  // Mode Selection Screen
  if (mode === "single") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid className="h-5 w-5" />
            Configurar Variações do Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleModeSelect("variations")}
              className="p-6 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-lg transition-colors text-center group"
            >
              <Package className="h-8 w-8 mx-auto mb-3 text-gray-400 group-hover:text-blue-500" />
              <h3 className="font-semibold text-gray-900 mb-2">Variações Livres</h3>
              <p className="text-sm text-gray-600">
                Criar variações individuais com cores, tamanhos e preços personalizados
              </p>
            </button>

            <button
              onClick={() => handleModeSelect("grade")}
              className="p-6 border-2 border-dashed border-gray-300 hover:border-green-500 rounded-lg transition-colors text-center group"
            >
              <Grid className="h-8 w-8 mx-auto mb-3 text-gray-400 group-hover:text-green-500" />
              <h3 className="font-semibold text-gray-900 mb-2">Grade de Produtos</h3>
              <p className="text-sm text-gray-600">
                Configurar uma grade com cores e tamanhos em matriz
              </p>
            </button>

            <button
              onClick={() => onClose()}
              className="p-6 border-2 border-dashed border-gray-300 hover:border-gray-500 rounded-lg transition-colors text-center group"
            >
              <ArrowLeft className="h-8 w-8 mx-auto mb-3 text-gray-400 group-hover:text-gray-500" />
              <h3 className="font-semibold text-gray-900 mb-2">Produto Simples</h3>
              <p className="text-sm text-gray-600">
                Manter produto sem variações
              </p>
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Free Variations Mode
  if (mode === "variations") {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Variações Livres
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode("single")}
              className="ml-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Badge variant="outline">
              {variations.length} variações criadas
            </Badge>
            <Button onClick={() => {
              const newVariation: ProductVariation = {
                id: `variation-${Date.now()}`,
                product_id: "",
                color: "",
                size: "",
                stock: 0,
                price_adjustment: 0,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              setVariations([...variations, newVariation]);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Variação
            </Button>
          </div>

          {variations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Nenhuma variação criada ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {variations.map((variation, index) => (
                <div key={variation.id} className="flex gap-3 items-center p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Cor</Label>
                      <Input
                        value={variation.color || ""}
                        onChange={(e) => {
                          const updated = [...variations];
                          updated[index] = { ...variation, color: e.target.value };
                          setVariations(updated);
                        }}
                        placeholder="Ex: Azul"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tamanho</Label>
                      <Input
                        value={variation.size || ""}
                        onChange={(e) => {
                          const updated = [...variations];
                          updated[index] = { ...variation, size: e.target.value };
                          setVariations(updated);
                        }}
                        placeholder="Ex: M"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Estoque</Label>
                      <Input
                        type="number"
                        value={variation.stock}
                        onChange={(e) => {
                          const updated = [...variations];
                          updated[index] = { ...variation, stock: parseInt(e.target.value) || 0 };
                          setVariations(updated);
                        }}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Ajuste Preço</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variation.price_adjustment}
                        onChange={(e) => {
                          const updated = [...variations];
                          updated[index] = { ...variation, price_adjustment: parseFloat(e.target.value) || 0 };
                          setVariations(updated);
                        }}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVariations(variations.filter((_, i) => i !== index));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Variações
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grade Mode
  if (mode === "grade") {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid className="h-5 w-5" />
            Grade de Produtos
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode("single")}
              className="ml-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Grade Name */}
          <div>
            <Label>Nome da Grade</Label>
            <Input
              value={gradeConfig.name}
              onChange={(e) => setGradeConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Camiseta Básica"
            />
          </div>

          {/* Colors */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <Label>Cores Disponíveis</Label>
              <Button variant="outline" size="sm" onClick={addGradeColor}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cor
              </Button>
            </div>
            <div className="space-y-2">
              {gradeConfig.colors.map((color, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={color}
                    onChange={(e) => updateGradeColor(index, e.target.value)}
                    placeholder="Nome da cor"
                    className="flex-1"
                  />
                  {gradeConfig.colors.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeGradeColor(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sizes and Quantities */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <Label>Tamanhos e Quantidades</Label>
              <Button variant="outline" size="sm" onClick={addGradeSize}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Tamanho
              </Button>
            </div>
            <div className="space-y-2">
              {gradeConfig.sizes.map((size, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={size}
                    onChange={(e) => updateGradeSize(index, e.target.value)}
                    placeholder="Tamanho"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={gradeConfig.quantities[index] || 0}
                    onChange={(e) => updateGradeQuantity(index, parseInt(e.target.value) || 0)}
                    placeholder="Qtd"
                    className="w-20"
                    min="0"
                  />
                  {gradeConfig.sizes.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeGradeSize(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label>Prévia da Grade</Label>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">
                Total de variações: {gradeConfig.colors.filter(c => c.trim()).length * gradeConfig.sizes.filter(s => s.trim()).length}
              </div>
              {gradeConfig.colors.filter(c => c.trim()).length > 0 && 
               gradeConfig.sizes.filter(s => s.trim()).length > 0 && (
                <div className="grid gap-1 text-xs">
                  {gradeConfig.colors.filter(c => c.trim()).map((color, colorIndex) => (
                    <div key={colorIndex} className="flex items-center gap-2">
                      <Badge variant="outline">{color}</Badge>
                      <span>×</span> 
                      <div className="flex gap-1">
                        {gradeConfig.sizes.filter(s => s.trim()).map((size, sizeIndex) => (
                          <Badge key={sizeIndex} variant="secondary">
                            {size} ({gradeConfig.quantities[sizeIndex] || 0})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Criar Grade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default SimpleGradeWizard;
