
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { useDraftImages } from "@/hooks/useDraftImages";
import ImprovedDraftImageUpload from "../ImprovedDraftImageUpload";

export interface ProductImagesFormProps {
  productId?: string;
  onImageUploadReady?: (uploadFn: (productId: string) => Promise<string[]>) => void;
}

const ProductImagesForm: React.FC<ProductImagesFormProps> = ({
  productId,
  onImageUploadReady,
}) => {
  const { uploadAllImages } = useDraftImages();

  React.useEffect(() => {
    if (onImageUploadReady) {
      onImageUploadReady(uploadAllImages);
    }
  }, [onImageUploadReady, uploadAllImages]);

  return (
    <ImprovedDraftImageUpload 
      productId={productId}
      maxImages={10}
    />
  );
};

export default ProductImagesForm;
