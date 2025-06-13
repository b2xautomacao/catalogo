
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ProductFormComplete from './ProductFormComplete';
import { CreateProductData, UpdateProductData } from '@/hooks/useProducts';

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateProductData | UpdateProductData) => void;
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
    await onSubmit(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
        <div className="overflow-y-auto max-h-[95vh]">
          <ProductFormComplete
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={initialData}
            mode={mode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;
