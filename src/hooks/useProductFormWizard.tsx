
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
    wholesale_price: 0,
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
    console.log('Atualizando dados do formulário:', updates);
    setFormData(prev => ({ ...prev, ...updates }));
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
        return !!(formData.name && formData.retail_price > 0);
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
    if (isSaving) {
      console.log('Já está salvando, ignorando...');
      return null;
    }

    console.log('=== INICIANDO SALVAMENTO ===');
    console.log('Product ID:', productId);
    console.log('Form Data:', formData);
    console.log('Draft Images:', draftImages.length);
    console.log('Store ID:', profile?.store_id);

    try {
      setIsSaving(true);
      
      // Validar store_id
      if (!profile?.store_id) {
        throw new Error('Store ID é obrigatório para salvar o produto');
      }

      // Preparar dados do produto
      const productData = {
        ...formData,
        store_id: profile.store_id,
      };

      console.log('Dados preparados para salvamento:', productData);

      let result;
      let savedProductId: string;

      if (productId) {
        // Atualizar produto existente
        console.log('=== ATUALIZANDO PRODUTO EXISTENTE ===');
        result = await updateProduct({
          ...productData,
          id: productId
        });
        savedProductId = productId;
      } else {
        // Criar novo produto
        console.log('=== CRIANDO NOVO PRODUTO ===');
        result = await createProduct(productData);
        savedProductId = result.data?.id;
      }

      console.log('Resultado da operação de produto:', result);

      if (result.error || !savedProductId) {
        throw new Error(result.error || 'Erro ao salvar produto - ID não retornado');
      }

      console.log('=== PRODUTO SALVO COM SUCESSO ===');
      console.log('Product ID salvo:', savedProductId);

      // Upload das imagens se houver
      if (draftImages.length > 0) {
        console.log('=== INICIANDO UPLOAD DE IMAGENS ===');
        console.log('Imagens para upload:', draftImages.length);
        
        const uploadedUrls = await uploadDraftImages(savedProductId);
        console.log('=== UPLOAD DE IMAGENS CONCLUÍDO ===');
        console.log('URLs das imagens:', uploadedUrls);
        
        if (uploadedUrls.length > 0) {
          console.log('Atualizando produto com imagem principal:', uploadedUrls[0]);
          // A função uploadDraftImages já atualiza o produto com a primeira imagem
        }
      } else {
        console.log('=== NENHUMA IMAGEM PARA UPLOAD ===');
      }

      toast({ 
        title: productId ? 'Produto atualizado!' : 'Produto criado!',
        description: `${formData.name} foi ${productId ? 'atualizado' : 'criado'} com sucesso.`
      });
      
      console.log('=== SALVAMENTO CONCLUÍDO COM SUCESSO ===');
      return savedProductId;
      
    } catch (error) {
      console.error('=== ERRO NO SALVAMENTO ===');
      console.error('Erro:', error);
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
    console.log('Resetando formulário...');
    setFormData({
      name: '',
      description: '',
      retail_price: 0,
      wholesale_price: 0,
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
