
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Camera, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProductImages } from '@/hooks/useProductImages';

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
  className = ""
}) => {
  const { images, loading } = useProductImages(productId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && !isHovered && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, autoPlayInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, isHovered, images.length, autoPlayInterval]);

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handleImageClick = () => {
    if (onImageClick) {
      onImageClick();
    }
  };

  if (loading) {
    return (
      <div className={`relative aspect-square bg-muted rounded-lg overflow-hidden ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <Package className="h-8 w-8 text-muted-foreground animate-pulse" />
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div 
        className={`relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:bg-muted/80 transition-colors ${className}`}
        onClick={handleImageClick}
      >
        <div className="w-full h-full flex items-center justify-center">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  return (
    <div
      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleImageClick}
    >
      {/* Main Image */}
      <img
        src={currentImage.image_url}
        alt={`${productName} - Imagem ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            parent.classList.add('bg-muted', 'flex', 'items-center', 'justify-center');
            parent.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>';
          }
        }}
      />

      {/* Image Count Badge */}
      {hasMultipleImages && (
        <Badge
          className="absolute top-2 right-2 bg-black/70 text-white text-xs font-medium flex items-center gap-1 backdrop-blur-sm border-white/20"
          style={{ padding: '4px 8px' }}
        >
          <Camera className="h-3 w-3" />
          {images.length}
        </Badge>
      )}

      {/* Navigation Controls - Only show on hover and if multiple images */}
      {hasMultipleImages && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 p-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 p-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            onClick={goToNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Image Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {images.slice(0, Math.min(5, images.length)).map((_, index) => (
              <button
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
    </div>
  );
};

export default ProductCardCarousel;
