
import React from 'react';
import ImprovedProductFormWizard from './ImprovedProductFormWizard';

export interface SimpleProductWizardProps {
  onComplete?: (product: any) => void;
  onCancel?: () => void;
}

const SimpleProductWizard: React.FC<SimpleProductWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const handleSuccess = () => {
    console.log('✅ SIMPLE PRODUCT WIZARD - Produto salvo com sucesso');
    if (onComplete) {
      onComplete({});
    }
  };

  const handleClose = () => {
    console.log('❌ SIMPLE PRODUCT WIZARD - Cancelando wizard');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <ImprovedProductFormWizard
      isOpen={true}
      onClose={handleClose}
      onSuccess={handleSuccess}
    />
  );
};

export default SimpleProductWizard;
