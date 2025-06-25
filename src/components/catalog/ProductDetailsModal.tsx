
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Package, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { Product } from '@/hooks/useCatalog';
import ProductImageGallery from '@/components/products/ProductImageGallery';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  onAddToWishlist?: (product: Product) => void;
  catalogType?: 'retail' | 'wholesale';
  isInWishlist?: boolean;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onAddToWishlist,
  catalogType = 'retail',
  isInWishlist = false
}) => {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const price = catalogType === 'wholesale' && product.wholesale_price 
    ? product.wholesale_price 
    : product.retail_price;

  const isWholesale = catalogType === 'wholesale';
  const minQty = isWholesale ? (product.min_wholesale_qty || 1) : 1;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= minQty) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity);
      onClose();
    }
  };

  const handleAddToWishlist = () => {
    if (onAddToWishlist) {
      onAddToWishlist(product);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
          {/* Galeria de Imagens */}
          <div>
            <ProductImageGallery 
              productId={product.id} 
              productName={product.name}
            />
          </div>

          {/* Informações do Produto */}
          <div className="space-y-6">
            {/* Cabeçalho */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {product.name}
              </h2>
              {product.category && (
                <Badge variant="secondary" className="mb-4">
                  {product.category}
                </Badge>
              )}
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">
                R$ {price.toFixed(2).replace('.', ',')}
              </div>
              {isWholesale && product.retail_price !== price && (
                <div className="text-sm text-gray-500">
                  Varejo: R$ {product.retail_price.toFixed(2).replace('.', ',')}
                </div>
              )}
              {isWholesale && minQty > 1 && (
                <div className="text-sm text-orange-600">
                  Quantidade mínima: {minQty} unidades
                </div>
              )}
            </div>

            {/* Estoque */}
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4" />
              {product.stock > 0 ? (
                <span className="text-green-600">
                  {product.stock} em estoque
                </span>
              ) : (
                <span className="text-red-600">Fora de estoque</span>
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

            {/* Controles de Quantidade */}
            {product.stock > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quantidade
                  </label>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= minQty}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-16 text-center font-medium">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {minQty > 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Mínimo: {minQty} unidades
                    </p>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleAddToCart}
                    className="w-full"
                    size="lg"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Adicionar ao Carrinho
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleAddToWishlist}
                    className="w-full"
                    size="lg"
                  >
                    <Heart className={`h-5 w-5 mr-2 ${isInWishlist ? 'fill-current' : ''}`} />
                    {isInWishlist ? 'Remover da Lista' : 'Adicionar à Lista de Desejos'}
                  </Button>
                </div>
              </div>
            )}

            {/* Produto Fora de Estoque */}
            {product.stock === 0 && (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-gray-600 mb-3">
                  Este produto está temporariamente fora de estoque
                </p>
                <Button
                  variant="outline"
                  onClick={handleAddToWishlist}
                  className="w-full"
                >
                  <Heart className={`h-5 w-5 mr-2 ${isInWishlist ? 'fill-current' : ''}`} />
                  Adicionar à Lista de Desejos
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
