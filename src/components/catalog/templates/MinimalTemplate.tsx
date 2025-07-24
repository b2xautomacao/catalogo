
import React from 'react';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { useShoppingCart } from '@/hooks/useShoppingCart';
import { toast } from 'sonner';

interface MinimalTemplateProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const MinimalTemplate: React.FC<MinimalTemplateProps> = ({ product, onAddToCart }) => {
  const { addItem } = useShoppingCart();

  const handleAddToCart = (product: Product) => {
    console.log('🎯 MINIMAL - Adicionando produto ao carrinho:', product);
    
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addItem(product, 1);
    }
    
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  return (
    <div className="border rounded-md p-4 flex flex-col h-full">
      <img
        src={product.image_url}
        alt={product.name}
        className="w-full h-48 object-cover rounded-md mb-4"
      />
      <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
      <p className="text-gray-600 mb-4">{product.description}</p>
      <div className="mt-auto">
        <p className="text-xl font-bold text-blue-500">R$ {product.retail_price}</p>
        <Button onClick={() => handleAddToCart(product)} className="w-full mt-2">
          Adicionar ao Carrinho
        </Button>
      </div>
    </div>
  );
};

export default MinimalTemplate;
