import React, { useEffect } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSimpleDraftImages } from "@/hooks/useSimpleDraftImages";
import { useToast } from "@/hooks/use-toast";

interface SimpleImageUploadProps {
  productId?: string;
  maxImages?: number;
  onImagesChange?: (images: any[]) => void;
  onUploadReady?: (uploadFn: (productId: string) => Promise<string[]>) => void;
}

const SimpleImageUpload = ({
  productId,
  maxImages = 10,
  onImagesChange,
  onUploadReady,
}: SimpleImageUploadProps) => {
  const {
    images,
    isUploading,
    isLoading,
    addImages,
    removeImage,
    loadExistingImages,
    uploadImages,
    uploadNewImages,
  } = useSimpleDraftImages();
  const { toast } = useToast();

  useEffect(() => {
    if (productId) {
      loadExistingImages(productId);
    }
  }, [productId, loadExistingImages]);

  // Notificar mudanças nas imagens para o componente pai
  useEffect(() => {
    if (onImagesChange) {
      onImagesChange(images);
    }
  }, [images, onImagesChange]);

  // Expor função de upload para o componente pai
  useEffect(() => {
    if (onUploadReady) {
      onUploadReady(uploadNewImages);
    }
  }, [onUploadReady, uploadNewImages]);

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
    // Limpar o input para permitir selecionar os mesmos arquivos novamente
    e.target.value = "";
  };

  const handleFiles = (files: File[]) => {
    console.log("📁 HANDLE FILES - Arquivos recebidos:", files.length);
    console.log(
      "📊 HANDLE FILES - Imagens atuais:",
      images.length,
      "Max:",
      maxImages
    );

    if (images.length >= maxImages) {
      console.log("❌ HANDLE FILES - Limite atingido");
      toast({
        title: "Limite atingido",
        description: `Você pode adicionar no máximo ${maxImages} imagens`,
        variant: "destructive",
      });
      return;
    }

    const remainingSlots = maxImages - images.length;
    const filesToProcess = files.slice(0, remainingSlots);
    const validFiles: File[] = [];

    console.log("📋 HANDLE FILES - Slots restantes:", remainingSlots);
    console.log(
      "📋 HANDLE FILES - Arquivos para processar:",
      filesToProcess.length
    );

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        console.log("❌ HANDLE FILES - Arquivo não é imagem:", file.name);
        toast({
          title: "Arquivo inválido",
          description: `${file.name} não é uma imagem válida`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        console.log(
          "❌ HANDLE FILES - Arquivo muito grande:",
          file.name,
          file.size
        );
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o limite de 5MB`,
          variant: "destructive",
        });
        return;
      }

      console.log("✅ HANDLE FILES - Arquivo válido:", file.name);
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      console.log(
        "🚀 HANDLE FILES - Adicionando",
        validFiles.length,
        "imagens"
      );
      addImages(validFiles);
    } else {
      console.log("⚠️ HANDLE FILES - Nenhum arquivo válido encontrado");
    }
  };

  const handleUploadClick = () => {
    const input = document.getElementById("simple-image-upload");
    if (input && !isUploading) {
      (input as HTMLInputElement).click();
    }
  };

  const MAX_IMAGES = 10;

  const handleImageUpload = (newImages) => {
    if (images.length + newImages.length > MAX_IMAGES) {
      toast({
        title: "Limite de imagens atingido",
        description: `Você pode cadastrar no máximo ${MAX_IMAGES} imagens por produto.`,
        variant: "destructive",
      });
      return;
    }
    // prossegue com upload normalmente
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
          {images.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({images.length}/{maxImages})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Área de Upload */}
        {images.length < maxImages && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-all hover:border-primary hover:bg-gray-50"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleUploadClick}
          >
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2 font-medium">
                Arraste e solte imagens aqui, ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, JPEG, GIF, WEBP • Máximo {maxImages} imagens • 5MB por
                arquivo
              </p>
            </div>
          </div>
        )}

        <input
          id="simple-image-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading}
        />

        {/* Preview das Imagens */}
        {images.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Imagens Selecionadas</h4>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors">
                    <img
                      src={image.preview || image.url || ""}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error(
                          "❌ Erro ao carregar imagem:",
                          image.preview || image.url
                        );
                        const target = e.currentTarget;
                        target.style.display = "none";
                        const errorDiv =
                          target.parentElement?.querySelector(
                            ".error-placeholder"
                          );
                        if (errorDiv) {
                          (errorDiv as HTMLElement).style.display = "flex";
                        }
                      }}
                    />

                    {/* Placeholder de erro */}
                    <div className="error-placeholder w-full h-full items-center justify-center bg-gray-100 hidden">
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    {image.uploaded || image.isExisting ? (
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        ✓ Salva
                      </div>
                    ) : (
                      <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Nova
                      </div>
                    )}
                  </div>

                  {/* Principal Badge */}
                  {index === 0 && (
                    <div className="absolute top-2 right-8">
                      <div className="bg-primary text-white text-xs px-2 py-1 rounded-full font-medium">
                        Principal
                      </div>
                    </div>
                  )}

                  {/* Remove Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(image.id)}
                    disabled={isUploading}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Ordem da Imagem */}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dicas */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">
            💡 Dicas importantes:
          </h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• A primeira imagem será definida como principal</li>
            <li>• Use imagens de alta qualidade (mínimo 800x800px)</li>
            <li>• Máximo de {maxImages} imagens por produto</li>
            <li>
              • As imagens serão salvas automaticamente ao concluir o cadastro
            </li>
          </ul>
        </div>

        <Button
          onClick={handleUploadClick}
          disabled={images.length >= MAX_IMAGES}
        >
          Adicionar Imagem
        </Button>
      </CardContent>
    </Card>
  );
};

export default SimpleImageUpload;
