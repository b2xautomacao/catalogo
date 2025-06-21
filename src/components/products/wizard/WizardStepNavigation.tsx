
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Step {
  id: number;
  name: string;
  icon: string;
}

const steps: Step[] = [
  { id: 1, name: 'Informações Básicas', icon: '📝' },
  { id: 2, name: 'Preços e Estoque', icon: '💰' },
  { id: 3, name: 'Imagens', icon: '📸' },
  { id: 4, name: 'Variações', icon: '🎨' },
  { id: 5, name: 'SEO', icon: '🔍' },
];

interface WizardStepNavigationProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  canProceedToNext: () => boolean;
}

const WizardStepNavigation: React.FC<WizardStepNavigationProps> = ({
  currentStep,
  setCurrentStep,
  canProceedToNext
}) => {
  const progress = (currentStep / steps.length) * 100;
  const currentStepData = steps.find(step => step.id === currentStep);

  return (
    <div className="shrink-0 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{currentStepData?.icon}</div>
          <div>
            <h3 className="text-lg font-semibold">{currentStepData?.name}</h3>
            <p className="text-sm text-muted-foreground">
              Passo {currentStep} de {steps.length}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">{Math.round(progress)}%</div>
          <div className="text-xs text-muted-foreground">Concluído</div>
        </div>
      </div>
      
      <Progress value={progress} className="h-2 mb-4" />
      
      {/* Steps Navigation */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center shrink-0">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 cursor-pointer hover:scale-105
                  ${step.id === currentStep
                    ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                    : step.id < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                  }
                `}
                onClick={() => {
                  if (step.id <= currentStep || canProceedToNext()) {
                    setCurrentStep(step.id);
                  }
                }}
              >
                {step.id < currentStep ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
              
              {index < steps.length - 1 && (
                <div 
                  className={`
                    w-8 h-0.5 mx-1 transition-colors
                    ${step.id < currentStep ? 'bg-green-500' : 'bg-border'}
                  `} 
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WizardStepNavigation;
