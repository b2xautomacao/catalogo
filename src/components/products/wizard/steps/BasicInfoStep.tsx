import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import CategoryFormDialog from "@/components/products/CategoryFormDialog";
import { WizardFormData } from "@/hooks/useImprovedProductFormWizard";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BasicInfoStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  updateFormData,
}) => {
  const { categories, loading: categoriesLoading } = useCategories();
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const { toast } = useToast();

  const handleCategoryCreated = (newCategory: any) => {
    updateFormData({ category: newCategory.name });
    setShowCategoryDialog(false);
  };

  const generateDescription = async () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do produto antes de gerar a descrição",
        variant: "destructive",
      });
      return;
    }

    setGeneratingDescription(true);

    try {
      console.log("🤖 Gerando descrição para:", formData.name);

      // Usar a função genérica que respeita as configurações globais
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke(
        "ai-content-generator",
        {
          body: {
            productName: formData.name.trim(),
            category: formData.category || "Produto",
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
        updateFormData({ description: data.content });
        toast({
          title: "Descrição gerada!",
          description: `A IA criou uma descrição otimizada usando ${data.provider?.toUpperCase()}.`,
        });
      } else {
        console.error("❌ Descrição não retornada:", data);
        throw new Error("Descrição não foi gerada pela IA");
      }
    } catch (error: any) {
      console.error("💥 Erro ao gerar descrição:", error);
      toast({
        title: "Erro na geração",
        description:
          error.message ||
          "Não foi possível gerar a descrição. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGeneratingDescription(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Informações Básicas</h3>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <Label htmlFor="productName" className="text-sm font-medium">
            Nome do Produto *
          </Label>
          <Input
            id="productName"
            type="text"
            value={formData.name || ""}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="Digite o nome do produto"
            className={`${!formData.name?.trim() ? "border-red-300" : ""}`}
          />
          {!formData.name?.trim() && (
            <p className="text-xs text-red-500">
              Nome do produto é obrigatório
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">
            Categoria *
          </Label>
          <div className="flex gap-2">
            <Select
              value={formData.category || ""}
              onValueChange={(value) => updateFormData({ category: value })}
            >
              <SelectTrigger
                className={`flex-1 ${
                  !formData.category?.trim() ? "border-red-300" : ""
                }`}
              >
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriesLoading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando...
                    </div>
                  </SelectItem>
                ) : categories.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Nenhuma categoria encontrada
                  </SelectItem>
                ) : (
                  categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCategoryDialog(true)}
              className="flex items-center gap-2 px-3"
            >
              <Plus className="h-4 w-4" />
              Nova
            </Button>
          </div>
          {!formData.category?.trim() && (
            <p className="text-xs text-red-500">Categoria é obrigatória</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateDescription}
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
                  Gerar Descrição
                </>
              )}
            </Button>
          </div>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Descreva o produto ou use o botão para gerar automaticamente"
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Uma boa descrição ajuda os clientes a entenderem o produto
          </p>
        </div>
      </div>

      <CategoryFormDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        onCategoryCreated={handleCategoryCreated}
      />
    </div>
  );
};

export default BasicInfoStep;
