
import React from 'react';
import ProductBasicInfoForm from './ProductBasicInfoForm';
import ProductPricingForm from './ProductPricingForm';
import ProductVariationsForm from './ProductVariationsForm';
import SimpleImageUpload from '../SimpleImageUpload';
import ProductSeoForm from './ProductSeoForm';
import ProductAdvancedForm from './ProductAdvancedForm';

// Interface genérica para compatibilidade com todos os wizards
interface GenericProductFormData {
  name: string;
  description?: string;
  retail_price: number;
  wholesale_price?: number;
  min_wholesale_qty?: number; // Tornando opcional para compatibilidade
  stock: number;
  category?: string; // Tornando opcional para compatibilidade
  keywords?: string; // Tornando opcional para compatibilidade
  meta_title?: string; // Tornando opcional para compatibilidade
  meta_description?: string; // Tornando opcional para compatibilidade
  seo_slug?: string; // Tornando opcional para compatibilidade
  is_featured: boolean;
  allow_negative_stock: boolean;
  stock_alert_threshold: number;
  variations?: any[];
  store_id?: string; // Mantendo opcional para compatibilidade
}

interface WizardStepContentProps {
  currentStep: number;
  formData: GenericProductFormData;
  updateFormData: (updates: Partial<GenericProductFormData>) => void;
  productId?: string;
  onImageUploadReady?: (uploadFn: (productId: string) => Promise<string[]>) => void;
}

const WizardStepContent: React.FC<WizardStepContentProps> = ({
  currentStep,
  formData,
  updateFormData,
  productId,
  onImageUploadReady
}) => {
  // Garantir valores padrão para propriedades que podem estar ausentes
  const safeFormData = {
    ...formData,
    min_wholesale_qty: formData.min_wholesale_qty ?? 1,
    category: formData.category || '',
    keywords: formData.keywords || '',
    meta_title: formData.meta_title || '',
    meta_description: formData.meta_description || '',
    seo_slug: formData.seo_slug || '',
    store_id: formData.store_id || ''
  };

  switch (currentStep) {
    case 0: // Informações Básicas
      return (
        <ProductBasicInfoForm
          formData={safeFormData}
          updateFormData={updateFormData}
        />
      );
      
    case 1: // Preços e Estoque
      return (
        <ProductPricingForm
          formData={safeFormData}
          updateFormData={updateFormData}
        />
      );
      
    case 2: // Imagens
      return (
        <SimpleImageUpload
          productId={productId}
          onUploadReady={onImageUploadReady}
        />
      );
      
    case 3: // Variações
      return (
        <ProductVariationsForm
          variations={formData.variations || []}
          onVariationsChange={(variations) => updateFormData({ variations })}
        />
      );
      
    case 4: // SEO
      return (
        <ProductSeoForm
          formData={safeFormData}
          updateFormData={updateFormData}
        />
      );
      
    case 5: // Avançado
      return (
        <ProductAdvancedForm
          formData={safeFormData}
          updateFormData={updateFormData}
        />
      );
      
    default:
      return (
        <div className="text-center p-8">
          <p className="text-red-500">Step inválido: {currentStep}</p>
        </div>
      );
  }
};

export default WizardStepContent;
