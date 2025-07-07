
import React, { useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSimpleProductWizard } from "@/hooks/useSimpleProductWizard";
import { useProductVariations } from "@/hooks/useProductVariations";
import { useSimpleDraftImages } from "@/hooks/useSimpleDraftImages";
import { useVariationDraftImages } from "@/hooks/useVariationDraftImages";
import ImprovedWizardStepNavigation from "./wizard/ImprovedWizardStepNavigation";
import WizardStepContent from "./wizard/WizardStepContent";
import ImprovedWizardActionButtons from "./wizard/ImprovedWizardActionButtons";

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
  onSuccess,
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
    canProceed,
  } = useSimpleProductWizard();

  const { variations, loading: variationsLoading } = useProductVariations(
    editingProduct?.id
  );
  const { clearImages, uploadNewImages } = useSimpleDraftImages();
  const { uploadVariationImages, clearVariationImages } = useVariationDraftImages();

  // Ref para evitar múltiplas chamadas
  const loadedProductRef = useRef<string | null>(null);
  const imageUploadFunctionRef = useRef<
    ((productId: string) => Promise<string[]>) | null
  >(null);

  // Carregar dados do produto para edição
  useEffect(() => {
    if (
      editingProduct &&
      isOpen &&
      loadedProductRef.current !== editingProduct.id
    ) {
      console.log("📂 SIMPLE WIZARD - Carregando produto para edição:", editingProduct.id);
      loadProductData(editingProduct);
      loadedProductRef.current = editingProduct.id;
    }
  }, [editingProduct?.id, isOpen, loadProductData]);

  // Carregar variações existentes
  useEffect(() => {
    if (variations && variations.length > 0 && !variationsLoading) {
      console.log("🎨 SIMPLE WIZARD - Carregando variações existentes:", variations.length);
      
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
    } else if (
      editingProduct &&
      !variationsLoading &&
      variations?.length === 0
    ) {
      // Se está editando um produto mas não há variações, limpar o array
      updateFormData({ variations: [] });
    }
  }, [variations, variationsLoading, updateFormData, editingProduct?.id]);

  // Limpar form ao fechar
  useEffect(() => {
    if (!isOpen && loadedProductRef.current) {
      console.log("🧹 SIMPLE WIZARD - Dialog fechado, limpando dados");
      resetForm();
      clearImages();
      clearVariationImages();
      loadedProductRef.current = null;
      imageUploadFunctionRef.current = null;
    }
  }, [isOpen, resetForm, clearImages, clearVariationImages]);

  // Callback para receber a função de upload do componente de imagens
  const handleImageUploadReady = useCallback(
    (uploadFn: (productId: string) => Promise<string[]>) => {
      imageUploadFunctionRef.current = uploadFn;
    },
    []
  );

  const handleSave = async () => {
    try {
      console.log("💾 SIMPLE WIZARD - Iniciando salvamento");

      // Função para fazer upload das imagens após salvar o produto
      const imageUploadFn = async (productId: string) => {
        console.log("💾 SIMPLE WIZARD - Executando uploads para produto:", productId);

        // Upload das imagens principais
        if (imageUploadFunctionRef.current) {
          console.log("💾 SIMPLE WIZARD - Upload de imagens principais");
          try {
            const result = await imageUploadFunctionRef.current(productId);
            console.log("✅ SIMPLE WIZARD - Upload principal concluído:", result.length, "imagens");
          } catch (error) {
            console.error("❌ SIMPLE WIZARD - Erro no upload principal:", error);
          }
        }

        // Para edição, usar uploadNewImages que preserva imagens existentes
        if (editingProduct?.id) {
          console.log("💾 SIMPLE WIZARD - Upload de novas imagens (modo edição)");
          try {
            const result = await uploadNewImages(productId);
            console.log("✅ SIMPLE WIZARD - Upload de novas imagens concluído:", result.length);
          } catch (error) {
            console.error("❌ SIMPLE WIZARD - Erro no upload de novas imagens:", error);
          }
        }

        // Upload das imagens das variações
        try {
          console.log("💾 SIMPLE WIZARD - Upload de imagens das variações");
          const variationUploadResults = await uploadVariationImages(productId);
          console.log("✅ SIMPLE WIZARD - Upload de variações concluído:", variationUploadResults.length);
          
          // Atualizar URLs das variações com as imagens enviadas
          if (variationUploadResults.length > 0) {
            const updatedVariations = formData.variations?.map((variation) => {
              const uploadResult = variationUploadResults.find(
                (result) => result.colorName.toLowerCase() === variation.color?.toLowerCase()
              );
              
              if (uploadResult) {
                return { ...variation, image_url: uploadResult.url };
              }
              return variation;
            });
            
            if (updatedVariations) {
              updateFormData({ variations: updatedVariations });
            }
          }
        } catch (variationImageError) {
          console.error("❌ SIMPLE WIZARD - Erro no upload das imagens das variações:", variationImageError);
          // Não falhar por causa das imagens das variações
        }
      };

      console.log("💾 SIMPLE WIZARD - Dados finais para salvamento:", {
        name: formData.name,
        retail_price: formData.retail_price,
        variations: formData.variations?.length || 0,
        price_tiers: formData.price_tiers?.length || 0,
      });

      const productId = await saveProduct(editingProduct?.id, imageUploadFn);

      if (productId) {
        console.log("✅ SIMPLE WIZARD - Produto salvo com sucesso:", productId);
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }
    } catch (error) {
      console.error("💥 SIMPLE WIZARD - Erro durante salvamento:", error);
    }
  };

  const handleClose = () => {
    console.log("❌ SIMPLE WIZARD - Fechando wizard");
    clearImages();
    clearVariationImages();
    onClose();
  };

  const isLastStep = currentStep === steps.length - 1;

  // Calcular steps completados
  const completedSteps: number[] = [];

  // Step 0: Básico - precisa de nome
  if ((formData.name || "").trim().length > 0) {
    completedSteps.push(0);
  }

  // Step 1: Preços - precisa de preço válido e estoque >= 0
  if (formData.retail_price > 0 && formData.stock >= 0) {
    completedSteps.push(1);
  }

  // Steps 2-5 sempre podem ser completados (opcionais)
  completedSteps.push(2, 3, 4, 5);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-[95vw] sm:w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0 mx-2 sm:mx-auto">
        <DialogHeader className="p-3 sm:p-6 pb-0">
          <DialogTitle className="text-lg sm:text-xl font-semibold truncate">
            {editingProduct ? `Editar: ${editingProduct.name}` : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Navegação dos Steps */}
          <ImprovedWizardStepNavigation
            steps={steps}
            currentStep={currentStep}
            onStepClick={goToStep}
            completedSteps={completedSteps.filter((step) => step < currentStep)}
          />

          {/* Conteúdo do Step */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-3 sm:p-6">
              <WizardStepContent
                currentStep={currentStep}
                formData={formData}
                updateFormData={updateFormData}
                productId={editingProduct?.id}
                onImageUploadReady={handleImageUploadReady}
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

export default SimpleProductWizard;
