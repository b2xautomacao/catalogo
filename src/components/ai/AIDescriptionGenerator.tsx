import React, { useState } from "react";
import { Sparkles, Loader2, Copy, RefreshCw, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";
import { useAIProviders } from "@/hooks/useAIProviders";
import { useStoreData } from "@/hooks/useStoreData";
import PlanUpgradeModal from "@/components/billing/PlanUpgradeModal";

interface AIDescriptionGeneratorProps {
  productName: string;
  category: string;
  onDescriptionGenerated: (description: string, seo: string) => void;
}

const AIDescriptionGenerator = ({
  productName,
  category,
  onDescriptionGenerated,
}: AIDescriptionGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [generatedSEO, setGeneratedSEO] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { toast } = useToast();
  const { checkAIUsage } = usePlanPermissions();

  // Hook para provedores de IA
  const { store } = useStoreData();
  const { generateAIContent, settings } = useAIProviders(store?.id || "");

  const generateContent = async () => {
    if (!productName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do produto é obrigatório para gerar descrição",
        variant: "destructive",
      });
      return;
    }

    // Verificar acesso à funcionalidade de IA
    const aiAccess = checkAIUsage();
    if (!aiAccess.hasAccess) {
      setShowUpgradeModal(true);
      return;
    }

    // Verificar se há configurações de IA
    if (!settings || !settings.default_provider) {
      toast({
        title: "Configuração necessária",
        description: "Configure um provedor de IA nas configurações da loja",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Prompt para geração de descrição
      const descriptionPrompt = `Crie uma descrição atrativa e persuasiva para o produto "${productName}" da categoria "${category}".

${keywords && `Palavras-chave importantes: ${keywords}`}
${targetAudience && `Público-alvo: ${targetAudience}`}

A descrição deve:
- Ser envolvente e persuasiva
- Destacar benefícios e características
- Incluir as palavras-chave naturalmente
- Ter entre 150-300 palavras
- Ser adequada para e-commerce
- Usar linguagem acessível mas profissional

Formato: Texto corrido com parágrafos bem estruturados.`;

      // Prompt para SEO
      const seoPrompt = `Crie um título SEO otimizado e meta description para o produto "${productName}" da categoria "${category}".

${keywords && `Palavras-chave: ${keywords}`}

Requisitos:
- Título: máximo 60 caracteres, incluir nome do produto e categoria
- Meta Description: máximo 160 caracteres, persuasivo e com call-to-action
- Incluir palavras-chave naturalmente
- Otimizado para busca orgânica

Formato:
Título: [título aqui]
Meta Description: [meta description aqui]`;

      // Gerar descrição
      const descriptionResponse = await generateAIContent({
        provider: settings.default_provider,
        prompt: descriptionPrompt,
        max_tokens: 500,
        temperature: 0.7,
        system_message:
          "Você é um especialista em marketing digital e copywriting para e-commerce. Crie descrições persuasivas e envolventes.",
      });

      // Gerar SEO
      const seoResponse = await generateAIContent({
        provider: settings.default_provider,
        prompt: seoPrompt,
        max_tokens: 300,
        temperature: 0.5,
        system_message:
          "Você é um especialista em SEO e otimização para motores de busca. Crie títulos e meta descriptions otimizados.",
      });

      if (descriptionResponse.success && seoResponse.success) {
        setGeneratedDescription(descriptionResponse.content || "");
        setGeneratedSEO(seoResponse.content || "");

        toast({
          title: "Conteúdo gerado com sucesso!",
          description: `Descrição e SEO foram criados usando ${settings.default_provider.toUpperCase()}`,
        });
      } else {
        throw new Error(
          descriptionResponse.error ||
            seoResponse.error ||
            "Erro na geração de conteúdo"
        );
      }
    } catch (error: any) {
      console.error("Erro ao gerar conteúdo com IA:", error);
      toast({
        title: "Erro ao gerar conteúdo",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${type} copiado para a área de transferência`,
    });
  };

  const applyGenerated = () => {
    onDescriptionGenerated(generatedDescription, generatedSEO);
    toast({
      title: "Conteúdo aplicado!",
      description: "Descrição e SEO foram aplicados ao produto",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Gerador de Descrição com IA</h3>
        {settings?.default_provider && (
          <div className="flex items-center gap-2 ml-auto">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Usando: {settings.default_provider.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="keywords">Palavras-chave importantes</Label>
          <Input
            id="keywords"
            placeholder="Ex: qualidade, durabilidade, design"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="targetAudience">Público-alvo</Label>
          <Input
            id="targetAudience"
            placeholder="Ex: profissionais, estudantes, famílias"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
          />
        </div>
      </div>

      <Button
        onClick={generateContent}
        disabled={isGenerating || !productName.trim()}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando com {settings?.default_provider?.toUpperCase() || "IA"}...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Gerar Descrição e SEO
          </>
        )}
      </Button>

      {generatedDescription && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Descrição Gerada</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(generatedDescription, "Descrição")
                  }
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copiar
                </Button>
                <Button size="sm" variant="outline" onClick={generateContent}>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Regenerar
                </Button>
              </div>
            </div>
            <Textarea
              value={generatedDescription}
              onChange={(e) => setGeneratedDescription(e.target.value)}
              rows={8}
              className="input-modern"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>SEO Gerado</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(generatedSEO, "SEO")}
              >
                <Copy className="mr-1 h-3 w-3" />
                Copiar
              </Button>
            </div>
            <Textarea
              value={generatedSEO}
              onChange={(e) => setGeneratedSEO(e.target.value)}
              rows={4}
              className="input-modern"
            />
          </div>

          <Button onClick={applyGenerated} className="btn-primary w-full">
            Aplicar ao Produto
          </Button>
        </div>
      )}

      <PlanUpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
      />
    </div>
  );
};

export default AIDescriptionGenerator;
