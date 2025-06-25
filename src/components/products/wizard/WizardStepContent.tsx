
import React from 'react';
import ProductBasicInfoForm from './ProductBasicInfoForm';
import ProductPricingForm from './ProductPricingForm';
import ProductImagesForm from './ProductImagesForm';
import ProductSeoForm from './ProductSeoForm';
import ProductAdvancedForm from './ProductAdvancedForm';
import { ProductFormData } from '@/hooks/useProductFormWizard';

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
  switch (currentStep) {
    case 0:
      return (
        <ProductBasicInfoForm
          formData={formData}
          updateFormData={updateFormData}
        />
      );
    case 1:
      return (
        <ProductPricingForm
          formData={formData}
          updateFormData={updateFormData}
        />
      );
    case 2:
      return (
        <ProductImagesForm
          productId={productId}
        />
      );
    case 3:
      return (
        <ProductSeoForm
          formData={formData}
          updateFormData={updateFormData}
        />
      );
    case 4:
      return (
        <ProductAdvancedForm
          formData={formData}
          updateFormData={updateFormData}
        />
      );
    default:
      return null;
  }
};

export default WizardStepContent;
