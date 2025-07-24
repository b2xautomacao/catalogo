
import React, { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'
import { useShoppingCart } from '@/hooks/useShoppingCart';
import { Skeleton } from "@/components/ui/skeleton"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from '@/lib/utils';

export type CatalogType = 'retail' | 'wholesale';

interface ResponsiveProductGridProps {
  products: Product[];
  isLoading?: boolean;
  loading?: boolean;
  mode?: 'grid' | 'carousel';
  onProductClick?: (product: Product) => void;
  catalogSettings?: any;
  catalogType?: CatalogType;
  storeIdentifier?: string;
  className?: string;
}

const ResponsiveProductGrid: React.FC<ResponsiveProductGridProps> = ({
  products,
  isLoading,
  loading,
  mode = 'grid',
  onProductClick,
  catalogSettings,
  catalogType = 'retail',
  storeIdentifier,
  className,
}) => {
  const { addItem: addToCart } = useShoppingCart();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const actualLoading = isLoading || loading;

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const renderProductCard = (product: Product) => (
    <Card key={product.id} className="group/product relative transition-shadow hover:shadow-lg">
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <AspectRatio ratio={16 / 9}>
          <img
            src={product.image_url}
            alt={product.name}
            className="object-cover rounded-md"
            onClick={() => onProductClick?.(product)}
            style={{ cursor: 'pointer' }}
          />
        </AspectRatio>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <span className="text-sm font-medium">R$ {product.retail_price}</span>
          {product.stock <= 5 && product.stock > 0 && (
            <Badge variant="secondary">
              Apenas {product.stock} restantes
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="destructive">
              Sem estoque
            </Badge>
          )}
        </div>
        <Button size="sm" onClick={() => handleAddToCart(product)}>
          Adicionar
        </Button>
      </CardFooter>
    </Card>
  );

  const handleAddToCart = (product: Product, selectedVariation?: any) => {
    console.log('📦 GRID - Adicionando ao carrinho:', product, selectedVariation);
    
    addToCart(product, 1, selectedVariation);
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  if (actualLoading) {
    return (
      <div className={cn("grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3", className)}>
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="group/product relative transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle><Skeleton className="h-4 w-[80%]" /></CardTitle>
              <CardDescription><Skeleton className="h-4 w-[60%]" /></CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <AspectRatio ratio={16 / 9}>
                <Skeleton className="w-full h-full rounded-md" />
              </AspectRatio>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <Skeleton className="h-4 w-[50%]" />
              </div>
              <Skeleton className="h-8 w-20" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (mode === 'carousel') {
    return (
      <Carousel className="w-full max-w-5xl">
        <CarouselContent className="-ml-1 pl-1">
          {products.map((product) => (
            <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                {renderProductCard(product)}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );
  }

  return (
    <div className={cn("grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3", className)}>
      {products.map((product) => renderProductCard(product))}
    </div>
  );
};

export default ResponsiveProductGrid;
