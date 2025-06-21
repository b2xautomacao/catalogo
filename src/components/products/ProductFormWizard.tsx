
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProductBasicInfoForm from './wizard/ProductBasicInfoForm';
import ProductPricingForm from './wizard/ProductPricingForm';
import ProductImagesForm from './wizard/ProductImagesForm';
import ProductVariationsForm from './wizard/ProductVariationsForm';
import ProductSeoForm from './wizard/ProductSeoForm';
import { useAuth } from '@/hooks/useAuth';
import { useDraftImages } from '@/hooks/useDraftImages';
import { useFormTracker } from '@/hooks/useFormTracker';
import { useVariationImageUpload } from '@/hooks/useVariationImageUpload';
import { ProductVariation } from './ProductVariationsManager';

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

interface ProductFormWizardProps {
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  mode: 'create' | 'edit';
  onClose?: () => void;
}

const steps = [
  { id: 1, name: 'Informações Básicas', icon: '📝', component: ProductBasicInfoForm },
  { id: 2, name: 'Preços e Estoque', icon: '💰', component: ProductPricingForm },
  { id: 3, name: 'Imagens', icon: '📸', component: ProductImagesForm },
  { id: 4, name: 'Variações', icon: '🎨', component: ProductVariationsForm },
  { id: 5, name: 'SEO', icon: '🔍', component: ProductSeoForm },
];

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

