
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Heart, X, Star, Share2 } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { useProductVariations } from '@/hooks/useProductVariations';
import { useProductImages } from '@/hooks/useProductImages';
import { CatalogType } from '@/hooks/useCatalog';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { createCartItem } from '@/utils/cartHelpers';
import ProductVariationSelector from './ProductVariationSelector';

interface ProductDetailsModalProps {
  product: Product | null;
  catalogType: CatalogType;
  isOpen: boolean;
  onClose: () => void;
  onAddToWishlist: (product: Product) => void;
  isInWishlist?: boolean;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  catalogType,
  isOpen,
  onClose,
  onAddToWishlist,
  isInWishlist = false
}) => {
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  const { variations, loading: variationsLoading } = useProductVariations(product?.id);
  const { images, loading: imagesLoading } = useProductImages(product?.id);
  const { addItem } = useCart();
  const { toast } = useToast();

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setSelectedVariation(null);
      setSelectedImageIndex(0);
      setQuantity(catalogType === 'wholesale' && product.min_wholesale_qty ? product.min_wholesale_qty : 1);
    }
  }, [product, catalogType]);

  if (!product) return null;

  const price = catalogType === 'wholesale' && product.wholesale_price 
    ? product.wholesale_price 
    : product.retail_price;

  const minQuantity = catalogType === 'wholesale' && product.min_wholesale_qty 
    ? product.min_wholesale_qty 
    : 1;

  const finalPrice = selectedVariation?.price_adjustment 
    ? price + selectedVariation.price_adjustment 
    : price;

  const availableStock = variations.length > 0 && selectedVariation
    ? selectedVariation.stock
    : product.stock;

  const allImages = [
    ...(product.image_url ? [{ id: 'main', image_url: product.image_url, is_primary: true }] : []),
    ...images
  ];

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: product.description || 'Confira este produto incrível!',
      url: window.location.href + `/produto/${product.id}`
    };

    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Link copiado!",
        description: "O link do produto foi copiado para a área de transferência.",
      });
    }
  };

  const handleAddToCart = () => {
    if (variations.length > 0 && !selectedVariation) {
      toast({
        title: "Selecione uma variação",
        description: "Por favor, escolha uma cor/tamanho antes de adicionar ao carrinho.",
        variant: "destructive"
      });
      return;
    }

    if (availableStock < quantity) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${availableStock} unidades disponíveis.`,
        variant: "destructive"
      });
      return;
    }

    const cartItem = createCartItem(
      product, 
      catalogType, 
      quantity,
      selectedVariation ? {
        size: selectedVariation.size,
        color: selectedVariation.color
      } : undefined
    );

    addItem(cartItem);
    onClose();
  };

  const canAddToCart = variations.length === 0 || selectedVariation;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Images Section */}
          <div className="relative">
            <div className="aspect-square bg-gray-100">
              {allImages.length > 0 ? (
                <img
                  src={allImages[selectedImageIndex]?.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400">Sem imagem</span>
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, index) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === index ? 'border-primary' : 'border-white'
                      }`}
                    >
                      <img
                        src={img.image_url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/80 hover:bg-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Product Details Section */}
          <div className="p-6">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-left">
                      {product.name}
                    </DialogTitle>
                  </DialogHeader>
                  
                  {product.category && (
                    <Badge variant="outline" className="mt-2">
                      {product.category}
                    </Badge>
                  )}
                </div>

                {/* Price */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl font-bold text-primary">
                      R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {catalogType === 'wholesale' && product.wholesale_price && (
                      <span className="text-lg text-gray-500 line-through">
                        R$ {product.retail_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  
                  {catalogType === 'wholesale' && minQuantity > 1 && (
                    <p className="text-sm text-gray-600">
                      Quantidade mínima: {minQuantity} unidades
                    </p>
                  )}
                </div>

                {/* Rating (Mock) */}
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="text-yellow-400" fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">(24 avaliações)</span>
                </div>

                <Separator />

                {/* Description */}
                {product.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Variations */}
                {variations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Variações</h3>
                    <ProductVariationSelector
                      variations={variations}
                      selectedVariation={selectedVariation}
                      onVariationChange={setSelectedVariation}
                      loading={variationsLoading}
                    />
                  </div>
                )}

                {/* Stock Info */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Disponibilidade:</span>
                    <Badge variant={availableStock > 0 ? "default" : "destructive"}>
                      {availableStock > 0 ? `${availableStock} em estoque` : 'Esgotado'}
                    </Badge>
                  </div>
                </div>

                {/* Quantity Selector */}
                {availableStock > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Quantidade</h3>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                        disabled={quantity <= minQuantity}
                      >
                        -
                      </Button>
                      <span className="w-16 text-center font-medium">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                        disabled={quantity >= availableStock}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={availableStock === 0 || !canAddToCart}
                    className="w-full"
                    size="lg"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {availableStock === 0 ? 'Esgotado' : 'Adicionar ao Carrinho'}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onAddToWishlist(product)}
                      className={isInWishlist ? 'text-red-500 border-red-500' : ''}
                    >
                      <Heart className="mr-2 h-4 w-4" fill={isInWishlist ? 'currentColor' : 'none'} />
                      {isInWishlist ? 'Na Lista' : 'Favoritar'}
                    </Button>

                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
