import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, Star, StarOff, Camera, MoveUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDraftImagesContext } from '@/contexts/DraftImagesContext';

interface ImprovedProductImagesFormProps {
  productId?: string;
  onImageUploadReady?: (uploadFn: (productId: string) => Promise<string[]>) => void;
}

const ImprovedProductImagesForm: React.FC<ImprovedProductImagesFormProps> = ({
  productId,
  onImageUploadReady,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const { 
    draftImages, 
    addDraftImage, 
    removeDraftImage, 
    uploadAllImages,
    setPrimaryImage,
    reorderImages,
    loadExistingImages,
    isLoading,
    isUploading
  } = useDraftImagesContext();

  React.useEffect(() => {
    console.log("📷 IMPROVED FORM - useEffect triggered:", { productId, hasUploadReady: !!onImageUploadReady });
    
    // Registrar função de upload sempre que disponível
    if (onImageUploadReady) {
      console.log("📷 IMPROVED FORM - Registrando função de upload");
      onImageUploadReady(uploadAllImages);
    }
  }, [onImageUploadReady, uploadAllImages]);

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
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const maxImages = 10;
    
    if (draftImages.length >= maxImages) {
      toast({
        title: "Limite atingido",
        description: `Você pode adicionar no máximo ${maxImages} imagens`,
        variant: "destructive",
      });
      return;
    }

    const remainingSlots = maxImages - draftImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione apenas arquivos de imagem",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }

      console.log("📷 IMPROVED FORM - Adicionando imagem:", file.name);
      addDraftImage(file);
    });
  };

  const handleSetPrimary = (imageId: string) => {
    console.log("📷 IMPROVED FORM - Definindo imagem principal:", imageId);
    setPrimaryImage(imageId);
    toast({
      title: "Imagem principal definida",
      description: "Esta imagem será a principal do produto",
    });
  };

  const handleMoveUp = (imageId: string) => {
    const currentIndex = draftImages.findIndex(img => img.id === imageId);
    if (currentIndex > 0) {
      reorderImages(imageId, currentIndex - 1);
    }
  };

  console.log("📷 IMPROVED FORM - Renderizando com", draftImages.length, "imagens");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Imagens do Produto
          <span className="text-sm font-normal text-muted-foreground">
            ({draftImages.length}/10)
          </span>
          {isLoading && (
            <span className="text-xs text-blue-600 animate-pulse">
              Carregando...
            </span>
          )}
          {isUploading && (
            <span className="text-xs text-green-600 animate-pulse">
              Salvando...
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Adicionar Imagens
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Arraste e solte ou clique para selecionar
          </p>
          <Button type="button" variant="outline">
            Escolher Arquivos
          </Button>
        </div>

        <input
          id="image-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Carregando imagens existentes...</p>
          </div>
        )}

        {/* No Images State */}
        {!isLoading && draftImages.length === 0 && productId && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              {productId ? "Nenhuma imagem encontrada para este produto" : "Adicione imagens para o produto"}
            </p>
          </div>
        )}

        {/* Images Grid */}
        {!isLoading && draftImages.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Imagens Carregadas</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {draftImages.map((image, index) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square rounded-lg border-2 border-gray-200 overflow-hidden">
                    <img
                      src={image.preview || image.url || ''}
                      alt={`Produto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        console.log("📷 IMPROVED FORM - Removendo imagem:", image.id);
                        removeDraftImage(image.id);
                      }}
                      className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      title="Remover imagem"
                    >
                      <X size={14} />
                    </button>
                    
                    {index > 0 && (
                      <button
                        onClick={() => handleMoveUp(image.id)}
                        className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                        title="Mover para cima"
                      >
                        <MoveUp size={14} />
                      </button>
                    )}
                  </div>

                  {/* Primary Image Actions */}
                  <div className="absolute bottom-2 left-2 right-2">
                    {image.isPrimary ? (
                      <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Star size={12} fill="currentColor" />
                        Principal
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleSetPrimary(image.id)}
                      >
                        <StarOff size={12} className="mr-1" />
                        Definir Principal
                      </Button>
                    )}
                  </div>

                  {/* Status Indicators */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {image.uploaded && (
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                        ✓
                      </div>
                    )}
                    
                    {!image.uploaded && !image.isExisting && (
                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Nova
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-500 space-y-1">
          <p>• A primeira imagem ou a marcada como "Principal" será a capa do produto</p>
          <p>• Formatos aceitos: JPG, PNG, WebP</p>
          <p>• Tamanho máximo: 5MB por imagem</p>
          <p>• Máximo: 10 imagens por produto</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovedProductImagesForm;
