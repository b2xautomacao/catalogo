
import React from "react";
import { WizardFormData } from "@/hooks/useImprovedProductFormWizard";
import BasicInfoStep from "./steps/BasicInfoStep";
import PricingStep from "./steps/PricingStep";
import ImagesStep from "./steps/ImagesStep";
import VariationsStep from "./steps/VariationsStep";
import SEOStep from "./steps/SEOStep";
import ReviewStep from "./steps/ReviewStep";

interface WizardStepContentProps {
  currentStep: number;
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  productId?: string;
}

const WizardStepContent: React.FC<WizardStepContentProps> = ({
  currentStep,
  formData,
  updateFormData,
  productId,
}) => {
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );

      case 1:
        return (
          <PricingStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );

      case 2:
        return (
          <ImagesStep 
            formData={formData} 
            updateFormData={updateFormData}
            productId={productId}
          />
        );

      case 3:
        return (
          <VariationsStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );

      case 4:
        return (
          <SEOStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );

      case 5:
        return (
          <ReviewStep 
            formData={formData} 
          />
        );

      default:
        return <div>Step não encontrado</div>;
    }
  };

  return (
    <div className="min-h-[400px]">
      {renderStepContent()}
    </div>
  );
};

export default WizardStepContent;
