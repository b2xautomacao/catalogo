import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDraftImages } from "@/hooks/useDraftImages";
import { useAuth } from "@/hooks/useAuth";
import { ProductVariation, ProductPriceTier } from "@/types/product";

export interface ProductFormData {
  name: string;
  description?: string;
  retail_price: number;
  wholesale_price?: number;
  min_wholesale_qty?: number;
  stock: number;
  category: string;
  keywords: string;
  meta_title: string;
  meta_description: string;
  seo_slug: string;
  is_featured: boolean;
  allow_negative_stock: boolean;
  stock_alert_threshold: number;
  variations: ProductVariation[];
  price_tiers: ProductPriceTier[];
  store_id: string;
}

const initialFormData: ProductFormData = {
  name: "",
  description: "",
  retail_price: 0,
  wholesale_price: undefined,
  min_wholesale_qty: 1,
  stock: 0,
  category: "",
  keywords: "",
  meta_title: "",
  meta_description: "",
  seo_slug: "",
  is_featured: false,
  allow_negative_stock: false,
  stock_alert_threshold: 5,
  variations: [],
  price_tiers: [
    {
      id: "retail",
      tier_name: "Varejo",
      tier_type: "retail",
      min_quantity: 1,
      price: 0,
      tier_order: 1,
      is_active: true,
      name: "Varejo",
      minQuantity: 1,
      enabled: true,
    },
  ],
  store_id: "",
};

