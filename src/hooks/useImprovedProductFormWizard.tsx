
import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDraftImages } from '@/hooks/useDraftImages';
import { useAuth } from '@/hooks/useAuth';

export interface ProductFormData {
  name: string;
  description?: string; // Tornando opcional para compatibilidade
  retail_price: number;
  wholesale_price?: number;
  min_wholesale_qty: number;
  stock: number;
  category: string;
  keywords: string;
  meta_title: string;
  meta_description: string;
  seo_slug: string;
  is_featured: boolean;
  allow_negative_stock: boolean;
  stock_alert_threshold: number;
  variations: any[];
  store_id: string; // Obrigatório mas será preenchido automaticamente
}

const initialFormData: ProductFormData = {
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
  seo_slug: '',
  is_featured: false,
  allow_negative_stock: false,
  stock_alert_threshold: 5,
  variations: [],
  store_id: '', // Será preenchido pelo hook
};

export const useImprovedProductFormWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { draftImages, uploadDraftImages, clearDraftImages } = useDraftImages();
  const { profile } = useAuth();

  const steps = useMemo(() => [
    { id: 'basic', title: 'Informações Básicas', description: 'Nome, categoria e descrição' },
    { id: 'pricing', title: 'Preços e Estoque', description: 'Valores e quantidades' },
    { id: 'images', title: 'Imagens', description: 'Fotos do produto' },
    { id: 'variations', title: 'Variações', description: 'Cores, tamanhos e opções' },
    { id: 'seo', title: 'SEO', description: 'Otimização para buscadores' },
    { id: 'review', title: 'Revisão', description: 'Conferir e finalizar' }
  ], []);

  const updateFormData = useCallback((updates: Partial<ProductFormData>) => {
    setFormData(prev => {
      const updated = { ...prev, ...updates };
      // Garantir que store_id está sempre presente
      if (!updated.store_id && profile?.store_id) {
        updated.store_id = profile.store_id;
      }
      return updated;
    });
  }, [profile?.store_id]);

  const canProceed = useMemo(() => {
    const trimmedName = formData.name?.trim() || '';
    
    switch (currentStep) {
      case 0: // Informações básicas
        return trimmedName.length > 0;
      case 1: // Preços e estoque
        return formData.retail_price > 0 && formData.stock >= 0;
      case 2: // Imagens (opcional)
      case 3: // Variações (opcional)
      case 4: // SEO (opcional)
      case 5: // Revisão
        return true;
      default:
        return false;
    }
  }, [currentStep, formData.name, formData.retail_price, formData.stock]);

  const nextStep = useCallback(() => {
    if (canProceed && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [canProceed, currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  }, [steps.length]);

  const saveProduct = async (editingProductId?: string): Promise<string | null> => {
    if (!canProceed) {
      console.error('❌ WIZARD SAVE - Dados inválidos para salvamento');
      return null;
    }

    if (!profile?.store_id) {
      console.error('❌ WIZARD SAVE - Store ID não encontrado');
      toast({
        title: "Erro",
        description: "ID da loja não encontrado",
        variant: "destructive",
      });
      return null;
    }

    setIsSaving(true);
    
    try {
      console.log('💾 WIZARD SAVE - Iniciando salvamento do produto');
      console.log('📊 WIZARD SAVE - Dados atuais:', {
        name: `"${formData.name?.trim()}"`,
        nameLength: formData.name?.trim()?.length,
        retail_price: formData.retail_price,
        stock: formData.stock,
        store_id: profile.store_id,
        isEditing: !!editingProductId
      });

      // Preparar dados do produto - incluindo store_id obrigatório
      const productData = {
        name: formData.name.trim(),
        description: formData.description || '',
        retail_price: formData.retail_price,
        wholesale_price: formData.wholesale_price || null,
        min_wholesale_qty: formData.min_wholesale_qty || 1,
        stock: formData.stock,
        category: formData.category || '',
        keywords: formData.keywords || '',
        meta_title: formData.meta_title || '',
        meta_description: formData.meta_description || '',
        seo_slug: formData.seo_slug || '',
        is_featured: formData.is_featured || false,
        allow_negative_stock: formData.allow_negative_stock || false,
        stock_alert_threshold: formData.stock_alert_threshold || 5,
        store_id: profile.store_id // Incluindo store_id obrigatório
      };

      console.log('📋 WIZARD SAVE - Dados preparados:', productData);

      let productId = editingProductId;

      if (editingProductId) {
        // Atualizar produto existente
        console.log('✏️ WIZARD SAVE - Atualizando produto:', editingProductId);
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProductId);

        if (error) {
          console.error('❌ WIZARD SAVE - Erro na atualização:', error);
          throw error;
        }
      } else {
        // Criar novo produto
        console.log('➕ WIZARD SAVE - Criando novo produto');
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();

        if (error) {
          console.error('❌ WIZARD SAVE - Erro na criação:', error);
          throw error;
        }

        productId = newProduct.id;
        console.log('✅ WIZARD SAVE - Produto criado com ID:', productId);
      }

      // Upload de imagens se houver
      if (draftImages.length > 0 && productId) {
        console.log('📷 WIZARD SAVE - Uploading imagens:', draftImages.length);
        const uploadResult = await uploadDraftImages(productId);
        if (uploadResult.length === 0) {
          console.warn('⚠️ WIZARD SAVE - Nenhuma imagem foi enviada');
        }
      }

      // Salvar variações se houver
      if (formData.variations.length > 0 && productId) {
        console.log('🎨 WIZARD SAVE - Salvando variações:', formData.variations.length);
        
        // Remover variações existentes
        await supabase
          .from('product_variations')
          .delete()
          .eq('product_id', productId);

        // Inserir novas variações
        const variationsToSave = formData.variations.map((variation, index) => ({
          product_id: productId,
          color: variation.color || null,
          size: variation.size || null,
          sku: variation.sku || null,
          stock: variation.stock || 0,
          price_adjustment: variation.price_adjustment || 0,
          is_active: variation.is_active !== false,
          image_url: variation.image_url || null,
          display_order: index
        }));

        const { error: variationsError } = await supabase
          .from('product_variations')
          .insert(variationsToSave);

        if (variationsError) {
          console.warn('⚠️ WIZARD SAVE - Erro ao salvar variações:', variationsError);
        }
      }

      console.log('✅ WIZARD SAVE - Produto salvo com sucesso:', productId);
      
      toast({
        title: editingProductId ? "Produto atualizado!" : "Produto criado!",
        description: `${productData.name} foi ${editingProductId ? 'atualizado' : 'criado'} com sucesso.`,
      });

      return productId;
    } catch (error) {
      console.error('💥 WIZARD SAVE - Erro durante salvamento:', error);
      toast({
        title: "Erro ao salvar produto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = useCallback(() => {
    console.log('🧹 WIZARD - Resetando formulário');
    const resetData = { ...initialFormData };
    if (profile?.store_id) {
      resetData.store_id = profile.store_id;
    }
    setFormData(resetData);
    setCurrentStep(0);
    clearDraftImages();
  }, [clearDraftImages, profile?.store_id]);

  // Garantir que store_id está sempre preenchido
  useState(() => {
    if (profile?.store_id && !formData.store_id) {
      updateFormData({ store_id: profile.store_id });
    }
  });

  return {
    currentStep,
    formData,
    steps,
    isSaving,
    canProceed,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    saveProduct,
    resetForm
  };
};
