
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Heart, Minus, Plus, Package, Truck, Shield } from 'lucide-react';
import { Product, ProductVariation } from '@/types/product';
import { CatalogType } from '@/hooks/useCatalog';
import ProductImageGallery from '@/components/products/ProductImageGallery';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number, variation?: ProductVariation) => void;
  catalogType: CatalogType;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  catalogType
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);

  if (!product) return null;

  const price = catalogType === 'wholesale' && product.wholesale_price 
    ? product.wholesale_price 
    : product.retail_price;

  const minQuantity = catalogType === 'wholesale' && product.min_wholesale_qty 
    ? product.min_wholesale_qty 
    : 1;

  const handleQuantityChange = (newQuantity: number) => {
    const min = Math.max(minQuantity, 1);
    const max = product.stock || 999;
    setQuantity(Math.max(min, Math.min(max, newQuantity)));
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedVariation);
    onClose();
  };

  const hasVariations = product.variations && product.variations.length > 0;
  const isAvailable = product.stock > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <ProductImageGallery
              productId={product.id || ''}
              productName={product.name}
              selectedVariationImage={selectedVariation?.image_url}
            />
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Price */}
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">
                R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              {catalogType === 'wholesale' && product.min_wholesale_qty && (
                <p className="text-sm text-muted-foreground">
                  Quantidade mínima: {product.min_wholesale_qty} unidades
                </p>
              )}
            </div>

            {/* Category */}
            {product.category && (
              <Badge variant="secondary" className="w-fit">
                {product.category}
              </Badge>
            )}

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h3 className="font-semibold">Descrição</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Variations */}
            {hasVariations && (
              <div className="space-y-3">
                <h3 className="font-semibold">Variações</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.variations?.map((variation) => (
                    <Button
                      key={variation.id}
                      variant={selectedVariation?.id === variation.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedVariation(variation)}
                      className="justify-start text-sm"
                    >
                      {variation.color && (
                        <div 
                          className="w-3 h-3 rounded-full mr-2 border border-gray-300" 
                          style={{ backgroundColor: variation.hex_color || variation.color }}
                        />
                      )}
                      {variation.color} {variation.size && `- ${variation.size}`}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4" />
              <span className={isAvailable ? "text-green-600" : "text-red-600"}>
                {isAvailable 
                  ? `${product.stock} em estoque`
                  : 'Produto esgotado'
                }
              </span>
            </div>

            {/* Quantity Selector */}
            {isAvailable && (
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= minQuantity}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || minQuantity)}
                    className="w-20 text-center"
                    min={minQuantity}
                    max={product.stock}
                  />
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
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleAddToCart}
                disabled={!isAvailable || (hasVariations && !selectedVariation)}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isAvailable ? 'Adicionar ao Carrinho' : 'Produto Esgotado'}
              </Button>

              <Button variant="outline" size="lg" className="w-full">
                <Heart className="h-5 w-5 mr-2" />
                Adicionar aos Favoritos
              </Button>
            </div>

            {/* Additional Info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span>Entrega rápida disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Compra protegida</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
