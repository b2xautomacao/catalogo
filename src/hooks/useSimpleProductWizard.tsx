import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { useDraftImages } from '@/hooks/useDraftImages';
import { ProductVariation } from '@/types/variation';

interface ProductFormData {
  name: string;
  description: string;
  retail_price: number;
  wholesale_price: number;
  min_wholesale_qty: number;
  stock: number;
  category: string;
  sku: string;
  barcode: string;
  allow_negative_stock: boolean;
  variations: ProductVariation[];
}

export const useSimpleProductWizard = () => {
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { createProduct } = useProducts();
  const { draftImages, uploadAllImages } = useDraftImages();
  const [uploadImages, setUploadImages] = useState<((productId: string) => Promise<string[]>) | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    retail_price: 0,
    wholesale_price: 0,
    min_wholesale_qty: 1,
    stock: 10,
    category: '',
    sku: '',
    barcode: '',
    allow_negative_stock: false,
    variations: []
  });

  const setImagesUploadFn = useCallback((uploadFn: (productId: string) => Promise<string[]>) => {
    setUploadImages(() => uploadFn);
  }, []);

  const updateFormData = (data: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const validateCurrentStep = (): boolean => {
    switch (step) {
      case 0:
        return !!formData.name && !!formData.retail_price;
      case 1:
        return true;
      case 2:
        return true;
      default:
        return true;
    }
  };

  const saveVariations = async (variations: ProductVariation[]) => {
    // try {
    //   const { data, error } = await supabase
    //     .from('product_variations')
    //     .insert(variations);

    //   if (error) throw error;

    //   toast({
    //     title: 'Variações salvas com sucesso!',
    //     description: `Foram adicionadas ${variations.length} variações.`,
    //   });
    //   return true;
    // } catch (error) {
    //   console.error('Erro ao salvar variações:', error);
    //   toast({
    //     title: 'Erro ao salvar variações',
    //     description: error instanceof Error ? error.message : 'Erro desconhecido',
    //     variant: 'destructive',
    //   });
    //   return false;
    // }
    return true;
  };

  const resetWizard = () => {
    setStep(0);
    setFormData({
      name: '',
      description: '',
      retail_price: 0,
      wholesale_price: 0,
      min_wholesale_qty: 1,
      stock: 10,
      category: '',
      sku: '',
      barcode: '',
      allow_negative_stock: false,
      variations: []
    });
  };

  const [onComplete, setOnComplete] = useState<(product: any) => void>();

  const setCompletionHandler = (handler: (product: any) => void) => {
    setOnComplete(() => handler);
  };

  const saveProduct = async () => {
    if (!validateCurrentStep()) return;

    setIsSaving(true);
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        retail_price: formData.retail_price,
        wholesale_price: formData.wholesale_price,
        min_wholesale_qty: formData.min_wholesale_qty,
        stock: formData.stock,
        category: formData.category,
        sku: formData.sku,
        barcode: formData.barcode,
        store_id: profile?.store_id,
        is_active: true,
        allow_negative_stock: formData.allow_negative_stock || false,
      };

      const result = await createProduct(productData);

      if (result.success && result.data) {
        const productId = result.data.id;

        // Salvar imagens se houver
        if (uploadImages && draftImages.length > 0) {
          await uploadImages(productId);
        }

        // Salvar variações se houver
        if (formData.variations.length > 0) {
          const variationsWithProduct = formData.variations.map(v => ({
            ...v,
            product_id: productId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          await saveVariations(variationsWithProduct);
        }

        toast({
          title: 'Produto criado com sucesso!',
          description: `${formData.name} foi adicionado ao catálogo.`,
        });

        onComplete?.(result.data);
        return true;
      } else {
        throw new Error(result.error || 'Erro ao criar produto');
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: 'Erro ao salvar produto',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    step,
    formData,
    isSaving,
    nextStep,
    prevStep,
    updateFormData,
    saveProduct,
    validateCurrentStep,
    resetWizard,
    setCompletionHandler,
    setImagesUploadFn
  };
};
