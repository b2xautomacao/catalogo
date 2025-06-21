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

interface ProductVariation {
  id: string;
  color: string | null;
  size: string | null;
  sku: string | null;
  stock: number;
  price_adjustment: number;
  is_active: boolean;
  image_url: string | null;
}

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
  variations?: ProductVariation[];
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
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [productImages, setProductImages] = useState<string[]>([]);
  const { addItem } = useCart();
  const { getProductImages } = useProductImages();

  console.log('🔍 MODAL - Produto recebido:', {
    productId: product?.id,
    hasVariations: !!product?.variations?.length,
    variationsCount: product?.variations?.length || 0,
    variations: product?.variations?.map(v => ({
      id: v.id,
      color: v.color,
      size: v.size,
      stock: v.stock,
      hasImage: !!v.image_url
    })) || []
  });

  // Carregar imagens do produto quando o modal abrir
  useEffect(() => {
    if (product?.id && isOpen) {
      const loadImages = async () => {
        try {
          console.log('📸 MODAL - Carregando imagens para produto:', product.id);
          
          const images = await getProductImages(product.id);
          const imageUrls = images.map(img => img.image_url);
          
          // Incluir image_url principal se não estiver na lista
          if (product.image_url && !imageUrls.includes(product.image_url)) {
            imageUrls.unshift(product.image_url);
          }

          // Incluir imagens das variações
          if (product.variations) {
            product.variations.forEach(variation => {
              if (variation.image_url && !imageUrls.includes(variation.image_url)) {
                imageUrls.push(variation.image_url);
              }
            });
          }
          
          const finalImages = imageUrls.length > 0 ? imageUrls : [product.image_url || '/placeholder.svg'];
          
          console.log('✅ MODAL - Imagens carregadas:', {
            total: finalImages.length,
            images: finalImages.slice(0, 3)
          });
          
          setProductImages(finalImages);
        } catch (error) {
          console.error('❌ Erro ao carregar imagens:', error);
          setProductImages([product.image_url || '/placeholder.svg']);
        }
      };
      
      loadImages();
    }
  }, [product?.id, product?.image_url, product?.variations, isOpen, getProductImages]);

  // Reset states when product changes
  useEffect(() => {
    if (product) {
      const minQty = catalogType === 'wholesale' ? (product.min_wholesale_qty || 1) : 1;
      setQuantity(minQty);
      setSelectedVariation(null);
      setSelectedImageIndex(0);
      
      console.log('🔄 MODAL - Estados resetados:', {
        quantity: minQty,
        catalogType,
        hasVariations: !!product.variations?.length
      });
    }
  }, [product, catalogType]);

  // Atualizar imagem quando variação é selecionada
  useEffect(() => {
    if (selectedVariation?.image_url && productImages.includes(selectedVariation.image_url)) {
      const variationImageIndex = productImages.indexOf(selectedVariation.image_url);
      setSelectedImageIndex(variationImageIndex);
      
      console.log('🖼️ MODAL - Imagem da variação selecionada:', {
        variationId: selectedVariation.id,
        imageIndex: variationImageIndex,
        imageUrl: selectedVariation.image_url
      });
    }
  }, [selectedVariation, productImages]);

  if (!product) return null;

  const price = catalogType === 'retail' ? product.retail_price : (product.wholesale_price || product.retail_price);
  const minQty = catalogType === 'wholesale' ? (product.min_wholesale_qty || 1) : 1;

  // Calcular preço final com ajuste da variação - COM VERIFICAÇÃO NULL
  const priceAdjustment = selectedVariation?.price_adjustment || 0;
  const finalPrice = price + priceAdjustment;

  // Calcular estoque disponível
  const availableStock = selectedVariation 
    ? selectedVariation.stock 
    : product.stock;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= minQty && newQuantity <= availableStock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    console.log('🛒 MODAL - Adicionando ao carrinho:', {
      productId: product.id,
      quantity,
      selectedVariation: selectedVariation ? {
        id: selectedVariation.id,
        color: selectedVariation.color,
        size: selectedVariation.size
      } : null,
      finalPrice
    });

    addItem({
      id: `${product.id}-${selectedVariation?.id || 'main'}-${Date.now()}`,
      product: {
        id: product.id,
        name: product.name,
        retail_price: product.retail_price,
        wholesale_price: product.wholesale_price,
        image_url: selectedVariation?.image_url || product.image_url
      },
      quantity: quantity,
      price: finalPrice,
      variations: selectedVariation,
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
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
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
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
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
                }).format(finalPrice)}
                {priceAdjustment !== 0 && (
                  <span className="text-sm text-gray-500 ml-2">
                    (Ajuste: {priceAdjustment > 0 ? '+' : ''}
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(priceAdjustment)})
                  </span>
                )}
              </div>
              
              {catalogType === 'wholesale' && minQty > 1 && (
                <p className="text-sm text-gray-600 mb-4">
                  Quantidade mínima: {minQty} unidades
                </p>
              )}
              
              <p className="text-sm text-gray-600 mb-6">
                Estoque disponível: {availableStock} unidades
              </p>
            </div>

            {/* Seletor de Variações */}
            {product.variations && product.variations.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Opções do Produto</h3>
                <ProductVariationSelector
                  variations={product.variations}
                  selectedVariation={selectedVariation}
                  onVariationChange={setSelectedVariation}
                />
              </div>
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
                  disabled={quantity >= availableStock}
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
                disabled={availableStock === 0}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {availableStock === 0 ? 'Sem Estoque' : 'Adicionar ao Carrinho'}
              </Button>
              
              <Button variant="outline" className="w-full">
                <Heart className="mr-2 h-4 w-4" />
                Adicionar aos Favoritos
              </Button>
            </div>

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <strong>🐛 DEBUG MODAL:</strong>
                <div>Variações recebidas: {product.variations?.length || 0}</div>
                <div>Variação selecionada: {selectedVariation?.id || 'Nenhuma'}</div>
                <div>Estoque disponível: {availableStock}</div>
                <div>Preço final: R$ {finalPrice.toFixed(2)}</div>
                <div>Ajuste de preço: R$ {priceAdjustment.toFixed(2)}</div>
                <div>Imagens: {productImages.length}</div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
