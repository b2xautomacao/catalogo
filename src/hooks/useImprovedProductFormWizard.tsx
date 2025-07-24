import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStorePriceModel } from '@/hooks/useStorePriceModel';
import { PriceModelType } from '@/types/price-models';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDraftImagesContext } from '@/contexts/DraftImagesContext';

export interface WizardFormData {
  // Basic product info
  name: string;
  description?: string;
  category?: string;
  retail_price: number;
  wholesale_price?: number;
  stock: number;
  min_wholesale_qty?: number;
  
  // Advanced settings
  is_featured?: boolean;
  is_active?: boolean;
  allow_negative_stock?: boolean;
  stock_alert_threshold?: number;
  
  // SEO
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  seo_slug?: string;
  
  // Price model settings
  price_model?: PriceModelType;
  simple_wholesale_enabled?: boolean;
  gradual_wholesale_enabled?: boolean;
  
  // Store reference
  store_id?: string;
  
  // Variations
  variations?: any[];
}

export interface WizardStep {
  id: string;
  label: string;
  title: string;
  description: string;
}

export const useImprovedProductFormWizard = () => {
  const { profile } = useAuth();
  const { priceModel } = useStorePriceModel(profile?.store_id);
  const { toast } = useToast();
  const { uploadAllImages, clearDraftImages, loadExistingImages } = useDraftImagesContext();
  
  const [formData, setFormData] = useState<WizardFormData>({
    name: '',
    description: '',
    category: '',
    retail_price: 0,
    wholesale_price: 0,
    stock: 0,
    min_wholesale_qty: 1,
    is_featured: false,
    is_active: true,
    allow_negative_stock: false,
    stock_alert_threshold: 5,
    store_id: profile?.store_id,
    variations: []
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const steps: WizardStep[] = [
    {
      id: "0",
      label: "Básico",
      title: "Informações Básicas",
      description: "Nome, descrição e categoria do produto"
    },
    {
      id: "1",
      label: "Preços",
      title: "Preços e Estoque",
      description: "Preços de varejo/atacado e controle de estoque"
    },
    {
      id: "2",
      label: "Imagens",
      title: "Imagens do Produto",
      description: "Upload e organização das imagens"
    },
    {
      id: "3",
      label: "Variações",
      title: "Variações do Produto",
      description: "Cores, tamanhos e outras variações"
    },
    {
      id: "4",
      label: "SEO",
      title: "Otimização para Busca",
      description: "Meta tags e palavras-chave"
    },
    {
      id: "5",
      label: "Revisão",
      title: "Revisar e Salvar",
      description: "Confirme os dados antes de salvar"
    }
  ];

  // Update store_id when profile changes
  useEffect(() => {
    if (profile?.store_id) {
      setFormData(prev => ({
        ...prev,
        store_id: profile.store_id
      }));
    }
  }, [profile?.store_id]);

  // Update price model settings when model changes
  useEffect(() => {
    if (priceModel) {
      setFormData(prev => ({
        ...prev,
        price_model: priceModel.price_model,
        simple_wholesale_enabled: priceModel.simple_wholesale_enabled,
        gradual_wholesale_enabled: priceModel.gradual_wholesale_enabled
      }));
    }
  }, [priceModel]);

  const updateFormData = (updates: Partial<WizardFormData>) => {
    console.log('🔄 WIZARD - Atualizando formData:', updates);
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (canProceed()) {
      setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  };

  const canProceed = (): boolean => {
    console.log('🔍 WIZARD - Verificando canProceed para step:', currentStep, formData);
    
    switch (currentStep) {
      case 0: // Basic info
        const hasName = Boolean(formData.name?.trim());
        const hasCategory = Boolean(formData.category?.trim());
        
        console.log('🔍 WIZARD - Step 0 validation:', { 
          hasName, 
          hasCategory,
          name: formData.name,
          category: formData.category
        });
        
        return hasName && hasCategory;
        
      case 1: // Pricing - Validação baseada no modelo de preço
        console.log('🔍 WIZARD - Validando preços com modelo:', priceModel?.price_model);
        
        // Se é wholesale_only, só precisa de preço de atacado
        if (priceModel?.price_model === 'wholesale_only') {
          const hasValidWholesalePrice = formData.wholesale_price && formData.wholesale_price > 0;
          console.log('🔍 WIZARD - Wholesale only validation:', { 
            hasValidWholesalePrice, 
            wholesale_price: formData.wholesale_price 
          });
          return hasValidWholesalePrice;
        }
        
        // Para retail_only ou outros modelos, precisa de preço de varejo
        const hasValidRetailPrice = formData.retail_price > 0;
        console.log('🔍 WIZARD - Retail price validation:', { 
          hasValidRetailPrice, 
          retail_price: formData.retail_price 
        });
        return hasValidRetailPrice;
        
      case 2: // Images
        return true;
        
      case 3: // Variations
        return true;
        
      case 4: // SEO
        return true;
        
      case 5: // Review - Validação final baseada no modelo
        const hasNameFinal = Boolean(formData.name?.trim());
        const hasCategoryFinal = Boolean(formData.category?.trim());
        
        let hasPriceFinal = false;
        if (priceModel?.price_model === 'wholesale_only') {
          hasPriceFinal = Boolean(formData.wholesale_price && formData.wholesale_price > 0);
        } else {
          hasPriceFinal = Boolean(formData.retail_price > 0);
        }
        
        const finalValidation = hasNameFinal && hasCategoryFinal && hasPriceFinal;
        console.log('🔍 WIZARD - Final validation:', { 
          finalValidation,
          hasNameFinal,
          hasCategoryFinal,
          hasPriceFinal,
          priceModel: priceModel?.price_model
        });
        return finalValidation;
        
      default:
        return true;
    }
  };

  const saveProduct = async (editingProductId?: string): Promise<string | null> => {
    console.log('💾 WIZARD - Iniciando salvamento:', { editingProductId, formData });
    setLoading(true);
    
    try {
      // Validações básicas
      if (!formData.name?.trim()) {
        throw new Error('Nome do produto é obrigatório');
      }
      
      if (!formData.category?.trim()) {
        throw new Error('Categoria é obrigatória');
      }
      
      // Validação de preço baseada no modelo
      if (priceModel?.price_model === 'wholesale_only') {
        if (!formData.wholesale_price || formData.wholesale_price <= 0) {
          throw new Error('Preço de atacado deve ser maior que zero');
        }
      } else {
        if (!formData.retail_price || formData.retail_price <= 0) {
          throw new Error('Preço de varejo deve ser maior que zero');
        }
      }
      
      if (!profile?.store_id) {
        throw new Error('Store ID não encontrado');
      }

      const productData = {
        name: formData.name.trim(),
        description: formData.description || '',
        category: formData.category.trim(),
        retail_price: formData.retail_price || 0,
        wholesale_price: formData.wholesale_price,
        stock: formData.stock || 0,
        min_wholesale_qty: formData.min_wholesale_qty || 1,
        is_featured: formData.is_featured || false,
        is_active: formData.is_active !== false,
        allow_negative_stock: formData.allow_negative_stock || false,
        stock_alert_threshold: formData.stock_alert_threshold || 5,
        meta_title: formData.meta_title || '',
        meta_description: formData.meta_description || '',
        keywords: formData.keywords || '',
        seo_slug: formData.seo_slug || '',
        store_id: profile.store_id
      };

      console.log('💾 WIZARD - Dados do produto:', productData);

      let result;
      
      if (editingProductId) {
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update({
            ...productData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProductId)
          .select()
          .single();

        if (error) {
          console.error('💾 WIZARD - Erro ao atualizar:', error);
          throw error;
        }
        result = data;
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert({
            ...productData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('💾 WIZARD - Erro ao criar:', error);
          throw error;
        }
        result = data;
      }

      console.log('✅ WIZARD - Produto salvo:', result);

      // Upload de imagens após salvar o produto
      if (result?.id) {
        console.log('📤 WIZARD - Iniciando upload de imagens para produto:', result.id);
        try {
          const uploadedUrls = await uploadAllImages(result.id);
          console.log('✅ WIZARD - Imagens enviadas:', uploadedUrls.length);
          
          // Limpar as imagens do contexto após upload bem-sucedido
          clearDraftImages();
        } catch (imageError) {
          console.error('❌ WIZARD - Erro no upload de imagens:', imageError);
          // Não falhar o salvamento do produto por erro de imagem
          toast({
            title: "Produto salvo com avisos",
            description: "Produto salvo, mas houve problemas com o upload das imagens.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Produto salvo!",
        description: editingProductId ? "Produto atualizado com sucesso." : "Produto criado com sucesso.",
      });

      return result?.id || null;
    } catch (error: any) {
      console.error('❌ WIZARD - Erro ao salvar produto:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar o produto.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    console.log('🧹 WIZARD - Resetando formulário');
    setCurrentStep(0);
    setFormData({
      name: '',
      description: '',
      category: '',
      retail_price: 0,
      wholesale_price: 0,
      stock: 0,
      min_wholesale_qty: 1,
      is_featured: false,
      is_active: true,
      allow_negative_stock: false,
      stock_alert_threshold: 5,
      store_id: profile?.store_id,
      variations: []
    });
    // Limpar imagens do contexto
    clearDraftImages();
  };

  // Check if current price model supports wholesale
  const supportsWholesale = (): boolean => {
    if (!priceModel) return false;
    return priceModel.price_model !== 'retail_only';
  };

  // Função para carregar imagens existentes durante a edição
  const loadProductForEditing = (editingProduct: any) => {
    console.log("📂 WIZARD - Carregando produto para edição:", editingProduct.id);
    
    // Carregar dados do formulário
    updateFormData({
      name: editingProduct.name || '',
      description: editingProduct.description || '',
      category: editingProduct.category || '',
      retail_price: editingProduct.retail_price || 0,
      wholesale_price: editingProduct.wholesale_price || 0,
      stock: editingProduct.stock || 0,
      min_wholesale_qty: editingProduct.min_wholesale_qty || 1,
      is_featured: editingProduct.is_featured || false,
      is_active: editingProduct.is_active !== false,
      allow_negative_stock: editingProduct.allow_negative_stock || false,
      stock_alert_threshold: editingProduct.stock_alert_threshold || 5,
      meta_title: editingProduct.meta_title || '',
      meta_description: editingProduct.meta_description || '',
      keywords: editingProduct.keywords || '',
      seo_slug: editingProduct.seo_slug || '',
    });

    // Carregar imagens existentes
    if (editingProduct.id) {
      console.log("📷 WIZARD - Carregando imagens existentes para produto:", editingProduct.id);
      loadExistingImages(editingProduct.id);
    }
  };

  return {
    formData,
    updateFormData,
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    goToStep,
    canProceed,
    loading,
    setLoading,
    resetForm,
    supportsWholesale,
    priceModel,
    steps,
    isSaving: loading,
    saveProduct,
    loadProductForEditing
  };
};
