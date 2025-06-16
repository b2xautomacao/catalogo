
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useStoreWizard } from '@/hooks/useStoreWizard';
import { WelcomeStep } from './steps/WelcomeStep';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { VisualIdentityStep } from './steps/VisualIdentityStep';
import { ContactStep } from './steps/ContactStep';
import { PaymentStep } from './steps/PaymentStep';
import { DeliveryStep } from './steps/DeliveryStep';
import { FinalStep } from './steps/FinalStep';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

interface ImprovedStoreWizardProps {
  open: boolean;
  onComplete: () => void;
}

export const ImprovedStoreWizard: React.FC<ImprovedStoreWizardProps> = ({
  open,
  onComplete
}) => {
  const {
    currentStep,
    totalSteps,
    data,
    loading,
    updateData,
    nextStep,
    prevStep,
    goToStep,
    completeWizard,
    canProceedToNext,
    getProgress,
    businessTypes
  } = useStoreWizard();

  const handleComplete = async () => {
    const success = await completeWizard();
    if (success) {
      onComplete();
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onNext={nextStep} />;
      case 2:
        return (
          <BasicInfoStep
            data={data}
            onUpdate={updateData}
            businessTypes={businessTypes}
          />
        );
      case 3:
        return (
          <VisualIdentityStep
            data={data}
            onUpdate={updateData}
          />
        );
      case 4:
        return (
          <ContactStep
            data={data}
            onUpdate={updateData}
          />
        );
      case 5:
        return (
          <PaymentStep
            data={data}
            onUpdate={updateData}
          />
        );
      case 6:
        return (
          <DeliveryStep
            data={data}
            onUpdate={updateData}
          />
        );
      case 7:
        return (
          <FinalStep
            data={data}
            businessTypes={businessTypes}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const titles = [
      '',
      'Bem-vindo!',
      'Informações Básicas',
      'Identidade Visual',
      'Contato e WhatsApp',
      'Formas de Pagamento',
      'Opções de Entrega',
      'Revisão Final'
    ];
    return titles[currentStep] || '';
  };

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {currentStep > 1 && (
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {getStepTitle()}
            </DialogTitle>
            <div className="space-y-2 mt-4">
              <Progress value={getProgress()} className="w-full" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Passo {currentStep - 1} de {totalSteps}</span>
                <span>{Math.round(getProgress())}% concluído</span>
              </div>
            </div>
          </DialogHeader>
        )}

        <div className="mt-6">
          {renderCurrentStep()}
        </div>

        {currentStep > 1 && (
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 2 || loading}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>

            <div className="flex items-center gap-2">
              {/* Indicadores de passos */}
              <div className="hidden md:flex items-center gap-1">
                {Array.from({ length: totalSteps }, (_, i) => {
                  const stepNumber = i + 2; // Começamos do passo 2
                  const isActive = stepNumber === currentStep;
                  const isCompleted = stepNumber < currentStep;
                  
                  return (
                    <button
                      key={stepNumber}
                      onClick={() => goToStep(stepNumber)}
                      disabled={loading}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 mx-auto" />
                      ) : (
                        stepNumber - 1
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              {currentStep < totalSteps + 1 ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceedToNext() || loading}
                  className="flex items-center gap-2"
                >
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando loja...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Criar Minha Loja
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
