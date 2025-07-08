
import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStep {
  id: string;
  title: string;
  description: string;
}

interface ImprovedWizardStepNavigationProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps?: number[];
}

const ImprovedWizardStepNavigation: React.FC<ImprovedWizardStepNavigationProps> = ({
  steps,
  currentStep,
  onStepClick,
  completedSteps = []
}) => {
  const isStepCompleted = (stepIndex: number) => completedSteps.includes(stepIndex);
  const isStepActive = (stepIndex: number) => stepIndex === currentStep;
  const isStepClickable = (stepIndex: number) => stepIndex <= currentStep || isStepCompleted(stepIndex);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between space-x-4 overflow-x-auto">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={cn(
                  "flex items-center space-x-3 cursor-pointer transition-all duration-200 min-w-0 flex-shrink-0",
                  isStepClickable(index) ? "hover:opacity-80" : "cursor-not-allowed opacity-50"
                )}
                onClick={() => isStepClickable(index) && onStepClick(index)}
              >
                {/* Step Circle */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                    isStepActive(index) && "border-primary bg-primary text-white scale-110 shadow-lg",
                    isStepCompleted(index) && !isStepActive(index) && "border-green-500 bg-green-500 text-white",
                    !isStepActive(index) && !isStepCompleted(index) && "border-gray-300 bg-white text-gray-500"
                  )}
                >
                  {isStepCompleted(index) && !isStepActive(index) ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step Content */}
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "text-sm font-medium transition-colors duration-200",
                      isStepActive(index) && "text-primary",
                      isStepCompleted(index) && !isStepActive(index) && "text-green-600",
                      !isStepActive(index) && !isStepCompleted(index) && "text-gray-500"
                    )}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-32">
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Separator */}
              {index < steps.length - 1 && (
                <ChevronRight
                  className={cn(
                    "w-5 h-5 transition-colors duration-200 flex-shrink-0",
                    index < currentStep ? "text-primary" : "text-gray-300"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Progresso</span>
            <span>{currentStep + 1} de {steps.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedWizardStepNavigation;
