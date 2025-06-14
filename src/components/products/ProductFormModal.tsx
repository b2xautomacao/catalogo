
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProductFormWizard from './ProductFormWizard';

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>
        
        <ProductFormWizard
          onSubmit={onSubmit}
          initialData={initialData}
          mode={mode}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;