export const useImprovedProductFormWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { draftImages, uploadDraftImages, clearDraftImages } = useDraftImages();
  const { profile } = useAuth();

  const steps = useMemo(
    () => [
      {
        id: "basic",
        title: "Informações Básicas",
        description: "Nome, categoria e descrição",
      },
      {
        id: "pricing",
        title: "Preços e Estoque",
        description: "Valores e quantidades",
      },
      { id: "images", title: "Imagens", description: "Fotos do produto" },
      {
        id: "variations",
        title: "Variações",
        description: "Cores, tamanhos e opções",
      },
      { id: "seo", title: "SEO", description: "Otimização para buscadores" },
      {
        id: "advanced",
        title: "Configurações Avançadas",
        description: "Opções adicionais",
      },
    ],
    []
  );

  const updateFormData = useCallback(
    (updates: Partial<ProductFormData>) => {
      setFormData((prev) => {
        const updated = { ...prev, ...updates };
        if (!updated.store_id && profile?.store_id) {
          updated.store_id = profile.store_id;
        }
        if (updated.min_wholesale_qty === undefined) {
          updated.min_wholesale_qty = 1;
        }
        console.log("📊 WIZARD - Atualizando formData:", updates);
        return updated;
      });
    },
    [profile?.store_id]
  );

  const canProceed = useMemo(() => {
    const trimmedName = formData.name?.trim() || "";

    switch (currentStep) {
      case 0: // Informações básicas
        return trimmedName.length > 0;
      case 1: // Preços e estoque
        return formData.retail_price > 0 && formData.stock >= 0;
      case 2: // Imagens (opcional)
      case 3: // Variações (opcional)
      case 4: // SEO (opcional)
      case 5: // Avançado (opcional)
        return true;
      default:
        return false;
    }
  }, [currentStep, formData.name, formData.retail_price, formData.stock]);

  const nextStep = useCallback(() => {
    if (canProceed && currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [canProceed, currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < steps.length) {
        setCurrentStep(step);
      }
    },
    [steps.length]
  );

  const saveProduct = async (
    editingProductId?: string
  ): Promise<string | null> => {
    if (!canProceed) {
      console.error("❌ WIZARD SAVE - Dados inválidos para salvamento");
      return null;
    }

    if (!profile?.store_id) {
      console.error("❌ WIZARD SAVE - Store ID não encontrado");
      toast({
        title: "Erro",
        description: "ID da loja não encontrado",
        variant: "destructive",
      });
      return null;
    }

    setIsSaving(true);

    try {
      console.log("💾 WIZARD SAVE - Iniciando salvamento do produto");

      const productData = {
        name: formData.name.trim(),
        description: formData.description || "",
        retail_price: formData.retail_price,
        wholesale_price: formData.wholesale_price || null,
        min_wholesale_qty: formData.min_wholesale_qty || 1,
        stock: formData.stock,
        category: formData.category || "",
        keywords: formData.keywords || "",
        meta_title: formData.meta_title || "",
        meta_description: formData.meta_description || "",
        seo_slug: formData.seo_slug || "",
        is_featured: formData.is_featured || false,
        allow_negative_stock: formData.allow_negative_stock || false,
        stock_alert_threshold: formData.stock_alert_threshold || 5,
        store_id: profile.store_id,
      };

      let productId = editingProductId;

      if (editingProductId) {
        console.log("✏️ WIZARD SAVE - Atualizando produto:", editingProductId);
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProductId);

        if (error) {
          console.error("❌ WIZARD SAVE - Erro na atualização:", error);
          throw error;
        }
      } else {
        console.log("➕ WIZARD SAVE - Criando novo produto");
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert(productData)
          .select("id")
          .single();

        if (error) {
          console.error("❌ WIZARD SAVE - Erro na criação:", error);
          throw error;
        }

        productId = newProduct.id;
        console.log("✅ WIZARD SAVE - Produto criado com ID:", productId);
      }

      // Salvar níveis de preço se houver
      if (formData.price_tiers.length > 1 && productId) {
        console.log(
          "💰 WIZARD SAVE - Salvando níveis de preço:",
          formData.price_tiers.length
        );

        // Remover níveis existentes
        await supabase
          .from("product_price_tiers")
          .delete()
          .eq("product_id", productId);

        // Inserir novos níveis (exceto varejo que já está no produto)
        const tiersToSave = formData.price_tiers
          .filter((tier) => tier.id !== "retail" && tier.enabled)
          .map((tier) => ({
            product_id: productId,
            tier_name: tier.name,
            tier_order:
              tier.id === "wholesale"
                ? 2
                : tier.id === "tier2"
                ? 2
                : tier.id === "tier3"
                ? 3
                : 4,
            tier_type:
              tier.id === "wholesale"
                ? "simple_wholesale"
                : "gradual_wholesale",
            price: tier.price,
            min_quantity: tier.minQuantity,
            is_active: true,
          }));

        if (tiersToSave.length > 0) {
          const { error: tiersError } = await supabase
            .from("product_price_tiers")
            .insert(tiersToSave);

          if (tiersError) {
            console.error(
              "❌ WIZARD SAVE - Erro ao salvar níveis:",
              tiersError
            );
            throw tiersError;
          }
        }
      }

      // Upload de imagens se houver
      if (draftImages.length > 0 && productId) {
        console.log("📷 WIZARD SAVE - Uploading imagens:", draftImages.length);
        const uploadResult = await uploadDraftImages(productId);
        if (uploadResult.length === 0) {
          console.warn("⚠️ WIZARD SAVE - Nenhuma imagem foi enviada");
        }
      }

      // Salvar variações se houver
      if (formData.variations.length > 0 && productId) {
        console.log(
          "🎨 WIZARD SAVE - Salvando variações:",
          formData.variations.length
        );

        // Remover variações existentes simples
        await supabase
          .from("product_variations")
          .delete()
          .eq("product_id", productId);

        // Inserir novas variações
        const variationsToSave = formData.variations.map((variation) => ({
          product_id: productId,
          color: variation.color || "",
          size: variation.size || "",
          sku: variation.sku || "",
          stock: variation.stock || 0,
          price_adjustment: variation.price_adjustment || 0,
          is_active: variation.is_active !== false,
          image_url: variation.image_url || "",
        }));

        if (variationsToSave.length > 0) {
          const { error: variationsError } = await supabase
            .from("product_variations")
            .insert(variationsToSave);

          if (variationsError) {
            console.error(
              "❌ WIZARD SAVE - Erro ao salvar variações:",
              variationsError
            );
            throw variationsError;
          }
        }
      }

      toast({
        title: "✅ Produto salvo!",
        description: editingProductId
          ? "Produto atualizado com sucesso."
          : "Produto criado com sucesso.",
      });

      return editingProductId || 'new-product-id';
    } catch (error: any) {
      console.error("💥 WIZARD SAVE - Erro durante salvamento:", error);
      toast({
        title: "Erro ao salvar produto",
        description: error?.message || "Não foi possível salvar o produto.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setCurrentStep(0);
    clearDraftImages();
  }, [clearDraftImages]);

  return {
    currentStep,
    formData,
    steps,
    isSaving,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    saveProduct,
    resetForm,
    canProceed,
  };
};
