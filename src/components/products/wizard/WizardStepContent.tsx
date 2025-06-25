
import React from 'react';
import ProductBasicInfoForm from './ProductBasicInfoForm';
import ProductPricingForm from './ProductPricingForm';
import ProductVariationsForm from './ProductVariationsForm';
import ImprovedDraftImageUpload from '../ImprovedDraftImageUpload';
import ProductSeoForm from './ProductSeoForm';
import ProductAdvancedForm from './ProductAdvancedForm';
import { ProductFormData } from '@/hooks/useImprovedProductFormWizard';

interface WizardStepContentProps {
  currentStep: number;
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  productId?: string;
}

const WizardStepContent: React.FC<WizardStepContentProps> = ({
  currentStep,
  formData,
  updateFormData,
  productId
}) => {
  console.log('📄 WIZARD STEP CONTENT - Renderizando step:', currentStep);

  switch (currentStep) {
    case 0: // Informações Básicas
      console.log('📝 WIZARD STEP CONTENT - Renderizando básico');
      return (
        <ProductBasicInfoForm
          formData={formData}
          updateFormData={updateFormData}
        />
      );
      
    case 1: // Preços e Estoque
      console.log('💰 WIZARD STEP CONTENT - Renderizando preços');
      return (
        <ProductPricingForm
          formData={formData}
          updateFormData={updateFormData}
        />
      );
      
    case 2: // Variações
      console.log('🎨 WIZARD STEP CONTENT - Renderizando variações');
      return (
        <ProductVariationsForm
          variations={formData.variations || []}
          onVariationsChange={(variations) => updateFormData({ variations })}
        />
      );
      
    case 3: // Imagens
      console.log('📷 WIZARD STEP CONTENT - Renderizando imagens');
      return (
        <ImprovedDraftImageUpload
          productId={productId}
        />
      );
      
    case 4: // SEO
      console.log('🔍 WIZARD STEP CONTENT - Renderizando SEO');
      return (
        <ProductSeoForm
          formData={formData}
          updateFormData={updateFormData}
        />
      );
      
    case 5: // Avançado
      console.log('⚙️ WIZARD STEP CONTENT - Renderizando avançado');
      return (
        <ProductAdvancedForm
          formData={formData}
          updateFormData={updateFormData}
        />
      );
      
    default:
      console.error('❌ WIZARD STEP CONTENT - Step inválido:', currentStep);
      return (
        <div className="text-center p-8">
          <p className="text-red-500">Step inválido: {currentStep}</p>
        </div>
      );
  }
};

export default WizardStepContent;
