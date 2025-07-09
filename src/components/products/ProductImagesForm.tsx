import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Loader2, GripVertical } from "lucide-react";
import { useProductImages, ProductImage } from "@/hooks/useProductImages";
import { useProductImageManager } from "@/hooks/useProductImageManager";

interface ProductImagesFormProps {
  productId: string;
}

const DraggableImageCard = ({
  image,
  index,
  moveImage,
  onRemove,
  onSetPrimary,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: "image",
    hover(item: { index: number }) {
      if (!ref.current) return;
      if (item.index === index) return;
      moveImage(item.index, index);
      item.index = index;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: "image",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={preview}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="relative group"
    >
      <div
        ref={ref}
        className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
      >
        <img
          src={image.image_url}
          alt={image.alt_text || `Imagem ${index + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute top-2 left-2 flex gap-1">
        {image.is_primary && (
          <Badge variant="default" className="text-xs">
            Principal
          </Badge>
        )}
      </div>

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="destructive"
          className="h-6 w-6 p-0"
          onClick={() => onRemove(image.id, image.image_url)}
          title="Remover"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {!image.is_primary && (
        <Button
          size="sm"
          variant="outline"
          className="absolute bottom-2 left-2 right-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onSetPrimary(image.id)}
        >
          Tornar Principal
        </Button>
      )}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
        <GripVertical ref={drag} className="h-5 w-5 text-white" />
      </div>
    </div>
  );
};

const ProductImagesForm: React.FC<ProductImagesFormProps> = ({ productId }) => {
  const {
    images: initialImages,
    loading: loadingImages,
    refetchImages,
  } = useProductImages(productId);
  const {
    isUploading,
    uploadProductImage,
    deleteProductImage,
    updateImageOrder,
  } = useProductImageManager(productId);
  const [images, setImages] = useState<ProductImage[]>([]);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        await uploadProductImage(file, images.length);
      }
      refetchImages();
    },
    [images, uploadProductImage, refetchImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    multiple: true,
  });

  const handleRemoveImage = async (imageId: string, imageUrl: string) => {
    await deleteProductImage(imageId, imageUrl);
    refetchImages();
  };

  const handleSetPrimary = async (newPrimaryId: string) => {
    const updates = images.map((img) => ({
      id: img.id,
      image_order: img.id === newPrimaryId ? 1 : img.image_order, // Nova imagem principal fica na posição 1
      is_primary: img.id === newPrimaryId,
    }));
    await updateImageOrder(updates);
    refetchImages();
  };

  const moveImage = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      const draggedImage = images[dragIndex];
      const newImages = [...images];
      newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, draggedImage);

      setImages(newImages);

      const updates = newImages.map((img, index) => ({
        id: img.id,
        image_order: index + 1, // image_order deve começar em 1, não 0
        is_primary: img.is_primary,
      }));

      await updateImageOrder(updates);
      refetchImages();
    },
    [images, updateImageOrder, refetchImages]
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Imagens do Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Solte as imagens aqui...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Arraste e solte imagens aqui, ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500">
                  Formatos suportados: JPG, PNG, WebP
                </p>
              </div>
            )}
          </div>

          {(isUploading || loadingImages) && (
            <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-blue-600 text-sm">
                {loadingImages ? "Carregando imagens..." : "Enviando..."}
              </span>
            </div>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <DraggableImageCard
                  key={image.id}
                  index={index}
                  image={image}
                  moveImage={moveImage}
                  onRemove={handleRemoveImage}
                  onSetPrimary={handleSetPrimary}
                />
              ))}
            </div>
          )}
          <p className="text-sm text-gray-500">
            Arraste as imagens para reordenar. A primeira imagem será a
            principal.
          </p>
        </CardContent>
      </Card>
    </DndProvider>
  );
};

export default ProductImagesForm;
