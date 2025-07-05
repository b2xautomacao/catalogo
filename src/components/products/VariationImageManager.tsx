import React, { useState, useCallback, useEffect } from "react";
import {
  Upload,
  X,
  Camera,
  ImageIcon,
  Palette,
  Shirt,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVariationDraftImages } from "@/hooks/useVariationDraftImages";
import { useSimpleDraftImages } from "@/hooks/useSimpleDraftImages";
import { useProductImages } from "@/hooks/useProductImages";
import { useToast } from "@/hooks/use-toast";
import { ProductVariation } from "@/types/variation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VariationImageManagerProps {
  productId?: string;
  variations: ProductVariation[];
  onImagesUpdated: (color: string, imageUrl: string) => void;
}

const VariationImageManager: React.FC<VariationImageManagerProps> = ({
  productId,
  variations,
  onImagesUpdated,
}) => {
  const { toast } = useToast();
  const [selectedVariationForImage, setSelectedVariationForImage] = useState<
    string | null
  >(null);
  const [showImageSelector, setShowImageSelector] = useState(false);

  const {
    draftImages,
    uploadVariationImage,
    removeVariationImage,
    getImageForColor,
  } = useVariationDraftImages();
  const { images: productImages } = useSimpleDraftImages();
  const { images: savedProductImages } = useProductImages(productId);

  // Combinar imagens do produto (draft + salvas)
  const allProductImages = React.useMemo(() => {
    const draftUrls = productImages
      .map((img) => img.url || img.preview)
      .filter(Boolean);
    const savedUrls = savedProductImages
      .map((img) => img.image_url)
      .filter(Boolean);

    // Remover duplicatas
    const uniqueUrls = [...new Set([...draftUrls, ...savedUrls])];
    return uniqueUrls;
  }, [productImages, savedProductImages]);

  // Filtrar apenas variações com cor
  const colorVariations = variations.filter((v) => v.color);

  // Agrupar variações por cor
  const variationsByColor = React.useMemo(() => {
    const grouped: Record<string, ProductVariation[]> = {};

    colorVariations.forEach((variation) => {
      const color = variation.color!.toLowerCase();
      if (!grouped[color]) {
        grouped[color] = [];
      }
      grouped[color].push(variation);
    });

    return grouped;
  }, [colorVariations]);

  // Mapeamento de cores para palavras-chave nas imagens
  const colorKeywords: Record<string, string[]> = {
    azul: ["azul", "blue", "azul"],
    preto: ["preto", "black", "negro", "preta"],
    branco: ["branco", "white", "blanco", "branca"],
    rosa: ["rosa", "pink", "rosa"],
    verde: ["verde", "green", "verde"],
    vermelho: ["vermelho", "red", "rojo", "vermelha"],
    amarelo: ["amarelo", "yellow", "amarillo", "amarela"],
    laranja: ["laranja", "orange", "naranja"],
    roxo: ["roxo", "purple", "morado", "roxa"],
    cinza: ["cinza", "gray", "gris", "cinza"],
  };

  // Encontrar imagem principal que corresponde à cor da variação
  const findMatchingProductImage = (color: string): string | null => {
    if (!color || !productImages.length) return null;

    const colorLower = color.toLowerCase();
    const keywords = colorKeywords[colorLower] || [colorLower];

    // Procurar por imagem que contenha a palavra-chave da cor
    const matchingImage = productImages.find((image) => {
      const imageName = image.name?.toLowerCase() || "";
      return keywords.some((keyword) => imageName.includes(keyword));
    });

    return matchingImage?.url || null;
  };

  // Função para aplicar imagem a todas as variações da mesma cor
  const applyImageToColorVariations = useCallback(
    (color: string, imageUrl: string) => {
      console.log(
        "🎨 APPLYING IMAGE - Aplicando imagem para cor:",
        color,
        "URL:",
        imageUrl
      );

      // Atualizar todas as variações da mesma cor
      const updatedVariations = variations.map((v) => {
        if (v.color && v.color.toLowerCase() === color.toLowerCase()) {
          return { ...v, image_url: imageUrl };
        }
        return v;
      });

      // Chamar o callback para atualizar o estado pai
      onImagesUpdated(color, imageUrl);

      toast({
        title: "Imagem aplicada",
        description: `Imagem aplicada para todas as variações da cor ${color}.`,
      });
    },
    [variations, onImagesUpdated, toast]
  );

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>, color: string) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        // Upload da imagem
        const imageUrl = await uploadVariationImage(file, color);

        // Aplicar a todas as variações da mesma cor
        applyImageToColorVariations(color, imageUrl);

        toast({
          title: "Imagem enviada",
          description: `Imagem da cor ${color} enviada com sucesso.`,
        });
      } catch (error) {
        toast({
          title: "Erro no upload",
          description: "Erro ao enviar imagem da variação.",
          variant: "destructive",
        });
      }
    },
    [uploadVariationImage, applyImageToColorVariations, toast]
  );

  const handleImageSelect = useCallback(
    (imageUrl: string | null, color: string) => {
      if (imageUrl) {
        applyImageToColorVariations(color, imageUrl);
      } else {
        // Tentar encontrar imagem automática baseada na cor
        const matchingImage = findMatchingProductImage(color);
        if (matchingImage) {
          applyImageToColorVariations(color, matchingImage);
          toast({
            title: "Imagem automática",
            description: `Imagem ${color} aplicada automaticamente.`,
          });
        }
      }
    },
    [applyImageToColorVariations, findMatchingProductImage, toast]
  );

  // Função para abrir modal de seleção de imagens
  const handleOpenImageSelector = useCallback((color: string) => {
    setSelectedVariationForImage(color);
    setShowImageSelector(true);
  }, []);

  // Função para selecionar imagem da modal
  const handleSelectImageFromModal = useCallback(
    (imageUrl: string) => {
      if (selectedVariationForImage) {
        applyImageToColorVariations(selectedVariationForImage, imageUrl);
      }
      setShowImageSelector(false);
      setSelectedVariationForImage(null);
    },
    [selectedVariationForImage, applyImageToColorVariations]
  );

  const handleRemoveImage = useCallback(
    (color: string) => {
      const colorLower = color.toLowerCase();
      const variationsOfColor = variationsByColor[colorLower] || [];

      variationsOfColor.forEach((variation) => {
        removeVariationImage(variation.id!);
        onImagesUpdated(color, "");
      });

      toast({
        title: "Imagem removida",
        description: `Imagem da cor ${color} removida.`,
      });
    },
    [variationsByColor, removeVariationImage, onImagesUpdated, toast]
  );

  // Função para obter a imagem atual de uma cor
  const getCurrentImageForColor = useCallback(
    (color: string): string | null => {
      // Primeiro, verificar se há uma imagem salva nas variações
      const variationWithImage = variations.find(
        (v) =>
          v.color &&
          v.color.toLowerCase() === color.toLowerCase() &&
          v.image_url
      );

      if (variationWithImage?.image_url) {
        return variationWithImage.image_url;
      }

      // Se não houver, verificar no draft
      const draftImage = getImageForColor(color);
      return draftImage?.preview || draftImage?.url || null;
    },
    [variations, getImageForColor]
  );

  if (colorVariations.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-gray-500">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma variação com cor encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Gerenciar Imagens das Variações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Galeria de imagens do produto para seleção */}
        {allProductImages.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-medium mb-2">
              Selecione uma imagem para cada cor:
            </div>
            <div className="flex gap-2 flex-wrap">
              {allProductImages.map((imgUrl, idx) => (
                <div
                  key={imgUrl}
                  className="flex flex-col items-center relative"
                >
                  <img
                    src={imgUrl}
                    alt={`Imagem ${idx + 1}`}
                    className={`w-16 h-16 object-cover rounded border-2 cursor-pointer transition-all
                      ${
                        Object.entries(variationsByColor).some(
                          ([color, vars]) =>
                            getCurrentImageForColor(color) === imgUrl
                        )
                          ? "border-blue-600 ring-2 ring-blue-300"
                          : "border-gray-200 hover:border-primary"
                      }
                    `}
                    onClick={() => {
                      setSelectedVariationForImage(null);
                      setShowImageSelector(true);
                      window.__selectedImageUrl = imgUrl;
                    }}
                  />
                  {/* Ícone de check se selecionada para alguma cor */}
                  {Object.entries(variationsByColor).some(
                    ([color, vars]) => getCurrentImageForColor(color) === imgUrl
                  ) && (
                    <span className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-1 shadow">
                      ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de variações por cor */}
        {Object.entries(variationsByColor).map(([color, variationsOfColor]) => {
          const currentImage = getCurrentImageForColor(color);
          const sizes = variationsOfColor.map((v) => v.size).filter(Boolean);

          return (
            <div key={color} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-sm font-medium">
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                      </Badge>
                      {sizes.length > 0 && (
                        <span className="text-sm text-gray-600">
                          Tamanhos: {sizes.join(", ")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {variationsOfColor.length} variação
                      {variationsOfColor.length > 1 ? "ões" : "ão"} • Estoque
                      total:{" "}
                      {variationsOfColor.reduce((sum, v) => sum + v.stock, 0)}
                    </p>
                  </div>
                  {/* Imagem selecionada ao lado do nome/cor - agora clicável */}
                  <div
                    className="ml-4 cursor-pointer group"
                    title="Clique para escolher a imagem da variação"
                    onClick={() => {
                      setSelectedVariationForImage(color);
                      setShowImageSelector(true);
                    }}
                  >
                    {currentImage ? (
                      <img
                        src={currentImage}
                        alt={`Selecionada ${color}`}
                        className="w-14 h-14 object-cover rounded border-2 border-blue-600 group-hover:shadow-lg group-hover:scale-105 transition-all"
                      />
                    ) : (
                      <div className="w-14 h-14 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded group-hover:border-blue-400 group-hover:bg-blue-50 transition-all">
                        <ImageIcon className="h-7 w-7 text-gray-400 group-hover:text-blue-500" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                {/* Imagem Atual */}
                <div className="flex-shrink-0">
                  {currentImage ? (
                    <div className="relative">
                      <img
                        src={currentImage}
                        alt={`Variação ${color}`}
                        className="w-24 h-24 object-cover rounded border"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={() => handleRemoveImage(color)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded border flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Debug Visual - Mostrar estado atual das variações */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-4 bg-gray-50 rounded border">
            <h4 className="text-sm font-medium mb-2">
              🔍 Debug - Estado das Variações:
            </h4>
            <div className="text-xs space-y-1">
              {variations.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-20 truncate">{v.color || "N/A"}</span>
                  <span className="w-20 truncate">{v.size || "N/A"}</span>
                  <span className="w-8 text-center">{v.stock}</span>
                  <span className="flex-1 truncate">
                    {v.image_url
                      ? `✅ ${v.image_url.substring(0, 30)}...`
                      : "❌ Sem imagem"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dica de Reaproveitamento */}
        {productImages.length > 0 && (
          <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
            💡 <strong>Dica:</strong> Você pode reaproveitar as imagens
            principais do produto para as variações. O sistema tentará encontrar
            automaticamente a imagem que corresponde à cor da variação.
          </div>
        )}
      </CardContent>

      {/* Modal de Seleção de Cor para aplicar a imagem */}
      <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Selecione a imagem para a cor:{" "}
              {selectedVariationForImage &&
                selectedVariationForImage.charAt(0).toUpperCase() +
                  selectedVariationForImage.slice(1)}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 p-4">
            {allProductImages.map((imageUrl, index) => {
              const isSelected =
                selectedVariationForImage &&
                getCurrentImageForColor(selectedVariationForImage) === imageUrl;
              return (
                <button
                  key={`select-${index}`}
                  onClick={() => {
                    if (selectedVariationForImage) {
                      applyImageToColorVariations(
                        selectedVariationForImage,
                        imageUrl
                      );
                      setShowImageSelector(false);
                      setSelectedVariationForImage(null);
                    }
                  }}
                  className={`aspect-square rounded-lg border-2 overflow-hidden transition-all relative
                    ${
                      isSelected
                        ? "border-blue-600 ring-2 ring-blue-300"
                        : "border-gray-200 hover:border-primary"
                    }`}
                >
                  <img
                    src={imageUrl}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <span className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-1 shadow">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default VariationImageManager;
