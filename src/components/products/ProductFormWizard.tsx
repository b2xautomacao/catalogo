
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProductFormWizard } from '@/hooks/useProductFormWizard';
import { useDraftImages } from '@/hooks/useDraftImages';
import ImprovedWizardStepNavigation from './wizard/ImprovedWizardStepNavigation';
import WizardStepContent from './wizard/WizardStepContent';
import ImprovedWizardActionButtons from './wizard/ImprovedWizardActionButtons';

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
  }, [editingProduct?.id, isOpen, updateFormData, loadExistingImages]);

  // Limpar form ao fechar
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      clearDraftImages();
    }
  }, [isOpen, resetForm, clearDraftImages]);

  const handleSave = async () => {
    console.log('Iniciando salvamento do produto...');
    console.log('Dados do formulário:', formData);
    
    try {
      const productId = await saveProduct(editingProduct?.id);
      console.log('Produto salvo com ID:', productId);
      
      if (productId) {
        console.log('Salvamento bem-sucedido, chamando callbacks...');
        onSuccess?.();
        onClose();
      } else {
        console.error('Falha no salvamento - productId é null');
      }
    } catch (error) {
      console.error('Erro durante o salvamento:', error);
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
        return formData.name.trim() !== '' && formData.retail_price > 0;
      case 1: // Preços
        return formData.retail_price > 0 && formData.stock >= 0;
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

  // Calcular steps completados
  const completedSteps: number[] = [];
  if (formData.name && formData.retail_price > 0) completedSteps.push(0);
  if (formData.retail_price > 0 && formData.stock >= 0) completedSteps.push(1);
  // Imagens e SEO sempre podem ser marcados como completados
  completedSteps.push(2, 3, 4);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
            canProceed={canProceed()}
            isSaving={isSaving}
            onPrevious={prevStep}
            onNext={nextStep}
            onSave={handleSave}
            onCancel={handleClose}
            isLastStep={isLastStep}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormWizard;
