
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSimpleProductWizard } from '@/hooks/useSimpleProductWizard';
import { useProductVariations } from '@/hooks/useProductVariations';
import ImprovedWizardStepNavigation from './wizard/ImprovedWizardStepNavigation';
import WizardStepContent from './wizard/WizardStepContent';
import ImprovedWizardActionButtons from './wizard/ImprovedWizardActionButtons';

interface SimpleProductWizardProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: any;
  onSuccess?: () => void;
}

const SimpleProductWizard: React.FC<SimpleProductWizardProps> = ({
  isOpen,
  onClose,
  editingProduct,
  onSuccess
}) => {
  const {
    currentStep,
    formData,
    steps,
    isSaving,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    saveProduct,
    resetForm,
    loadProductData,
    canProceed
  } = useSimpleProductWizard();

  const { variations, loading: variationsLoading } = useProductVariations(editingProduct?.id);

  // Carregar dados do produto para edição
  useEffect(() => {
    if (editingProduct && isOpen) {
      console.log('📂 Carregando produto para edição:', editingProduct.name);
      loadProductData(editingProduct);
    }
  }, [editingProduct?.id, isOpen, loadProductData]);

  // Carregar variações existentes
  useEffect(() => {
    if (variations && variations.length > 0 && !variationsLoading) {
      const formattedVariations = variations.map(variation => ({
        id: variation.id,
        color: variation.color || '',
        size: variation.size || '',
        sku: variation.sku || '',
        stock: variation.stock,
        price_adjustment: variation.price_adjustment,
        is_active: variation.is_active,
        image_url: variation.image_url || ''
      }));
      
      updateFormData({ variations: formattedVariations });
    }
  }, [variations, variationsLoading, updateFormData]);

  // Limpar form ao fechar
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleSave = async () => {
    try {
      const productId = await saveProduct(editingProduct?.id);
      
      if (productId) {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }
    } catch (error) {
      console.error('Erro durante salvamento:', error);
    }
  };

  const isLastStep = currentStep === steps.length - 1;
  
  // Calcular steps completados
  const completedSteps: number[] = [];
  
  // Step 0: Básico - precisa de nome
  if ((formData.name || '').trim().length > 0) {
    completedSteps.push(0);
  }
  
  // Step 1: Preços - precisa de preço válido e estoque >= 0
  if (formData.retail_price > 0 && formData.stock >= 0) {
    completedSteps.push(1);
  }
  
  // Steps 2-5 sempre podem ser completados (opcionais)
  completedSteps.push(2, 3, 4, 5);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold">
            {editingProduct ? `Editar: ${editingProduct.name}` : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Navegação dos Steps */}
          <ImprovedWizardStepNavigation
            steps={steps}
            currentStep={currentStep}
            onStepClick={goToStep}
            completedSteps={completedSteps.filter(step => step < currentStep)}
          />

          {/* Conteúdo do Step */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <WizardStepContent
                currentStep={currentStep}
                formData={formData}
                updateFormData={updateFormData}
                productId={editingProduct?.id}
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <ImprovedWizardActionButtons
            currentStep={currentStep}
            totalSteps={steps.length}
            canProceed={canProceed}
            isSaving={isSaving}
            onPrevious={prevStep}
            onNext={nextStep}
            onSave={handleSave}
            onCancel={onClose}
            isLastStep={isLastStep}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleProductWizard;
