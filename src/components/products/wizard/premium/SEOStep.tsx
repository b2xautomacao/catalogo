import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PremiumWizardFormData } from "@/hooks/usePremiumProductWizard";
import { Globe, Key, Sparkles, Loader2, Link2, AlertCircle } from "lucide-react";
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
      
      // Padronizando conforme AIContentGenerator.tsx (múltiplas chamadas)
      const commonBody = {
        productName: formData.name,
        category: formData.category || "produto",
        storeId: "global"
      };

      toast({ title: "IA em ação", description: "Otimizando título, descrição e keywords..." });

      // 1. Título
      const { data: titleData } = await supabase.functions.invoke("ai-content-generator", {
        body: { ...commonBody, contentType: "title" }
      });

      // 2. Keywords
      const { data: keyData } = await supabase.functions.invoke("ai-content-generator", {
        body: { ...commonBody, contentType: "keywords" }
      });

      // 3. Descrição SEO
      const { data: descData } = await supabase.functions.invoke("ai-content-generator", {
        body: { ...commonBody, contentType: "description" }
      });

      updateFormData({
        meta_title: titleData?.content || formData.name,
        meta_description: descData?.content?.substring(0, 160) || formData.description?.substring(0, 160),
        keywords: Array.isArray(keyData?.content) ? keyData.content.join(", ") : (keyData?.content || ""),
        seo_slug: formData.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
      });

      toast({ title: "Pronto!", description: "SEO otimizado com sucesso pela IA." });

    } catch (e) {
      console.error(e);
      toast({ title: "Falha na IA", description: "Não conseguimos gerar todo o SEO agora.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
               <Globe className="w-5 h-5" />
            </div>
            <div>
               <h3 className="text-lg font-bold text-slate-900">SEO de Alta Performance</h3>
               <p className="text-xs text-slate-500">Apareça no topo das buscas do Google</p>
            </div>
         </div>
         <Button 
            variant="outline" 
            size="sm" 
            className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-2 font-bold shadow-sm"
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
             Slug Amigável (Link)
          </Label>
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 group focus-within:border-blue-300 transition-all">
             <span className="text-[10px] text-slate-400 font-bold uppercase">/p/</span>
             <Input
                value={formData.seo_slug}
                onChange={(e) => updateFormData({ seo_slug: e.target.value.toLowerCase().replace(/ /g, "-") })}
                placeholder="nome-do-produto"
                className="h-7 border-none bg-transparent shadow-none p-0 focus-visible:ring-0 text-blue-600 font-bold text-sm"
              />
          </div>
        </div>

        {/* Preview do Google */}
        <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm space-y-2">
           <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-3 h-3" /> Preview de Busca
           </Label>
           <div className="space-y-1">
              <h4 className="text-lg text-[#1a0dab] hover:underline cursor-pointer font-medium truncate">
                  {formData.meta_title || formData.name || "Título do Produto"}
              </h4>
              <p className="text-sm text-[#006621] truncate">https://meucatalogo.com/p/{formData.seo_slug || "..."}</p>
              <p className="text-sm text-[#545454] line-clamp-2 leading-relaxed">
                  {formData.meta_description || "Uma descrição matadora ajudará seu produto a ser encontrado mais facilmente pelos seus clientes."}
              </p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-800">SEO Title</Label>
              <Input
                value={formData.meta_title}
                onChange={(e) => updateFormData({ meta_title: e.target.value })}
                placeholder="Título otimizado"
                className="h-11 bg-white"
              />
           </div>
           
           <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                 <Key className="w-4 h-4 text-slate-400" />
                 Keywords
              </Label>
              <Input
                value={formData.keywords}
                onChange={(e) => updateFormData({ keywords: e.target.value })}
                placeholder="Ex: verao, moda, premium"
                className="h-11 bg-white"
              />
           </div>
        </div>

        <div className="space-y-2">
           <Label className="text-sm font-bold text-slate-800">Meta Description</Label>
           <Textarea
             value={formData.meta_description}
             onChange={(e) => updateFormData({ meta_description: e.target.value })}
             placeholder="Descrição curta e chamativa..."
             className="min-h-[100px] bg-white text-slate-700 resize-none p-4 rounded-xl"
             maxLength={160}
           />
           <div className="flex justify-between items-center px-1">
              <p className="text-[10px] text-slate-400 font-medium italic">Máx 160 caracteres para não truncar no Google.</p>
              <span className={`text-[10px] font-bold ${formData.meta_description?.length > 160 ? "text-red-500" : "text-blue-500"}`}>
                 {formData.meta_description?.length || 0}/160
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SEOStep;
