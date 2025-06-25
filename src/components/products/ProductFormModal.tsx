
import React from 'react';
import ImprovedProductFormWizard from './ImprovedProductFormWizard';

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: any) => Promise<void>;
  initialData?: any;
  mode: 'create' | 'edit';
}

const ProductFormModal = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode
}: ProductFormModalProps) => {
  console.log('🎭 PRODUCT FORM MODAL - Renderizando com Improved Wizard:', {
    open,
    mode,
    hasInitialData: !!initialData,
    initialDataId: initialData?.id
  });

  const handleSuccess = () => {
    console.log('✅ PRODUCT FORM MODAL - Sucesso no Improved Wizard, fechando modal');
    onOpenChange(false);
    
    // Se há callback de submit, executar após fechar
    if (onSubmit) {
      console.log('🔄 PRODUCT FORM MODAL - Executando callback onSubmit');
      // Não precisamos passar dados aqui pois o wizard já salvou
      onSubmit({}).catch(console.error);
    }
  };

  const handleClose = () => {
    console.log('❌ PRODUCT FORM MODAL - Fechando modal via Improved Wizard');
    onOpenChange(false);
  };

  return (
    <ImprovedProductFormWizard
      isOpen={open}
      onClose={handleClose}
      editingProduct={mode === 'edit' ? initialData : undefined}
      onSuccess={handleSuccess}
    />
  );
};

export default ProductFormModal;
