
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useImprovedProductFormWizard } from '@/hooks/useImprovedProductFormWizard';
import { DraftImagesProvider } from '@/contexts/DraftImagesContext';
import ImprovedWizardStepNavigation from './wizard/ImprovedWizardStepNavigation';
import WizardStepContent from './wizard/WizardStepContent';
import ImprovedWizardActionButtons from './wizard/ImprovedWizardActionButtons';

interface ImprovedProductFormWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (productId: string) => void;
  editingProduct?: any;
}

const ImprovedProductFormWizard: React.FC<ImprovedProductFormWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingProduct
}) => {
  const {
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
    loadProductForEditing
  } = useImprovedProductFormWizard();

  React.useEffect(() => {
    console.log("🧙 WIZARD - useEffect triggered:", { editingProduct: !!editingProduct, isOpen });
    
    if (editingProduct && isOpen) {
      console.log("🧙 WIZARD - Carregando dados do produto para edição:", editingProduct.id);
      // Usar a função integrada que carrega tanto dados quanto imagens
      loadProductForEditing(editingProduct);
    }
  }, [editingProduct, isOpen, loadProductForEditing]);

  const handleSave = async () => {
    try {
      console.log('🔄 WIZARD - Iniciando salvamento do produto');
      const productId = await saveProduct(editingProduct?.id);
      
      if (productId) {
        console.log('✅ WIZARD - Produto salvo com sucesso:', productId);
        resetForm();
        onClose();
        if (onSuccess) {
          onSuccess(productId);
        }
      }
    } catch (error) {
      console.error('❌ WIZARD - Erro ao salvar produto:', error);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isLastStep = currentStep === steps.length - 1;

  // Convert steps to match expected interface
  const navigationSteps = steps.map(step => ({
    id: step.id.toString(),
    title: step.label,
    description: step.description
  }));

  return (
    <DraftImagesProvider>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Step Navigation */}
            <ImprovedWizardStepNavigation
              steps={navigationSteps}
              currentStep={currentStep}
              onStepClick={goToStep}
            />

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <WizardStepContent
                currentStep={currentStep}
                formData={formData}
                updateFormData={updateFormData}
                productId={editingProduct?.id}
              />
            </div>

            {/* Action Buttons */}
            <ImprovedWizardActionButtons
              currentStep={currentStep}
              totalSteps={steps.length}
              canProceed={canProceed()}
              isSaving={loading}
              onPrevious={prevStep}
              onNext={nextStep}
              onSave={handleSave}
              onCancel={handleClose}
              isLastStep={isLastStep}
            />
          </div>
        </DialogContent>
      </Dialog>
    </DraftImagesProvider>
  );
};

export default ImprovedProductFormWizard;
