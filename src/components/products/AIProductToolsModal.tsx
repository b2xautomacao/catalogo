
import React, { useState } from "react";
import { Loader2, Brain, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AdvancedFeatureGate } from "@/components/billing/AdvancedFeatureGate";

interface AIProductToolsModalProps {
  product: any;
  open: boolean;
  onClose: () => void;
  onContentGenerated?: (data: any) => void;
}

const IA_OPTIONS = [
  { key: "headline", label: "Gerar Headline Otimizada" },
  { key: "hashtag", label: "Gerar Hashtags Estratégicas" },
  { key: "description", label: "Gerar Descrição" },
  { key: "ad", label: "Texto para Anúncio" },
  { key: "social", label: "Post para Redes Sociais" },
];

const AIProductToolsModal: React.FC<AIProductToolsModalProps> = ({
  product, open, onClose, onContentGenerated
}) => {
  const { toast } = useToast();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [results, setResults] = useState<{ [key: string]: string }>({});

  const handleGenerate = async (optionKey: string) => {
    setLoadingKey(optionKey);
    let fnName = "";
    let body: Record<string, any> = {
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description,
    };

    if (optionKey === "headline") fnName = "ai-headline-generator";
    else if (optionKey === "hashtag") fnName = "ai-hashtag-generator";
    else if (optionKey === "description") fnName = "ai-product-description";
    else if (optionKey === "ad") fnName = "ai-ad-copy-generator";
    else if (optionKey === "social") fnName = "ai-social-media-generator";

    try {
      // @ts-ignore
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke(fnName, { body });
      if (error) throw new Error(error.message || "Erro na IA");
      setResults((prev) => ({ ...prev, [optionKey]: data?.content || data?.description || "" }));
      toast({ title: "Conteúdo gerado", description: "Conteúdo de IA gerado!", variant: "default" });
      if (onContentGenerated) onContentGenerated(data);
    } catch (error: any) {
      toast({ title: "Erro IA", description: error.message, variant: "destructive" });
    }
    setLoadingKey(null);
  };

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white max-w-md w-full rounded-xl p-6 shadow-xl relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose} aria-label="Fechar">×</button>
        <div className="flex flex-col items-center mb-4">
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-2 text-blue-700">
            <Brain className="w-7 h-7" />
          </span>
          <h2 className="text-xl font-bold mb-0.5">Ferramentas de IA</h2>
          <p className="text-gray-600 text-sm text-center">
            Conteúdo automático para <span className="font-semibold">{product.name}</span>
          </p>
        </div>
        
        <AdvancedFeatureGate 
          feature="ai_agent" 
          blockInteraction={false}
          showUpgradeModal={true}
          fallback={
            <div className="text-center py-8">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Funcionalidade Premium</h3>
              <p className="text-gray-600 text-sm mb-4">
                As ferramentas de IA estão disponíveis apenas nos planos Premium e Enterprise.
              </p>
              <Button className="w-full">
                Fazer Upgrade do Plano
              </Button>
            </div>
          }
        >
          <div className="flex flex-col items-center space-y-2">
            {IA_OPTIONS.map((opt) => (
              <Button
                key={opt.key}
                size="sm"
                className="w-full shadow-sm flex justify-center"
                onClick={() => handleGenerate(opt.key)}
                disabled={!!loadingKey}
              >
                {loadingKey === opt.key ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : <Brain className="h-4 w-4 mr-1" />}
                {opt.label}
              </Button>
            ))}
          </div>
        </AdvancedFeatureGate>
        
        <div className="mt-6 space-y-2">
          {Object.entries(results).map(([k, v]) => (
            <div key={k}>
              <div className="text-xs font-bold text-neutral-600 mb-1">{IA_OPTIONS.find(opt=>opt.key===k)?.label}:</div>
              <div className="bg-neutral-100 rounded-sm px-3 py-2 text-xs break-words">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIProductToolsModal;
