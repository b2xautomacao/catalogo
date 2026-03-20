import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Palette, Plus, X, Check, Box, User, Layers } from "lucide-react";
import { useStoreColors } from "@/hooks/useStoreColors";
import { resolveColorHex, isLightColor } from "@/lib/colors";
import { Card, CardContent } from "@/components/ui/card";
import { PremiumWizardFormData } from "@/hooks/usePremiumProductWizard";
import { ProductVariation } from "@/types/product";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VariationsStepProps {
  formData: PremiumWizardFormData;
  updateFormData: (updates: Partial<PremiumWizardFormData>) => void;
  productId?: string;
}

const VariationsStep: React.FC<VariationsStepProps> = ({ formData, updateFormData, productId }) => {
  const { colors: storeColors } = useStoreColors(formData.store_id);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [bulkStock, setBulkStock] = useState("");

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

  const generateVariations = (mode: 'standard' | 'half' | 'merged' = 'standard') => {
    const newVariations: ProductVariation[] = [];
    
    selectedColors.forEach(colorName => {
      const storeColor = storeColors.find(c => c.name === colorName);
      const hex = storeColor?.hex_color || resolveColorHex(colorName);

      let finalSizes = [...selectedSizes];
      
      if (mode === 'half' && formData.product_category_type === 'calcado') {
        // Exemplo de meia grade: adiciona .5 para cada tamanho selecionado
        const extra = selectedSizes.map(s => `${s}.5`);
        finalSizes = [...new Set([...finalSizes, ...extra])].sort();
      }

      if (finalSizes.length > 0) {
        finalSizes.forEach(size => {
          newVariations.push({
            id: `new-${colorName}-${size}-${Date.now()}-${Math.random()}`,
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

  const applyBulkStock = () => {
    const val = parseInt(bulkStock) || 0;
    updateFormData({
      variations: formData.variations.map(v => ({ ...v, stock: val }))
    });
    setBulkStock("");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Gênero e Material (Agora no Step 1) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                   <User className="w-3 h-3" /> Gênero
                </Label>
                <Select value={formData.product_gender} onValueChange={(v) => updateFormData({ product_gender: v as any })}>
                  <SelectTrigger className="h-9 bg-white text-xs">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="unissex">Unissex</SelectItem>
                    <SelectItem value="infantil">Infantil</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                   <Layers className="w-3 h-3" /> Material
                </Label>
                <Input 
                   value={formData.material} 
                   onChange={(e) => updateFormData({ material: e.target.value })}
                   placeholder="Ex: Couro"
                   className="h-9 bg-white text-xs"
                />
             </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold flex items-center gap-2 text-slate-800">
               <Palette className="w-4 h-4 text-rose-500" />
               1. Cores da Grade
            </Label>
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
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold text-slate-800">2. Tamanhos</Label>
            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
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

          <div className="grid grid-cols-2 gap-3">
            <Button 
                variant="outline"
                className="h-12 rounded-xl border-dashed border-slate-300 text-slate-600 font-bold text-xs gap-2"
                onClick={() => generateVariations('standard')}
                disabled={selectedColors.length === 0}
            >
                Grade Padrão
            </Button>
            {formData.product_category_type === 'calcado' && (
                <Button 
                    variant="outline"
                    className="h-12 rounded-xl border-dashed border-blue-200 text-blue-600 bg-blue-50/30 font-bold text-xs gap-2"
                    onClick={() => generateVariations('half')}
                    disabled={selectedColors.length === 0 || selectedSizes.length === 0}
                >
                    Meia Grade (.5)
                </Button>
            )}
            <Button 
                className="col-span-2 bg-slate-900 hover:bg-black text-white h-12 rounded-xl font-bold gap-2"
                disabled={selectedColors.length === 0}
                onClick={() => generateVariations('merged')}
            >
                Mesclar e Gerar Variações
                <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                formData.variations.length > 0 
                ? "bg-emerald-50/50 border-emerald-100 opacity-100" 
                : "bg-slate-50 border-slate-100 opacity-50 grayscale"
            }`}>
               <div>
                  <Label className={`text-xs font-bold ${formData.variations.length > 0 ? "text-emerald-800" : "text-slate-400"}`}>Estoque em Massa</Label>
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
                            <div className="flex flex-col">
                               <span className="text-[11px] font-bold text-slate-800">{v.color}</span>
                               <span className="text-[9px] text-slate-500 font-bold uppercase">Estoque: {v.stock}</span>
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
