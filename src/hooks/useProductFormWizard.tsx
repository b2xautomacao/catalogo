
import { useState, useCallback } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { useDraftImages } from '@/hooks/useDraftImages';
import { useAuth } from '@/hooks/useAuth';

export interface ProductFormData {
  name: string;
  description: string;
  retail_price: number;
  wholesale_price?: number;
  min_wholesale_qty?: number;
  stock: number;
  category: string;
  keywords: string;
  meta_title: string;
  meta_description: string;
  is_featured?: boolean;
  allow_negative_stock?: boolean;
  stock_alert_threshold?: number;
}

export const useProductFormWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    retail_price: 0,
    wholesale_price: undefined,
    min_wholesale_qty: 1,
    stock: 0,
    category: '',
    keywords: '',
    meta_title: '',
    meta_description: '',
    is_featured: false,
    allow_negative_stock: false,
    stock_alert_threshold: 5,
  });

  const { createProduct, updateProduct } = useProducts();
  const { uploadDraftImages, clearDraftImages, draftImages } = useDraftImages();
  const { toast } = useToast();
  const { profile } = useAuth();

  const updateFormData = useCallback((updates: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => prev - 1);
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const saveProduct = useCallback(async (productId?: string): Promise<string | null> => {
    if (!profile?.store_id) {
      toast({
        title: 'Erro',
        description: 'Store ID não encontrado',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsSaving(true);
      console.log('🔄 Salvando produto...', { productId, hasImages: draftImages.length > 0 });
      
      // Preparar dados do produto
      const productData = {
        ...formData,
        store_id: profile.store_id,
        image_url: undefined
      };

      let finalProductId: string;

      if (productId) {
        // Atualizar produto existente
        const { data: updatedProduct, error } = await updateProduct(productId, productData);
        if (error || !updatedProduct) {
          throw new Error(error || 'Falha ao atualizar produto');
        }
        finalProductId = productId;
        console.log('✅ Produto atualizado:', finalProductId);
      } else {
        // Criar novo produto
        const { data: newProduct, error } = await createProduct(productData);
        if (error || !newProduct) {
          throw new Error(error || 'Falha ao criar produto');
        }
        finalProductId = newProduct.id;
        console.log('✅ Produto criado:', finalProductId);
      }

      // Upload das imagens se houver
      if (draftImages.length > 0) {
        console.log('📸 Iniciando upload de imagens...');
        const uploadedUrls = await uploadDraftImages(finalProductId);
        console.log('📸 Upload concluído:', uploadedUrls.length, 'imagens');
        
        if (uploadedUrls.length === 0) {
          toast({
            title: 'Aviso',
            description: 'Produto salvo, mas houve problemas no upload das imagens',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Sucesso!',
        description: productId ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!',
      });

      return finalProductId;

    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar produto',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [formData, draftImages, createProduct, updateProduct, uploadDraftImages, toast, profile?.store_id]);

  const resetForm = useCallback(() => {
    setCurrentStep(0);
    setFormData({
      name: '',
      description: '',
      retail_price: 0,
      wholesale_price: undefined,
      min_wholesale_qty: 1,
      stock: 0,
      category: '',
      keywords: '',
      meta_title: '',
      meta_description: '',
      is_featured: false,
      allow_negative_stock: false,
      stock_alert_threshold: 5,
    });
    clearDraftImages();
  }, [clearDraftImages]);

  const steps = [
    { id: 'basic', title: 'Informações Básicas', description: 'Nome, descrição e categoria' },
    { id: 'pricing', title: 'Preços e Estoque', description: 'Valores e quantidades' },
    { id: 'images', title: 'Imagens', description: 'Fotos do produto' },
    { id: 'seo', title: 'SEO', description: 'Otimização para busca' },
    { id: 'advanced', title: 'Avançado', description: 'Configurações extras' },
  ];

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
  };
};
