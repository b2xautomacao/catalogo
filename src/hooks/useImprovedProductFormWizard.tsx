import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProductVariations } from '@/hooks/useProductVariations';
import { ProductVariation } from '@/types/product';

export interface WizardFormData {
  name: string;
  description?: string; // Tornar opcional para alinhar com ProductFormData
  category: string;
  retail_price: number;
  wholesale_price: number;
  stock: number;
  min_wholesale_qty: number;
  is_featured: boolean;
  is_active: boolean;
  allow_negative_stock: boolean;
  stock_alert_threshold: number;
  store_id: string;
  variations: ProductVariation[];
  price_model: string;
  simple_wholesale_enabled: boolean;
  gradual_wholesale_enabled: boolean;
  // Propriedades SEO
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  seo_slug?: string;
}

export interface WizardStep {
  id: number;
  label: string;
  description: string;
}

export const useImprovedProductFormWizard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { saveVariations } = useProductVariations();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
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
    store_id: profile?.store_id || '',
    variations: [],
    price_model: 'wholesale_only',
    simple_wholesale_enabled: true,
    gradual_wholesale_enabled: false,
    meta_title: '',
    meta_description: '',
    keywords: '',
    seo_slug: '',
  });

  const steps: WizardStep[] = [
    { id: 0, label: 'Informações Básicas', description: 'Nome, categoria e descrição' },
    { id: 1, label: 'Preços e Estoque', description: 'Preços, estoque e configurações' },
    { id: 2, label: 'Imagens', description: 'Imagens do produto' },
    { id: 3, label: 'Variações', description: 'Cores, tamanhos e outras variações' },
    { id: 4, label: 'SEO e Marketing', description: 'Otimização e configurações de marketing' },
  ];

  const updateFormData = useCallback((updates: Partial<WizardFormData>) => {
    console.log('📝 WIZARD - Atualizando formData:', updates);
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

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  }, [steps.length]);

  const canProceed = useCallback(() => {
    console.log('🔍 WIZARD - Verificando canProceed para step:', currentStep, formData);
    
    switch (currentStep) {
      case 0: // Informações Básicas
        const hasName = formData.name.trim() !== '';
        const hasCategory = formData.category.trim() !== '';
        console.log('🔍 WIZARD - Step 0 validation:', { hasName, hasCategory, name: formData.name, category: formData.category });
        return hasName && hasCategory;
      case 1: // Preços e Estoque
        return formData.retail_price > 0;
      case 2: // Imagens
        return true; // Imagens são opcionais
      case 3: // Variações
        return true; // Variações são opcionais
      case 4: // SEO e Marketing
        return true; // SEO é opcional
      default:
        return true;
    }
  }, [currentStep, formData]);

  const loadProductForEditing = useCallback(async (product: any) => {
    console.log('📂 WIZARD - Carregando produto para edição:', product);
    
    try {
      // Carregar variações do produto
      let variations: ProductVariation[] = [];
      if (product.id) {
        const { data: variationsData, error: variationsError } = await supabase
          .from('product_variations')
          .select('*')
          .eq('product_id', product.id)
          .eq('is_active', true)
          .order('display_order');

        if (variationsError) {
          console.error('Erro ao carregar variações:', variationsError);
        } else {
          variations = variationsData?.map((v: any) => ({
            id: v.id,
            product_id: v.product_id,
            color: v.color,
            size: v.size,
            sku: v.sku,
            stock: v.stock,
            price_adjustment: v.price_adjustment,
            is_active: v.is_active,
            image_url: v.image_url,
            created_at: v.created_at,
            updated_at: v.updated_at,
            variation_type: v.variation_type,
            name: v.name,
            is_grade: v.is_grade,
            grade_name: v.grade_name,
            grade_color: v.grade_color,
            grade_quantity: v.grade_quantity,
            grade_sizes: v.grade_sizes,
            grade_pairs: v.grade_pairs,
            display_order: v.display_order,
          })) || [];
        }
      }

      console.log('📂 WIZARD - Variações carregadas:', variations.length);

      // Atualizar formData com dados do produto
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        retail_price: product.retail_price || 0,
        wholesale_price: product.wholesale_price || 0,
        stock: product.stock || 0,
        min_wholesale_qty: product.min_wholesale_qty || 1,
        is_featured: product.is_featured || false,
        is_active: product.is_active !== false,
        allow_negative_stock: product.allow_negative_stock || false,
        stock_alert_threshold: product.stock_alert_threshold || 5,
        store_id: product.store_id || profile?.store_id || '',
        variations: variations,
        price_model: 'wholesale_only', // Sempre wholesale_only por padrão
        simple_wholesale_enabled: true,
        gradual_wholesale_enabled: product.enable_gradual_wholesale || false,
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        keywords: product.keywords || '',
        seo_slug: product.seo_slug || '',
      });
    } catch (error) {
      console.error('Erro ao carregar produto para edição:', error);
      toast({
        title: 'Erro ao carregar produto',
        description: 'Não foi possível carregar os dados do produto.',
        variant: 'destructive',
      });
    }
  }, [profile?.store_id, toast]);

  const saveProduct = useCallback(async (editingProductId?: string, uploadAllImages?: (productId: string) => Promise<string[]>) => {
    setLoading(true);
    console.log('💾 WIZARD - Iniciando salvamento do produto', { editingProductId, formData });

    try {
      // Dados do produto
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        retail_price: formData.retail_price,
        wholesale_price: formData.wholesale_price,
        stock: formData.stock,
        min_wholesale_qty: formData.min_wholesale_qty,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        allow_negative_stock: formData.allow_negative_stock,
        stock_alert_threshold: formData.stock_alert_threshold,
        store_id: formData.store_id,
        enable_gradual_wholesale: formData.gradual_wholesale_enabled,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        keywords: formData.keywords,
        seo_slug: formData.seo_slug,
      };

      let productId = editingProductId;

      if (editingProductId) {
        // Atualizar produto existente
        console.log('🔄 WIZARD - Atualizando produto existente:', editingProductId);
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProductId);

        if (updateError) {
          console.error('Erro ao atualizar produto:', updateError);
          throw updateError;
        }
      } else {
        // Criar novo produto
        console.log('✨ WIZARD - Criando novo produto');
        const { data: newProduct, error: createError } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (createError) {
          console.error('Erro ao criar produto:', createError);
          throw createError;
        }

        productId = newProduct.id;
        console.log('✅ WIZARD - Produto criado com ID:', productId);
      }

      // Upload de imagens se houver função
      if (uploadAllImages && productId) {
        console.log('📷 WIZARD - Fazendo upload de imagens');
        try {
          await uploadAllImages(productId);
        } catch (imageError) {
          console.error('Erro no upload de imagens:', imageError);
          // Não interromper o salvamento por erro de imagem
        }
      }

      // Salvar variações se houver
      if (formData.variations && formData.variations.length > 0 && productId) {
        console.log('🎨 WIZARD - Salvando variações:', formData.variations.length);
        try {
          const { success, error: variationsError } = await saveVariations(productId, formData.variations);
          if (!success) {
            console.error('Erro ao salvar variações:', variationsError);
            // Não interromper o salvamento por erro de variações
            toast({
              title: 'Aviso',
              description: 'Produto salvo, mas houve problemas ao salvar as variações.',
              variant: 'destructive',
            });
          } else {
            console.log('✅ WIZARD - Variações salvas com sucesso');
          }
        } catch (variationError) {
          console.error('Erro inesperado ao salvar variações:', variationError);
        }
      }

      toast({
        title: 'Produto salvo!',
        description: 'O produto foi salvo com sucesso.',
      });

      return productId;
    } catch (error) {
      console.error('💥 WIZARD - Erro no salvamento:', error);
      toast({
        title: 'Erro ao salvar produto',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [formData, saveVariations, toast]);

  const resetForm = useCallback(() => {
    console.log('🧹 WIZARD - Resetando formulário');
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
      store_id: profile?.store_id || '',
      variations: [],
      price_model: 'wholesale_only',
      simple_wholesale_enabled: true,
      gradual_wholesale_enabled: false,
      meta_title: '',
      meta_description: '',
      keywords: '',
      seo_slug: '',
    });
    setCurrentStep(0);
  }, [profile?.store_id]);

  // Atualizar store_id quando o perfil mudar
  useEffect(() => {
    if (profile?.store_id && formData.store_id !== profile.store_id) {
      updateFormData({ store_id: profile.store_id });
    }
  }, [profile?.store_id, formData.store_id, updateFormData]);

  return {
    formData,
    updateFormData,
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    canProceed,
    loading,
    resetForm,
    steps,
    saveProduct,
    loadProductForEditing,
  };
};
