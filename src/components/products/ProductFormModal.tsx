
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const handleSuccess = async () => {
    if (onSubmit && initialData) {
      await onSubmit(initialData);
    }
    onOpenChange(false);
  };

  return (
    <ProductFormWizard
      isOpen={open}
      onClose={() => onOpenChange(false)}
      editingProduct={mode === 'edit' ? initialData : undefined}
      onSuccess={handleSuccess}
    />
  );
};

export default ProductFormModal;
