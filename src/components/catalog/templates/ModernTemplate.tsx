
import React from 'react';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { useShoppingCart } from '@/hooks/useShoppingCart';
import { toast } from 'sonner';

interface ModernTemplateProps {
  product: Product;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

const ModernTemplate: React.FC<ModernTemplateProps> = ({ product, onProductClick, onAddToCart }) => {
  const { addItem } = useShoppingCart();

  const handleAddToCart = (product: Product) => {
    console.log('🚀 MODERN - Adicionando produto ao carrinho:', product);
    
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addItem(product, 1);
    }
    
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  return (
    <div 
      className="relative flex flex-col rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105 cursor-pointer"
      onClick={() => onProductClick?.(product)}
    >
      {/* Product Image */}
      <div className="aspect-w-4 aspect-h-3">
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="object-cover rounded-t-lg" 
        />
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500 flex-grow line-clamp-3">
          {product.description}
        </p>

        {/* Price and Add to Cart */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="font-bold text-gray-900">
              R$ {product.retail_price}
            </span>
          </div>
          <Button size="sm" onClick={(e) => {
              e.stopPropagation();
              handleAddToCart(product);
            }}>
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModernTemplate;
