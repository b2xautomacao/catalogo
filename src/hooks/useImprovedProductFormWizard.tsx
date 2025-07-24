
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStorePriceModel } from '@/hooks/useStorePriceModel';
import { PriceModelType } from '@/types/price-models';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
        
      case 1: // Pricing
        const hasValidRetailPrice = formData.retail_price > 0;
        console.log('🔍 WIZARD - Step 1 validation:', { 
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
        
      case 5: // Review
        const finalValidation = formData.name?.trim() && 
                               formData.category?.trim() && 
                               formData.retail_price > 0;
        console.log('🔍 WIZARD - Final validation:', { 
          finalValidation,
          name: formData.name,
          category: formData.category,
          retail_price: formData.retail_price
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
      
      if (!formData.retail_price || formData.retail_price <= 0) {
        throw new Error('Preço de varejo deve ser maior que zero');
      }
      
      if (!profile?.store_id) {
        throw new Error('Store ID não encontrado');
      }

      const productData = {
        name: formData.name.trim(),
        description: formData.description || '',
        category: formData.category.trim(),
        retail_price: formData.retail_price,
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
  };

  // Check if current price model supports wholesale
  const supportsWholesale = (): boolean => {
    if (!priceModel) return false;
    return priceModel.price_model !== 'retail_only';
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
    saveProduct
  };
};
