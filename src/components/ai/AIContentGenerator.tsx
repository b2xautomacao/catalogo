import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIContentGeneratorProps {
  productName: string;
  category?: string;
  onDescriptionGenerated: (description: string) => void;
  onTitleGenerated?: (title: string) => void;
  onKeywordsGenerated?: (keywords: string) => void;
  onAdCopyGenerated?: (adCopy: string) => void;
  disabled?: boolean;
  variant?: "description" | "seo" | "title" | "keywords" | "ad-copy";
  size?: "sm" | "default" | "lg";
}

const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({
  productName,
  category = "produto",
  onDescriptionGenerated,
  onTitleGenerated,
  onKeywordsGenerated,
  onAdCopyGenerated,
  disabled = false,
  variant = "description",
  size = "default",
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateDescription = async () => {
    if (!productName?.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do produto para gerar a descrição",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log(
        "🤖 Gerando descrição para:",
        productName,
        "categoria:",
        category
      );

      const { data, error } = await supabase.functions.invoke(
        "ai-content-generator",
        {
          body: {
            productName: productName.trim(),
            category: category?.trim() || "produto",
            contentType: "description",
            storeId: "global", // Usar configurações globais
          },
        }
      );

      console.log("🤖 Resposta da função:", { data, error });

      if (error) {
        console.error("❌ Erro na função:", error);
        throw new Error(error.message || "Erro ao chamar função IA");
      }

      if (data?.content) {
        console.log(
          "✅ Descrição gerada com sucesso:",
          data.content.length,
          "caracteres"
        );
        console.log("🤖 Provedor usado:", data.provider, "Modelo:", data.model);
        onDescriptionGenerated(data.content);
        toast({
          title: "Descrição gerada!",
          description: `A IA criou uma descrição otimizada usando ${data.provider.toUpperCase()}.`,
        });
      } else {
        console.error("❌ Descrição não retornada:", data);
        throw new Error("Descrição não foi gerada pela IA");
      }
    } catch (error) {
      console.error("💥 Erro ao gerar descrição:", error);
      toast({
        title: "Erro ao gerar descrição",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSEO = async () => {
    if (!productName?.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do produto para gerar SEO",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log("🔍 Gerando SEO para:", productName, "categoria:", category);

      // Gerar título SEO
      const titleResponse = await supabase.functions.invoke(
        "ai-content-generator",
        {
          body: {
            productName: productName.trim(),
            category: category?.trim() || "produto",
            contentType: "title",
            storeId: "global",
          },
        }
      );

      // Gerar palavras-chave
      const keywordsResponse = await supabase.functions.invoke(
        "ai-content-generator",
        {
          body: {
            productName: productName.trim(),
            category: category?.trim() || "produto",
            contentType: "keywords",
            storeId: "global",
          },
        }
      );

      // Gerar descrição para meta description
      const descriptionResponse = await supabase.functions.invoke(
        "ai-content-generator",
        {
          body: {
            productName: productName.trim(),
            category: category?.trim() || "produto",
            contentType: "description",
            storeId: "global",
          },
        }
      );

      console.log("🔍 Respostas das funções SEO:", {
        title: titleResponse.data,
        keywords: keywordsResponse.data,
        description: descriptionResponse.data,
      });

      if (
        titleResponse.error ||
        keywordsResponse.error ||
        descriptionResponse.error
      ) {
        console.error("❌ Erro nas funções SEO:", {
          title: titleResponse.error,
          keywords: keywordsResponse.error,
          description: descriptionResponse.error,
        });
        throw new Error("Erro ao gerar conteúdo SEO");
      }

      // Aplicar dados SEO usando os callbacks fornecidos
      if (titleResponse.data?.content && onTitleGenerated) {
        onTitleGenerated(titleResponse.data.content);
      }

      if (descriptionResponse.data?.content) {
        onDescriptionGenerated(descriptionResponse.data.content);
      }

      if (keywordsResponse.data?.content && onKeywordsGenerated) {
        onKeywordsGenerated(keywordsResponse.data.content);
      }

      console.log("✅ SEO gerado com sucesso usando:", {
        titleProvider: titleResponse.data?.provider,
        keywordsProvider: keywordsResponse.data?.provider,
        descriptionProvider: descriptionResponse.data?.provider,
      });

      toast({
        title: "SEO gerado!",
        description: "A IA criou conteúdo SEO otimizado para seu produto.",
      });
    } catch (error) {
      console.error("💥 Erro ao gerar SEO:", error);
      toast({
        title: "Erro ao gerar SEO",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (variant === "seo") {
      generateSEO();
    } else {
      generateDescription();
    }
  };

  const getButtonText = () => {
    if (isGenerating) return "Gerando...";

    switch (variant) {
      case "seo":
        return "Gerar SEO";
      case "title":
        return "Gerar Título";
      case "keywords":
        return "Gerar Palavras-chave";
      case "ad-copy":
        return "Gerar Anúncio";
      default:
        return "Gerar com IA";
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={disabled || isGenerating || !productName?.trim()}
      variant="outline"
      size={size}
      className="gap-2"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {getButtonText()}
    </Button>
  );
};

export default AIContentGenerator;
