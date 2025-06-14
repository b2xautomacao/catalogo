
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
      <DialogContent className="
        w-[100vw] h-[100vh] max-w-none max-h-none m-0 p-0 
        sm:w-[95vw] sm:h-[95vh] sm:max-w-4xl sm:max-h-[95vh] sm:m-auto sm:rounded-lg
        overflow-hidden flex flex-col
      ">
        <DialogHeader className="px-3 py-2 sm:px-6 sm:py-4 border-b bg-background shrink-0">
          <DialogTitle className="text-base sm:text-lg xl:text-xl">
            {mode === 'edit' ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden p-3 sm:p-4 lg:p-6">
          <ProductFormWizard
            onSubmit={onSubmit}
            initialData={initialData}
            mode={mode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;
