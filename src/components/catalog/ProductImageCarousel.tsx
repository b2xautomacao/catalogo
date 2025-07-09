import React, { useState, useEffect } from "react";
import { useProductImages } from "@/hooks/useProductImages";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductImageCarouselProps {
  productId: string;
  productName: string;
  className?: string;
  showThumbnails?: boolean;
  showNavigation?: boolean;
  showCounter?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({
  productId,
  productName,
  className = "",
  showThumbnails = true,
  showNavigation = true,
  showCounter = true,
  autoPlay = false,
  autoPlayInterval = 3000,
}) => {
  const { images, loading } = useProductImages(productId);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  // Combinar imagens do produto
  const allImages = React.useMemo(() => {
    return images?.map((img) => img.image_url) || [];
  }, [images]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || allImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === allImages.length - 1 ? 0 : prev + 1
      );
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, allImages.length]);

  // Garantir que o índice seja válido
  useEffect(() => {
    if (currentImageIndex >= allImages.length && allImages.length > 0) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, allImages.length]);

  if (loading) {
    return (
      <div
        className={cn(
          "aspect-square bg-gray-100 rounded-lg flex items-center justify-center",
          className
        )}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (allImages.length === 0) {
    return (
      <div
        className={cn(
          "aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center",
          className
        )}
      >
        <ImageIcon className="h-16 w-16 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 text-center">
          Nenhuma imagem disponível
        </p>
      </div>
    );
  }

  const currentImage = allImages[currentImageIndex];
  const hasMultipleImages = allImages.length > 1;

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
    <div className={cn("space-y-2", className)}>
      {/* Imagem Principal */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
        {/* Loading Overlay */}
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

        {/* Navegação */}
        {showNavigation && hasMultipleImages && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 h-8 w-8 p-0"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 h-8 w-8 p-0"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Contador de imagens */}
        {showCounter && hasMultipleImages && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-20">
            {currentImageIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {showThumbnails && hasMultipleImages && (
        <div className="grid grid-cols-4 gap-1 max-h-16 overflow-hidden">
          {allImages.slice(0, 4).map((imageUrl, index) => (
            <button
              key={`thumb-${index}`}
              onClick={() => setCurrentImageIndex(index)}
              className={cn(
                "flex-shrink-0 w-full aspect-square rounded border overflow-hidden transition-all relative",
                index === currentImageIndex
                  ? "border-primary shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              )}
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
            </button>
          ))}
          {/* Indicador de mais imagens */}
          {allImages.length > 4 && (
            <div className="flex-shrink-0 w-full aspect-square rounded border border-gray-200 bg-gray-100 flex items-center justify-center">
              <span className="text-xs text-gray-500 font-medium">
                +{allImages.length - 4}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductImageCarousel;
