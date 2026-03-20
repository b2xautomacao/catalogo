import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PremiumWizardFormData } from "@/hooks/usePremiumProductWizard";
import { useCategories } from "@/hooks/useCategories";
import { FileText, Sparkles, Loader2, Ruler, ShieldCheck, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BasicInfoStepProps {
  formData: PremiumWizardFormData;
  updateFormData: (updates: Partial<PremiumWizardFormData>) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ formData, updateFormData }) => {
  const { categories } = useCategories();
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      toast({ title: "Ei!", description: "Dê um nome ao produto primeiro.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("ai-content-generator", {
        body: { 
           productName: formData.name, 
           category: formData.category, 
           contentType: "description",
           storeId: "global"
        },
      });
      if (error) throw error;
      if (data?.content) updateFormData({ description: data.content });
    } catch (e) {
      console.error(e);
      toast({ title: "Erro na IA", description: "Não consegui gerar agora.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Coluna 1: Dados Principais */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-800">Nome do Produto *</Label>
            <Input
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              placeholder="Ex: Camiseta Cotton Premium"
              className="h-11 bg-white border-slate-200 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-800">Categoria *</Label>
                <Select value={formData.category} onValueChange={(v) => updateFormData({ category: v })}>
                  <SelectTrigger className="h-11 bg-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-800">Tipo de Produto</Label>
                <Select value={formData.product_category_type} onValueChange={(v) => updateFormData({ product_category_type: v as any })}>
                  <SelectTrigger className="h-11 bg-white">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calcado">Calçado</SelectItem>
                    <SelectItem value="roupa_superior">Roupa Superior</SelectItem>
                    <SelectItem value="roupa_inferior">Roupa Inferior</SelectItem>
                    <SelectItem value="acessorio">Acessório</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                   <FileText className="w-4 h-4 text-emerald-500" />
                   Descrição
                </Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[9px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 uppercase gap-1"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Gerar com IA
                </Button>
             </div>
             <Textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Detalhes, benefícios e diferenciais..."
                className="min-h-[140px] bg-white text-slate-700 resize-none p-4"
             />
          </div>
        </div>

        {/* Coluna 2: Medidas e Cuidados */}
        <div className="space-y-6">
           <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                 <Ruler className="w-4 h-4 text-blue-500" />
                 Tabela de Medidas (Opcional)
              </Label>
              <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100 flex flex-col gap-3">
                 <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Tamanhos e Dimensões (cm)</p>
                 <Textarea 
                    value={formData.measurements}
                    onChange={(e) => updateFormData({ measurements: e.target.value })}
                    placeholder="Ex: P: Altura 70, Largura 50 | M: Altura 72, Largura 52..."
                    className="min-h-[100px] bg-white border-blue-100 text-xs text-slate-600"
                 />
                 <div className="flex items-center gap-2 text-[9px] text-blue-400 font-medium italic">
                    <Info className="w-3 h-3" />
                    Esta tabela será exibida para o cliente na seleção de tamanho.
                 </div>
              </div>
           </div>

           <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-purple-500" />
                 Instruções de Cuidado
              </Label>
              <Textarea 
                 value={formData.care_instructions}
                 onChange={(e) => updateFormData({ care_instructions: e.target.value })}
                 placeholder="Ex: Lavar à mão, não usar secadora, passar em temperatura baixa..."
                 className="min-h-[100px] bg-white border-slate-200 text-xs text-slate-600"
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;
