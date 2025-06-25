
import { useState, useCallback } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useDraftImages } from '@/hooks/useDraftImages';
import { useProductVariations } from '@/hooks/useProductVariations';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CreateProductData } from '@/types/product';

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
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

export const useImprovedProductFormWizard = () => {
  const { createProduct, updateProduct } = useProducts();
  const { draftImages, uploadDraftImages, clearDraftImages } = useDraftImages();
  const { saveVariations } = useProductVariations();
  const { toast } = useToast();
  const { profile } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    store_id: '',
    name: '',
    description: '',
    retail_price: 0,
    wholesale_price: undefined,
    category: '',
    stock: 0,
    min_wholesale_qty: 1,
    meta_title: '',
    meta_description: '',
    keywords: '',
    seo_slug: '',
    is_featured: false,
    allow_negative_stock: false,
    stock_alert_threshold: 5,
    is_active: true,
    variations: []
  });

  const steps: WizardStep[] = [
    { id: 'basic', title: 'Informações Básicas', description: 'Nome, descrição e categoria', required: true },
    { id: 'pricing', title: 'Preços e Estoque', description: 'Valores e quantidades', required: true },
    { id: 'variations', title: 'Variações', description: 'Cores, tamanhos e opções', required: false },
    { id: 'images', title: 'Imagens', description: 'Fotos do produto', required: false },
    { id: 'seo', title: 'SEO e Metadados', description: 'Otimização para buscas', required: false },
    { id: 'advanced', title: 'Configurações Avançadas', description: 'Opções extras', required: false }
  ];

  const updateFormData = useCallback((updates: Partial<ProductFormData>) => {
    console.log('🔧 WIZARD IMPROVED - Atualizando dados:', Object.keys(updates));
    setFormData(prev => {
      const updated = { ...prev, ...updates };
      console.log('📊 WIZARD IMPROVED - Dados após atualização:', {
        step: currentStep,
        name: updated.name?.trim(),
        nameLength: updated.name?.trim()?.length || 0,
        retail_price: updated.retail_price,
        stock: updated.stock,
        variations: updated.variations?.length || 0
      });
      return updated;
    });
  }, [currentStep]);

  const validateCurrentStep = useCallback((): boolean => {
    console.log('✅ WIZARD IMPROVED - Validando step:', currentStep);
    
    const currentStepData = steps[currentStep];
    if (!currentStepData.required) {
      console.log('📝 WIZARD IMPROVED - Step opcional, sempre válido:', currentStep);
      return true;
    }
    
    console.log('📊 WIZARD IMPROVED - Dados para validação:', {
      name: formData.name?.trim(),
      nameLength: formData.name?.trim()?.length || 0,
      retail_price: formData.retail_price,
      stock: formData.stock
    });
    
    switch (currentStep) {
      case 0: // Informações Básicas
        const hasName = formData.name?.trim() && formData.name.trim().length > 0;
        console.log('📝 WIZARD IMPROVED - Validação básica:', { hasName, name: formData.name?.trim() });
        return hasName;
        
      case 1: // Preços e Estoque
        const validPricing = formData.retail_price > 0 && formData.stock >= 0;
        console.log('💰 WIZARD IMPROVED - Validação preços:', {
          retail_price: formData.retail_price,
          stock: formData.stock,
          valid: validPricing
        });
        return validPricing;
        
      default:
        return true;
    }
  }, [currentStep, formData, steps]);

  const nextStep = useCallback(() => {
    console.log('➡️ WIZARD IMPROVED - Tentando avançar do step:', currentStep);
    
    const canProceed = validateCurrentStep();
    console.log('🚦 WIZARD IMPROVED - Pode avançar?', canProceed);
    
    if (!canProceed) {
      console.log('🛑 WIZARD IMPROVED - Não pode avançar, dados incompletos');
      
      const currentStepData = steps[currentStep];
      let message = 'Preencha todos os campos obrigatórios antes de continuar.';
      
      if (currentStep === 0) {
        message = 'Nome do produto é obrigatório.';
      } else if (currentStep === 1) {
        message = 'Preço de varejo deve ser maior que zero e estoque não pode ser negativo.';
      }
      
      toast({
        title: 'Dados incompletos',
        description: message,
        variant: 'destructive'
      });
      return;
    }
    
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      console.log('✅ WIZARD IMPROVED - Avançando para step:', nextStepIndex);
      setCurrentStep(nextStepIndex);
    }
  }, [currentStep, steps.length, validateCurrentStep, toast]);

  const prevStep = useCallback(() => {
    console.log('⬅️ WIZARD IMPROVED - Voltando do step:', currentStep);
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      console.log('✅ WIZARD IMPROVED - Voltando para step:', prevStepIndex);
      setCurrentStep(prevStepIndex);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    console.log('🎯 WIZARD IMPROVED - Indo para step:', stepIndex);
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  const saveProduct = useCallback(async (productId?: string): Promise<string | null> => {
    console.log('💾 WIZARD IMPROVED - Iniciando salvamento');
    console.log('📋 WIZARD IMPROVED - Product ID:', productId);
    console.log('📋 WIZARD IMPROVED - Form Data:', {
      name: formData.name?.trim(),
      retail_price: formData.retail_price,
      stock: formData.stock,
      category: formData.category?.trim(),
      variations: formData.variations?.length || 0
    });

    if (isSaving) {
      console.log('⏳ WIZARD IMPROVED - Já está salvando, ignorando...');
      return null;
    }

    if (!profile?.store_id) {
      console.error('❌ WIZARD IMPROVED - Store ID não encontrado');
      toast({
        title: 'Erro',
        description: 'Loja não identificada. Faça login novamente.',
        variant: 'destructive'
      });
      return null;
    }

    // Validação final obrigatória
    const trimmedName = formData.name?.trim();
    if (!trimmedName || trimmedName.length === 0) {
      console.error('❌ WIZARD IMPROVED - Nome vazio:', formData.name);
      toast({
        title: 'Erro de validação',
        description: 'Nome do produto é obrigatório.',
        variant: 'destructive'
      });
      return null;
    }

    if (formData.retail_price <= 0) {
      console.error('❌ WIZARD IMPROVED - Preço inválido:', formData.retail_price);
      toast({
        title: 'Erro de validação',
        description: 'Preço de varejo deve ser maior que zero.',
        variant: 'destructive'
      });
      return null;
    }

    setIsSaving(true);

    try {
      // 1. Preparar dados do produto
      const { variations, ...productDataWithoutVariations } = formData;
      const productData: CreateProductData = {
        ...productDataWithoutVariations,
        store_id: profile.store_id,
        name: trimmedName,
        description: formData.description?.trim() || '',
        category: formData.category?.trim() || 'Geral',
        retail_price: Number(formData.retail_price),
        stock: Number(formData.stock)
      };

      console.log('📤 WIZARD IMPROVED - Salvando produto:', productData);

      // 2. Salvar produto
      let result;
      let savedProductId: string;

      if (productId) {
        console.log('🔄 WIZARD IMPROVED - Atualizando produto existente');
        result = await updateProduct({ ...productData, id: productId });
        savedProductId = productId;
      } else {
        console.log('➕ WIZARD IMPROVED - Criando novo produto');
        result = await createProduct(productData);
        savedProductId = result.data?.id;
      }

      if (result.error || !savedProductId) {
        console.error('❌ WIZARD IMPROVED - Erro ao salvar produto:', result.error);
        throw new Error(result.error || 'Erro ao salvar produto');
      }

      console.log('✅ WIZARD IMPROVED - Produto salvo:', savedProductId);

      // 3. Upload de imagens
      if (draftImages.length > 0) {
        console.log('📷 WIZARD IMPROVED - Fazendo upload de imagens');
        try {
          const uploadedUrls = await uploadDraftImages(savedProductId);
          console.log('✅ WIZARD IMPROVED - Upload concluído:', uploadedUrls.length);
        } catch (uploadError) {
          console.error('❌ WIZARD IMPROVED - Erro no upload:', uploadError);
          // Não falhar o produto por causa das imagens
        }
      }

      // 4. Salvar variações
      if (formData.variations && formData.variations.length > 0) {
        console.log('🎨 WIZARD IMPROVED - Salvando variações:', formData.variations.length);
        try {
          const variationsToSave = formData.variations.map(variation => ({
            color: variation.color || null,
            size: variation.size || null,
            sku: variation.sku || null,
            stock: variation.stock,
            price_adjustment: variation.price_adjustment,
            is_active: variation.is_active,
            image_url: variation.image_url || null
          }));

          const variationResult = await saveVariations(savedProductId, variationsToSave);
          if (variationResult.success) {
            console.log('✅ WIZARD IMPROVED - Variações salvas');
          } else {
            console.error('❌ WIZARD IMPROVED - Erro nas variações:', variationResult.error);
          }
        } catch (variationError) {
          console.error('❌ WIZARD IMPROVED - Erro ao salvar variações:', variationError);
        }
      }

      // Sucesso
      toast({ 
        title: productId ? 'Produto atualizado!' : 'Produto criado!',
        description: `${trimmedName} foi ${productId ? 'atualizado' : 'criado'} com sucesso.`
      });
      
      console.log('🎉 WIZARD IMPROVED - Processo completo!');
      return savedProductId;
      
    } catch (error) {
      console.error('💥 WIZARD IMPROVED - Erro no salvamento:', error);
      toast({
        title: 'Erro ao salvar produto',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [formData, profile?.store_id, draftImages, createProduct, updateProduct, uploadDraftImages, saveVariations, toast, isSaving]);

  const resetForm = useCallback(() => {
    console.log('🔄 WIZARD IMPROVED - Resetando formulário');
    setFormData({
      store_id: '',
      name: '',
      description: '',
      retail_price: 0,
      wholesale_price: undefined,
      category: '',
      stock: 0,
      min_wholesale_qty: 1,
      meta_title: '',
      meta_description: '',
      keywords: '',
      seo_slug: '',
      is_featured: false,
      allow_negative_stock: false,
      stock_alert_threshold: 5,
      is_active: true,
      variations: []
    });
    setCurrentStep(0);
    clearDraftImages();
  }, [clearDraftImages]);

  const canProceed = validateCurrentStep();

  return {
    currentStep,
    steps,
    formData,
    isSaving,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    validateCurrentStep,
    saveProduct,
    resetForm,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    canProceed
  };
};
