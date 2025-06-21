
import React from 'react';
import { Form } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useProductFormWizard } from '@/hooks/useProductFormWizard';
import WizardStepNavigation from './wizard/WizardStepNavigation';
import WizardStepContent from './wizard/WizardStepContent';
import WizardActionButtons from './wizard/WizardActionButtons';

interface ProductFormWizardProps {
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  mode: 'create' | 'edit';
  onClose?: () => void;
}

const ProductFormWizard = ({ onSubmit, initialData, mode, onClose }: ProductFormWizardProps) => {
  const {
    form,
    currentStep,
    setCurrentStep,
    variations,
    handleVariationsChange,
    isSubmitting,
    hasUnsavedChanges,
    showUnsavedDialog,
    setShowUnsavedDialog,
    canProceedToNext,
    handleNext,
    handlePrevious,
    handleClose,
    handleSave
  } = useProductFormWizard({ initialData, mode, onSubmit, onClose });

  return (
    <>
      {/* Header com Progress */}
      <WizardStepNavigation
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        canProceedToNext={canProceedToNext}
      />

      {/* Form Content */}
      <div className="flex-1 overflow-hidden">
        <Form {...form}>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto px-1">
              <div className="pb-6">
                <WizardStepContent
                  currentStep={currentStep}
                  form={form}
                  variations={variations}
                  onVariationsChange={handleVariationsChange}
                  initialData={initialData}
                  mode={mode}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <WizardActionButtons
              currentStep={currentStep}
              totalSteps={5}
              isSubmitting={isSubmitting}
              hasUnsavedChanges={hasUnsavedChanges}
              canProceedToNext={canProceedToNext}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSave={handleSave}
              mode={mode}
              variations={variations}
            />
          </div>
        </Form>
      </div>

      {/* Dialog para mudanças não salvas */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterações não salvas</DialogTitle>
            <DialogDescription>
              Você tem alterações não salvas. Deseja sair sem salvar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnsavedDialog(false)}
            >
              Continuar editando
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowUnsavedDialog(false);
                onClose?.();
              }}
            >
              Sair sem salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductFormWizard;
