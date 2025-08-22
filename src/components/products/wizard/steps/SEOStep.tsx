import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Hash, FileText, Loader2 } from "lucide-react";
import { WizardFormData } from "@/hooks/useImprovedProductFormWizard";
import { useState } from "react";
import { useAIProviders } from "@/hooks/useAIProviders";
import { useToast } from "@/hooks/use-toast";
import ImprovedAIToolsModal from "@/components/products/ImprovedAIToolsModal";

interface SEOStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

const SEOStep: React.FC<SEOStepProps> = ({ formData, updateFormData }) => {
  const [showAIModal, setShowAIModal] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingKeywords, setGeneratingKeywords] = useState(false);

  const { generateAIContent } = useAIProviders("global");
  const { toast } = useToast();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (name: string) => {
    updateFormData({
      name,
      seo_slug: generateSlug(name),
    });
  };

  // Gerar título SEO com IA
  const generateSEOTitle = async () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do produto antes de gerar o título SEO",
        variant: "destructive",
      });
      return;
    }

    setGeneratingTitle(true);
    try {
      const response = await generateAIContent({
        provider: "gemini",
        prompt: `Crie um título SEO otimizado para o produto "${
          formData.name
        }" da categoria "${
          formData.category || "Produto"
        }". O título deve ser atrativo, incluir palavras-chave relevantes e ter até 60 caracteres.`,
        max_tokens: 100,
        temperature: 0.7,
        system_message:
          "Você é um especialista em SEO e títulos otimizados para e-commerce.",
      });

      if (response.success && response.content) {
        updateFormData({ meta_title: response.content });
        toast({
          title: "Título SEO gerado!",
          description: `IA gerou um título otimizado usando ${response.provider?.toUpperCase()}`,
        });
      } else {
        toast({
          title: "Erro na geração",
          description: response.error || "Não foi possível gerar o título SEO",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na geração",
        description: error.message || "Erro ao gerar título SEO",
        variant: "destructive",
      });
    } finally {
      setGeneratingTitle(false);
    }
  };

  // Gerar descrição SEO com IA
  const generateSEODescription = async () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do produto antes de gerar a descrição SEO",
        variant: "destructive",
      });
      return;
    }

    setGeneratingDescription(true);
    try {
      const response = await generateAIContent({
        provider: "gemini",
        prompt: `Crie uma descrição SEO otimizada para o produto "${
          formData.name
        }" da categoria "${
          formData.category || "Produto"
        }". A descrição deve ser atrativa, incluir palavras-chave relevantes e ter entre 150-160 caracteres para aparecer nos resultados de busca.`,
        max_tokens: 200,
        temperature: 0.7,
        system_message:
          "Você é um especialista em SEO e descrições otimizadas para e-commerce.",
      });

      if (response.success && response.content) {
        updateFormData({ meta_description: response.content });
        toast({
          title: "Descrição SEO gerada!",
          description: `IA gerou uma descrição otimizada usando ${response.provider?.toUpperCase()}`,
        });
      } else {
        toast({
          title: "Erro na geração",
          description:
            response.error || "Não foi possível gerar a descrição SEO",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na geração",
        description: error.message || "Erro ao gerar descrição SEO",
        variant: "destructive",
      });
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Gerar palavras-chave com IA
  const generateSEOKeywords = async () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Nome obrigatório",
        description:
          "Digite o nome do produto antes de gerar as palavras-chave",
        variant: "destructive",
      });
      return;
    }

    setGeneratingKeywords(true);
    try {
      const response = await generateAIContent({
        provider: "gemini",
        prompt: `Gere palavras-chave relevantes para SEO do produto "${
          formData.name
        }" da categoria "${
          formData.category || "Produto"
        }". Retorne uma lista separada por vírgulas com 8-12 palavras-chave relevantes para busca orgânica.`,
        max_tokens: 150,
        temperature: 0.7,
        system_message:
          "Você é um especialista em SEO e palavras-chave para e-commerce.",
      });

      if (response.success && response.content) {
        updateFormData({ keywords: response.content });
        toast({
          title: "Palavras-chave geradas!",
          description: `IA gerou palavras-chave otimizadas usando ${response.provider?.toUpperCase()}`,
        });
      } else {
        toast({
          title: "Erro na geração",
          description:
            response.error || "Não foi possível gerar as palavras-chave",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na geração",
        description: error.message || "Erro ao gerar palavras-chave",
        variant: "destructive",
      });
    } finally {
      setGeneratingKeywords(false);
    }
  };

  const handleAITitleGenerated = (title: string) => {
    updateFormData({ meta_title: title });
  };

  const handleAIDescriptionGenerated = (description: string) => {
    updateFormData({ meta_description: description });
  };

  const handleAIKeywordsGenerated = (keywords: string) => {
    updateFormData({ keywords });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">SEO e Meta Tags</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAIModal(true)}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Ferramentas de IA
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Meta Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="metaTitle">Título SEO</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateSEOTitle}
                disabled={!formData.name?.trim() || generatingTitle}
                className="flex items-center gap-2"
              >
                {generatingTitle ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar com IA
                  </>
                )}
              </Button>
            </div>
            <Input
              id="metaTitle"
              value={formData.meta_title || ""}
              onChange={(e) => updateFormData({ meta_title: e.target.value })}
              placeholder="Título otimizado para mecanismos de busca"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">
              {formData.meta_title?.length || 0}/60 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="metaDescription">Descrição SEO</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateSEODescription}
                disabled={!formData.name?.trim() || generatingDescription}
                className="flex items-center gap-2"
              >
                {generatingDescription ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar com IA
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="metaDescription"
              value={formData.meta_description || ""}
              onChange={(e) =>
                updateFormData({ meta_description: e.target.value })
              }
              placeholder="Descrição que aparecerá nos resultados de busca"
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground">
              {formData.meta_description?.length || 0}/160 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="keywords">Palavras-chave</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateSEOKeywords}
                disabled={!formData.name?.trim() || generatingKeywords}
                className="flex items-center gap-2"
              >
                {generatingKeywords ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar com IA
                  </>
                )}
              </Button>
            </div>
            <Input
              id="keywords"
              value={formData.keywords || ""}
              onChange={(e) => updateFormData({ keywords: e.target.value })}
              placeholder="palavra1, palavra2, palavra3"
            />
            <p className="text-xs text-muted-foreground">
              Separe as palavras-chave com vírgulas
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            URL e Identificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seoSlug">Slug da URL</Label>
            <Input
              id="seoSlug"
              value={formData.seo_slug || ""}
              onChange={(e) => updateFormData({ seo_slug: e.target.value })}
              placeholder="url-amigavel-do-produto"
            />
            <p className="text-xs text-muted-foreground">
              URL final: /produto/{formData.seo_slug || "slug-do-produto"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Dicas de SEO</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use palavras-chave relevantes no título e descrição</li>
          <li>• Mantenha o título com até 60 caracteres</li>
          <li>• A descrição deve ter entre 150-160 caracteres</li>
          <li>• Use URLs amigáveis e descritivas</li>
          <li>• Inclua o nome do produto nas meta tags</li>
        </ul>
      </div>

      <ImprovedAIToolsModal
        open={showAIModal}
        onOpenChange={setShowAIModal}
        productName={formData.name}
        category={formData.category}
        onTitleGenerated={handleAITitleGenerated}
        onDescriptionGenerated={handleAIDescriptionGenerated}
        onKeywordsGenerated={handleAIKeywordsGenerated}
      />
    </div>
  );
};

export default SEOStep;
