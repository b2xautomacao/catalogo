
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
  
  // Estado inicial com valores padrão mais robustos
  const [formData, setFormData] = useState<ProductFormData>({
    store_id: profile?.store_id || '',
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
    console.log('🔧 IMPROVED WIZARD - Atualizando formData:', {
      currentStep,
      updates: Object.keys(updates),
      nameUpdate: updates.name ? `"${updates.name.trim()}"` : 'não alterado',
      priceUpdate: updates.retail_price !== undefined ? updates.retail_price : 'não alterado'
    });
    
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      
      // Garantir que store_id está sempre presente
      if (!newData.store_id && profile?.store_id) {
        newData.store_id = profile.store_id;
      }
      
      console.log('📊 IMPROVED WIZARD - FormData após atualização:', {
        name: `"${newData.name?.trim() || ''}"`,
        nameLength: newData.name?.trim()?.length || 0,
        retail_price: newData.retail_price,
        stock: newData.stock,
        store_id: newData.store_id,
        hasStoreId: !!newData.store_id
      });
      
      return newData;
    });
  }, [currentStep, profile?.store_id]);

  const validateCurrentStep = useCallback((): boolean => {
    console.log('✅ IMPROVED WIZARD - Validando step:', currentStep);
    
    const currentStepData = steps[currentStep];
    if (!currentStepData.required) {
      console.log('📝 IMPROVED WIZARD - Step opcional, sempre válido:', currentStep);
      return true;
    }
    
    // Dados atuais para validação
    const nameToValidate = formData.name?.trim() || '';
    const priceToValidate = formData.retail_price || 0;
    const stockToValidate = formData.stock || 0;
    
    console.log('📊 IMPROVED WIZARD - Dados para validação:', {
      step: currentStep,
      name: `"${nameToValidate}"`,
      nameLength: nameToValidate.length,
      retail_price: priceToValidate,
      stock: stockToValidate,
      store_id: formData.store_id
    });
    
    switch (currentStep) {
      case 0: // Informações Básicas
        const hasValidName = nameToValidate.length > 0;
        console.log('📝 IMPROVED WIZARD - Validação básica:', { 
          hasValidName, 
          nameValue: `"${nameToValidate}"`,
          nameLength: nameToValidate.length
        });
        return hasValidName;
        
      case 1: // Preços e Estoque
        const validPricing = priceToValidate > 0 && stockToValidate >= 0;
        console.log('💰 IMPROVED WIZARD - Validação preços:', {
          retail_price: priceToValidate,
          stock: stockToValidate,
          valid: validPricing
        });
        return validPricing;
        
      default:
        return true;
    }
  }, [currentStep, formData, steps]);

  const nextStep = useCallback(() => {
    console.log('➡️ IMPROVED WIZARD - Tentando avançar do step:', currentStep);
    
    const canProceed = validateCurrentStep();
    console.log('🚦 IMPROVED WIZARD - Pode avançar?', canProceed);
    
    if (!canProceed) {
      console.log('🛑 IMPROVED WIZARD - Não pode avançar, dados incompletos');
      
      let message = 'Preencha todos os campos obrigatórios antes de continuar.';
      
      if (currentStep === 0) {
        message = 'Nome do produto é obrigatório.';
        console.log('🔍 IMPROVED WIZARD - Problema no nome:', {
          formDataName: formData.name,
          trimmedName: formData.name?.trim(),
          nameLength: formData.name?.trim()?.length || 0
        });
      } else if (currentStep === 1) {
        message = 'Preço de varejo deve ser maior que zero e estoque não pode ser negativo.';
        console.log('🔍 IMPROVED WIZARD - Problema nos preços:', {
          retail_price: formData.retail_price,
          stock: formData.stock
        });
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
      console.log('✅ IMPROVED WIZARD - Avançando para step:', nextStepIndex);
      setCurrentStep(nextStepIndex);
    }
  }, [currentStep, steps.length, validateCurrentStep, toast, formData]);

  const prevStep = useCallback(() => {
    console.log('⬅️ IMPROVED WIZARD - Voltando do step:', currentStep);
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      console.log('✅ IMPROVED WIZARD - Voltando para step:', prevStepIndex);
      setCurrentStep(prevStepIndex);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    console.log('🎯 IMPROVED WIZARD - Indo para step:', stepIndex);
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  const saveProduct = useCallback(async (productId?: string): Promise<string | null> => {
    console.log('💾 IMPROVED WIZARD - Iniciando salvamento');
    console.log('📋 IMPROVED WIZARD - Product ID:', productId);
    
    // Dados atuais no momento do salvamento
    const currentName = formData.name?.trim() || '';
    const currentPrice = formData.retail_price || 0;
    const currentStock = formData.stock || 0;
    const currentStoreId = formData.store_id || profile?.store_id;
    
    console.log('📋 IMPROVED WIZARD - Dados no momento do salvamento:', {
      name: `"${currentName}"`,
      nameLength: currentName.length,
      retail_price: currentPrice,
      stock: currentStock,
      store_id: currentStoreId,
      variations: formData.variations?.length || 0
    });

    if (isSaving) {
      console.log('⏳ IMPROVED WIZARD - Já está salvando, ignorando...');
      return null;
    }

    if (!currentStoreId) {
      console.error('❌ IMPROVED WIZARD - Store ID não encontrado');
      toast({
        title: 'Erro',
        description: 'Loja não identificada. Faça login novamente.',
        variant: 'destructive'
      });
      return null;
    }

    // Validação final obrigatória com dados atuais
    if (!currentName || currentName.length === 0) {
      console.error('❌ IMPROVED WIZARD - Nome vazio no salvamento:', {
        formDataName: formData.name,
        trimmedName: currentName,
        nameLength: currentName.length
      });
      toast({
        title: 'Erro de validação',
        description: 'Nome do produto é obrigatório.',
        variant: 'destructive'
      });
      return null;
    }

    if (currentPrice <= 0) {
      console.error('❌ IMPROVED WIZARD - Preço inválido:', currentPrice);
      toast({
        title: 'Erro de validação',
        description: 'Preço de varejo deve ser maior que zero.',
        variant: 'destructive'
      });
      return null;
    }

    setIsSaving(true);

    try {
      // 1. Preparar dados do produto com valores atuais
      const { variations, ...productDataWithoutVariations } = formData;
      const productData: CreateProductData = {
        ...productDataWithoutVariations,
        store_id: currentStoreId,
        name: currentName,
        description: formData.description?.trim() || '',
        category: formData.category?.trim() || 'Geral',
        retail_price: Number(currentPrice),
        stock: Number(currentStock)
      };

      console.log('📤 IMPROVED WIZARD - Dados limpos para salvamento:', productData);

      // 2. Salvar produto
      let result;
      let savedProductId: string;

      if (productId) {
        console.log('🔄 IMPROVED WIZARD - Atualizando produto existente');
        result = await updateProduct({ ...productData, id: productId });
        savedProductId = productId;
      } else {
        console.log('➕ IMPROVED WIZARD - Criando novo produto');
        result = await createProduct(productData);
        savedProductId = result.data?.id;
      }

      if (result.error || !savedProductId) {
        console.error('❌ IMPROVED WIZARD - Erro ao salvar produto:', result.error);
        throw new Error(result.error || 'Erro ao salvar produto');
      }

      console.log('✅ IMPROVED WIZARD - Produto salvo:', savedProductId);

      // 3. Upload de imagens
      if (draftImages.length > 0) {
        console.log('📷 IMPROVED WIZARD - Fazendo upload de imagens');
        try {
          const uploadedUrls = await uploadDraftImages(savedProductId);
          console.log('✅ IMPROVED WIZARD - Upload concluído:', uploadedUrls.length);
        } catch (uploadError) {
          console.error('❌ IMPROVED WIZARD - Erro no upload:', uploadError);
          // Não falhar o produto por causa das imagens
        }
      }

      // 4. Salvar variações
      if (formData.variations && formData.variations.length > 0) {
        console.log('🎨 IMPROVED WIZARD - Salvando variações:', formData.variations.length);
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
            console.log('✅ IMPROVED WIZARD - Variações salvas');
          } else {
            console.error('❌ IMPROVED WIZARD - Erro nas variações:', variationResult.error);
          }
        } catch (variationError) {
          console.error('❌ IMPROVED WIZARD - Erro ao salvar variações:', variationError);
        }
      }

      // Sucesso
      toast({ 
        title: productId ? 'Produto atualizado!' : 'Produto criado!',
        description: `${currentName} foi ${productId ? 'atualizado' : 'criado'} com sucesso.`
      });
      
      console.log('🎉 IMPROVED WIZARD - Processo completo!');
      return savedProductId;
      
    } catch (error) {
      console.error('💥 IMPROVED WIZARD - Erro no salvamento:', error);
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
    console.log('🔄 IMPROVED WIZARD - Resetando formulário');
    setFormData({
      store_id: profile?.store_id || '',
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
  }, [clearDraftImages, profile?.store_id]);

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
