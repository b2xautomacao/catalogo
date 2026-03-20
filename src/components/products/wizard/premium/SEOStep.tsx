import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PremiumWizardFormData } from "@/hooks/usePremiumProductWizard";
import { Search, Globe, Key, Sparkles, Loader2, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SEOStepProps {
  formData: PremiumWizardFormData;
  updateFormData: (updates: Partial<PremiumWizardFormData>) => void;
}

const SEOStep: React.FC<SEOStepProps> = ({ formData, updateFormData }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateSEO = async () => {
    if (!formData.name) {
      toast({ title: "Ops!", description: "Nome do produto é essencial para o SEO.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("ai-content-generator", {
        body: { 
            productName: formData.name, 
            description: formData.description,
            category: formData.category, 
            contentType: "seo",
            storeId: "global"
        },
      });
      if (error) throw error;
      if (data?.content) {
          const seo = data.content;
          updateFormData({
              meta_title: seo.title || formData.name,
              meta_description: seo.description || formData.description?.substring(0, 160),
              keywords: seo.keywords?.join(", ") || "",
          });
          toast({ title: "SEO Otimizado!", description: "Tags geradas com sucesso." });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Erro na IA", description: "Não consegui gerar o SEO agora.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
               <Globe className="w-5 h-5" />
            </div>
            <div>
               <h3 className="text-lg font-bold text-slate-900">Otimização para Buscadores (SEO)</h3>
               <p className="text-xs text-slate-500">Como seu produto aparece no Google e redes sociais</p>
            </div>
         </div>
         <Button 
            variant="outline" 
            size="sm" 
            className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-2 font-bold"
            onClick={handleGenerateSEO}
            disabled={isGenerating}
         >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Otimizar via IA
         </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Link Amistoso */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
             <Link2 className="w-4 h-4 text-slate-400" />
             Slug da URL (Link)
          </Label>
          <div className="flex items-center gap-2 bg-slate-100/50 p-3 rounded-lg border border-slate-200">
             <span className="text-xs text-slate-400">meucatalogo.com/p/</span>
             <Input
                value={formData.seo_slug}
                onChange={(e) => updateFormData({ seo_slug: e.target.value.toLowerCase().replace(/ /g, "-") })}
                placeholder="nome-do-produto-aqui"
                className="h-8 border-none bg-transparent shadow-none p-0 focus-visible:ring-0 text-blue-600 font-medium"
              />
          </div>
        </div>

        {/* Preview do Google */}
        <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm space-y-2">
           <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preview no Google</Label>
           <div className="space-y-1">
              <h4 className="text-lg text-[#1a0dab] hover:underline cursor-pointer font-medium truncate">
                  {formData.meta_title || formData.name || "Título do Produto"}
              </h4>
              <p className="text-sm text-[#006621] truncate">meucatalogo.com/p/{formData.seo_slug || "..."}</p>
              <p className="text-sm text-[#545454] line-clamp-2">
                  {formData.meta_description || "Sua descrição aparecerá aqui. Certifique-se de incluir palavras-chave importantes."}
              </p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-800">Meta Título</Label>
              <Input
                value={formData.meta_title}
                onChange={(e) => updateFormData({ meta_title: e.target.value })}
                placeholder="Título para o Google"
                className="h-11 bg-white"
              />
              <p className="text-[10px] text-slate-400">Recomendado: até 60 caracteres</p>
           </div>
           
           <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                 <Key className="w-4 h-4 text-slate-400" />
                 Palavras-chave
              </Label>
              <Input
                value={formData.keywords}
                onChange={(e) => updateFormData({ keywords: e.target.value })}
                placeholder="camisa, cotton, moda, verao"
                className="h-11 bg-white"
              />
              <p className="text-[10px] text-slate-400">Separe por vírgulas</p>
           </div>
        </div>

        <div className="space-y-2">
           <Label className="text-sm font-bold text-slate-800">Meta Descrição</Label>
           <Textarea
             value={formData.meta_description}
             onChange={(e) => updateFormData({ meta_description: e.target.value })}
             placeholder="Descrição curta para os resultados de busca..."
             className="min-h-[100px] bg-white text-slate-700 resize-none p-4"
             maxLength={160}
           />
           <div className="flex justify-between items-center">
              <p className="text-[10px] text-slate-400">Recomendado: 150 a 160 caracteres</p>
              <span className={`text-[10px] font-bold ${formData.meta_description?.length > 160 ? "text-red-500" : "text-emerald-500"}`}>
                 {formData.meta_description?.length || 0}/160
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SEOStep;
