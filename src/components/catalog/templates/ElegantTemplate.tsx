
import React from 'react';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useShoppingCart } from '@/hooks/useShoppingCart';

export interface CatalogSettingsData {
  colors?: {
    primary: string;
    secondary: string;
    surface: string;
    text: string;
  };
  global?: {
    borderRadius: number;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
  };
  productCard?: {
    showQuickView: boolean;
    showAddToCart: boolean;
    productCardStyle: string;
  };
}

interface ElegantTemplateProps {
  product: Product;
  index?: number;
  catalogType?: string;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  isInWishlist?: boolean;
  showPrices?: boolean;
  showStock?: boolean;
  editorSettings?: CatalogSettingsData;
}

const ElegantTemplate: React.FC<ElegantTemplateProps> = ({ 
  product, 
  index = 0,
  onAddToCart,
  editorSettings 
}) => {
  const { addItem } = useShoppingCart();

  const handleAddToCart = (product: Product) => {
    console.log('🛍️ ELEGANT - Adicionando produto ao carrinho:', product);
    
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addItem(product, 1);
    }
    
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  return (
    <div
      key={product.id}
      className={`group relative flex flex-col items-center justify-center rounded-md border border-gray-200 bg-white text-center shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
    >
      <div className="relative">
        <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200">
          <img
            src={product.image_url}
            alt={product.name}
            className="group-hover:opacity-75 h-full w-full object-cover object-center"
          />
        </div>
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute top-2 left-2 rounded-md bg-amber-500 px-2 py-1 text-xs font-semibold uppercase text-white">
            Estoque baixo
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute top-2 left-2 rounded-md bg-red-500 px-2 py-1 text-xs font-semibold uppercase text-white">
            Esgotado
          </div>
        )}
      </div>
      <div className="mt-4 flex w-full flex-col items-center space-y-2 p-4">
        <h3 className="text-sm font-medium text-gray-900">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500">{product.description}</p>
        <p className="text-sm font-medium text-gray-900">
          R$ {product.retail_price}
        </p>
        <Button onClick={() => handleAddToCart(product)} variant="outline">
          Adicionar ao Carrinho
        </Button>
      </div>
    </div>
  );
};

export default ElegantTemplate;
