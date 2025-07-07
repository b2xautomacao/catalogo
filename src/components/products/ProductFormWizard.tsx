
import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProductFormWizard } from "@/hooks/useProductFormWizard";
import { useDraftImages } from "@/hooks/useDraftImages";
import { useProductVariations } from "@/hooks/useProductVariations";
import ImprovedWizardStepNavigation from "./wizard/ImprovedWizardStepNavigation";
import WizardStepContent from "./wizard/WizardStepContent";
import ImprovedWizardActionButtons from "./wizard/ImprovedWizardActionButtons";

interface WizardStep {
  id: string;
  label: string;
  title: string;
  description: string;
}

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
  onSuccess,
}) => {
  console.log("🧙‍♂️ PRODUCT FORM WIZARD - Renderizando:", {
    isOpen,
    editingProduct: editingProduct?.id,
    hasOnSuccess: !!onSuccess,
  });

  const {
    currentStep,
    formData,
    steps: originalSteps,
    isSaving,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    saveProduct,
    resetForm,
    canProceed,
    loadProductForEditing,
    productId,
    cancelAndCleanup,
  } = useProductFormWizard();

  const { loadExistingImages, clearDraftImages } = useDraftImages();
  const { variations, loading: variationsLoading } = useProductVariations(
    editingProduct?.id
  );

  // Convert steps to match WizardStep interface
  const steps: WizardStep[] = originalSteps.map(step => ({
    id: step.id.toString(),
    label: step.label,
    title: step.title || step.label,
    description: step.description
  }));

  // Carregar dados completos do produto para edição
  useEffect(() => {
    if (editingProduct && isOpen) {
      console.log(
        "📂 WIZARD - Carregando produto para edição:",
        editingProduct
      );

      // Usar a função centralizada para carregar todos os dados
      loadProductForEditing(editingProduct);

      // Carregar imagens existentes
      if (editingProduct.id) {
        console.log("📷 WIZARD - Carregando imagens existentes");
        loadExistingImages(editingProduct.id);
      }
    }
  }, [editingProduct?.id, isOpen, loadProductForEditing, loadExistingImages]);

  // Limpar dados ao fechar
  useEffect(() => {
    if (!isOpen) {
      console.log("🧹 WIZARD - Limpando dados ao fechar");
      clearDraftImages();
      resetForm();
    }
  }, [isOpen, clearDraftImages, resetForm]);

  // Carregar variações existentes quando disponível
  useEffect(() => {
    if (variations.length > 0 && editingProduct) {
      console.log(
        "🎨 WIZARD - Sincronizando variações carregadas:",
        variations.length
      );
      updateFormData({ variations });
    }
  }, [variations, editingProduct, updateFormData]);

  const handleSave = async () => {
    try {
      console.log("💾 WIZARD - Salvando produto:", formData);

      // Usar o hook useSimpleProductWizard para salvar
      const productFormData = {
        ...formData,
        store_id: editingProduct?.store_id || "",
      };

      const savedProduct = await saveProduct(productFormData);
      
      console.log("✅ WIZARD - Produto salvo:", savedProduct);
      
      onSuccess?.();
      onClose();
      
    } catch (error) {
      console.error("❌ WIZARD - Erro ao salvar:", error);
    }
  };

  const handleClose = () => {
    cancelAndCleanup();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ImprovedWizardStepNavigation
            steps={steps}
            currentStep={currentStep}
            onStepClick={goToStep}
          />

          <div className="flex-1 overflow-y-auto p-6">
            <WizardStepContent
              currentStep={currentStep}
              formData={formData}
              updateFormData={updateFormData}
              productId={productId || editingProduct?.id}
            />
          </div>

          <ImprovedWizardActionButtons
            currentStep={currentStep}
            totalSteps={steps.length}
            canProceed={canProceed()}
            isSaving={isSaving}
            isLastStep={currentStep === steps.length - 1}
            onPrevious={prevStep}
            onNext={nextStep}
            onSave={handleSave}
            onCancel={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormWizard;
