
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useDraftImages } from '@/hooks/useDraftImages';
import { useFormTracker } from '@/hooks/useFormTracker';
import { useVariationImageUpload } from '@/hooks/useVariationImageUpload';
import { ProductVariation } from '@/components/products/ProductVariationsManager';

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  retail_price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  wholesale_price: z.number().optional(),
  stock: z.number().min(0, 'Estoque não pode ser negativo'),
  min_wholesale_qty: z.number().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  keywords: z.string().optional(),
  seo_slug: z.string().optional(),
  image_url: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

interface UseProductFormWizardProps {
  initialData?: any;
  mode: 'create' | 'edit';
  onSubmit: (data: any) => Promise<void>;
  onClose?: () => void;
}

export const useProductFormWizard = ({ initialData, mode, onSubmit, onClose }: UseProductFormWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  const { profile } = useAuth();
  const { draftImages, uploadDraftImages, clearDraftImages } = useDraftImages();
  const { uploadVariationImage } = useVariationImageUpload();
  
  const initialLoadDoneRef = useRef<string | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      retail_price: 0,
      wholesale_price: 0,
      stock: 0,
      min_wholesale_qty: 1,
      is_active: true,
      is_featured: false,
      meta_title: '',
      meta_description: '',
      keywords: '',
      seo_slug: '',
      image_url: '',
    },
  });

  const { hasUnsavedChanges, markAsSaved, reset } = useFormTracker({ 
    form,
    onUnsavedChanges: (hasChanges) => {
      console.log('📊 Mudanças no formulário:', hasChanges);
    }
  });

  // 🎯 FUNÇÃO CRÍTICA: Atualizar variações
  const handleVariationsChange = (newVariations: ProductVariation[]) => {
    console.log('🚨 CRÍTICA - handleVariationsChange CHAMADA:', {
      timestamp: new Date().toISOString(),
      origem: 'ProductVariationsManager',
      variationsAnterior: variations.length,
      variationsNova: newVariations.length,
      modo: mode,
      productId: initialData?.id || 'novo',
      variationsDetalhadas: newVariations.map(v => ({ 
        id: v.id, 
        color: v.color, 
        size: v.size, 
        stock: v.stock,
        hasImage: !!v.image_url,
        hasImageFile: !!v.image_file
      }))
    });
    
    setVariations(newVariations);
    console.log('✅ ESTADO VARIAÇÕES ATUALIZADO:', newVariations.length);
  };

  // 🔧 CARREGAMENTO INICIAL
  useEffect(() => {
    const productId = initialData?.id;
    
    console.log('🔍 CARREGAMENTO - Verificando necessidade:', {
      mode,
      productId,
      initialLoadDone: initialLoadDoneRef.current,
      needsLoad: mode === 'edit' && productId && initialLoadDoneRef.current !== productId
    });
    
    if (mode === 'edit' && initialData && productId && initialLoadDoneRef.current !== productId) {
      console.log('📝 CARREGAMENTO INICIAL - Modo edição:', {
        id: initialData.id,
        name: initialData.name,
        variations: initialData.variations?.length || 0
      });
      
      const formData = {
        name: initialData.name || '',
        description: initialData.description || '',
        category: initialData.category || '',
        retail_price: Number(initialData.retail_price) || 0,
        wholesale_price: initialData.wholesale_price ? Number(initialData.wholesale_price) : undefined,
        stock: Number(initialData.stock) || 0,
        min_wholesale_qty: Number(initialData.min_wholesale_qty) || 1,
        is_active: initialData.is_active ?? true,
        is_featured: initialData.is_featured ?? false,
        meta_title: initialData.meta_title || '',
        meta_description: initialData.meta_description || '',
        keywords: initialData.keywords || '',
        seo_slug: initialData.seo_slug || '',
        image_url: initialData.image_url || '',
      };
      
      form.reset(formData);
      
      if (initialData.variations && Array.isArray(initialData.variations)) {
        console.log('🎨 CARREGANDO VARIAÇÕES INICIAIS:', initialData.variations.length);
        setVariations(initialData.variations);
      }
      
      initialLoadDoneRef.current = productId;
      setTimeout(() => reset(), 300);
    }
  }, [initialData?.id, mode, form, reset]);

  // Gerar slug automaticamente quando o nome mudar (apenas no modo criação)
  const watchedName = form.watch('name');
  useEffect(() => {
    if (mode === 'create' && watchedName && watchedName.trim()) {
      const slug = generateSlug(watchedName);
      form.setValue('seo_slug', slug);
    }
  }, [watchedName, mode, form]);

  // Validação por step
  const validateCurrentStep = (): boolean => {
    const values = form.getValues();
    
    switch (currentStep) {
      case 1:
        return !!(values.name?.trim() && values.category?.trim());
      case 2:
        return values.retail_price > 0 && values.stock >= 0;
      case 3:
      case 4:
      case 5:
        return true;
      default:
        return true;
    }
  };

  const canProceedToNext = (): boolean => {
    return validateCurrentStep();
  };

  const handleNext = () => {
    if (canProceedToNext() && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onClose?.();
    }
  };

  // Processar imagens das variações
  const processVariationImages = async (variations: ProductVariation[]): Promise<ProductVariation[]> => {
    console.log('🖼️ IMAGENS - Processando imagens das variações:', variations.length);
    const processedVariations: ProductVariation[] = [];
    
    for (const [index, variation] of variations.entries()) {
      let processedVariation = { ...variation };
      
      if (variation.image_file && variation.image_url?.startsWith('blob:')) {
        console.log(`🔄 Upload imagem variação ${index + 1}/${variations.length}...`);
        
        const variationId = variation.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          const uploadResult = await uploadVariationImage(variation.image_file, variationId);
          
          if (uploadResult.success && uploadResult.imageUrl) {
            processedVariation.image_url = uploadResult.imageUrl;
            delete processedVariation.image_file;
            console.log(`✅ Upload variação ${index + 1} concluído:`, uploadResult.imageUrl);
          } else {
            console.warn(`⚠️ Falha upload variação ${index + 1}:`, uploadResult.error);
            processedVariation.image_url = '';
          }
        } catch (error) {
          console.error(`🚨 Erro upload variação ${index + 1}:`, error);
          processedVariation.image_url = '';
        }
      }
      
      processedVariations.push(processedVariation);
    }
    
    console.log('✅ IMAGENS - Processamento concluído:', processedVariations.length);
    return processedVariations;
  };

  const handleSave = async () => {
    if (!profile?.store_id) {
      console.error('🚨 Store ID não encontrado!');
      return;
    }

    console.log('🚨 CRÍTICO - Verificação completa do estado antes do salvamento:', {
      variationsLength: variations.length,
      initialLoadDone: initialLoadDoneRef.current,
      mode: mode,
      productId: mode === 'edit' ? initialData?.id : 'novo',
      timestamp: new Date().toISOString(),
      variationsDetalhadas: variations.map(v => ({ 
        id: v.id, 
        color: v.color, 
        size: v.size, 
        stock: v.stock,
        hasImage: !!v.image_url,
        hasImageFile: !!v.image_file
      }))
    });

    if (variations.length === 0) {
      console.log('ℹ️ AVISO - Produto será salvo sem variações');
    }

    setIsSubmitting(true);

    try {
      let imageUrl = form.getValues('image_url');
      let imageFiles: File[] = [];
      
      if (mode === 'create' && draftImages.length > 0) {
        console.log('📤 Preparando upload de imagens rascunho...');
        imageFiles = draftImages.map(img => img.file);
      }

      console.log('🎨 PROCESSAMENTO - Iniciando processamento das variações:', {
        total: variations.length,
        variations: variations.map(v => ({ color: v.color, size: v.size, stock: v.stock }))
      });

      const processedVariations = await processVariationImages(variations);
      
      console.log('✅ PROCESSAMENTO - Variações processadas com sucesso:', processedVariations.length);

      const productData = {
        ...form.getValues(),
        store_id: profile.store_id,
        image_url: imageUrl,
        image_files: imageFiles.length > 0 ? imageFiles : undefined,
        variations: processedVariations,
        wholesale_price: form.getValues('wholesale_price') || null,
        min_wholesale_qty: form.getValues('min_wholesale_qty') || 1,
        retail_price: Number(form.getValues('retail_price')),
        stock: Number(form.getValues('stock')),
      };

      if (mode === 'edit' && initialData?.id) {
        (productData as any).id = initialData.id;
      }

      console.log('💾 SALVAMENTO - Dados finais sendo enviados:', {
        id: mode === 'edit' ? initialData?.id : 'novo',
        name: productData.name,
        variations_count: productData.variations?.length || 0,
        variations_preview: productData.variations?.slice(0, 2).map(v => ({ 
          color: v.color, 
          size: v.size, 
          stock: v.stock 
        }))
      });

      await onSubmit(productData);
      markAsSaved();
      
      if (mode === 'create') {
        clearDraftImages();
        setVariations([]);
        initialLoadDoneRef.current = null;
      }
      
      onClose?.();
    } catch (error) {
      console.error('🚨 Erro ao salvar produto:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    currentStep,
    setCurrentStep,
    variations,
    handleVariationsChange,
    isSubmitting,
    hasUnsavedChanges,
    showUnsavedDialog,
    setShowUnsavedDialog,
    validateCurrentStep,
    canProceedToNext,
    handleNext,
    handlePrevious,
    handleClose,
    handleSave,
    initialData,
    mode,
    onClose
  };
};
