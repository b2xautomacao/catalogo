
import { useState, useCallback } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useDraftImages } from '@/hooks/useDraftImages';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface ProductFormData {
  name: string;
  description?: string;
  retail_price: number;
  wholesale_price?: number;
  category?: string;
  stock: number;
  min_wholesale_qty?: number;
  image_url?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  seo_slug?: string;
  is_featured?: boolean;
  allow_negative_stock?: boolean;
  stock_alert_threshold?: number;
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
  const { toast } = useToast();
  const { profile } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    retail_price: 0,
    wholesale_price: undefined,
    category: '',
    stock: 0,
    min_wholesale_qty: 1,
    image_url: '',
    meta_title: '',
    meta_description: '',
    keywords: '',
    seo_slug: '',
    is_featured: false,
    allow_negative_stock: false,
    stock_alert_threshold: 5,
  });

  const steps: WizardStep[] = [
    { id: 'basic', title: 'Informações Básicas', description: 'Nome, descrição e categoria' },
    { id: 'pricing', title: 'Preços e Estoque', description: 'Valores e quantidades' },
    { id: 'images', title: 'Imagens', description: 'Fotos do produto' },
    { id: 'seo', title: 'SEO e Metadados', description: 'Otimização para buscas' },
    { id: 'advanced', title: 'Configurações Avançadas', description: 'Opções extras' }
  ];

  const updateFormData = useCallback((updates: Partial<ProductFormData>) => {
    console.log('=== ATUALIZANDO DADOS DO FORMULÁRIO ===');
    console.log('Updates:', updates);
    setFormData(prev => {
      const updated = { ...prev, ...updates };
      console.log('Dados atualizados:', updated);
      return updated;
    });
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  const validateCurrentStep = useCallback((): boolean => {
    switch (currentStep) {
      case 0: // Informações Básicas
        return !!(formData.name?.trim() && formData.retail_price > 0);
      case 1: // Preços e Estoque
        return formData.retail_price > 0 && formData.stock >= 0;
      case 2: // Imagens
        return true; // Opcional
      case 3: // SEO
        return true; // Opcional
      case 4: // Avançado
        return true; // Opcional
      default:
        return true;
    }
  }, [currentStep, formData]);

  const saveProduct = useCallback(async (productId?: string): Promise<string | null> => {
    console.log('=== INICIANDO PROCESSO DE SALVAMENTO ===');
    console.log('Product ID recebido:', productId);
    console.log('Form Data:', formData);
    console.log('Draft Images count:', draftImages.length);

    if (isSaving) {
      console.log('Já está salvando, ignorando chamada...');
      return null;
    }

    if (!profile?.store_id) {
      console.error('Store ID não encontrado');
      toast({
        title: 'Erro',
        description: 'Loja não identificada. Faça login novamente.',
        variant: 'destructive'
      });
      return null;
    }

    if (!formData.name?.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'Nome do produto é obrigatório.',
        variant: 'destructive'
      });
      return null;
    }

    if (formData.retail_price <= 0) {
      toast({
        title: 'Erro de validação',
        description: 'Preço de varejo deve ser maior que zero.',
        variant: 'destructive'
      });
      return null;
    }

    setIsSaving(true);

    try {
      // 1. Preparar dados do produto - CORRIGIDO: removendo referências a 'price'
      const productData = {
        store_id: profile.store_id,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        retail_price: formData.retail_price,
        wholesale_price: formData.wholesale_price || null,
        category: formData.category?.trim() || null,
        stock: formData.stock,
        min_wholesale_qty: formData.min_wholesale_qty || 1,
        meta_title: formData.meta_title?.trim() || null,
        meta_description: formData.meta_description?.trim() || null,
        keywords: formData.keywords?.trim() || null,
        seo_slug: formData.seo_slug?.trim() || null,
        is_featured: formData.is_featured || false,
        allow_negative_stock: formData.allow_negative_stock || false,
        stock_alert_threshold: formData.stock_alert_threshold || 5,
      };

      console.log('=== SALVANDO DADOS DO PRODUTO ===');
      console.log('Dados para salvar:', productData);

      let result;
      let savedProductId: string;

      if (productId) {
        // Atualizar produto existente
        console.log('Atualizando produto existente...');
        result = await updateProduct({
          ...productData,
          id: productId
        });
        savedProductId = productId;
      } else {
        // Criar novo produto
        console.log('Criando novo produto...');
        result = await createProduct(productData);
        savedProductId = result.data?.id;
      }

      console.log('Resultado da operação:', result);

      if (result.error || !savedProductId) {
        console.error('Erro na operação do produto:', result.error);
        throw new Error(result.error || 'Erro ao salvar produto');
      }

      console.log('=== PRODUTO SALVO COM SUCESSO ===');

      // 2. Upload das imagens se houver
      if (draftImages.length > 0) {
        console.log('=== INICIANDO UPLOAD DE IMAGENS ===');
        await uploadDraftImages(savedProductId);
        console.log('=== UPLOAD DE IMAGENS CONCLUÍDO ===');
      }

      // 3. Exibir sucesso
      toast({ 
        title: productId ? 'Produto atualizado!' : 'Produto criado!',
        description: `${formData.name} foi ${productId ? 'atualizado' : 'criado'} com sucesso.`
      });
      
      console.log('=== PROCESSO COMPLETO COM SUCESSO ===');
      return savedProductId;
      
    } catch (error) {
      console.error('=== ERRO NO PROCESSO DE SALVAMENTO ===');
      console.error('Erro completo:', error);
      toast({
        title: 'Erro ao salvar produto',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [formData, profile?.store_id, draftImages, createProduct, updateProduct, uploadDraftImages, toast, isSaving]);

  const resetForm = useCallback(() => {
    console.log('=== RESETANDO FORMULÁRIO ===');
    setFormData({
      name: '',
      description: '',
      retail_price: 0,
      wholesale_price: undefined,
      category: '',
      stock: 0,
      min_wholesale_qty: 1,
      image_url: '',
      meta_title: '',
      meta_description: '',
      keywords: '',
      seo_slug: '',
      is_featured: false,
      allow_negative_stock: false,
      stock_alert_threshold: 5,
    });
    setCurrentStep(0);
    clearDraftImages();
  }, [clearDraftImages]);

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
    canProceed: validateCurrentStep()
  };
};