const ProductFormWizard = ({ onSubmit, initialData, mode, onClose }: ProductFormWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const { profile } = useAuth();
  const { draftImages, uploadDraftImages, clearDraftImages } = useDraftImages();
  const { uploadVariationImage } = useVariationImageUpload();
  
  // Controle mais rigoroso de carregamento inicial
  const dataLoadedRef = useRef<string | null>(null);
  const modeRef = useRef(mode);

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

  // Função segura para atualizar variações
  const handleVariationsChange = (newVariations: ProductVariation[]) => {
    console.log('🔄 VARIAÇÕES - Mudança solicitada:', {
      anterior: variations.length,
      nova: newVariations.length,
      modo: mode,
      productId: initialData?.id,
      detalhes: newVariations.map(v => ({ 
        id: v.id, 
        color: v.color, 
        size: v.size, 
        stock: v.stock,
        hasImage: !!v.image_url
      }))
    });
    
    setVariations(newVariations);
    console.log('✅ VARIAÇÕES - Estado atualizado com sucesso:', newVariations.length);
  };

  // CORREÇÃO CRÍTICA: Carregamento inicial controlado - executar apenas uma vez por produto
  useEffect(() => {
    const currentProductId = initialData?.id || 'new-product';
    const currentMode = mode;
    
    console.log('🔍 CARREGAMENTO - Verificando necessidade:', {
      mode: currentMode,
      productId: currentProductId,
      dataLoadedFor: dataLoadedRef.current,
      needsLoad: dataLoadedRef.current !== currentProductId
    });

    // Só carregar se:
    // 1. É modo de edição E
    // 2. Temos dados iniciais E  
    // 3. Ainda não carregamos dados para este produto específico
    if (currentMode === 'edit' && initialData && dataLoadedRef.current !== currentProductId) {
      console.log('📝 CARREGAMENTO - Iniciando para produto:', {
        id: initialData.id,
        name: initialData.name,
        variations_count: initialData.variations?.length || 0
      });
      
      const formData = {
        id: initialData.id,
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
      
      // Configurar variações se existirem
      if (initialData.variations && Array.isArray(initialData.variations)) {
        console.log('🎨 CARREGAMENTO - Configurando variações:', initialData.variations.length);
        setVariations(initialData.variations);
      } else {
        console.log('🎨 CARREGAMENTO - Nenhuma variação encontrada');
        setVariations([]);
      }
      
      form.reset(formData);
      dataLoadedRef.current = currentProductId;
      
      // Reset tracker após carregamento
      setTimeout(() => reset(), 300);
      
      console.log('✅ CARREGAMENTO - Concluído para produto:', currentProductId);
    }
    
    // CORREÇÃO: Reset apenas quando mudança real de modo para 'create'
    else if (currentMode === 'create' && modeRef.current === 'edit') {
      console.log('🔄 RESET - Mudança de edição para criação');
      setVariations([]);
      dataLoadedRef.current = null;
      modeRef.current = 'create';
    }
    
    // Atualizar ref do modo
    if (modeRef.current !== currentMode) {
      modeRef.current = currentMode;
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

  const progress = (currentStep / steps.length) * 100;

  const validateCurrentStep = (): boolean => {
    const values = form.getValues();
    
    switch (currentStep) {
      case 1:
        return !!(values.name?.trim() && values.category?.trim());
      case 2:
        return values.retail_price > 0 && values.stock >= 0;
      case 3:
        return true; // Imagens são opcionais
      case 4:
        return true; // Variações são opcionais
      case 5:
        return true; // SEO é opcional
      default:
        return true;
    }
  };

  const canProceedToNext = (): boolean => {
    return validateCurrentStep();
  };

  const handleNext = () => {
    if (canProceedToNext() && currentStep < steps.length) {
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

  // Função simplificada para processar imagens das variações
  const processVariationImages = async (variations: ProductVariation[]): Promise<ProductVariation[]> => {
    console.log('🖼️ IMAGENS - Processando imagens das variações:', variations.length);
    const processedVariations: ProductVariation[] = [];
    
    for (const [index, variation] of variations.entries()) {
      let processedVariation = { ...variation };
      
      // Se há arquivo de imagem (blob), fazer upload
      if (variation.image_file && variation.image_url?.startsWith('blob:')) {
        console.log(`🔄 Upload imagem variação ${index + 1}/${variations.length}...`);
        
        // Gerar ID temporário se não existir
        const variationId = variation.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          const uploadResult = await uploadVariationImage(variation.image_file, variationId);
          
          if (uploadResult.success && uploadResult.imageUrl) {
            processedVariation.image_url = uploadResult.imageUrl;
            // Remover o arquivo após upload bem-sucedido
            delete processedVariation.image_file;
            console.log(`✅ Upload variação ${index + 1} concluído:`, uploadResult.imageUrl);
          } else {
            console.warn(`⚠️ Falha upload variação ${index + 1}:`, uploadResult.error);
            // Remover URL blob inválida se upload falhou
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

    // VERIFICAÇÃO CRÍTICA MELHORADA: Estado das variações
    console.log('🚨 CRÍTICO - Verificação completa do estado antes do salvamento:', {
      variationsLength: variations.length,
      dataLoaded: dataLoadedRef.current,
      mode: mode,
      productId: initialData?.id,
      variationsDetailed: variations.map(v => ({ 
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
    } else {
      console.log('✅ CONFIRMADO - Produto possui variações para salvar:', variations.length);
    }

    setIsSubmitting(true);

    try {
      let imageUrl = form.getValues('image_url');
      let imageFiles: File[] = [];
      
      // Preparar arquivos de imagem para upload
      if (mode === 'create' && draftImages.length > 0) {
        console.log('📤 Preparando upload de imagens rascunho...');
        imageFiles = draftImages.map(img => img.file);
      }

      // Processar imagens das variações ANTES de enviar
      console.log('🎨 PROCESSAMENTO - Iniciando processamento das variações:', {
        total: variations.length,
        variations: variations.map(v => ({ 
          id: v.id, 
          color: v.color, 
          size: v.size, 
          stock: v.stock,
          hasImageFile: !!v.image_file,
          hasImageUrl: !!v.image_url
        }))
      });

      const processedVariations = await processVariationImages(variations);
      console.log('✅ PROCESSAMENTO - Variações processadas com sucesso:', processedVariations.length);

      const productData = {
        ...form.getValues(),
        store_id: profile.store_id,
        image_url: imageUrl,
        image_files: imageFiles.length > 0 ? imageFiles : undefined,
        variations: processedVariations, // SEMPRE incluir variações processadas
        wholesale_price: form.getValues('wholesale_price') || null,
        min_wholesale_qty: form.getValues('min_wholesale_qty') || 1,
        retail_price: Number(form.getValues('retail_price')),
        stock: Number(form.getValues('stock')),
      };

      console.log('💾 ENVIO FINAL - Dados do produto preparados:', {
        id: productData.id,
        name: productData.name,
        mode: mode,
        variations_count: productData.variations?.length || 0,
        image_files_count: productData.image_files?.length || 0,
        variationsPreview: productData.variations?.slice(0, 3).map(v => ({ 
          id: v.id, 
          color: v.color, 
          size: v.size 
        }))
      });

      await onSubmit(productData);
      markAsSaved();
      
      if (mode === 'create') {
        clearDraftImages();
        setVariations([]);
        dataLoadedRef.current = null;
      }
      
      onClose?.();
    } catch (error) {
      console.error('🚨 Erro ao salvar produto:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <ProductBasicInfoForm form={form} />;
      case 2:
        return <ProductPricingForm form={form} />;
      case 3:
        return (
          <ProductImagesForm 
            form={form} 
            initialData={initialData}
            mode={mode}
          />
        );
      case 4:
        return (
          <ProductVariationsForm 
            form={form}
            variations={variations}
            onVariationsChange={handleVariationsChange}
          />
        );
      case 5:
        return <ProductSeoForm form={form} />;
      default:
        return null;
    }
  };

  const currentStepData = steps.find(step => step.id === currentStep);

  return (
    <>
      {/* Header com Progress */}
      <div className="shrink-0 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{currentStepData?.icon}</div>
            <div>
              <h3 className="text-lg font-semibold">{currentStepData?.name}</h3>
              <p className="text-sm text-muted-foreground">
                Passo {currentStep} de {steps.length}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{Math.round(progress)}%</div>
            <div className="text-xs text-muted-foreground">Concluído</div>
          </div>
        </div>
        
        <Progress value={progress} className="h-2 mb-4" />
        
        {/* Steps Navigation */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center shrink-0">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 cursor-pointer hover:scale-105
                    ${step.id === currentStep
                      ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                      : step.id < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                    }
                  `}
                  onClick={() => {
                    if (step.id <= currentStep || canProceedToNext()) {
                      setCurrentStep(step.id);
                    }
                  }}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                
                {index < steps.length - 1 && (
                  <div 
                    className={`
                      w-8 h-0.5 mx-1 transition-colors
                      ${step.id < currentStep ? 'bg-green-500' : 'bg-border'}
                    `} 
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-hidden">
        <Form {...form}>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto px-1">
              <div className="pb-6">
                {renderCurrentStep()}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="shrink-0 pt-6 border-t bg-background/95 backdrop-blur">
              <div className="flex justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="min-w-[100px]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>

                <div className="flex gap-2">
                  {/* Botão de salvamento bypass - sempre visível se há mudanças */}
                  {hasUnsavedChanges && (
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={isSubmitting}
                      className="min-w-[100px] bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? 'Salvando...' : 'Salvar'}
                    </Button>
                  )}
                  
                  {currentStep < steps.length ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={!canProceedToNext()}
                      className="min-w-[100px]"
                    >
                      Próximo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={isSubmitting}
                      className="min-w-[120px] bg-green-600 hover:bg-green-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? 'Salvando...' : mode === 'edit' ? 'Finalizar' : 'Criar Produto'}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Debug: Estado atual das variações - MELHORADO */}
              {variations.length > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                  <strong>✅ Estado OK:</strong> {variations.length} variações prontas para salvar
                  {mode === 'edit' && dataLoadedRef.current && (
                    <span className="ml-2 text-green-600">
                      | Dados carregados: {dataLoadedRef.current.slice(0, 8)}...
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Form>
      </div>

      {/* Indicador de mudanças não salvas */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm z-50">
          <AlertTriangle className="h-4 w-4" />
          Alterações não salvas
        </div>
      )}

      {/* Dialog para mudanças não salvas */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterações não salvas</DialogTitle>
            <DialogDescription>
              Você tem alterações não salvas. Deseja sair sem salvar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnsavedDialog(false)}
            >
              Continuar editando
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowUnsavedDialog(false);
                onClose?.();
              }}
            >
              Sair sem salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductFormWizard;
