
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProductFormComplete from './ProductFormComplete';
import { CreateProductData } from '@/hooks/useProducts';

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateProductData) => void;
  initialData?: any;
}

const ProductFormModal = ({ open, onOpenChange, onSubmit, initialData }: ProductFormModalProps) => {
  const handleSubmit = (data: CreateProductData) => {
    onSubmit(data);
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
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;
