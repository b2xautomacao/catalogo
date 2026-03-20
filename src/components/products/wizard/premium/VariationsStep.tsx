import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Palette, Plus, X, Check } from "lucide-react";
import { useStoreColors } from "@/hooks/useStoreColors";
import { resolveColorHex, isLightColor } from "@/lib/colors";
import { Card, CardContent } from "@/components/ui/card";
import { PremiumWizardFormData } from "@/hooks/usePremiumProductWizard";
import { ProductVariation } from "@/types/product";

interface VariationsStepProps {
  formData: PremiumWizardFormData;
  updateFormData: (updates: Partial<PremiumWizardFormData>) => void;
  productId?: string;
}

const VariationsStep: React.FC<VariationsStepProps> = ({ formData, updateFormData, productId }) => {
  const { colors: storeColors } = useStoreColors(formData.store_id);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  // Grades de tamanho dinâmicas
  const sizeGrades = {
    calcado: ["33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"],
    roupa: ["PP", "P", "M", "G", "GG", "G1", "G2", "G3"],
    infantil: ["RN", "1", "2", "4", "6", "8", "10", "12"],
    acessorio: ["Tamanho Único", "P", "M", "G"],
  };

  const getSizes = () => {
    if (formData.product_category_type === "calcado") return sizeGrades.calcado;
    if (formData.product_gender === "infantil") return sizeGrades.infantil;
    if (formData.product_category_type === "acessorio") return sizeGrades.acessorio;
    return sizeGrades.roupa;
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

  const generateVariations = () => {
    const newVariations: ProductVariation[] = [];
    
    selectedColors.forEach(colorName => {
      const storeColor = storeColors.find(c => c.name === colorName);
      const hex = storeColor?.hex_color || resolveColorHex(colorName);

      if (selectedSizes.length > 0) {
        selectedSizes.forEach(size => {
          newVariations.push({
            id: `new-${colorName}-${size}-${Date.now()}`,
            product_id: productId || "",
            color: colorName,
            size: size,
            hex_color: hex,
            stock: 0,
            price_adjustment: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      } else {
        newVariations.push({
          id: `new-${colorName}-${Date.now()}`,
          product_id: productId || "",
          color: colorName,
          hex_color: hex,
          stock: 0,
          price_adjustment: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    });

    updateFormData({ variations: [...formData.variations, ...newVariations] });
    setSelectedColors([]);
    setSelectedSizes([]);
  };

  const updateVariationStock = (id: string, newStock: number) => {
    updateFormData({
      variations: formData.variations.map(v => v.id === id ? { ...v, stock: newStock } : v)
    });
  };

  const removeVariation = (id: string) => {
    updateFormData({ 
      variations: formData.variations.filter(v => v.id !== id) 
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold flex items-center gap-2 text-slate-800">
               <Palette className="w-4 h-4 text-rose-500" />
               1. Cores Disponíveis
            </Label>
            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
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
                    className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: color.hex_color }}
                  >
                    {selectedColors.includes(color.name) && (
                      <Check className="w-5 h-5 drop-shadow-md" style={{ color: isLightColor(color.hex_color) ? '#000' : '#FFF' }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 uppercase font-bold px-1 tracking-widest">
              {selectedColors.length} cores selecionadas
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-sm font-bold text-slate-800">2. Grades de Tamanho</Label>
            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`w-12 h-12 rounded-xl border-2 font-bold text-xs transition-all ${
                    selectedSizes.includes(size)
                      ? "border-blue-500 bg-white text-blue-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-2xl shadow-lg shadow-blue-500/20 font-bold text-base gap-2"
            disabled={selectedColors.length === 0}
            onClick={generateVariations}
          >
            Gerar Grade de Variações
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
           <div className="flex items-center justify-between px-1">
              <Label className="text-sm font-bold text-slate-800">Grade Gerada ({formData.variations.length})</Label>
              <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold text-slate-400 hover:text-red-500" onClick={() => updateFormData({ variations: [] })}>
                 Limpar Tudo
              </Button>
           </div>
           
           <Card className="bg-slate-50/50 border-slate-200 border-dashed min-h-[350px] overflow-hidden rounded-2xl shadow-inner">
             <CardContent className="p-0">
                {formData.variations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Palette className="w-10 h-10 mb-2 opacity-10" />
                    <p className="text-sm font-medium opacity-40">Combine cores e tamanhos ao lado</p>
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto w-full divide-y divide-slate-100">
                    {formData.variations.map((v) => (
                      <div 
                        key={v.id} 
                        className="flex items-center justify-between p-4 bg-white hover:bg-white transition-all group"
                      >
                         <div className="flex items-center gap-4">
                            <div className="relative">
                               <div className="w-10 h-10 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: v.hex_color }} />
                               {v.size && (
                                 <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-white">
                                    {v.size}
                                 </div>
                               )}
                            </div>
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-slate-800">{v.color}</span>
                               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Estoque</span>
                            </div>
                         </div>

                         <div className="flex items-center gap-4">
                            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                               <button 
                                 className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"
                                 onClick={() => updateVariationStock(v.id || "", Math.max(0, (v.stock || 0) - 1))}
                               > - </button>
                               <input 
                                 type="number"
                                 value={v.stock || 0}
                                 onChange={(e) => updateVariationStock(v.id || "", parseInt(e.target.value) || 0)}
                                 className="w-12 bg-transparent text-center text-xs font-bold text-slate-700 border-none focus-visible:ring-0 p-0"
                               />
                               <button 
                                 className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"
                                 onClick={() => updateVariationStock(v.id || "", (v.stock || 0) + 1)}
                               > + </button>
                            </div>

                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-full"
                              onClick={() => removeVariation(v.id || "")}
                            >
                               <X className="w-4 h-4" />
                            </Button>
                         </div>
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
