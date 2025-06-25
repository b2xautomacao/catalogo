
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface WizardStep {
  id: string;
  title: string;
  description: string;
}

interface WizardStepNavigationProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

const WizardStepNavigation: React.FC<WizardStepNavigationProps> = ({
  steps,
  currentStep,
  onStepClick
}) => {
  return (
    <div className="border-b border-gray-200 p-4">
      <nav className="flex space-x-1 overflow-x-auto">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => onStepClick(index)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
              currentStep === index 
                ? 'bg-blue-500 text-white' 
                : currentStep > index
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {currentStep > index ? (
              <Check size={16} />
            ) : (
              <span className="w-4 h-4 flex items-center justify-center text-xs">
                {index + 1}
              </span>
            )}
            <span>{step.title}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default WizardStepNavigation;
