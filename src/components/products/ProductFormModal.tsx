
import React from 'react';
import ProductFormWizard from './ProductFormWizard';

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
  console.log('🎭 PRODUCT FORM MODAL - Renderizando:', {
    open,
    mode,
    hasInitialData: !!initialData
  });

  // Simplificar - deixar apenas o wizard gerenciar tudo
  const handleSuccess = () => {
    console.log('✅ PRODUCT FORM MODAL - Sucesso, fechando modal');
    onOpenChange(false);
    
    // Se há callback de submit, executar após fechar
    if (onSubmit) {
      console.log('🔄 PRODUCT FORM MODAL - Executando callback onSubmit');
      // Não precisamos passar dados aqui pois o wizard já salvou
      onSubmit({}).catch(console.error);
    }
  };

  const handleClose = () => {
    console.log('❌ PRODUCT FORM MODAL - Fechando modal');
    onOpenChange(false);
  };

  return (
    <ProductFormWizard
      isOpen={open}
      onClose={handleClose}
      editingProduct={mode === 'edit' ? initialData : undefined}
      onSuccess={handleSuccess}
    />
  );
};

export default ProductFormModal;
