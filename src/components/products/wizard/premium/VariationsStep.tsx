import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Plus, Trash2, Layers, Grid, ChevronRight, Check, Palette, X, Box, User, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useStoreColors } from "@/hooks/useStoreColors";
import { resolveColorHex, isLightColor } from "@/lib/colors";
import { Card, CardContent } from "@/components/ui/card";
import { PremiumWizardFormData } from "@/hooks/usePremiumProductWizard";
import { ProductVariation } from "@/types/product";

import UnifiedGradeManager from "../UnifiedGradeManager";
import ColorPickerPopover from "../ColorPickerPopover";
import { useToast } from "@/hooks/use-toast";

interface VariationsStepProps {
  formData: PremiumWizardFormData;
  updateFormData: (updates: Partial<PremiumWizardFormData>) => void;
  productId?: string;
}

type VariationType = 
  | "none" 
  | "color_only" 
  | "size_only" 
  | "material_only" 
  | "color_size" 
  | "color_material" 
  | "grade_system";

const VariationsStep: React.FC<VariationsStepProps> = ({ formData, updateFormData, productId }) => {
  const { colors: storeColors } = useStoreColors(formData.store_id);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [bulkStock, setBulkStock] = useState("");
  const [baseQuantity, setBaseQuantity] = useState("1");
  const [variationType, setVariationType] = useState<VariationType>("none");
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);

  const sizeGrades = {
    calcado: ["33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"],
    roupa: ["PP", "P", "M", "G", "GG", "G1", "G2", "G3"],
    infantil: ["RN", "1", "2", "4", "6", "8", "10", "12"],
    acessorio: ["Tamanho Único", "P", "M", "G"],
  };

  // Inicializar tamanhos e cores a partir das variações existentes (para edição)
  useEffect(() => {
    if (formData.variations.length > 0 && !initialized) {
      const existingSizes = [...new Set(formData.variations.map(v => v.size).filter(Boolean))];
      const existingColors = [...new Set(formData.variations.map(v => v.color).filter(Boolean))];
      const existingMaterials = [...new Set(formData.variations.map(v => v.material).filter(Boolean))];

      // Identificar quais tamanhos são "customizados" (não estão nos grades padrão)
      const allStandardSizes = Object.values(sizeGrades).flat();
      const newCustomSizes = existingSizes.filter(s => !allStandardSizes.includes(s));

      if (newCustomSizes.length > 0) {
        setCustomSizes(prev => [...new Set([...prev, ...newCustomSizes])]);
      }

      setSelectedSizes(prev => [...new Set([...prev, ...existingSizes])]);
      setSelectedColors(prev => [...new Set([...prev, ...existingColors])]);
      setSelectedMaterials(prev => [...new Set([...prev, ...existingMaterials])]);
      
      // Tentar adivinhar a estratégia de variação
      if (existingColors.length > 0 && existingSizes.length > 0) setVariationType("color_size");
      else if (existingColors.length > 0 && existingMaterials.length > 0) setVariationType("color_material");
      else if (existingColors.length > 0) setVariationType("color_only");
      else if (existingSizes.length > 0) setVariationType("size_only");
      else if (existingMaterials.length > 0) setVariationType("material_only");
      
      setInitialized(true);
    }
  }, [formData.variations, sizeGrades, initialized]);

  // Carregar tamanhos customizados salvos no localStorage para esta loja
  useEffect(() => {
    const storageKey = `b2x_custom_sizes_${formData.store_id || 'global'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomSizes(prev => [...new Set([...prev, ...parsed])]);
        }
      } catch (e) {
        console.error("Erro ao carregar tamanhos customizados:", e);
      }
    }
  }, [formData.store_id]);

  const getSizes = () => {
    let baseSizes: string[] = [];
    if (formData.product_category_type === "calcado") baseSizes = sizeGrades.calcado;
    else if (formData.product_gender === "infantil") baseSizes = sizeGrades.infantil;
    else if (formData.product_category_type === "acessorio") baseSizes = sizeGrades.acessorio;
    else baseSizes = sizeGrades.roupa;
    
    return [...baseSizes, ...customSizes];
  };

  const sizes = getSizes();

  const toggleColor = (colorName: string) => {
    setSelectedColors(prev => 
      prev.includes(colorName) 
        ? prev.filter(c => c !== colorName) 
        : [...prev, colorName]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size) 
        : [...prev, size]
    );
  };

  const toggleMaterial = (mat: string) => {
    setSelectedMaterials(prev => 
      prev.includes(mat) 
        ? prev.filter(m => m !== mat) 
        : [...prev, mat]
    );
  };

  const handleAddCustomSize = () => {
    if (!customSizeInput.trim()) return;
    
    const newSize = customSizeInput.trim();
    if (!customSizes.includes(newSize)) {
      const updatedCustom = [...customSizes, newSize];
      setCustomSizes(updatedCustom);
      
      // Persistir no localStorage
      const storageKey = `b2x_custom_sizes_${formData.store_id || 'global'}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedCustom));

      if (!selectedSizes.includes(newSize)) {
        setSelectedSizes(prev => [...prev, newSize]);
      }
    }
    setCustomSizeInput("");
  };

  const removeCustomSize = (size: string) => {
    const updatedCustom = customSizes.filter(s => s !== size);
    setCustomSizes(updatedCustom);
    setSelectedSizes(prev => prev.filter(s => s !== size));
    
    // Atualizar no localStorage
    const storageKey = `b2x_custom_sizes_${formData.store_id || 'global'}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedCustom));
  };

  const generateVariations = (mode: 'standard' | 'half' | 'merged' = 'standard') => {
    const newVariations: ProductVariation[] = [];
    const stockVal = parseInt(baseQuantity) || 0;
    
    // Auxiliar para gerar combinações
    const colors = selectedColors.length > 0 ? selectedColors : [null];
    const materials = selectedMaterials.length > 0 ? selectedMaterials : [null];
    const sizesList = selectedSizes.length > 0 ? selectedSizes : [null];

    colors.forEach(colorName => {
      const storeColor = colorName ? storeColors.find(c => c.name === colorName) : null;
      const hex = colorName ? (storeColor?.hex_color || resolveColorHex(colorName)) : "#9CA3AF";

      materials.forEach(materialName => {
        let finalSizes = [...selectedSizes];
        
        if (mode === 'half' && formData.product_category_type === 'calcado' && selectedSizes.length > 0) {
          const extra = selectedSizes.map(s => `${s}.5`);
          finalSizes = [...new Set([...finalSizes, ...extra])].sort();
        }

        const effectiveSizes = finalSizes.length > 0 ? finalSizes : [null];

        effectiveSizes.forEach(size => {
          const id = `new-${colorName || 'any'}-${size || 'any'}-${materialName || 'any'}-${Date.now()}-${Math.random()}`;
          
          newVariations.push({
            id,
            product_id: productId || "",
            color: colorName || "",
            size: size || "",
            material: materialName || "",
            hex_color: hex,
            stock: stockVal,
            price_adjustment: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      });
    });

    updateFormData({ variations: [...formData.variations, ...newVariations] });
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedMaterials([]);
    toast({ title: "Variações geradas!", description: `${newVariations.length} novas variações foram criadas.` });
  };

  const applyBulkStock = () => {
    const val = parseInt(bulkStock) || 0;
    updateFormData({
      variations: formData.variations.map(v => ({ ...v, stock: val }))
    });
    setBulkStock("");
  };

  const renderTypeSelection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {[
        { id: "color_only", title: "Apenas Cor", desc: "Produtos que variam apenas na cor", icon: <Palette className="w-8 h-8 text-rose-500" /> },
        { id: "size_only", title: "Apenas Tamanho", desc: "Produtos com tamanhos diferentes", icon: <Layers className="w-8 h-8 text-blue-500" /> },
        { id: "material_only", title: "Apenas Material", desc: "Ex: Couro, Sintético, Lona", icon: <Box className="w-8 h-8 text-amber-500" /> },
        { id: "color_size", title: "Cor e Tamanho", desc: "Combinação de cores e tamanhos", icon: <Grid className="w-8 h-8 text-purple-500" /> },
        { id: "color_material", title: "Cor e Material", desc: "Variações de cor por material", icon: <Palette className="w-8 h-8 text-indigo-500" /> },
        { id: "grade_system", title: "Sistema de Grades", desc: "Ideal para Calçados (Atacado)", icon: <Plus className="w-8 h-8 text-emerald-500" /> },
      ].map((type) => (
        <Card 
          key={type.id} 
          className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group overflow-hidden"
          onClick={() => setVariationType(type.id as VariationType)}
        >
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
              {type.icon}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{type.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{type.desc}</p>
            </div>
            <Button variant="ghost" size="sm" className="w-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              Escolher <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (variationType === "none" && formData.variations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-slate-800">Como seu produto varia?</h2>
          <p className="text-sm text-slate-500">Escolha a melhor estratégia para as variações do seu produto</p>
        </div>
        {renderTypeSelection()}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold flex items-center gap-2 text-slate-800">
                 <Palette className="w-4 h-4 text-rose-500" />
                 1. Configurações de Variação
              </Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[10px] font-bold text-slate-400 hover:text-blue-600"
                onClick={() => setVariationType("none")}
              >
                Mudar Estratégia
              </Button>
            </div>

            {variationType === "grade_system" ? (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <UnifiedGradeManager
                  variations={formData.variations}
                  onVariationsChange={(vars) => updateFormData({ variations: vars })}
                  productId={productId}
                  storeId={formData.store_id}
                  productName={formData.name}
                  showPreview={false}
                />
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                {(variationType.includes("color")) && (
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-700">Escolha as Cores</Label>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                      {storeColors.map(color => (
                        <button
                          key={color.id}
                          onClick={() => toggleColor(color.name)}
                          className={`group relative p-1 rounded-full border-2 transition-all ${
                            selectedColors.includes(color.name) 
                              ? "border-blue-500 scale-110 shadow-md bg-white" 
                              : "border-transparent hover:border-slate-300"
                          }`}
                          title={color.name}
                        >
                          <div 
                            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center"
                            style={{ backgroundColor: color.hex_color }}
                          >
                            {selectedColors.includes(color.name) && (
                              <Check className="w-5 h-5 drop-shadow-md" style={{ color: isLightColor(color.hex_color) ? '#000' : '#FFF' }} />
                            )}
                          </div>
                        </button>
                      ))}
                      
                      <ColorPickerPopover 
                        storeId={formData.store_id}
                        onColorSelect={(colorObj) => {
                          if (!selectedColors.includes(colorObj.name)) {
                            setSelectedColors(prev => [...prev, colorObj.name]);
                          }
                        }}
                        trigger={
                          <Button variant="outline" className="w-12 h-12 rounded-full border-dashed border-2 p-0 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-200">
                            <Plus className="w-5 h-5" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                )}

                {(variationType.includes("size")) && (
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-700">Escolha os Tamanhos</Label>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                      {sizes.map(size => (
                        <div key={size} className="relative group">
                          <button
                            onClick={() => toggleSize(size)}
                            className={`w-12 h-12 rounded-xl border-2 font-bold text-[10px] transition-all flex items-center justify-center text-center px-1 overflow-hidden break-words ${
                              selectedSizes.includes(size)
                                ? "border-blue-500 bg-white text-blue-700 shadow-sm"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {size}
                          </button>
                          {customSizes.includes(size) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCustomSize(size);
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      <div className="flex items-center gap-2 w-full mt-2 pt-2 border-t border-slate-100">
                         <Input 
                           placeholder="Ex: 30 cáps, 800g, 15ml..." 
                           value={customSizeInput}
                           onChange={(e) => setCustomSizeInput(e.target.value)}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               e.preventDefault();
                               handleAddCustomSize();
                             }
                           }}
                           className="flex-1 h-9 text-[11px] bg-white border-slate-200"
                         />
                         <Button 
                           type="button" 
                           size="sm" 
                           onClick={handleAddCustomSize}
                           className="h-9 px-3 bg-slate-900 hover:bg-black text-white rounded-xl"
                         >
                           <Plus className="w-4 h-4" />
                         </Button>
                      </div>
                    </div>
                  </div>
                )}

                {(variationType.includes("material")) && (
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-700">Escolha os Materiais</Label>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                      {["Couro", "Sintético", "Lona", "Camurça", "Verniz", "Tecido"].map(mat => (
                        <button
                          key={mat}
                          onClick={() => toggleMaterial(mat)}
                          className={`px-4 py-2 rounded-xl border-2 font-bold text-xs transition-all ${
                            selectedMaterials.includes(mat)
                              ? "border-blue-500 bg-white text-blue-700 shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {mat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100 mb-2">
                  <div className="flex flex-col">
                    <Label className="text-[10px] font-bold text-blue-700 uppercase">Qtd base por item</Label>
                    <p className="text-[9px] text-blue-500">Pares iniciais</p>
                  </div>
                  <Input 
                    type="number" 
                    value={baseQuantity} 
                    onChange={e => setBaseQuantity(e.target.value)}
                    className="w-16 h-8 text-center font-bold bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Button 
                      className="bg-slate-900 hover:bg-black text-white h-12 rounded-xl font-bold gap-2 shadow-lg"
                      disabled={
                        (variationType.includes("color") && selectedColors.length === 0) ||
                        (variationType.includes("size") && selectedSizes.length === 0) ||
                        (variationType.includes("material") && selectedMaterials.length === 0)
                      }
                      onClick={() => generateVariations()}
                  >
                      <Plus className="w-4 h-4" />
                      Gerar Variações do Produto
                  </Button>
                  
                  {variationType === "color_size" && formData.product_category_type === 'calcado' && (
                    <Button 
                        variant="outline"
                        className="h-10 rounded-xl border-dashed border-blue-200 text-blue-600 font-bold text-[10px] gap-2"
                        onClick={() => generateVariations('half')}
                        disabled={selectedColors.length === 0 || selectedSizes.length === 0}
                    >
                        <Plus className="w-3 h-3" />
                        Gerar com Meia Grade (.5)
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

        <div className="space-y-4">
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                formData.variations.length > 0 
                ? "bg-emerald-50/50 border-emerald-100 opacity-100" 
                : "bg-slate-50 border-slate-100 opacity-50 grayscale"
            }`}>
               <div>
                  <Label className={`text-xs font-bold ${formData.variations.length > 0 ? "text-emerald-800" : "text-slate-400"}`}>Estoque Rápido</Label>
                  <p className={`text-[10px] font-medium ${formData.variations.length > 0 ? "text-emerald-600" : "text-slate-400"}`}>Ajusta todas as variações de uma vez</p>
               </div>
               <div className="flex items-center gap-2">
                  <Input 
                    type="number"
                    placeholder="Qtd"
                    value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                    disabled={formData.variations.length === 0}
                    className="w-20 h-9 text-center font-bold bg-white"
                  />
                  <Button 
                    size="sm" 
                    className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    disabled={formData.variations.length === 0 || !bulkStock}
                    onClick={applyBulkStock}
                  >
                    Aplicar
                  </Button>
               </div>
            </div>

           <div className="flex items-center justify-between px-1 pt-2">
              <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                 <Box className="w-4 h-4 text-blue-500" />
                 Grade Gerada ({formData.variations.length})
              </Label>
              <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold text-slate-400 hover:text-red-500" onClick={() => updateFormData({ variations: [] })}>
                 Limpar
              </Button>
           </div>
           
           <Card className="bg-slate-50/50 border-slate-200 border-dashed min-h-[300px] overflow-hidden rounded-2xl shadow-inner">
             <CardContent className="p-0">
                {formData.variations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Palette className="w-10 h-10 mb-2 opacity-10" />
                    <p className="text-sm font-medium opacity-40">Selecione cores e tamanhos</p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto w-full divide-y divide-slate-100">
                    {formData.variations.map((v) => (
                      <div key={v.id} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50/50 transition-all group">
                         <div className="flex items-center gap-3">
                            <div className="relative">
                               <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: v.hex_color }} />
                               {v.size && (
                                 <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[7px] font-bold px-1 py-0.5 rounded-md border border-white">
                                    {v.size}
                                 </div>
                               )}
                            </div>
                             <div className="flex-1 flex items-center justify-between ml-4">
                                <div className="flex flex-col">
                                   <div className="flex items-center gap-2">
                                     <span className="text-[11px] font-bold text-slate-800">{v.color || "Geral"}</span>
                                     <Badge variant="outline" className="h-4 px-1 text-[8px] border-slate-200 text-slate-500 font-bold uppercase">
                                       {v.size || "Único"}
                                     </Badge>
                                   </div>
                                </div>

                                <div className="flex items-center gap-4 mr-2">
                                   {/* Estoque Individual */}
                                   <div className="flex flex-col items-center">
                                      <span className="text-[8px] uppercase text-slate-400 font-bold mb-1">Estoque</span>
                                      <Input 
                                        type="number"
                                        value={v.stock}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          updateFormData({
                                            variations: formData.variations.map(varI => 
                                              varI.id === v.id ? { ...varI, stock: val } : varI
                                            )
                                          });
                                        }}
                                        className="w-16 h-8 text-[11px] text-center font-bold bg-slate-50 border-slate-100 focus:bg-white"
                                      />
                                   </div>

                                   {/* Preço de Varejo */}
                                   <div className="flex flex-col items-center">
                                      <span className="text-[8px] uppercase text-blue-400 font-bold mb-1">Preço Varejo</span>
                                      <div className="relative">
                                        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-blue-500">R$</span>
                                        <Input 
                                          type="number"
                                          placeholder="0.00"
                                          value={((formData.retail_price || 0) + (v.price_adjustment || 0))}
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            const baseRetail = formData.retail_price || 0;
                                            const adjustment = val - baseRetail;
                                            
                                            updateFormData({
                                              variations: formData.variations.map(varI => 
                                                varI.id === v.id ? { ...varI, price_adjustment: adjustment } : varI
                                              )
                                            });
                                          }}
                                          className="w-20 h-8 pl-4 text-[11px] text-center font-bold bg-blue-50/20 border-blue-50 text-blue-700 focus:bg-white placeholder:text-blue-300"
                                        />
                                      </div>
                                   </div>

                                   {/* Preço de Atacado (Sugerido/Calculado Proporcionalmente) */}
                                   <div className="flex flex-col items-center">
                                      <span className="text-[8px] uppercase text-emerald-400 font-bold mb-1">Preço Atacado</span>
                                      <div className="flex flex-col items-center h-8 px-2 bg-emerald-50/20 rounded-md border border-emerald-50 min-w-[80px] justify-center tooltip" title="Calculado proporcionalmente à margem do produto base">
                                        <span className="text-[10px] font-bold text-emerald-700">
                                          R$ {Math.max(0, (formData.retail_price > 0 
                                            ? ((formData.retail_price + (v.price_adjustment || 0)) * ((formData.wholesale_price || formData.retail_price) / formData.retail_price))
                                            : ((formData.wholesale_price || 0) + (v.price_adjustment || 0)))).toFixed(2)}
                                        </span>
                                        <span className="text-[6px] text-emerald-500 font-bold uppercase -mt-1">Proporcional</span>
                                      </div>
                                   </div>
                                </div>
                             </div>
                         </div>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-200 hover:text-red-500 rounded-full" onClick={() => updateFormData({ variations: formData.variations.filter(varI => varI.id !== v.id) })}>
                            <X className="w-3 h-3" />
                         </Button>
                      </div>
                    ))}
                  </div>
                )}
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default VariationsStep;
