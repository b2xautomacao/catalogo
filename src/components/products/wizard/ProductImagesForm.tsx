
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProductImages } from '@/hooks/useProductImages';
import { useDraftImages } from '@/hooks/useDraftImages';
import { UseFormReturn } from 'react-hook-form';

interface ProductImagesFormProps {
  form: UseFormReturn<any>;
  initialData?: any;
  mode?: 'create' | 'edit';
}

const ProductImagesForm: React.FC<ProductImagesFormProps> = ({
  form,
  initialData,
  mode = 'create'
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { uploadAndSaveImages, loading, error } = useProductImages();
  const { draftImages, addDraftImages, removeDraftImage, clearDraftImages } = useDraftImages();

  // Carregar imagens iniciais se estiver no modo edição
  useEffect(() => {
    if (mode === 'edit' && initialData?.image_url) {
      setImages([initialData.image_url]);
    }
  }, [mode, initialData]);

  // Sincronizar draft images com estado local
  useEffect(() => {
    if (mode === 'create' && draftImages.length > 0) {
      const imageUrls = draftImages.map(img => img.url);
      setImages(imageUrls);
      
      // Atualizar o form com a primeira imagem
      if (imageUrls.length > 0) {
        form.setValue('image_url', imageUrls[0]);
      }
    }
  }, [draftImages, mode, form]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (mode === 'create') {
      // No modo criação, usar draft images
      addDraftImages(acceptedFiles);
    } else if (mode === 'edit' && initialData?.id) {
      // No modo edição, fazer upload direto
      try {
        setUploading(true);
        const uploadedImages = await uploadAndSaveImages(acceptedFiles, initialData.id);
        const newImageUrls = uploadedImages.map(img => img.image_url);
        const updatedImages = [...images, ...newImageUrls];
        setImages(updatedImages);
        
        // Atualizar o form com a primeira imagem
        if (updatedImages.length > 0) {
          form.setValue('image_url', updatedImages[0]);
        }
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
      } finally {
        setUploading(false);
      }
    }
  }, [mode, initialData, addDraftImages, uploadAndSaveImages, images, form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true
  });

  const removeImage = (index: number) => {
    if (mode === 'create') {
      removeDraftImage(index);
    } else {
      const updatedImages = images.filter((_, i) => i !== index);
      setImages(updatedImages);
      
      // Atualizar o form
      if (updatedImages.length > 0) {
        form.setValue('image_url', updatedImages[0]);
      } else {
        form.setValue('image_url', '');
      }
    }
  };

  const isLoading = loading || uploading;
  const displayImages = mode === 'create' ? draftImages.map(img => img.url) : images;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Imagens do Produto</label>
        <p className="text-sm text-gray-600">
          Adicione até 10 imagens do produto. A primeira imagem será a principal.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={isLoading} />
        <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 mb-2">
          {isDragActive
            ? 'Solte as imagens aqui...'
            : 'Arraste imagens aqui ou clique para selecionar'
          }
        </p>
        <p className="text-sm text-gray-500">
          Formatos aceitos: JPG, PNG, WebP (máx. 5MB cada)
        </p>
        {isLoading && (
          <p className="text-sm text-blue-600 mt-2">Fazendo upload...</p>
        )}
      </div>

      {displayImages.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Imagens Adicionadas ({displayImages.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`Produto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Principal
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImagesForm;
