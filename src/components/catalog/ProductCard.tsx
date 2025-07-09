
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/product";
import { CatalogType } from "@/hooks/useCatalog";
import { ShoppingCart, Eye, Heart } from "lucide-react";

interface ProductCardProps {
  product: Product;
  catalogType?: CatalogType;
  onClick?: () => void;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isInWishlist?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  catalogType = 'retail',
  onClick,
  onAddToCart,
  onViewDetails,
  onToggleWishlist,
  isInWishlist = false
}) => {
  const displayPrice = catalogType === 'wholesale' && product.wholesale_price 
    ? product.wholesale_price 
    : product.retail_price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(product);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Imagem do Produto */}
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Eye className="mx-auto h-12 w-12 mb-2" />
              <p className="text-sm">Sem imagem</p>
            </div>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.is_featured && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-xs">
              ⭐ Destaque
            </Badge>
          )}
          {product.stock <= 0 && (
            <Badge variant="destructive" className="text-xs">
              Sem estoque
            </Badge>
          )}
          {product.stock > 0 && product.stock <= (product.stock_alert_threshold || 5) && (
            <Badge className="bg-orange-500 text-white text-xs">
              Estoque baixo
            </Badge>
          )}
        </div>

        {/* Botão Wishlist */}
        {onToggleWishlist && (
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all ${
              isInWishlist 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
      
      {/* Conteúdo do Card */}
      <div className="p-4">
        <div className="space-y-3">
          <div className="cursor-pointer" onClick={onClick}>
            <h3 className="font-semibold text-base mb-1 line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          {/* Preço */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-primary">
                {formatCurrency(displayPrice)}
              </span>
              {product.stock > 0 && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {product.stock} disponível
                </span>
              )}
            </div>
            
            {catalogType === 'retail' && product.wholesale_price && (
              <p className="text-sm text-gray-600">
                Atacado: {formatCurrency(product.wholesale_price)}
                {product.min_wholesale_qty && ` (min. ${product.min_wholesale_qty})`}
              </p>
            )}
          </div>

          {/* Categoria */}
          {product.category && (
            <span className="inline-block text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {product.category}
            </span>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2">
            {onViewDetails && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleViewDetails}
                className="flex-1 h-9"
              >
                <Eye className="h-4 w-4 mr-1" />
                Detalhes
              </Button>
            )}
            {onAddToCart && product.stock > 0 && (
              <Button
                size="sm"
                onClick={handleAddToCart}
                className="flex-1 h-9 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            )}
            {product.stock <= 0 && (
              <Button
                size="sm"
                disabled
                className="flex-1 h-9"
              >
                Indisponível
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
