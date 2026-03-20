import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Palette, Plus, X, Check, Save } from "lucide-react";
import { useStoreColors } from "@/hooks/useStoreColors";
import { resolveColorHex } from "@/lib/colors";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PremiumWizardFormData } from "@/hooks/usePremiumProductWizard";
import { ProductVariation } from "@/types/product";

interface VariationsStepProps {
  formData: PremiumWizardFormData;
  updateFormData: (updates: Partial<PremiumWizardFormData>) => void;
  productId?: string;
}

const VariationsStep: React.FC<VariationsStepProps> = ({ formData, updateFormData, productId }) => {
  const { colors: storeColors, loading: loadingColors } = useStoreColors(formData.store_id);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>(["P", "M", "G", "GG"]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

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

  const removeVariation = (id: string) => {
    updateFormData({ 
      variations: formData.variations.filter(v => v.id !== id) 
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lado Esquerdo: Seleção de Cores e Tamanhos */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold flex items-center gap-2">
               <Palette className="w-4 h-4 text-rose-500" />
               1. Escolha as Cores da Loja
            </Label>
            <div className="flex flex-wrap gap-2">
              {storeColors.map(color => (
                <button
                  key={color.id}
                  onClick={() => toggleColor(color.name)}
                  className={`group relative p-1 rounded-full border-2 transition-all ${
                    selectedColors.includes(color.name) 
                      ? "border-blue-500 scale-110 shadow-md" 
                      : "border-transparent hover:border-slate-200"
                  }`}
                  title={color.name}
                >
                  <div 
                    className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: color.hex_color }}
                  >
                    {selectedColors.includes(color.name) && (
                      <Check className="w-5 h-5 text-white drop-shadow-md" style={{ color: color.hex_color === '#FFFFFF' ? '#000' : '#FFF' }} />
                    )}
                  </div>
                </button>
              ))}
              <Button variant="outline" size="icon" className="w-12 h-12 rounded-full border-dashed">
                 <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 uppercase font-bold px-1">
              {selectedColors.length} cores selecionadas
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold">2. Escolha os Tamanhos</Label>
            <div className="flex flex-wrap gap-2">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`w-12 h-12 rounded-lg border-2 font-bold text-xs transition-all ${
                    selectedSizes.includes(size)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <Button 
            className="w-full bg-slate-900 hover:bg-black h-12 rounded-xl"
            disabled={selectedColors.length === 0}
            onClick={generateVariations}
          >
            Combinar e Adicionar Grade
          </Button>
        </div>

        {/* Lado Direito: Preview da Grade */}
        <div className="space-y-4">
           <Label className="text-sm font-bold">Grade Gerada ({formData.variations.length})</Label>
           <Card className="bg-slate-50/50 border-dashed min-h-[300px] overflow-hidden">
             <CardContent className="p-0">
                {formData.variations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Palette className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm italic">Selecione cores e tamanhos para gerar a grade</p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto w-full">
                    {formData.variations.map((v, i) => (
                      <div 
                        key={v.id} 
                        className={`flex items-center justify-between p-3 border-b border-slate-100 bg-white hover:bg-blue-50/30 transition-colors ${
                          i === formData.variations.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                         <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: v.hex_color }} />
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-slate-700">{v.color} {v.size ? `- ${v.size}` : ''}</span>
                               <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Estoque individual: 0</span>
                            </div>
                         </div>
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-8 w-8 text-slate-300 hover:text-red-500"
                           onClick={() => removeVariation(v.id || "")}
                         >
                            <X className="w-4 h-4" />
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
