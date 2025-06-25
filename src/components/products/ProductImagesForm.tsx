import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Eye, Droplet, Loader2 } from 'lucide-react';
import { useImageWatermark } from '@/hooks/useImageWatermark';
import WatermarkPreview from './WatermarkPreview';

interface ProductImage {
  file?: File;
  url?: string;
  alt?: string;
  isPrimary?: boolean;
}

interface ProductImagesFormProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}

const ProductImagesForm: React.FC<ProductImagesFormProps> = ({
  images,
  onChange
}) => {
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  const [showWatermarkPreview, setShowWatermarkPreview] = useState(false);
  const { applyWatermark, processing, watermarkEnabled } = useImageWatermark();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newImages: ProductImage[] = [];
    
    for (const file of acceptedFiles) {
      let processedFile = file;
      
      // Aplicar marca d'água automaticamente se estiver habilitada
      if (watermarkEnabled) {
        try {
          processedFile = await applyWatermark(file);
        } catch (error) {
          console.error('Erro ao aplicar marca d\'água:', error);
          // Continuar com o arquivo original se falhar
        }
      }
      
      newImages.push({
        file: processedFile,
        url: URL.createObjectURL(processedFile),
        alt: file.name,
        isPrimary: images.length === 0 && newImages.length === 0
      });
    }
    
    onChange([...images, ...newImages]);
  }, [images, onChange, applyWatermark, watermarkEnabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    
    // Se removeu a imagem principal, tornar a primeira como principal
    if (images[index]?.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    
    onChange(newImages);
  };

  const setPrimaryImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    onChange(newImages);
  };

  const handleWatermarkApplied = (index: number, watermarkedFile: File) => {
    const newImages = [...images];
    newImages[index] = {
      ...newImages[index],
      file: watermarkedFile,
      url: URL.createObjectURL(watermarkedFile)
    };
    onChange(newImages);
    setPreviewImageIndex(null);
    setShowWatermarkPreview(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Imagens do Produto
          {watermarkEnabled && (
            <Badge variant="outline" className="text-xs">
              <Droplet className="h-3 w-3 mr-1" />
              Marca d'água ativa
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400'
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
              {watermarkEnabled && (
                <p className="text-xs text-blue-600 mt-2">
                  ✨ Marca d'água será aplicada automaticamente
                </p>
              )}
            </div>
          )}
        </div>

        {/* Images Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.alt || `Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {image.isPrimary && (
                    <Badge variant="default" className="text-xs">
                      Principal
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setPreviewImageIndex(index);
                      setShowWatermarkPreview(true);
                    }}
                    title="Aplicar marca d'água"
                  >
                    <Droplet className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-6 w-6 p-0"
                    onClick={() => setPreviewImageIndex(index)}
                    title="Visualizar"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 w-6 p-0"
                    onClick={() => removeImage(index)}
                    title="Remover"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Set as Primary */}
                {!image.isPrimary && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute bottom-2 left-2 right-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setPrimaryImage(index)}
                  >
                    Tornar Principal
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Processing Indicator */}
        {processing && (
          <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-blue-600 text-sm">Aplicando marca d'água...</span>
          </div>
        )}

        {/* Preview Modal */}
        {previewImageIndex !== null && !showWatermarkPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg max-w-2xl max-h-[80vh]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Preview da Imagem</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewImageIndex(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <img
                src={images[previewImageIndex]?.url}
                alt="Preview"
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
          </div>
        )}

        {/* Watermark Preview Modal */}
        {showWatermarkPreview && previewImageIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Aplicar Marca d'Água</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowWatermarkPreview(false);
                    setPreviewImageIndex(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <WatermarkPreview
                imageFile={images[previewImageIndex]?.file || null}
                onWatermarkApplied={(watermarkedFile) => 
                  handleWatermarkApplied(previewImageIndex, watermarkedFile)
                }
              />
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500">
          A primeira imagem será usada como imagem principal do produto.
          {watermarkEnabled && (
            <span className="block mt-1 text-blue-600">
              Marca d'água está ativa e será aplicada automaticamente em novas imagens.
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
};

export default ProductImagesForm;
