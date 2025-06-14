
import React, { useState, useRef, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useDraftImages } from '@/hooks/useDraftImages';
import { useProductImages } from '@/hooks/useProductImages';

interface ProductImagesFormProps {
  form: UseFormReturn<any>;
}

const ProductImagesForm = ({ form }: ProductImagesFormProps) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { draftImages, addDraftImage, removeDraftImage, uploading } = useDraftImages();
  
  // Para modo edição, buscar imagens existentes
  const productId = form.getValues('id');
  const { images: existingImages, loading: loadingExisting } = useProductImages(productId);

  // Combinar imagens existentes + draft images para exibição
  const allImages = [
    ...existingImages.map(img => ({
      id: img.id,
      url: img.image_url,
      uploaded: true,
      existing: true,
      isPrimary: img.is_primary
    })),
    ...draftImages.map(img => ({
      ...img,
      existing: false,
      isPrimary: false
    }))
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        addDraftImage(file);
      }
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          addDraftImage(file);
        }
      });
    }
  };

  const handleRemoveImage = (imageId: string, isExisting: boolean) => {
    if (isExisting) {
      // Para imagens existentes, marcar para remoção (implementar depois se necessário)
      console.log('Remover imagem existente:', imageId);
    } else {
      removeDraftImage(imageId);
    }
  };

  // Atualizar image_url principal se houver imagens
  useEffect(() => {
    if (allImages.length > 0) {
      const primaryImage = allImages.find(img => img.isPrimary) || allImages[0];
      form.setValue('image_url', primaryImage.url);
    } else {
      form.setValue('image_url', '');
    }
  }, [allImages, form]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Imagens do Produto</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Adicione imagens para mostrar seu produto. A primeira imagem será usada como principal.
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Processando imagens...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              Arraste e solte imagens aqui ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground">
              PNG, JPG, WebP ou GIF • Máximo 5MB por imagem
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        className="hidden"
        disabled={uploading}
      />

      {/* Images Grid */}
      {allImages.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Imagens Adicionadas ({allImages.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allImages.map((image, index) => (
              <Card key={image.id} className="relative overflow-hidden">
                <CardContent className="p-2">
                  <div className="relative aspect-square">
                    <img
                      src={image.url}
                      alt={`Produto ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      {image.isPrimary && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Principal
                        </span>
                      )}
                      {!image.existing && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Nova
                        </span>
                      )}
                    </div>

                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => handleRemoveImage(image.id, image.existing)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-muted/50 border border-muted rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ImageIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Dicas para melhores imagens:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use imagens com boa iluminação e alta qualidade</li>
              <li>• Mostre o produto de diferentes ângulos</li>
              <li>• A primeira imagem será usada como capa do produto</li>
              <li>• Imagens quadradas (1:1) funcionam melhor</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductImagesForm;
