
import { useEffect, useState, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface UseFormTrackerProps {
  form: UseFormReturn<any>;
  onUnsavedChanges?: (hasChanges: boolean) => void;
}

export const useFormTracker = ({ form, onUnsavedChanges }: UseFormTrackerProps) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialValuesRef = useRef<any>(null);
  const lastComparisonRef = useRef<string>('');

  // Capturar valores iniciais quando o formulário é resetado
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (!initialValuesRef.current) {
        initialValuesRef.current = { ...values };
        lastComparisonRef.current = JSON.stringify(values);
        return;
      }

      // Comparar valores atuais com os iniciais
      const currentValues = { ...values };
      const currentString = JSON.stringify(currentValues);
      
      // Evitar comparações desnecessárias
      if (currentString === lastComparisonRef.current) {
        return;
      }
      
      const initialString = JSON.stringify(initialValuesRef.current);
      const hasChanges = currentString !== initialString;
      
      lastComparisonRef.current = currentString;
      
      if (hasChanges !== hasUnsavedChanges) {
        setHasUnsavedChanges(hasChanges);
        onUnsavedChanges?.(hasChanges);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, hasUnsavedChanges, onUnsavedChanges]);

  const markAsSaved = () => {
    const currentValues = form.getValues();
    const currentString = JSON.stringify(currentValues);
    
    initialValuesRef.current = { ...currentValues };
    lastComparisonRef.current = currentString;
    setHasUnsavedChanges(false);
    onUnsavedChanges?.(false);
  };

  const reset = () => {
    initialValuesRef.current = null;
    lastComparisonRef.current = '';
    setHasUnsavedChanges(false);
    onUnsavedChanges?.(false);
  };

  return {
    hasUnsavedChanges,
    markAsSaved,
    reset
  };
};
