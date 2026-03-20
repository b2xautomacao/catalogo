import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PremiumWizardFormData } from "@/hooks/usePremiumProductWizard";
import { useCategories } from "@/hooks/useCategories";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Tag, FileText, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
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
      toast({ title: "Ei!", description: "Diga o nome do produto para a IA se inspirar.", variant: "destructive" });
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lado Esquerdo: Nome e Categoria */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              Nome do Produto *
            </Label>
            <Input
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              placeholder="Ex: Camiseta Cotton Premium"
              className="h-11 bg-white/50 backdrop-blur-sm focus:bg-white transition-all border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-500" />
              Categoria *
            </Label>
            <Select
              value={formData.category}
              onValueChange={(v) => updateFormData({ category: v })}
            >
              <SelectTrigger className="h-11 bg-white/50 backdrop-blur-sm border-slate-200">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
             <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500">Gênero</Label>
                <Select
                  value={formData.product_gender || ""}
                  onValueChange={(v) => updateFormData({ product_gender: v as any })}
                >
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Opcional" />
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
                <Label className="text-xs font-medium text-slate-500">Material</Label>
                <Input
                  value={formData.material}
                  onChange={(e) => updateFormData({ material: e.target.value })}
                  placeholder="Ex: Algodão"
                  className="h-10 text-xs"
                />
             </div>
          </div>
        </div>

        {/* Lado Direito: Descrição */}
        <div className="space-y-4 flex flex-col h-full">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-bold flex items-center gap-2 text-slate-800">
              <FileText className="w-4 h-4 text-emerald-500" />
              Descrição Completa
            </Label>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
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
            placeholder="Conte os detalhes do seu produto, benefícios e diferenciais..."
            className="flex-1 min-h-[180px] bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 resize-none p-4 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="p-4 rounded-xl border border-slate-100 bg-white/50 space-y-4">
            <Label className="text-xs font-bold text-slate-500 uppercase">Detalhes Técnicos</Label>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-800">Gênero</Label>
                  <Select
                    value={formData.product_gender || ""}
                    onValueChange={(v) => updateFormData({ product_gender: v as any })}
                  >
                    <SelectTrigger className="h-10 text-slate-600 bg-white">
                      <SelectValue placeholder="Opcional" />
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
                  <Label className="text-xs font-bold text-slate-800">Material Principal</Label>
                  <Input
                    value={formData.material}
                    onChange={(e) => updateFormData({ material: e.target.value })}
                    placeholder="Ex: Algodão"
                    className="h-10 text-slate-600 bg-white"
                  />
               </div>
            </div>
         </div>

         <div className="p-4 rounded-xl border border-slate-100 bg-white/50 space-y-4">
            <Label className="text-xs font-bold text-slate-500 uppercase">Vídeo Demonstrativo</Label>
            <div className="space-y-2">
               <Label className="text-xs font-bold text-slate-800">Link do YouTube (Opcional)</Label>
               <Input
                 value={formData.video_url}
                 onChange={(e) => updateFormData({ video_url: e.target.value })}
                 placeholder="https://youtube.com/watch?v=..."
                 className="h-10 text-slate-600 bg-white"
               />
            </div>
         </div>
      </div>
      <div className="pt-4 border-t border-slate-100">
        <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
          Tipo de Produto (Define a Tabela de Medidas)
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: 'calcado', label: 'Calçado', icon: '👟' },
            { id: 'roupa_superior', label: 'Roupa Superior', icon: '👕' },
            { id: 'roupa_inferior', label: 'Roupa Inferior', icon: '👖' },
            { id: 'acessorio', label: 'Acessório', icon: '🎒' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => updateFormData({ product_category_type: type.id as any })}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all hover:shadow-md ${
                formData.product_category_type === type.id 
                  ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20" 
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="text-2xl">{type.icon}</span>
              <span className="text-xs font-semibold text-slate-700">{type.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;
