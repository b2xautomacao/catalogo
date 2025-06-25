
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useImprovedProductFormWizard } from '@/hooks/useImprovedProductFormWizard';
import { useDraftImages } from '@/hooks/useDraftImages';
import { useProductVariations } from '@/hooks/useProductVariations';
import ImprovedWizardStepNavigation from './wizard/ImprovedWizardStepNavigation';
import WizardStepContent from './wizard/WizardStepContent';
import ImprovedWizardActionButtons from './wizard/ImprovedWizardActionButtons';

interface ImprovedProductFormWizardProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: any;
  onSuccess?: () => void;
}

const ImprovedProductFormWizard: React.FC<ImprovedProductFormWizardProps> = ({
  isOpen,
  onClose,
  editingProduct,
  onSuccess
}) => {
  console.log('🧙‍♂️ IMPROVED PRODUCT WIZARD - Renderizando:', {
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
  } = useImprovedProductFormWizard();

  const { loadExistingImages, clearDraftImages } = useDraftImages();
  const { variations, loading: variationsLoading } = useProductVariations(editingProduct?.id);

  // Carregar dados do produto para edição
  useEffect(() => {
    if (editingProduct && isOpen) {
      console.log('📂 IMPROVED WIZARD - Carregando produto para edição:', editingProduct);
      
      // Carregar dados básicos do produto
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
        console.log('📷 IMPROVED WIZARD - Carregando imagens existentes');
        loadExistingImages(editingProduct.id);
      }
    }
  }, [editingProduct?.id, isOpen, updateFormData, loadExistingImages]);

  // Carregar variações existentes
  useEffect(() => {
    if (variations && variations.length > 0 && !variationsLoading) {
      console.log('🎨 IMPROVED WIZARD - Carregando variações:', variations.length);
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
      console.log('🧹 IMPROVED WIZARD - Dialog fechado, limpando dados');
      resetForm();
      clearDraftImages();
    }
  }, [isOpen, resetForm, clearDraftImages]);

  const handleSave = async () => {
    console.log('💾 IMPROVED WIZARD - Tentativa de salvamento');
    
    try {
      const productId = await saveProduct(editingProduct?.id);
      console.log('📋 IMPROVED WIZARD - Resultado:', productId);
      
      if (productId) {
        console.log('✅ IMPROVED WIZARD - Salvamento bem-sucedido');
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        console.error('❌ IMPROVED WIZARD - Falha no salvamento');
      }
    } catch (error) {
      console.error('💥 IMPROVED WIZARD - Erro durante salvamento:', error);
    }
  };

  const handleClose = () => {
    console.log('❌ IMPROVED WIZARD - Fechando wizard');
    clearDraftImages();
    onClose();
  };

  const isLastStep = currentStep === steps.length - 1;
  
  // Calcular steps completados
  const completedSteps: number[] = [];
  
  // Step 0: Básico - precisa de nome
  if (formData.name?.trim() && formData.name.trim().length > 0) {
    completedSteps.push(0);
  }
  
  // Step 1: Preços - precisa de preço válido e estoque >= 0
  if (formData.retail_price > 0 && formData.stock >= 0) {
    completedSteps.push(1);
  }
  
  // Steps 2-5 sempre podem ser completados (opcionais)
  completedSteps.push(2, 3, 4, 5);

  console.log('📊 IMPROVED WIZARD - Status:', {
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

export default ImprovedProductFormWizard;
