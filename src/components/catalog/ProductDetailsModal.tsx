
import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ProductVariationSelector from './ProductVariationSelector';
import { useCart } from '@/hooks/useCart';
import { useProductImages } from '@/hooks/useProductImages';

interface Product {
  id: string;
  name: string;
  description?: string;
  retail_price: number;
  wholesale_price?: number;
  image_url?: string;
  category: string;
  stock: number;
  min_wholesale_qty?: number;
  variations?: any[];
}

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  catalogType: 'retail' | 'wholesale';
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  catalogType
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [productImages, setProductImages] = useState<string[]>([]);
  const { addItem } = useCart();
  const { getProductImages } = useProductImages();

  // Carregar imagens do produto quando o modal abrir
  useEffect(() => {
    if (product?.id && isOpen) {
      const loadImages = async () => {
        try {
          const images = await getProductImages(product.id);
          const imageUrls = images.map(img => img.image_url);
          
          // Incluir image_url principal se não estiver na lista
          if (product.image_url && !imageUrls.includes(product.image_url)) {
            imageUrls.unshift(product.image_url);
          }
          
          setProductImages(imageUrls.length > 0 ? imageUrls : [product.image_url || '/placeholder.svg']);
        } catch (error) {
          console.error('Erro ao carregar imagens:', error);
          setProductImages([product.image_url || '/placeholder.svg']);
        }
      };
      
      loadImages();
    }
  }, [product?.id, product?.image_url, isOpen, getProductImages]);

  // Reset states when product changes
  useEffect(() => {
    if (product) {
      setQuantity(catalogType === 'wholesale' ? (product.min_wholesale_qty || 1) : 1);
      setSelectedVariation(null);
      setSelectedImageIndex(0);
    }
  }, [product, catalogType]);

  if (!product) return null;

  const price = catalogType === 'retail' ? product.retail_price : (product.wholesale_price || product.retail_price);
  const minQty = catalogType === 'wholesale' ? (product.min_wholesale_qty || 1) : 1;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= minQty && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: price,
      quantity: quantity,
      variation: selectedVariation,
      catalogType: catalogType
    });
    onClose();
  };

  const currentImage = productImages[selectedImageIndex] || '/placeholder.svg';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {product.name}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Galeria de Imagens */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detalhes do Produto */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-2">
                {product.category}
              </Badge>
              <h2 className="text-2xl font-bold mb-4">{product.name}</h2>
              
              {product.description && (
                <p className="text-gray-600 mb-4">{product.description}</p>
              )}
              
              <div className="text-3xl font-bold text-blue-600 mb-4">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(price)}
              </div>
              
              {catalogType === 'wholesale' && minQty > 1 && (
                <p className="text-sm text-gray-600 mb-4">
                  Quantidade mínima: {minQty} unidades
                </p>
              )}
              
              <p className="text-sm text-gray-600 mb-6">
                Estoque disponível: {product.stock} unidades
              </p>
            </div>

            {/* Seletor de Variações */}
            {product.variations && product.variations.length > 0 && (
              <ProductVariationSelector
                variations={product.variations}
                selectedVariation={selectedVariation}
                onVariationChange={setSelectedVariation}
              />
            )}

            {/* Controle de Quantidade */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Quantidade
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= minQty}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                className="w-full"
                disabled={product.stock === 0}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {product.stock === 0 ? 'Sem Estoque' : 'Adicionar ao Carrinho'}
              </Button>
              
              <Button variant="outline" className="w-full">
                <Heart className="mr-2 h-4 w-4" />
                Adicionar aos Favoritos
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
