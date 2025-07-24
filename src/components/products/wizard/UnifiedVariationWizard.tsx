
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Wand2, Package, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductVariation } from "@/types/product";
import { generateUniqueSKU, generateBatchSKUs, validateSKUUniqueness } from "@/utils/skuGenerator";

interface UnifiedVariationWizardProps {
  variations: ProductVariation[];
  onVariationsChange: (variations: ProductVariation[]) => void;
  productId?: string;
  storeId?: string;
  category?: string;
  productName?: string;
  onComplete?: () => void;
}

const UnifiedVariationWizard: React.FC<UnifiedVariationWizardProps> = ({
  variations,
  onVariationsChange,
  productId,
  storeId,
  category,
  productName = "Produto",
  onComplete,
}) => {
  const [currentView, setCurrentView] = useState<'selector' | 'simple' | 'colors' | 'sizes' | 'complete'>('selector');
  const [localVariations, setLocalVariations] = useState<ProductVariation[]>(variations);
  const [bulkStock, setBulkStock] = useState<number>(0);
  const [isGeneratingSKU, setIsGeneratingSKU] = useState(false);
  const { toast } = useToast();

  // Sincronizar com props apenas quando necessário
  useEffect(() => {
    if (variations.length > 0 && localVariations.length === 0) {
      setLocalVariations(variations);
      if (variations.length > 0) {
        setCurrentView('complete');
      }
    }
  }, [variations.length, localVariations.length]);

  // Debounce para evitar muitas atualizações
  const debouncedUpdate = useCallback(
    debounce((newVariations: ProductVariation[]) => {
      onVariationsChange(newVariations);
    }, 500),
    [onVariationsChange]
  );

  const updateLocalVariations = useCallback((newVariations: ProductVariation[]) => {
    setLocalVariations(newVariations);
    debouncedUpdate(newVariations);
  }, [debouncedUpdate]);

  const generateAllSKUs = useCallback(async () => {
    if (localVariations.length === 0) return;

    setIsGeneratingSKU(true);
    
    try {
      const variationData = localVariations.map(v => ({
        color: v.color,
        size: v.size,
        name: v.name,
      }));

      const newSKUs = generateBatchSKUs(productName, variationData);
      
      if (!validateSKUUniqueness(newSKUs)) {
        throw new Error("Erro na geração de SKUs únicos");
      }

      const updatedVariations = localVariations.map((variation, index) => ({
        ...variation,
        sku: newSKUs[index] || generateUniqueSKU(productName, { 
          color: variation.color,
          size: variation.size,
          name: variation.name,
          index 
        }),
      }));

      updateLocalVariations(updatedVariations);
      
      toast({
        title: "SKUs gerados!",
        description: `${newSKUs.length} SKUs únicos foram gerados com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao gerar SKUs:", error);
      toast({
        title: "Erro ao gerar SKUs",
        description: "Não foi possível gerar SKUs únicos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSKU(false);
    }
  }, [localVariations, productName, updateLocalVariations, toast]);

  const applyBulkStock = useCallback(() => {
    if (bulkStock <= 0) {
      toast({
        title: "Estoque inválido",
        description: "Insira um valor de estoque válido (maior que 0)",
        variant: "destructive",
      });
      return;
    }

    const updatedVariations = localVariations.map(variation => ({
      ...variation,
      stock: bulkStock,
    }));

    updateLocalVariations(updatedVariations);
    setBulkStock(0);
    
    toast({
      title: "Estoque aplicado!",
      description: `Estoque de ${bulkStock} unidades aplicado a todas as variações.`,
    });
  }, [bulkStock, localVariations, updateLocalVariations, toast]);

  const addSimpleVariation = useCallback(() => {
    const newVariation: ProductVariation = {
      id: `temp-${Date.now()}-${Math.random()}`,
      product_id: productId || "",
      name: `Variação ${localVariations.length + 1}`,
      color: "",
      size: "",
      sku: "",
      stock: 0,
      price_adjustment: 0,
      is_active: true,
      image_url: "",
      variation_type: "simple",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    updateLocalVariations([...localVariations, newVariation]);
  }, [localVariations, productId, updateLocalVariations]);

  const updateVariation = useCallback((index: number, updates: Partial<ProductVariation>) => {
    const updated = localVariations.map((variation, i) => 
      i === index ? { ...variation, ...updates } : variation
    );
    updateLocalVariations(updated);
  }, [localVariations, updateLocalVariations]);

  const removeVariation = useCallback((index: number) => {
    const updated = localVariations.filter((_, i) => i !== index);
    updateLocalVariations(updated);
  }, [localVariations, updateLocalVariations]);

  // Render do seletor inicial
  if (currentView === 'selector' && localVariations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Configurar Variações do Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => setCurrentView('simple')}
              variant="outline"
              className="h-24 flex flex-col gap-2"
            >
              <Package className="h-6 w-6" />
              <span>Variações Simples</span>
              <span className="text-xs text-muted-foreground">
                Criar variações básicas manualmente
              </span>
            </Button>
            
            <Button
              onClick={() => setCurrentView('colors')}
              variant="outline"
              className="h-24 flex flex-col gap-2"
            >
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span>Por Cores</span>
              <span className="text-xs text-muted-foreground">
                Criar variações baseadas em cores
              </span>
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Escolha como deseja configurar as variações do seu produto.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render das variações existentes ou configuração
  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Variações do Produto
              {localVariations.length > 0 && (
                <Badge variant="secondary">{localVariations.length}</Badge>
              )}
            </CardTitle>
            
            <div className="flex gap-2">
              {currentView !== 'selector' && localVariations.length === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView('selector')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={addSimpleVariation}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Variação
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {localVariations.length > 0 && (
          <CardContent className="space-y-4">
            {/* Ações em lote */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Label htmlFor="bulk-stock">Estoque em lote:</Label>
                <Input
                  id="bulk-stock"
                  type="number"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(Number(e.target.value))}
                  className="w-24"
                  min="0"
                />
                <Button
                  size="sm"
                  onClick={applyBulkStock}
                  disabled={bulkStock <= 0}
                >
                  Aplicar a Todas
                </Button>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={generateAllSKUs}
                disabled={isGeneratingSKU || localVariations.length === 0}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {isGeneratingSKU ? "Gerando..." : "Gerar SKUs"}
              </Button>
            </div>
            
            {/* Lista de variações */}
            <div className="space-y-4">
              {localVariations.map((variation, index) => (
                <Card key={variation.id || index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Variação</Label>
                      <Input
                        value={variation.name || ""}
                        onChange={(e) => updateVariation(index, { name: e.target.value })}
                        placeholder="Ex: Azul Claro P"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input
                        value={variation.sku || ""}
                        onChange={(e) => updateVariation(index, { sku: e.target.value })}
                        placeholder="Código único"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Estoque</Label>
                      <Input
                        type="number"
                        value={variation.stock || 0}
                        onChange={(e) => updateVariation(index, { stock: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Ajuste de Preço (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variation.price_adjustment || 0}
                        onChange={(e) => updateVariation(index, { price_adjustment: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariation(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remover
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default UnifiedVariationWizard;
