
import React, { useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDraftImages } from '@/hooks/useDraftImages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ImprovedDraftImageUploadProps {
  productId?: string;
  maxImages?: number;
}

const ImprovedDraftImageUpload = ({ 
  productId,
  maxImages = 5
}: ImprovedDraftImageUploadProps) => {
  const {
    draftImages,
    uploading,
    isLoading,
    addDraftImages,
    removeDraftImage,
    loadExistingImages
  } = useDraftImages();
  const { toast } = useToast();

  console.log('🖼 IMPROVED DRAFT IMAGE UPLOAD - Renderizando:', {
    productId,
    imagesCount: draftImages.length,
    uploading,
    isLoading
  });

  useEffect(() => {
    if (productId) {
      console.log('📂 IMPROVED DRAFT IMAGE UPLOAD - Carregando imagens existentes para:', productId);
      loadExistingImages(productId);
    }
  }, [productId, loadExistingImages]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    console.log('📁 IMPROVED DRAFT IMAGE UPLOAD - Arquivos selecionados:', files.length);
    
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
    const validFiles: File[] = [];

    filesToProcess.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Arquivo inválido",
          description: `${file.name} não é uma imagem válida`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o limite de 5MB`,
          variant: "destructive",
        });
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      console.log('➕ IMPROVED DRAFT IMAGE UPLOAD - Adicionando arquivos válidos:', validFiles.length);
      addDraftImages(validFiles);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Carregando imagens...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Imagens do Produto
          {draftImages.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({draftImages.length}/{maxImages})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zona de Upload */}
        {draftImages.length < maxImages && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-all hover:border-primary hover:bg-gray-50"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploading && document.getElementById('improved-image-upload')?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-primary font-medium">Processando imagens...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2 font-medium">
                  Arraste e solte imagens aqui, ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, JPEG, GIF, WEBP • Máximo {maxImages} imagens • 5MB por arquivo
                </p>
              </div>
            )}
          </div>
        )}

        <input
          id="improved-image-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading}
        />

        {/* Preview das Imagens */}
        {draftImages.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              Imagens Selecionadas
              {uploading && (
                <span className="text-sm text-blue-600 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processando...
                </span>
              )}
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {draftImages.map((image, index) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors">
                    {image.preview || image.url ? (
                      <img
                        src={image.preview || image.url || ''}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                        style={{ aspectRatio: '1/1' }}
                        onError={(e) => {
                          console.error('❌ IMPROVED DRAFT IMAGE UPLOAD - Erro ao carregar:', image.id);
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const errorDiv = target.parentElement?.querySelector('.error-placeholder');
                          if (errorDiv) {
                            (errorDiv as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="error-placeholder w-full h-full items-center justify-center bg-gray-100 hidden">
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                  </div>
                  
                  <div className="absolute top-2 left-2">
                    {image.uploaded ? (
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        ✓ Salva
                      </div>
                    ) : image.isExisting ? (
                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Existente
                      </div>
                    ) : (
                      <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Nova
                      </div>
                    )}
                  </div>

                  {index === 0 && (
                    <div className="absolute top-2 right-8">
                      <div className="bg-primary text-white text-xs px-2 py-1 rounded-full font-medium">
                        Principal
                      </div>
                    </div>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      console.log('🗑 IMPROVED DRAFT IMAGE UPLOAD - Removendo:', image.id);
                      removeDraftImage(image.id);
                    }}
                    disabled={uploading}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">💡 Dicas importantes:</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• A primeira imagem será definida como principal</li>
            <li>• Use imagens quadradas (1:1) para melhor visualização</li>
            <li>• Máximo de {maxImages} imagens por produto</li>
            <li>• Formatos aceitos: PNG, JPG, JPEG, GIF, WEBP</li>
            <li>• As imagens serão salvas automaticamente ao concluir o cadastro</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovedDraftImageUpload;
