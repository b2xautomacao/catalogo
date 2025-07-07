
import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/product";
import { CatalogType } from "@/hooks/useCatalog";

interface EnhancedProductCardProps {
  product: Product;
  catalogType?: CatalogType;
  onClick?: () => void;
}

const EnhancedProductCard: React.FC<EnhancedProductCardProps> = ({
  product,
  catalogType = 'retail',
  onClick,
}) => {
  const displayPrice = catalogType === 'wholesale' && product.wholesale_price 
    ? product.wholesale_price 
    : product.retail_price;

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="aspect-square bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Sem imagem
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(displayPrice)}
            </p>
            {catalogType === 'retail' && product.wholesale_price && (
              <p className="text-sm text-gray-500">
                Atacado: {formatCurrency(product.wholesale_price)}
              </p>
            )}
          </div>
          
          {product.is_featured && (
            <Badge variant="secondary">Destaque</Badge>
          )}
        </div>
        
        <div className="mt-2 text-sm text-gray-500">
          Estoque: {product.stock} unidades
        </div>
      </div>
    </div>
  );
};

export default EnhancedProductCard;
