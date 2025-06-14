import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import ProductBasicInfoForm from './wizard/ProductBasicInfoForm';
import ProductPricingForm from './wizard/ProductPricingForm';
import ProductImagesForm from './wizard/ProductImagesForm';
import ProductAdvancedForm from './wizard/ProductAdvancedForm';
import { useAuth } from '@/hooks/useAuth';
import { useDraftImages } from '@/hooks/useDraftImages';

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
}

const steps = [
  { id: 1, name: 'Informações Básicas', component: ProductBasicInfoForm },
  { id: 2, name: 'Preços e Estoque', component: ProductPricingForm },
  { id: 3, name: 'Imagens', component: ProductImagesForm },
  { id: 4, name: 'Configurações Avançadas', component: ProductAdvancedForm },
];

// Função para gerar slug a partir do nome
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
};

const ProductFormWizard = ({ onSubmit, initialData, mode }: ProductFormWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useAuth();
  const { draftImages, uploadDraftImages, clearDraftImages } = useDraftImages();

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

  // Carregar dados iniciais quando em modo edição
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      console.log('ProductFormWizard - Carregando dados iniciais:', initialData);
      
      const formData = {
        id: initialData.id, // Importante: incluir o ID
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
      
      console.log('ProductFormWizard - Dados processados:', formData);
      form.reset(formData);
    }
  }, [initialData, mode, form]);

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
        // Para edição, não exigir imagens (pode já ter ou não)
        // Para criação, aceitar tanto draft images quanto image_url
        if (mode === 'edit') return true;
        return draftImages.length > 0 || !!values.image_url;
      case 4:
        // Passo 4 sempre é válido - configurações avançadas são opcionais
        return true;
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

  const handleSubmit = async (data: ProductFormData) => {
    if (!profile?.store_id) {
      console.error('Store ID não encontrado');
      return;
    }

    setIsSubmitting(true);

    try {
      // Fazer upload das imagens draft se houver
      let imageUrl = data.image_url;
      
      if (draftImages.length > 0) {
        console.log('Fazendo upload das imagens draft...');
        const uploadResult = await uploadDraftImages();
        if (uploadResult.success && uploadResult.urls.length > 0) {
          imageUrl = uploadResult.urls[0]; // Primeira imagem como principal
          console.log('Upload concluído, URL principal:', imageUrl);
        }
      }

      const productData = {
        ...data,
        store_id: profile.store_id,
        image_url: imageUrl,
        // Garantir que valores numéricos sejam válidos
        retail_price: Number(data.retail_price),
        wholesale_price: data.wholesale_price ? Number(data.wholesale_price) : null,
        stock: Number(data.stock),
        min_wholesale_qty: data.min_wholesale_qty ? Number(data.min_wholesale_qty) : 1,
      };

      console.log('Submetendo dados do produto:', productData);
      await onSubmit(productData);
      
      // Limpar imagens draft apenas em caso de sucesso
      clearDraftImages();
      
    } catch (error) {
      console.error('Erro ao submeter produto:', error);
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
        return <ProductAdvancedForm form={form} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Passo {currentStep} de {steps.length}</span>
          <span>{Math.round(progress)}% concluído</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-center space-x-4 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center ${
              index < steps.length - 1 ? 'flex-shrink-0' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.id === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : step.id < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step.id}
            </div>
            <span
              className={`ml-2 text-sm font-medium ${
                step.id === currentStep
                  ? 'text-primary'
                  : step.id < currentStep
                  ? 'text-green-600'
                  : 'text-muted-foreground'
              }`}
            >
              {step.name}
            </span>
            {index < steps.length - 1 && (
              <div className="ml-4 w-8 h-px bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <Form {...form}>
        <div className="space-y-6">
          <div className="min-h-[400px]">
            {renderCurrentStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-2">
              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                >
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => handleSubmit(form.getValues())}
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Salvando...' : mode === 'edit' ? 'Atualizar Produto' : 'Criar Produto'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default ProductFormWizard;
