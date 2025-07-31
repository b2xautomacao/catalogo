import React, { useState, useCallback, useRef } from "react";
import { useProductImages } from "@/hooks/useProductImages";
import { useImageUploadControl } from "@/hooks/useImageUploadControl"; // 🎯 NOVO: Controle de limites
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ImageIcon,
  Upload,
  Trash2,
  Star,
  StarOff,
  Camera,
  X,
  AlertCircle,
  Info, // 🎯 NOVO: Ícone de informação
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert"; // 🎯 NOVO: Alert component

interface ProductImageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onImagesUpdated?: () => void; // 🎯 NOVO: Callback para atualizar lista
}

const ProductImageManagerModal: React.FC<ProductImageManagerModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  onImagesUpdated, // 🎯 NOVO: Usar callback
}) => {
  const { images, loading, error, refetchImages } = useProductImages(productId);
  const { canUploadImage, recordImageUpload, getImageLimitInfo } =
    useImageUploadControl(); // 🎯 NOVO: Hook de controle
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false); // 🎯 NOVO: Estado de drag
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 🎯 NOVO: Verificar limites do plano
  const { featureName } = getImageLimitInfo();
  const maxImages = 10; // Default do sistema

  // Fechar modal
  const handleClose = () => {
    onClose();
    // 🎯 NOVO: Notificar atualização ao fechar
    if (onImagesUpdated) {
      console.log(
        "🔄 MODAL - Notificando atualização da lista após edição de imagens"
      );
      onImagesUpdated();
    }
  };

  // 🎯 NOVO: Funções de Drag and Drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length > 0) {
      handleFilesSelected(files);
    }
  };

  // 🎯 MODIFICADO: Função unificada para seleção de arquivos
  const handleFilesSelected = async (files: File[]) => {
    const currentImageCount = images.length;
    const availableSlots = maxImages - currentImageCount;

    if (files.length > availableSlots) {
      toast({
        title: "Limite de imagens",
        description: `Você pode adicionar no máximo ${availableSlots} imagem(ns). Você selecionou ${files.length}.`,
        variant: "destructive",
      });
      return;
    }

    // Verificar se pode fazer upload
    const canUpload = await canUploadImage();
    if (!canUpload) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de imagens do seu plano.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFilesSelected(Array.from(files));
    }
  };

  // Definir imagem como principal
  const handleSetPrimary = useCallback(
    async (imageId: string) => {
      try {
        console.log("🌟 MODAL - Definindo imagem principal:", imageId);

        // 🎯 SINCRONIZAÇÃO COMPLETA: is_primary + image_order
        // 1. Remover 'principal' de todas as imagens
        await supabase
          .from("product_images")
          .update({ is_primary: false })
          .eq("product_id", productId);

        // 2. Definir a imagem selecionada como principal E primeira na ordem
        const { error: setPrimaryError } = await supabase
          .from("product_images")
          .update({
            is_primary: true,
            image_order: 1, // 🎯 NOVA: Colocar como primeira na ordem
          })
          .eq("id", imageId);

        if (setPrimaryError) {
          throw setPrimaryError;
        }

        // 3. Reorganizar as outras imagens para ordens subsequentes
        const otherImages = images.filter((img) => img.id !== imageId);
        for (let i = 0; i < otherImages.length; i++) {
          await supabase
            .from("product_images")
            .update({ image_order: i + 2 }) // Começar do 2 (já que principal é 1)
            .eq("id", otherImages[i].id);
        }

        // 4. Atualizar image_url do produto
        const targetImage = images.find((img) => img.id === imageId);
        if (targetImage) {
          await supabase
            .from("products")
            .update({ image_url: targetImage.image_url })
            .eq("id", productId);
        }

        // Recarregar imagens
        await refetchImages();

        toast({
          title: "✅ Imagem principal definida",
          description: "Esta imagem agora é a capa do produto",
        });

        console.log(
          "✅ MODAL - Sincronização completa: is_primary + image_order"
        );
      } catch (error) {
        console.error("❌ Erro ao definir imagem principal:", error);
        toast({
          title: "❌ Erro",
          description: "Não foi possível definir a imagem principal",
          variant: "destructive",
        });
      }
    },
    [productId, images, refetchImages, toast]
  );

  // Deletar imagem
  const handleDeleteImage = useCallback(
    async (imageId: string) => {
      try {
        const imageToDelete = images.find((img) => img.id === imageId);

        if (!imageToDelete) return;

        // Confirmar exclusão
        if (!confirm("Tem certeza que deseja excluir esta imagem?")) {
          return;
        }

        console.log("🗑️ MODAL - Deletando imagem:", imageId);

        // Deletar do banco
        const { error: deleteError } = await supabase
          .from("product_images")
          .delete()
          .eq("id", imageId);

        if (deleteError) {
          throw deleteError;
        }

        // Deletar do storage (opcional, pode ser async)
        try {
          const fileName = imageToDelete.image_url.split("/").pop();
          if (fileName) {
            await supabase.storage
              .from("product-images")
              .remove([`products/${productId}/${fileName}`]);
          }
        } catch (storageError) {
          console.warn("⚠️ Erro ao deletar do storage:", storageError);
        }

        // Se era a imagem principal, definir a primeira como principal
        if (imageToDelete.is_primary && images.length > 1) {
          const remainingImages = images.filter((img) => img.id !== imageId);
          if (remainingImages.length > 0) {
            await handleSetPrimary(remainingImages[0].id);
          }
        }

        // Recarregar imagens
        await refetchImages();

        toast({
          title: "✅ Imagem excluída",
          description: "A imagem foi removida do produto",
        });
      } catch (error) {
        console.error("❌ Erro ao excluir imagem:", error);
        toast({
          title: "❌ Erro",
          description: "Não foi possível excluir a imagem",
          variant: "destructive",
        });
      }
    },
    [images, productId, refetchImages, toast, handleSetPrimary]
  );

  // Upload de novas imagens
  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      console.log(
        "📤 MODAL - Fazendo upload de",
        selectedFiles.length,
        "imagens"
      );

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split(".").pop()?.toLowerCase();
        const fileName = `products/${productId}/${Date.now()}-${i}.${fileExt}`;

        // Upload para storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        // Obter URL pública
        const {
          data: { publicUrl },
        } = supabase.storage.from("product-images").getPublicUrl(fileName);

        // Salvar no banco
        const { error: dbError } = await supabase
          .from("product_images")
          .insert({
            product_id: productId,
            image_url: publicUrl,
            image_order: images.length + i + 1,
            is_primary: images.length === 0 && i === 0, // Primeira imagem se não há outras
            alt_text: `${productName} - Imagem ${images.length + i + 1}`,
          });

        if (dbError) {
          throw dbError;
        }

        // Se é a primeira imagem e não há outras, atualizar o produto
        if (images.length === 0 && i === 0) {
          await supabase
            .from("products")
            .update({ image_url: publicUrl })
            .eq("id", productId);
        }
      }

      // Recarregar imagens
      await refetchImages();

      toast({
        title: "✅ Upload concluído",
        description: `${selectedFiles.length} imagem(s) adicionada(s) com sucesso`,
      });

      setSelectedFiles([]);

      // Limpar input
      const fileInput = document.getElementById(
        "image-upload"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("❌ Erro no upload:", error);
      toast({
        title: "❌ Erro no upload",
        description: "Não foi possível fazer upload das imagens",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [selectedFiles, productId, productName, images, refetchImages, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Gerenciar Imagens - {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 🎯 NOVO: Alerta de limite de imagens */}
          {images.length >= maxImages && (
            <Alert className="border-orange-200 bg-orange-50">
              <Info className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Limite atingido:</strong> Você atingiu o limite de{" "}
                {maxImages} imagens por produto. Delete algumas imagens para
                adicionar novas.
              </AlertDescription>
            </Alert>
          )}

          {/* 🎯 MELHORADO: Upload Section com Drag and Drop */}
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              } ${
                images.length >= maxImages
                  ? "opacity-50 pointer-events-none"
                  : ""
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Upload
                    className={`h-12 w-12 ${
                      isDragging ? "text-blue-500" : "text-gray-400"
                    }`}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium">
                    {isDragging
                      ? "Solte as imagens aqui"
                      : "Adicionar Novas Imagens"}
                  </h3>
                  <p className="text-gray-600 text-sm mt-2">
                    Arraste e solte imagens aqui ou clique para selecionar
                    <br />
                    JPG, PNG ou WebP (máx. 5MB cada) • {images.length}/
                    {maxImages} imagens
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    accept="image/*"
                    className="hidden"
                    disabled={images.length >= maxImages}
                  />

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || images.length >= maxImages}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Enviando..." : "Selecionar Imagens"}
                  </Button>

                  {selectedFiles.length > 0 && (
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Enviar ({selectedFiles.length})
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Preview de arquivos selecionados */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Imagens selecionadas:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() =>
                          setSelectedFiles((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                        {Math.round(file.size / 1024)}KB
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando imagens...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center text-destructive">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Erro ao carregar imagens: {error}</p>
              </div>
            </div>
          )}

          {/* Images Grid */}
          {!loading && !error && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Imagens do Produto ({images.length})
                </h3>

                {images.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Clique para definir como principal • Arraste para reordenar
                  </p>
                )}
              </div>

              {images.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Nenhuma imagem encontrada. Faça upload de imagens para este
                    produto.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative group border-2 border-transparent hover:border-primary/50 rounded-lg overflow-hidden bg-muted/50 transition-all duration-200"
                    >
                      {/* Imagem */}
                      <div className="aspect-square relative">
                        <img
                          src={image.image_url}
                          alt={image.alt_text || `Imagem ${index + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Overlay de ações */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-2">
                            {/* Botão Principal */}
                            {!image.is_primary ? (
                              <Button
                                size="sm"
                                onClick={() => handleSetPrimary(image.id)}
                                className="flex items-center gap-1"
                              >
                                <StarOff className="w-3 h-3" />
                                Principal
                              </Button>
                            ) : (
                              <Badge className="bg-yellow-500 text-white">
                                <Star className="w-3 h-3 mr-1" />
                                Principal
                              </Badge>
                            )}

                            {/* Botão Deletar */}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteImage(image.id)}
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Deletar
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Badge de principal */}
                      {image.is_primary && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-yellow-500 text-white text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Principal
                          </Badge>
                        </div>
                      )}

                      {/* Número da ordem */}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          {image.image_order || index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleClose} variant="outline">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImageManagerModal;
