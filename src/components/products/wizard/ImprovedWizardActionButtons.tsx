import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react";

interface ImprovedWizardActionButtonsProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isSaving: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
  onCancel: () => void;
  isLastStep: boolean;
}

const ImprovedWizardActionButtons: React.FC<
  ImprovedWizardActionButtonsProps
> = ({
  currentStep,
  totalSteps,
  canProceed,
  isSaving,
  onPrevious,
  onNext,
  onSave,
  onCancel,
  isLastStep,
}) => {
  return (
    <div className="flex items-center justify-between p-6 border-t bg-gray-50/50">
      <div className="flex items-center gap-3">
        {/* Previous Button */}
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentStep === 0 || isSaving}
          className="min-w-[100px]"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {/* Cancel Button */}
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isSaving}
          className="min-w-[100px]"
        >
          Cancelar
        </Button>

        {/* Next/Save Button */}
        {isLastStep ? (
          <Button
            onClick={() => {
              console.log("🔘 BOTÃO SALVAR CLICADO - Step:", currentStep);
              onSave();
            }}
            disabled={!canProceed || isSaving}
            className="min-w-[130px] bg-primary hover:bg-primary/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Produto
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canProceed || isSaving}
            className="min-w-[100px]"
          >
            Próximo
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ImprovedWizardActionButtons;
