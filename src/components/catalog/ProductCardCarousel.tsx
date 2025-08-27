
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Package, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProductCardCarouselProps {
  productId: string;
  productName: string;
  onImageClick?: () => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

const ProductCardCarousel: React.FC<ProductCardCarouselProps> = ({
  productId,
  productName,
  onImageClick,
  autoPlay = true,
  autoPlayInterval = 4000,
  className = "",
}) => {
  const [images, setImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: productImages } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", productId)
          .order("is_primary", { ascending: false })
          .order("image_order", { ascending: true });

        if (productImages && productImages.length > 0) {
          setImages(productImages);
        }
      } catch (error) {
        console.error("Erro ao carregar imagens:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchImages();
    }
  }, [productId]);

  // Auto-play apenas se não estiver com hover e tiver múltiplas imagens
  useEffect(() => {
    if (!autoPlay || images.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, images.length, isHovered]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <div
        className={`relative bg-gradient-to-br from-muted to-muted/60 aspect-square flex items-center justify-center cursor-pointer ${className}`}
        onClick={onImageClick}
      >
        <Package className="h-12 w-12 text-muted-foreground animate-pulse" />
      </div>
    );
  }

  if (!images.length) {
    return (
      <div
        className={`relative bg-gradient-to-br from-muted to-muted/60 aspect-square flex items-center justify-center cursor-pointer ${className}`}
        onClick={onImageClick}
      >
        <Package className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/60 cursor-pointer group ${className}`}
      onClick={onImageClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Image */}
      <img
        src={images[currentImageIndex]?.image_url}
        alt={`${productName} - Imagem ${currentImageIndex + 1}`}
        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />

      {/* Image Count Badge */}
      {images.length > 1 && (
        <Badge
          className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 flex items-center gap-1 backdrop-blur-sm"
        >
          <Camera className="h-3 w-3" />
          {images.length}
        </Badge>
      )}

      {/* Navigation Arrows - Only show if multiple images */}
      {images.length > 1 && (
        <>
          {/* Previous Button */}
          <Button
            size="sm"
            variant="secondary"
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-1 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 backdrop-blur-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Next Button */}
          <Button
            size="sm"
            variant="secondary"
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-1 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Image Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {images.slice(0, Math.min(5, images.length)).map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex
                    ? "bg-white"
                    : "bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductCardCarousel;
