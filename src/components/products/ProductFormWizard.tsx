
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
  console.log('🧙‍♂️ PRODUCT FORM WIZARD - Renderizando:', {
    isOpen,
    editingProduct: editingProduct?.id,
    hasOnSuccess: !!onSuccess
  });

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
    canProceed
  } = useProductFormWizard();

  const { loadExistingImages, clearDraftImages } = useDraftImages();

  // Carregar dados do produto para edição
  useEffect(() => {
    if (editingProduct && isOpen) {
      console.log('📂 WIZARD - Carregando produto para edição:', editingProduct);
      
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
        seo_slug: editingProduct.seo_slug || '',
        is_featured: editingProduct.is_featured || false,
        allow_negative_stock: editingProduct.allow_negative_stock || false,
        stock_alert_threshold: editingProduct.stock_alert_threshold || 5,
      });

      // Carregar imagens existentes
      if (editingProduct.id) {
        console.log('📷 WIZARD - Carregando imagens existentes');
        loadExistingImages(editingProduct.id);
      }
    }
  }, [editingProduct?.id, isOpen, updateFormData, loadExistingImages]);

  // Limpar form ao fechar
  useEffect(() => {
    if (!isOpen) {
      console.log('🧹 WIZARD - Dialog fechado, limpando dados');
      resetForm();
      clearDraftImages();
    }
  }, [isOpen, resetForm, clearDraftImages]);

  const handleSave = async () => {
    console.log('💾 WIZARD - Tentativa de salvamento');
    
    try {
      const productId = await saveProduct(editingProduct?.id);
      console.log('📋 WIZARD - Resultado do salvamento:', productId);
      
      if (productId) {
        console.log('✅ WIZARD - Salvamento bem-sucedido');
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        console.error('❌ WIZARD - Falha no salvamento');
      }
    } catch (error) {
      console.error('💥 WIZARD - Erro durante salvamento:', error);
    }
  };

  const handleClose = () => {
    console.log('❌ WIZARD - Fechando wizard');
    clearDraftImages();
    onClose();
  };

  const isLastStep = currentStep === steps.length - 1;
  
  // Calcular steps completados baseado na validação
  const completedSteps: number[] = [];
  
  // Step 0: Básico - precisa de nome e preço
  if (formData.name?.trim() && formData.retail_price > 0) {
    completedSteps.push(0);
  }
  
  // Step 1: Preços - precisa de preço válido e estoque >= 0
  if (formData.retail_price > 0 && formData.stock >= 0) {
    completedSteps.push(1);
  }
  
  // Steps 2-5 sempre podem ser marcados como completados (opcionais)
  completedSteps.push(2, 3, 4, 5);

  console.log('📊 WIZARD - Status atual:', {
    currentStep,
    canProceed,
    completedSteps,
    isLastStep,
    formDataValid: {
      name: !!formData.name?.trim(),
      price: formData.retail_price > 0,
      stock: formData.stock >= 0
    }
  });

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
            canProceed={canProceed}
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
