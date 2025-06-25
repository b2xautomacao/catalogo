
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useProductImages } from '@/hooks/useProductImages';

interface ProductImageGalleryProps {
  productId: string;
  productName: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ 
  productId, 
  productName 
}) => {
  const { images, loading } = useProductImages(productId);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="space-y-4">
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-lg" />
            <p>Nenhuma imagem disponível</p>
          </div>
        </div>
      </div>
    );
  }

  const currentImage = images[currentImageIndex];

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="space-y-4">
      {/* Imagem Principal */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
        <img
          src={currentImage.image_url}
          alt={currentImage.alt_text || `${productName} - Imagem ${currentImageIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Controles de Navegação */}
        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Botão de Zoom */}
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsZoomOpen(true)}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        {/* Indicador de Posição */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              className={`aspect-square bg-gray-100 rounded overflow-hidden border-2 transition-colors ${
                currentImageIndex === index 
                  ? 'border-primary' 
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => setCurrentImageIndex(index)}
            >
              <img
                src={image.image_url}
                alt={`${productName} - Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Modal de Zoom */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          <div className="relative">
            <img
              src={currentImage.image_url}
              alt={currentImage.alt_text || `${productName} - Zoom`}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductImageGallery;
