
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
      <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg sm:text-xl">
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
