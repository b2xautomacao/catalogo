import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDraftImagesContext } from "@/contexts/DraftImagesContext";
import { useAuth } from "@/hooks/useAuth";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
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
  is_active: boolean;
  allow_negative_stock: boolean;
  stock_alert_threshold: number;
  variations: ProductVariation[];
  price_tiers: ProductPriceTier[];
  store_id: string;
  enable_gradual_wholesale?: boolean; // Toggle para ativar/desativar atacado gradativo
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
  is_active: true,
  allow_negative_stock: false,
  stock_alert_threshold: 5,
  variations: [],
  price_tiers: [],
  store_id: "",
  enable_gradual_wholesale: false,
};

export const useImprovedProductFormWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { uploadAllImages, clearDraftImages } = useDraftImagesContext();
  const { profile } = useAuth();
  const { priceModel } = useStorePriceModel(formData.store_id);

  const isWholesaleOnly = useMemo(() => {
    return priceModel?.price_model === ("wholesale_only" as PriceModelType);
  }, [priceModel]);

  const steps = useMemo(
    () => [
      {
        id: "basic",
        title: "Informações Básicas",
        description: "Nome, categoria e descrição",
      },
      {
        id: "pricing",
        title: "Preços Inteligentes",
        description: "Valores adaptados ao seu modelo",
      },
      { id: "images", title: "Imagens", description: "Fotos do produto" },
      {
        id: "variations",
        title: "Variações Inteligentes",
        description: "Sistema hierárquico de variações",
      },
      { id: "seo", title: "SEO com IA", description: "Otimização automática" },
      {
        id: "advanced",
        title: "Configurações Avançadas",
        description: "Destaque e ativação",
      },
    ],
    []
  );

  const updateFormData = useCallback(
    (updates: Partial<ProductFormData>) => {
      console.log("📊 WIZARD - Atualizando formData:", updates);
      setFormData((prev) => {
        const updated = { ...prev, ...updates };

        // Garantir store_id sempre presente
        if (!updated.store_id && profile?.store_id) {
          updated.store_id = profile.store_id;
        }

        // Debug específico para nome
        if (updates.name !== undefined) {
          console.log("🔍 NOME UPDATE:", {
            original: prev.name,
            novo: updates.name,
            trimmed: updates.name?.trim(),
            isEmpty: !updates.name?.trim(),
          });
        }

        console.log("📊 WIZARD - FormData atualizado:", {
          name: `"${updated.name}"`,
          nameLength: updated.name?.length || 0,
          hasTrimmedName: !!updated.name?.trim(),
          retail_price: updated.retail_price,
          store_id: updated.store_id,
        });

        return updated;
      });
    },
    [profile?.store_id]
  );

  const canProceed = useMemo(() => {
    const trimmedName = (formData.name || "").trim();

    console.log("🔍 CAN PROCEED CHECK:", {
      currentStep,
      name: `"${trimmedName}"`,
      nameLength: trimmedName.length,
      retail_price: formData.retail_price,
      wholesale_price: formData.wholesale_price,
      stock: formData.stock,
      rawName: `"${formData.name}"`,
      hasName: trimmedName.length > 0,
    });

    switch (currentStep) {
      case 0: // Informações básicas
        const hasValidName = trimmedName.length > 0;
        console.log("✅ Step 0 - hasValidName:", hasValidName);
        return hasValidName;
      case 1: // Preços e estoque
        // Para wholesale_only, só precisa de preço de atacado e estoque
        // Para outros modelos, precisa de preço de varejo e estoque
        const hasValidPrice =
          priceModel?.price_model === "wholesale_only"
            ? (formData.wholesale_price || 0) > 0
            : (formData.retail_price || 0) > 0;
        const hasStock = formData.stock >= 0;
        console.log(
          "✅ Step 1 - hasValidPrice:",
          hasValidPrice,
          "hasStock:",
          hasStock,
          "model:",
          priceModel?.price_model
        );
        return hasValidPrice && hasStock;
      case 2: // Imagens (opcional)
      case 3: // Variações (opcional)
      case 4: // SEO (opcional)
      case 5: // Avançado (opcional)
        console.log("✅ Step", currentStep, "- sempre pode prosseguir");
        return true;
      default:
        return false;
    }
  }, [
    currentStep,
    formData.name,
    formData.retail_price,
    formData.wholesale_price,
    formData.stock,
    priceModel?.price_model,
  ]);

  const nextStep = useCallback(() => {
    console.log("⏭️ NEXT STEP - Tentativa:", { currentStep, canProceed });
    if (canProceed && currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      console.log("✅ NEXT STEP - Sucesso para step:", currentStep + 1);
    } else {
      console.log("❌ NEXT STEP - Bloqueado:", {
        canProceed,
        isLastStep: currentStep >= steps.length - 1,
      });
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
    // Usar o nome atual do formData com trim
    const trimmedName = (formData.name || "").trim();

    console.log("💾 SAVE PRODUCT - Validação inicial:", {
      name: `"${trimmedName}"`,
      nameLength: trimmedName.length,
      hasValidName: trimmedName.length > 0,
      retail_price: formData.retail_price,
      stock: formData.stock,
      editingProductId,
      storeId: profile?.store_id,
    });

    // Validações críticas
    if (!trimmedName) {
      console.error("❌ SAVE - Nome vazio ou inválido!");
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira o nome do produto",
        variant: "destructive",
      });
      return null;
    }

    if (!profile?.store_id) {
      console.error("❌ SAVE - Store ID não encontrado");
      toast({
        title: "Erro",
        description: "ID da loja não encontrado",
        variant: "destructive",
      });
      return null;
    }

    setIsSaving(true);

    try {
      console.log("💾 SAVE - Iniciando salvamento do produto");

      const productData = {
        name: trimmedName,
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
        is_active: formData.is_active !== false,
        allow_negative_stock: formData.allow_negative_stock || false,
        stock_alert_threshold: formData.stock_alert_threshold || 5,
        store_id: profile.store_id,
        enable_gradual_wholesale: formData.enable_gradual_wholesale || false,
      };

      console.log("📦 SAVE - Dados finais do produto:", productData);

      let productId = editingProductId;

      if (editingProductId) {
        console.log("✏️ SAVE - Atualizando produto:", editingProductId);
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProductId);

        if (error) {
          console.error("❌ SAVE - Erro na atualização:", error);
          throw error;
        }
        console.log("✅ SAVE - Produto atualizado com sucesso");
      } else {
        console.log("➕ SAVE - Criando novo produto");
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert(productData)
          .select("id")
          .single();

        if (error) {
          console.error("❌ SAVE - Erro na criação:", error);
          throw error;
        }

        productId = newProduct.id;
        console.log("✅ SAVE - Produto criado com ID:", productId);
      }

      // Upload de imagens
      if (productId) {
        console.log("📷 SAVE - Processando imagens...");
        const uploadResult = await uploadAllImages(productId);
        console.log(
          "📷 SAVE - Resultado upload:",
          uploadResult.length,
          "imagens"
        );
      }

      // Salvar variações se houver
      if (formData.variations.length > 0 && productId) {
        console.log(
          "🎨 SAVE - Salvando variações:",
          formData.variations.length
        );

        // Remover variações existentes
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
          // Campos de grade
          grade_name: variation.grade_name || null,
          grade_color: variation.grade_color || null,
          grade_quantity: variation.grade_quantity || null,
          grade_sizes: variation.grade_sizes || null,
          grade_pairs: variation.grade_pairs || null,
          is_grade: variation.is_grade || false,
          variation_type: variation.variation_type || null,
          name: variation.name || null,
        }));

        if (variationsToSave.length > 0) {
          const { error: variationsError } = await supabase
            .from("product_variations")
            .insert(variationsToSave);

          if (variationsError) {
            console.error(
              "❌ SAVE - Erro ao salvar variações:",
              variationsError
            );
            throw variationsError;
          }
          console.log("✅ SAVE - Variações salvas com sucesso");
        }
      }

      // Salvar tiers de preço (atacado gradual)
      if (
        productId &&
        formData.price_tiers &&
        Array.isArray(formData.price_tiers)
      ) {
        console.log(
          "💰 SAVE - Salvando tiers de preço:",
          formData.price_tiers.length
        );
        // Remover tiers antigos
        const { error: deleteError } = await supabase
          .from("product_price_tiers")
          .delete()
          .eq("product_id", productId);
        if (deleteError) {
          console.error("❌ Erro ao remover tiers antigos:", deleteError);
          throw deleteError;
        }
        // Pequeno delay para garantir deleção
        await new Promise((r) => setTimeout(r, 200));
        // Ordenar tiers por min_quantity e limitar a 4
        const sortedTiers = [...formData.price_tiers]
          .sort((a, b) => a.min_quantity - b.min_quantity)
          .slice(0, 4);
        // Atribuir tier_order único (1 a 4)
        const tiersToSave = sortedTiers.map((tier, idx) => ({
          product_id: productId,
          tier_name: tier.tier_name || `Nível ${idx + 1}`,
          tier_type: tier.tier_type || "gradual",
          min_quantity: tier.min_quantity,
          price: tier.price,
          tier_order: idx + 1,
          is_active: tier.is_active !== false,
        }));
        console.log("📝 Tiers a serem salvos:", tiersToSave);
        if (tiersToSave.length > 0) {
          const { error: tiersError } = await supabase
            .from("product_price_tiers")
            .insert(tiersToSave);
          if (tiersError) {
            console.error("❌ SAVE - Erro ao salvar tiers:", tiersError);
            throw tiersError;
          }
          console.log("✅ SAVE - Tiers salvos com sucesso");
        }
      }

      toast({
        title: "✅ Produto salvo!",
        description: editingProductId
          ? "Produto atualizado com sucesso."
          : "Produto criado com sucesso.",
      });

      return productId || "success";
    } catch (error: any) {
      console.error("💥 SAVE - Erro durante salvamento:", error);
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
    console.log("🧹 RESET FORM - Limpando dados");
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
