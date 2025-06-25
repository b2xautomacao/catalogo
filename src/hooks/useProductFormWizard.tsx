
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
  icon?: React.ComponentType<{ className?: string }>;
}

export const useProductFormWizard = () => {
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
    { id: 'basic', title: 'Informações Básicas', description: 'Nome, descrição e categoria' },
    { id: 'pricing', title: 'Preços e Estoque', description: 'Valores e quantidades' },
    { id: 'variations', title: 'Variações', description: 'Cores, tamanhos e opções' },
    { id: 'images', title: 'Imagens', description: 'Fotos do produto' },
    { id: 'seo', title: 'SEO e Metadados', description: 'Otimização para buscas' },
    { id: 'advanced', title: 'Configurações Avançadas', description: 'Opções extras' }
  ];

  const updateFormData = useCallback((updates: Partial<ProductFormData>) => {
    console.log('🔧 WIZARD - Atualizando dados do formulário:', updates);
    setFormData(prev => {
      const updated = { ...prev, ...updates };
      console.log('📊 WIZARD - Dados atualizados:', {
        step: currentStep,
        name: updated.name,
        retail_price: updated.retail_price,
        stock: updated.stock,
        variations: updated.variations?.length || 0
      });
      return updated;
    });
  }, [currentStep]);

  const validateCurrentStep = useCallback((): boolean => {
    console.log('✅ WIZARD - Validando step:', currentStep);
    console.log('📊 WIZARD - Dados do form para validação:', {
      name: formData.name?.trim(),
      nameLength: formData.name?.trim()?.length || 0,
      retail_price: formData.retail_price,
      stock: formData.stock,
      category: formData.category?.trim()
    });
    
    switch (currentStep) {
      case 0: // Informações Básicas
        const basicValid = !!(formData.name?.trim() && formData.name.trim().length > 0);
        console.log('📝 WIZARD - Step 0 (Básico):', {
          name: formData.name?.trim(),
          nameValid: basicValid,
          valid: basicValid
        });
        return basicValid;
        
      case 1: // Preços e Estoque
        const pricingValid = formData.retail_price > 0 && formData.stock >= 0;
        console.log('💰 WIZARD - Step 1 (Preços):', {
          retail_price: formData.retail_price,
          stock: formData.stock,
          valid: pricingValid
        });
        return pricingValid;
        
      case 2: // Variações (opcional)
      case 3: // Imagens (opcional)
      case 4: // SEO (opcional)
      case 5: // Avançado (opcional)
        console.log(`✅ WIZARD - Step ${currentStep}: sempre válido (opcional)`);
        return true;
        
      default:
        console.error('❌ WIZARD - Step desconhecido:', currentStep);
        return false;
    }
  }, [currentStep, formData]);

  const nextStep = useCallback(() => {
    console.log('➡️ WIZARD - Tentando avançar do step:', currentStep);
    
    const canProceed = validateCurrentStep();
    console.log('🚦 WIZARD - Pode avançar?', canProceed);
    
    if (!canProceed) {
      console.log('🛑 WIZARD - Não pode avançar, validação falhou');
      toast({
        title: 'Dados incompletos',
        description: 'Preencha todos os campos obrigatórios antes de continuar.',
        variant: 'destructive'
      });
      return;
    }
    
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      console.log('✅ WIZARD - Avançando para step:', nextStepIndex);
      setCurrentStep(nextStepIndex);
    }
  }, [currentStep, steps.length, validateCurrentStep, toast]);

  const prevStep = useCallback(() => {
    console.log('⬅️ WIZARD - Voltando do step:', currentStep);
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      console.log('✅ WIZARD - Voltando para step:', prevStepIndex);
      setCurrentStep(prevStepIndex);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    console.log('🎯 WIZARD - Indo direto para step:', stepIndex);
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  const saveProduct = useCallback(async (productId?: string): Promise<string | null> => {
    console.log('💾 WIZARD - Iniciando salvamento do produto');
    console.log('📋 WIZARD - Product ID:', productId);
    console.log('📋 WIZARD - Form Data:', {
      name: formData.name,
      retail_price: formData.retail_price,
      stock: formData.stock,
      category: formData.category,
      description: formData.description?.substring(0, 50) + '...'
    });
    console.log('📋 WIZARD - Draft Images:', draftImages.length);
    console.log('📋 WIZARD - Variations:', formData.variations?.length || 0);

    if (isSaving) {
      console.log('⏳ WIZARD - Já está salvando, ignorando...');
      return null;
    }

    if (!profile?.store_id) {
      console.error('❌ WIZARD - Store ID não encontrado');
      toast({
        title: 'Erro',
        description: 'Loja não identificada. Faça login novamente.',
        variant: 'destructive'
      });
      return null;
    }

    // Validação final dos dados
    if (!formData.name?.trim() || formData.name.trim().length === 0) {
      console.error('❌ WIZARD - Nome vazio ou inválido:', formData.name);
      toast({
        title: 'Erro de validação',
        description: 'Nome do produto é obrigatório.',
        variant: 'destructive'
      });
      return null;
    }

    if (formData.retail_price <= 0) {
      console.error('❌ WIZARD - Preço inválido:', formData.retail_price);
      toast({
        title: 'Erro de validação',
        description: 'Preço de varejo deve ser maior que zero.',
        variant: 'destructive'
      });
      return null;
    }

    setIsSaving(true);

    try {
      // 1. Salvar produto primeiro
      const { variations, ...productDataWithoutVariations } = formData;
      const productData: CreateProductData = {
        ...productDataWithoutVariations,
        store_id: profile.store_id,
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        category: formData.category?.trim() || 'Geral',
        retail_price: Number(formData.retail_price),
        stock: Number(formData.stock)
      };

      console.log('📤 WIZARD - Dados do produto para salvar:', productData);

      let result;
      let savedProductId: string;

      if (productId) {
        console.log('🔄 WIZARD - Atualizando produto existente...');
        result = await updateProduct({
          ...productData,
          id: productId
        });
        savedProductId = productId;
      } else {
        console.log('➕ WIZARD - Criando novo produto...');
        result = await createProduct(productData);
        savedProductId = result.data?.id;
      }

      console.log('📋 WIZARD - Resultado da operação do produto:', result);

      if (result.error || !savedProductId) {
        console.error('❌ WIZARD - Erro na operação do produto:', result.error);
        throw new Error(result.error || 'Erro ao salvar produto');
      }

      console.log('✅ WIZARD - Produto salvo com sucesso:', savedProductId);

      // 2. Salvar imagens se houver
      if (draftImages.length > 0) {
        console.log('📷 WIZARD - Fazendo upload de imagens...');
        try {
          const uploadedUrls = await uploadDraftImages(savedProductId);
          console.log('✅ WIZARD - Upload de imagens concluído:', uploadedUrls.length);
        } catch (uploadError) {
          console.error('❌ WIZARD - Erro no upload de imagens:', uploadError);
          // Não falhar o produto por causa das imagens
        }
      }

      // 3. Salvar variações se houver
      if (formData.variations && formData.variations.length > 0) {
        console.log('🎨 WIZARD - Salvando variações...');
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
            console.log('✅ WIZARD - Variações salvas com sucesso');
          } else {
            console.error('❌ WIZARD - Erro ao salvar variações:', variationResult.error);
          }
        } catch (variationError) {
          console.error('❌ WIZARD - Erro nas variações:', variationError);
          // Não falhar o produto por causa das variações
        }
      }

      // Sucesso
      toast({ 
        title: productId ? 'Produto atualizado!' : 'Produto criado!',
        description: `${formData.name} foi ${productId ? 'atualizado' : 'criado'} com sucesso.`
      });
      
      console.log('🎉 WIZARD - Processo completo com sucesso');
      return savedProductId;
      
    } catch (error) {
      console.error('💥 WIZARD - Erro no salvamento:', error);
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
    console.log('🔄 WIZARD - Resetando formulário');
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
