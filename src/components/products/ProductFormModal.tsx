
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ProductFormComplete from './ProductFormComplete';
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
      // O modal será fechado pelo componente pai após sucesso
    } catch (error) {
      console.error('Erro no submit do modal:', error);
      // O erro será tratado pelo componente pai
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[95vh] p-0">
        <div className="h-full overflow-y-auto p-6">
          <ProductFormComplete
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
