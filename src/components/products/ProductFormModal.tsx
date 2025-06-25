
import React from 'react';
import SimpleProductWizard from './SimpleProductWizard';

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
  const handleSuccess = async () => {
    console.log('🎉 ProductFormModal - Produto salvo com sucesso');
    
    // Chamar onSubmit se fornecido (para refresh da lista)
    if (onSubmit) {
      try {
        await onSubmit({});
      } catch (error) {
        console.error('Erro no onSubmit:', error);
      }
    }
    
    // Fechar modal
    onOpenChange(false);
  };

  return (
    <SimpleProductWizard
      isOpen={open}
      onClose={() => onOpenChange(false)}
      editingProduct={mode === 'edit' ? initialData : undefined}
      onSuccess={handleSuccess}
    />
  );
};

export default ProductFormModal;
