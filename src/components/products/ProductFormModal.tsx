
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ProductFormWizard from './ProductFormWizard';
import { CreateProductData, UpdateProductData } from '@/hooks/useProducts';

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateProductData | UpdateProductData) => Promise<void>;
  initialData?: any;
  mode?: 'create' | 'edit';
}

const ProductFormModal = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  initialData, 
  mode = 'create' 
}: ProductFormModalProps) => {
  const handleSubmit = async (data: CreateProductData | UpdateProductData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro no submit do modal:', error);
      // O erro será tratado pelo componente pai
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] p-0">
        <div className="h-full overflow-y-auto p-6">
          <ProductFormWizard
            onSubmit={handleSubmit}
            initialData={initialData}
            mode={mode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;
