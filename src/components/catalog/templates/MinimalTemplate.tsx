import React from 'react';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/use-toast"
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCard } from '@/components/catalog/ProductCard';

interface MinimalTemplateProps {
  products: Product[];
  loading: boolean;
  onAddToCart: (product: Product, quantity?: number, variation?: any) => void;
  catalogType: string;
  storeId: string;
}

const MinimalTemplate: React.FC<MinimalTemplateProps> = ({
  products,
  loading,
  onAddToCart,
  catalogType,
  storeId
}) => {
  const handleAddToCart = (product: Product, quantity: number = 1, variation?: any) => {
    // Corrigir: passar apenas o produto diretamente
    onAddToCart(product, quantity, variation);
    
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho`,
      duration: 2000,
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {loading ? (
        <p>Carregando produtos...</p>
      ) : (
        products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
        ))
      )}
    </div>
  );
};

export default MinimalTemplate;
