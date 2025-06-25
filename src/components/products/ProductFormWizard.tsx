
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProductFormWizard } from '@/hooks/useProductFormWizard';
import { useDraftImages } from '@/hooks/useDraftImages';
import WizardStepNavigation from './wizard/WizardStepNavigation';
import WizardStepContent from './wizard/WizardStepContent';
import WizardActionButtons from './wizard/WizardActionButtons';

interface ProductFormWizardProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: any;
  onSuccess?: () => void;
}

const ProductFormWizard: React.FC<ProductFormWizardProps> = ({
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
  } = useProductFormWizard();

  const { loadExistingImages, clearDraftImages } = useDraftImages();

  // Carregar dados do produto para edição
  useEffect(() => {
    if (editingProduct && isOpen) {
      console.log('ProductFormWizard: Carregando produto para edição:', editingProduct.id);
      
      updateFormData({
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        retail_price: editingProduct.retail_price || 0,
        wholesale_price: editingProduct.wholesale_price || undefined,
        min_wholesale_qty: editingProduct.min_wholesale_qty || 1,
        stock: editingProduct.stock || 0,
        category: editingProduct.category || '',
        keywords: editingProduct.keywords || '',
        meta_title: editingProduct.meta_title || '',
        meta_description: editingProduct.meta_description || '',
        is_featured: editingProduct.is_featured || false,
        allow_negative_stock: editingProduct.allow_negative_stock || false,
        stock_alert_threshold: editingProduct.stock_alert_threshold || 5,
      });

      // Carregar imagens existentes
      loadExistingImages(editingProduct.id);
    }
  }, [editingProduct, isOpen, updateFormData, loadExistingImages]);

  // Limpar form ao fechar
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleSave = async () => {
    const productId = await saveProduct(editingProduct?.id);
    if (productId) {
      onSuccess?.();
      onClose();
    }
  };

  const handleClose = () => {
    clearDraftImages();
    onClose();
  };

  const isLastStep = currentStep === steps.length - 1;
  const canProceed = () => {
    switch (currentStep) {
      case 0: // Básico
        return formData.name.trim() !== '';
      case 1: // Preços
        return formData.retail_price > 0;
      case 2: // Imagens
        return true; // Imagens são opcionais
      case 3: // SEO
        return true; // SEO é opcional
      case 4: // Avançado
        return true;
      default:
        return true;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Navegação dos Steps */}
          <WizardStepNavigation
            steps={steps}
            currentStep={currentStep}
            onStepClick={goToStep}
          />

          {/* Conteúdo do Step */}
          <div className="flex-1 overflow-y-auto p-6">
            <WizardStepContent
              currentStep={currentStep}
              formData={formData}
              updateFormData={updateFormData}
              productId={editingProduct?.id}
            />
          </div>

          {/* Botões de Ação */}
          <div className="border-t p-6">
            <WizardActionButtons
              currentStep={currentStep}
              totalSteps={steps.length}
              canProceed={canProceed()}
              isSaving={isSaving}
              onPrevious={prevStep}
              onNext={nextStep}
              onSave={handleSave}
              onCancel={handleClose}
              isLastStep={isLastStep}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormWizard;
