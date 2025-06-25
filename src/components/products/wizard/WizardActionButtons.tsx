
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';

interface WizardActionButtonsProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isSaving: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  isLastStep: boolean;
}

const WizardActionButtons: React.FC<WizardActionButtonsProps> = ({
  currentStep,
  totalSteps,
  canProceed,
  isSaving,
  onPrevious,
  onNext,
  onSave,
  onCancel,
  isLastStep
}) => {
  return (
    <div className="flex justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
      >
        Cancelar
      </Button>

      <div className="flex gap-2">
        {currentStep > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isSaving}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
        )}

        {isLastStep ? (
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default WizardActionButtons;
