import React, { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Heart,
  Star,
  Plus,
  Minus,
  X,
  Share2,
  TrendingDown,
} from "lucide-react";
import { Product } from "@/types/product";
import { CatalogType } from "@/hooks/useCatalog";
import { useProductVariations } from "@/hooks/useProductVariations";
import { useToast } from "@/hooks/use-toast";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { PriceModelType } from "@/types/price-models";

interface ProductDetailsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, variation?: any) => void;
  catalogType: CatalogType;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  catalogType,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const { variations } = useProductVariations(product.id);
  const { toast } = useToast();
  const { priceModel, loading } = useStorePriceModel(product.store_id);
  const modelKey = priceModel?.price_model || ("retail_only" as PriceModelType);

  const rating = useMemo(() => {
    const hash = product.id.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return 3.5 + (Math.abs(hash) % 15) / 10; // Entre 3.5 e 5.0
  }, [product.id]);

  const reviewCount = useMemo(() => {
    const hash = product.name.length + (product.retail_price || 0);
    return Math.floor(5 + (hash % 45)); // Entre 5 e 50 avaliações
  }, [product.name, product.retail_price]);

  // Calcular desconto potencial
  const potentialSavings = useMemo(() => {
    if (!product.wholesale_price || !product.retail_price) return null;

    const maxSavings = product.retail_price - product.wholesale_price;
    const maxPercent = (maxSavings / product.retail_price) * 100;

    return {
      savings: maxSavings,
      savingsPercentage: maxPercent,
      maxDiscountPercent: Math.round(maxPercent),
    };
  }, [product.wholesale_price, product.retail_price]);

  const handleAddToCart = useCallback(() => {
    let qty = quantity;
    let price = product.retail_price;
    let isWholesale = false;

    if (modelKey === "wholesale_only") {
      qty = Math.max(quantity, product.min_wholesale_qty || 1);
      price = product.wholesale_price || product.retail_price;
      isWholesale = true;
    }

    // Garantir que o produto tenha allow_negative_stock definido
    const productWithDefaults = {
      ...product,
      allow_negative_stock: product.allow_negative_stock || false,
      price_model: modelKey
    };

    onAddToCart(productWithDefaults, qty, selectedVariation);
    onClose();
  }, [product, quantity, selectedVariation, onAddToCart, onClose, modelKey]);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (modelKey === "wholesale_only") {
      const minQty = product.min_wholesale_qty || 1;
      setQuantity(Math.max(newQuantity, minQty));
    } else {
      setQuantity(Math.max(newQuantity, 1));
    }
  }, [modelKey, product.min_wholesale_qty]);

  const currentPrice = useMemo(() => {
    if (modelKey === "wholesale_only") {
      return product.wholesale_price || product.retail_price;
    }
    return product.retail_price;
  }, [modelKey, product]);

  const minQuantity = useMemo(() => {
    if (modelKey === "wholesale_only") {
      return product.min_wholesale_qty || 1;
    }
    return 1;
  }, [modelKey, product.min_wholesale_qty]);

  const canAddMore = product.stock > quantity || product.allow_negative_stock;
  const canDecrease = quantity > minQuantity;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {product.name}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span>Sem imagem</span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            {/* Category */}
            {product.category && (
              <Badge variant="secondary">{product.category}</Badge>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-gray-600">{product.description}</p>
            )}

            {/* Price */}
            <div className="space-y-2">
              {loading ? (
                <div className="text-gray-500">Carregando preços...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-900">
                    R$ {currentPrice.toFixed(2)}
                  </div>
                  {modelKey === "wholesale_only" && product.min_wholesale_qty && (
                    <div className="text-sm text-orange-600">
                      Quantidade mínima: {product.min_wholesale_qty} unidades
                    </div>
                  )}
                  {modelKey !== "wholesale_only" && product.wholesale_price && (
                    <div className="text-sm text-gray-500">
                      Atacado: R$ {product.wholesale_price.toFixed(2)}
                      {product.min_wholesale_qty && (
                        <span> (min. {product.min_wholesale_qty})</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Stock */}
            <div className="text-sm text-gray-600">
              {product.stock > 0 ? (
                <span className="text-green-600">
                  {product.stock} em estoque
                </span>
              ) : (
                <span className="text-red-600">Produto esgotado</span>
              )}
            </div>

            <Separator />

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={!canDecrease}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="mx-4 text-lg font-medium w-12 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={!canAddMore}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {modelKey === "wholesale_only" && product.min_wholesale_qty && (
                <div className="text-xs text-gray-500">
                  Quantidade mínima: {product.min_wholesale_qty}
                </div>
              )}
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0 && !product.allow_negative_stock}
              className="w-full"
              size="lg"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Adicionar ao Carrinho - R$ {(currentPrice * quantity).toFixed(2)}
            </Button>

            {/* Share Button */}
            <Button variant="outline" size="sm" className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar Produto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
