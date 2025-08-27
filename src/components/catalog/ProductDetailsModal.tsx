
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import HierarchicalVariationSelector from './HierarchicalVariationSelector';

interface ProductDetailsModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: any, quantity: number, selectedVariation?: any) => void;
  catalogType?: 'retail' | 'wholesale';
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  catalogType = 'retail'
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const { toast } = useToast();

  if (!product) return null;

  const productImages = product.images || ['/placeholder.svg'];
  const hasVariations = product.variations && product.variations.length > 0;

  const handleAddToCart = () => {
    if (hasVariations && !selectedVariation) {
      toast({
        title: 'Selecione uma variação',
        description: 'Você precisa selecionar uma variação antes de adicionar ao carrinho.',
        variant: 'destructive'
      });
      return;
    }

    onAddToCart(product, quantity, selectedVariation);
    
    toast({
      title: 'Produto adicionado!',
      description: `${product.name} foi adicionado ao carrinho.`,
    });
    
    onClose();
  };

  const currentPrice = catalogType === 'wholesale' ? product.wholesale_price : product.price;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{product.name}</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Galeria de Imagens */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={productImages[selectedImage]}
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
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-primary' : 'border-gray-200'
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

          {/* Informações do Produto */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-primary">
                  R$ {currentPrice?.toFixed(2)}
                </span>
                {catalogType === 'wholesale' && (
                  <Badge variant="secondary">Preço Atacado</Badge>
                )}
              </div>
              
              {product.category && (
                <Badge variant="outline" className="mb-4">
                  {product.category.name}
                </Badge>
              )}
            </div>

            {/* Descrição */}
            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Seletor de Variações Hierárquico */}
            {hasVariations && (
              <div className="space-y-4">
                <h3 className="font-semibold">Escolha suas opções:</h3>
                <HierarchicalVariationSelector
                  variations={product.variations}
                  selectedVariation={selectedVariation}
                  onVariationChange={setSelectedVariation}
                />
              </div>
            )}

            {/* Controles de Quantidade e Compra */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="font-semibold">Quantidade:</label>
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    className="px-3 py-2 hover:bg-gray-100"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Adicionar ao Carrinho
                </Button>
                
                <Button variant="outline" size="lg" className="gap-2">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Informações Adicionais */}
            {(product.weight || product.dimensions) && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Informações do Produto</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {product.weight && <p>Peso: {product.weight}g</p>}
                  {product.dimensions && <p>Dimensões: {product.dimensions}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
