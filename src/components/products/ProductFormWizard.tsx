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
    steps,
    isSaving,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    saveProduct,
    resetForm,
    canProceed,
    isLoadingPriceTiers,
    loadProductForEditing,
    productId,
    cancelAndCleanup,
  } = useProductFormWizard();

  const { loadExistingImages, clearDraftImages } = useDraftImages();
  const { variations, loading: variationsLoading } = useProductVariations(
    editingProduct?.id
  );

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

  // Carregar variações existentes
  useEffect(() => {
    if (variations && variations.length > 0 && !variationsLoading) {
      console.log(
        "🎨 WIZARD - Carregando variações existentes:",
        variations.length
      );
      const formattedVariations = variations.map((variation) => ({
        id: variation.id,
        color: variation.color || "",
        size: variation.size || "",
        sku: variation.sku || "",
        stock: variation.stock,
        price_adjustment: variation.price_adjustment,
        is_active: variation.is_active,
        image_url: variation.image_url || "",
      }));

      updateFormData({ variations: formattedVariations });
    }
  }, [variations, variationsLoading, updateFormData]);

  // Limpar form ao fechar
  useEffect(() => {
    if (!isOpen) {
      console.log("🧹 WIZARD - Dialog fechado, limpando dados");
      resetForm();
      clearDraftImages();
    }
  }, [isOpen, resetForm, clearDraftImages]);

  const handleSave = async () => {
    console.log("💾 WIZARD - Tentativa de salvamento");

    try {
      const productId = await saveProduct(editingProduct?.id);
      console.log("📋 WIZARD - Resultado do salvamento:", productId);

      if (productId) {
        console.log("✅ WIZARD - Salvamento bem-sucedido");
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        console.error("❌ WIZARD - Falha no salvamento");
      }
    } catch (error) {
      console.error("💥 WIZARD - Erro durante salvamento:", error);
    }
  };

  const handleClose = () => {
    console.log("❌ WIZARD - Fechando wizard");
    cancelAndCleanup();
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

  console.log("📊 WIZARD - Status atual:", {
    currentStep,
    canProceed,
    completedSteps,
    isLastStep,
    formDataValid: {
      name: !!formData.name?.trim(),
      price: formData.retail_price > 0,
      stock: formData.stock >= 0,
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-full max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold">
            {editingProduct ? `Editar: ${editingProduct.name}` : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Navegação dos Steps */}
          <ImprovedWizardStepNavigation
            steps={steps}
            currentStep={currentStep}
            onStepClick={goToStep}
            completedSteps={completedSteps.filter((step) => step < currentStep)}
          />

          {/* Conteúdo do Step */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {isLoadingPriceTiers && editingProduct ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                      Carregando configurações de preço...
                    </p>
                  </div>
                </div>
              ) : (
                <WizardStepContent
                  currentStep={currentStep}
                  formData={formData}
                  updateFormData={updateFormData}
                  productId={productId || editingProduct?.id}
                />
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <ImprovedWizardActionButtons
            currentStep={currentStep}
            totalSteps={steps.length}
            canProceed={canProceed && !isLoadingPriceTiers}
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
