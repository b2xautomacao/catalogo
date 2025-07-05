import React, { useState, useEffect } from "react";
import { useProductImages } from "@/hooks/useProductImages";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductImageGalleryProps {
  productId: string;
  productName: string;
  selectedVariationImage?: string | null;
  className?: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  productId,
  productName,
  selectedVariationImage,
  className = "",
}) => {
  const { images, loading } = useProductImages(productId);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  // Combinar imagens do produto com imagem da variação selecionada
  const allImages = React.useMemo(() => {
    const productImages = images?.map((img) => img.image_url) || [];

    // Se há imagem de variação, colocá-la primeiro
    if (selectedVariationImage) {
      const combinedImages = [
        selectedVariationImage,
        ...productImages.filter((url) => url !== selectedVariationImage),
      ];
      return combinedImages;
    }

    return productImages;
  }, [images, selectedVariationImage]);

  // Reset para primeira imagem quando variação muda
  useEffect(() => {
    if (selectedVariationImage) {
      setCurrentImageIndex(0);
    }
  }, [selectedVariationImage]);

  // Garantir que o índice seja válido
  useEffect(() => {
    if (currentImageIndex >= allImages.length && allImages.length > 0) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, allImages.length]);

  if (loading) {
    return (
      <div
        className={`aspect-square bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (allImages.length === 0) {
    return (
      <div
        className={`aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center ${className}`}
      >
        <ImageIcon className="h-16 w-16 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 text-center">
          Nenhuma imagem disponível
        </p>
      </div>
    );
  }

  const currentImage = allImages[currentImageIndex];
  const showNavigation = allImages.length > 1;

  const goToPrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("Erro ao carregar imagem:", currentImage);
    setImageLoading(false);
    e.currentTarget.style.display = "none";
    const parent = e.currentTarget.parentElement;
    if (parent) {
      const errorDiv = parent.querySelector(".error-placeholder");
      if (errorDiv) {
        (errorDiv as HTMLElement).style.display = "flex";
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Imagem Principal */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
        {/* Loading Overlay - NÃO bloqueia interações */}
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center pointer-events-none z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        <img
          src={currentImage}
          alt={`${productName} - Imagem ${currentImageIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Placeholder de erro */}
        <div className="error-placeholder absolute inset-0 hidden items-center justify-center bg-gray-100">
          <div className="text-center">
            <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Erro ao carregar imagem</p>
          </div>
        </div>

        {/* Indicador de variação */}
        {selectedVariationImage && currentImageIndex === 0 && (
          <div className="absolute top-2 left-2">
            <span className="bg-primary text-white text-xs px-2 py-1 rounded">
              Variação
            </span>
          </div>
        )}

        {/* Navegação */}
        {showNavigation && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Contador de imagens */}
        {showNavigation && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-20">
            {currentImageIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {showNavigation && (
        <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
          {allImages.map((imageUrl, index) => (
            <button
              key={`thumb-${index}`}
              onClick={() => setCurrentImageIndex(index)}
              className={`
                flex-shrink-0 w-full aspect-square rounded border-2 overflow-hidden transition-all relative
                ${
                  index === currentImageIndex
                    ? "border-primary shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <img
                src={imageUrl}
                alt={`${productName} - Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.classList.add(
                      "bg-gray-100",
                      "flex",
                      "items-center",
                      "justify-center"
                    );
                    parent.innerHTML =
                      '<div class="text-gray-400 text-xs">Erro</div>';
                  }
                }}
              />
              {/* Indicador de variação na miniatura */}
              {selectedVariationImage && index === 0 && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full pointer-events-none"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
