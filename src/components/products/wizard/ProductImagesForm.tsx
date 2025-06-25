
import React, { useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useDraftImages } from '@/hooks/useDraftImages';

interface ProductImagesFormProps {
  productId?: string;
}

const ProductImagesForm: React.FC<ProductImagesFormProps> = ({ productId }) => {
  const {
    draftImages,
    isUploading,
    addDraftImages,
    removeDraftImage,
    loadExistingImages
  } = useDraftImages();

  // Carregar imagens existentes quando em modo de edição
  useEffect(() => {
    if (productId) {
      console.log('ProductImagesForm: Carregando imagens existentes para produto:', productId);
      loadExistingImages(productId);
    }
  }, [productId, loadExistingImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 10,
    onDrop: (acceptedFiles) => {
      console.log('ProductImagesForm: Arquivos selecionados:', acceptedFiles.length);
      addDraftImages(acceptedFiles);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Imagens do Produto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de Upload */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-gray-300 hover:border-primary hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-primary">Solte as imagens aqui...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Arraste e solte imagens aqui, ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500">
                Suporta PNG, JPG, JPEG, GIF, WEBP (máx. 10 imagens)
              </p>
            </div>
          )}
        </div>

        {/* Preview das Imagens */}
        {draftImages.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Imagens Selecionadas ({draftImages.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {draftImages.map((image, index) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Status de Upload */}
                  <div className="absolute top-2 left-2">
                    {image.uploaded ? (
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Salva
                      </div>
                    ) : (
                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Nova
                      </div>
                    )}
                  </div>

                  {/* Indicador de Principal */}
                  {index === 0 && (
                    <div className="absolute top-2 right-8">
                      <div className="bg-primary text-white text-xs px-2 py-1 rounded">
                        Principal
                      </div>
                    </div>
                  )}
                  
                  {/* Botão de Remover */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeDraftImage(image.id)}
                    disabled={isUploading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status de Upload */}
        {isUploading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Enviando imagens...
            </div>
          </div>
        )}

        {/* Informações */}
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
          <strong>Dicas:</strong>
          <ul className="mt-1 space-y-1">
            <li>• A primeira imagem será definida como principal</li>
            <li>• Use imagens de boa qualidade (mín. 800x800px)</li>
            <li>• Máximo de 10 imagens por produto</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductImagesForm;
