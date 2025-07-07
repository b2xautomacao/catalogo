
import { useState, useCallback, useRef } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useProductVariations } from "@/hooks/useProductVariations";
import { useProductPriceTiers } from "@/hooks/useProductPriceTiers";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CreateProductData } from "@/types/product";

export interface ProductVariation {
  id?: string;
  color?: string;
  size?: string;
  sku?: string;
  stock: number;
  price_adjustment: number;
  is_active: boolean;
  image_url?: string;
  image_file?: File;
}

export interface ProductFormData extends CreateProductData {
  variations?: ProductVariation[];
  price_tiers?: Array<{
    id: string;
    name: string;
    minQuantity: number;
    price: number;
    enabled: boolean;
  }>;
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const useSimpleProductWizard = () => {
  const { createProduct, updateProduct } = useProducts();
  const { saveVariations } = useProductVariations();
  const { createDefaultTiers, updateTier } = useProductPriceTiers();
  const { toast } = useToast();
  const { profile } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    store_id: "",
    name: "",
    description: "",
    retail_price: 0,
    wholesale_price: undefined,
    category: "",
    stock: 0,
    min_wholesale_qty: 1,
    meta_title: "",
    meta_description: "",
    keywords: "",
    seo_slug: "",
    is_featured: false,
    allow_negative_stock: false,
    stock_alert_threshold: 5,
    is_active: true,
    variations: [],
    price_tiers: [],
  });

  // Ref para prevenir múltiplos salvamentos
  const savingRef = useRef(false);
  const lastSaveRef = useRef<number>(0);

  const steps: WizardStep[] = [
    {
      id: "basic",
      title: "Informações Básicas",
      description: "Nome, descrição e categoria",
    },
    {
      id: "pricing",
      title: "Preços e Estoque",
      description: "Valores e quantidades",
    },
    {
      id: "images", 
      title: "Imagens",
      description: "Fotos do produto"
    },
    {
      id: "variations",
      title: "Variações",
      description: "Cores, tamanhos e opções",
    },
    {
      id: "seo",
      title: "SEO e Metadados",
      description: "Otimização para buscas",
    },
    {
      id: "advanced",
      title: "Configurações Avançadas",
      description: "Opções extras",
    },
  ];

  const updateFormData = useCallback((updates: Partial<ProductFormData>) => {
    console.log("🔧 SIMPLE WIZARD - Atualizando dados:", updates);
    setFormData((prev) => {
      const updated = { ...prev, ...updates };
      console.log("📊 SIMPLE WIZARD - Dados atualizados:", {
        step: currentStep,
        name: updated.name,
        retail_price: updated.retail_price,
        stock: updated.stock,
        variations: updated.variations?.length || 0,
        price_tiers: updated.price_tiers?.length || 0,
      });
      return updated;
    });
  }, [currentStep]);

  const loadProductData = useCallback(async (editingProduct: any) => {
    console.log("📂 SIMPLE WIZARD - Carregando dados do produto:", editingProduct);
    
    if (!editingProduct) return;

    try {
      // Carregar price_tiers se existir ID do produto
      let loadedPriceTiers: any[] = [];
      if (editingProduct.id) {
        console.log("💰 SIMPLE WIZARD - Carregando price_tiers...");
        
        // Importar supabase para buscar price_tiers
        const { supabase } = await import("@/integrations/supabase/client");
        
        const { data: priceTiersData, error: priceTiersError } = await supabase
          .from("product_price_tiers")
          .select("*")
          .eq("product_id", editingProduct.id)
          .eq("is_active", true)
          .order("tier_order");

        if (priceTiersError) {
          console.error("❌ SIMPLE WIZARD - Erro ao carregar price_tiers:", priceTiersError);
        } else if (priceTiersData && priceTiersData.length > 0) {
          console.log("✅ SIMPLE WIZARD - Price_tiers carregados:", priceTiersData);
          
          loadedPriceTiers = priceTiersData.map((tier) => ({
            id: tier.tier_type === "retail" ? "retail" : `tier${tier.tier_order}`,
            name: tier.tier_name,
            minQuantity: tier.min_quantity,
            price: tier.price,
            enabled: true,
          }));
        }
      }

      const productDataToLoad = {
        name: editingProduct.name || "",
        description: editingProduct.description || "",
        retail_price: editingProduct.retail_price || 0,
        wholesale_price: editingProduct.wholesale_price || undefined,
        min_wholesale_qty: editingProduct.min_wholesale_qty || 1,
        stock: editingProduct.stock || 0,
        category: editingProduct.category || "",
        keywords: editingProduct.keywords || "",
        meta_title: editingProduct.meta_title || "",
        meta_description: editingProduct.meta_description || "",
        seo_slug: editingProduct.seo_slug || "",
        is_featured: editingProduct.is_featured || false,
        allow_negative_stock: editingProduct.allow_negative_stock || false,
        stock_alert_threshold: editingProduct.stock_alert_threshold || 5,
        price_tiers: loadedPriceTiers,
      };

      console.log("📥 SIMPLE WIZARD - Dados preparados:", productDataToLoad);
      updateFormData(productDataToLoad);
    } catch (error) {
      console.error("❌ SIMPLE WIZARD - Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do produto",
        variant: "destructive",
      });
    }
  }, [updateFormData, toast]);

  const validateCurrentStep = useCallback((): boolean => {
    console.log("✅ SIMPLE WIZARD - Validando step:", currentStep);
    
    switch (currentStep) {
      case 0: // Informações Básicas
        const basicValid = !!(formData.name?.trim() && formData.name.trim().length > 0);
        console.log("📝 SIMPLE WIZARD - Step 0 válido:", basicValid);
        return basicValid;

      case 1: // Preços e Estoque
        const pricingValid = formData.retail_price > 0 && formData.stock >= 0;
        console.log("💰 SIMPLE WIZARD - Step 1 válido:", pricingValid);
        return pricingValid;

      case 2: // Imagens (opcional)
      case 3: // Variações (opcional)
      case 4: // SEO (opcional)
      case 5: // Avançado (opcional)
        console.log(`✅ SIMPLE WIZARD - Step ${currentStep}: sempre válido (opcional)`);
        return true;

      default:
        console.error("❌ SIMPLE WIZARD - Step desconhecido:", currentStep);
        return false;
    }
  }, [currentStep, formData]);

  const canProceed = validateCurrentStep();

  const nextStep = useCallback(() => {
    console.log("➡️ SIMPLE WIZARD - Tentando avançar do step:", currentStep);

    if (!canProceed) {
      console.log("🛑 SIMPLE WIZARD - Não pode avançar, validação falhou");
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      console.log("✅ SIMPLE WIZARD - Avançando para step:", nextStepIndex);
      setCurrentStep(nextStepIndex);
    }
  }, [currentStep, steps.length, canProceed, toast]);

  const prevStep = useCallback(() => {
    console.log("⬅️ SIMPLE WIZARD - Voltando do step:", currentStep);
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      console.log("✅ SIMPLE WIZARD - Voltando para step:", prevStepIndex);
      setCurrentStep(prevStepIndex);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    console.log("🎯 SIMPLE WIZARD - Indo direto para step:", stepIndex);
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  const saveProduct = useCallback(
    async (
      productId?: string,
      imageUploadFn?: (productId: string) => Promise<string[]>
    ): Promise<string | null> => {
      const now = Date.now();
      
      // Debounce: evitar múltiplos cliques muito rápidos
      if (now - lastSaveRef.current < 2000) {
        console.log("⏳ SIMPLE WIZARD - Debounce ativado, ignorando...");
        return null;
      }
      
      lastSaveRef.current = now;

      // Lock para evitar execução simultânea
      if (savingRef.current || isSaving) {
        console.log("⏳ SIMPLE WIZARD - Já está salvando, ignorando...");
        return null;
      }

      savingRef.current = true;
      setIsSaving(true);

      try {
        console.log("💾 SIMPLE WIZARD - Iniciando salvamento do produto");

        if (!profile?.store_id) {
          console.error("❌ SIMPLE WIZARD - Store ID não encontrado");
          toast({
            title: "Erro",
            description: "Loja não identificada. Faça login novamente.",
            variant: "destructive",
          });
          return null;
        }

        // Validação final dos dados
        if (!formData.name?.trim() || formData.name.trim().length === 0) {
          console.error("❌ SIMPLE WIZARD - Nome vazio ou inválido:", formData.name);
          toast({
            title: "Erro de validação",
            description: "Nome do produto é obrigatório.",
            variant: "destructive",
          });
          return null;
        }

        if (formData.retail_price <= 0) {
          console.error("❌ SIMPLE WIZARD - Preço inválido:", formData.retail_price);
          toast({
            title: "Erro de validação",
            description: "Preço de varejo deve ser maior que zero.",
            variant: "destructive",
          });
          return null;
        }

        // 1. Salvar produto primeiro
        const { variations, price_tiers, ...productDataWithoutVariations } = formData;
        const productData: CreateProductData = {
          ...productDataWithoutVariations,
          store_id: profile.store_id,
          name: formData.name.trim(),
          description: formData.description?.trim() || "",
          category: formData.category?.trim() || "Geral",
          retail_price: Number(formData.retail_price),
          stock: Number(formData.stock),
        };

        console.log("📤 SIMPLE WIZARD - Dados do produto para salvar:", productData);

        let result;
        let savedProductId: string;

        if (productId) {
          console.log("🔄 SIMPLE WIZARD - Atualizando produto existente...");
          result = await updateProduct({
            ...productData,
            id: productId,
          });
          savedProductId = productId;
        } else {
          console.log("➕ SIMPLE WIZARD - Criando novo produto...");
          result = await createProduct(productData);
          savedProductId = result.data?.id;
        }

        console.log("📋 SIMPLE WIZARD - Resultado da operação do produto:", result);

        if (result.error || !savedProductId) {
          console.error("❌ SIMPLE WIZARD - Erro na operação do produto:", result.error);
          throw new Error(result.error || "Erro ao salvar produto");
        }

        console.log("✅ SIMPLE WIZARD - Produto salvo com sucesso:", savedProductId);

        // 2. Salvar Price Tiers se houver
        if (formData.price_tiers && formData.price_tiers.length > 0) {
          console.log("💰 SIMPLE WIZARD - Salvando price_tiers...");
          
          try {
            const { supabase } = await import("@/integrations/supabase/client");

            // Primeiro, desativar todos os tiers existentes
            await supabase
              .from("product_price_tiers")
              .update({ is_active: false })
              .eq("product_id", savedProductId);

            // Preparar novos tiers
            const tiersToInsert = [];

            // Tier de varejo (sempre existe)
            tiersToInsert.push({
              product_id: savedProductId,
              tier_name: "Varejo",
              tier_order: 1,
              tier_type: "retail",
              price: formData.retail_price,
              min_quantity: 1,
              is_active: true,
            });

            // Tiers de atacado
            const enabledTiers = formData.price_tiers.filter(
              (tier) => tier.enabled && tier.price > 0 && tier.id !== "retail"
            );

            enabledTiers.forEach((tier, index) => {
              tiersToInsert.push({
                product_id: savedProductId,
                tier_name: tier.name,
                tier_order: index + 2,
                tier_type: "gradual_wholesale",
                price: tier.price,
                min_quantity: tier.minQuantity,
                is_active: true,
              });
            });

            if (tiersToInsert.length > 0) {
              const { error: insertError } = await supabase
                .from("product_price_tiers")
                .insert(tiersToInsert);

              if (insertError) {
                console.error("❌ SIMPLE WIZARD - Erro ao inserir price_tiers:", insertError);
                // Não falhar por causa dos tiers
              } else {
                console.log("✅ SIMPLE WIZARD - Price_tiers salvos com sucesso");
              }
            }
          } catch (tierError) {
            console.error("❌ SIMPLE WIZARD - Erro nos price_tiers:", tierError);
            // Não falhar por causa dos tiers
          }
        }

        // 3. Fazer upload de imagens se houver função
        if (imageUploadFn) {
          console.log("📷 SIMPLE WIZARD - Fazendo upload de imagens...");
          try {
            await imageUploadFn(savedProductId);
            console.log("✅ SIMPLE WIZARD - Upload de imagens concluído");
          } catch (uploadError) {
            console.error("❌ SIMPLE WIZARD - Erro no upload de imagens:", uploadError);
            // Não falhar por causa das imagens
          }
        }

        // 4. Salvar variações se houver
        if (formData.variations && formData.variations.length > 0) {
          console.log("🎨 SIMPLE WIZARD - Salvando variações...");
          try {
            const variationsToSave = formData.variations.map((variation) => ({
              color: variation.color || null,
              size: variation.size || null,
              sku: variation.sku || null,
              stock: variation.stock,
              price_adjustment: variation.price_adjustment,
              is_active: variation.is_active,
              image_url: variation.image_url || null,
            }));

            const variationResult = await saveVariations(savedProductId, variationsToSave);
            if (variationResult.success) {
              console.log("✅ SIMPLE WIZARD - Variações salvas com sucesso");
            } else {
              console.error("❌ SIMPLE WIZARD - Erro ao salvar variações:", variationResult.error);
            }
          } catch (variationError) {
            console.error("❌ SIMPLE WIZARD - Erro nas variações:", variationError);
            // Não falhar por causa das variações
          }
        }

        toast({
          title: "Sucesso!",
          description: productId ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!",
        });

        return savedProductId;
      } catch (error) {
        console.error("💥 SIMPLE WIZARD - Erro durante salvamento:", error);
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : "Erro desconhecido ao salvar produto",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsSaving(false);
        savingRef.current = false;
      }
    },
    [formData, profile, createProduct, updateProduct, saveVariations, toast]
  );

  const resetForm = useCallback(() => {
    console.log("🧹 SIMPLE WIZARD - Resetando formulário");
    setFormData({
      store_id: "",
      name: "",
      description: "",
      retail_price: 0,
      wholesale_price: undefined,
      category: "",
      stock: 0,
      min_wholesale_qty: 1,
      meta_title: "",
      meta_description: "",
      keywords: "",
      seo_slug: "",
      is_featured: false,
      allow_negative_stock: false,
      stock_alert_threshold: 5,
      is_active: true,
      variations: [],
      price_tiers: [],
    });
    setCurrentStep(0);
  }, []);

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
    loadProductData,
    canProceed,
  };
};
