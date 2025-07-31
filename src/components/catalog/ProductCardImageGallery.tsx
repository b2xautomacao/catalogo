import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";

interface ProductCardImageGalleryProps {
  productId: string;
  productName: string;
  maxImages?: number;
  className?: string;
}

const ProductCardImageGallery: React.FC<ProductCardImageGalleryProps> = ({
  productId,
  productName,
  maxImages = 5,
  className = "",
}) => {
  const [images, setImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: productImages } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", productId)
          .order("image_order", { ascending: true })
          .limit(maxImages);

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
  }, [productId, maxImages]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <div
        className={`relative bg-gradient-to-br from-muted to-muted/60 aspect-square flex items-center justify-center ${className}`}
      >
        <Package className="h-8 w-8 text-muted-foreground animate-pulse" />
      </div>
    );
  }

  if (!images.length) {
    return (
      <div
        className={`relative bg-gradient-to-br from-muted to-muted/60 aspect-square flex items-center justify-center ${className}`}
      >
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/60 ${className}`}
    >
      {/* Main Image */}
      <img
        src={images[currentImageIndex]?.image_url}
        alt={`${productName} - Imagem ${currentImageIndex + 1}`}
        className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />

      {/* Navigation Arrows - Only show if multiple images */}
      {images.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            title="Imagem anterior"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            title="Próxima imagem"
          >
            <ChevronRight className="h-3 w-3" />
          </button>

          {/* Image Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.slice(0, Math.min(5, images.length)).map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentImageIndex
                    ? "bg-white"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                title={`Ver imagem ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductCardImageGallery;
