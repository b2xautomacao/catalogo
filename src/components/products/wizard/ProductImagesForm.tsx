
import React from 'react';
import { useDraftImagesContext } from '@/contexts/DraftImagesContext';
import ImprovedProductImagesForm from './ImprovedProductImagesForm';

interface ProductImagesFormProps {
  productId?: string;
  onImageUploadReady?: (uploadFn: (productId: string) => Promise<string[]>) => void;
}

const ProductImagesForm: React.FC<ProductImagesFormProps> = ({
  productId,
  onImageUploadReady,
}) => {
  const { uploadAllImages } = useDraftImagesContext();

  console.log("📷 PRODUCT IMAGES FORM - Renderizando:", {
    productId,
    hasUploadReady: !!onImageUploadReady,
  });

  React.useEffect(() => {
    if (onImageUploadReady) {
      console.log("📷 PRODUCT IMAGES FORM - Registrando função de upload do contexto");
      onImageUploadReady(uploadAllImages);
    }
  }, [onImageUploadReady, uploadAllImages]);
  
  return (
    <ImprovedProductImagesForm
      productId={productId}
      onImageUploadReady={onImageUploadReady}
    />
  );
};

export default ProductImagesForm;
