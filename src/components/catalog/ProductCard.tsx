
import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/product";
import { CatalogType } from "@/hooks/useCatalog";

interface ProductCardProps {
  product: Product;
  catalogType?: CatalogType;
  onClick?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  catalogType = 'retail',
  onClick 
}) => {
  const displayPrice = catalogType === 'wholesale' && product.wholesale_price 
    ? product.wholesale_price 
    : product.retail_price;

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="aspect-square bg-gray-50">
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
      
      <div className="p-3">
        <h3 className="font-medium text-base mb-1 line-clamp-2">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-primary">
            {formatCurrency(displayPrice)}
          </p>
          
          {product.is_featured && (
            <Badge variant="outline" className="text-xs">
              Destaque
            </Badge>
          )}
        </div>
        
        {catalogType === 'retail' && product.wholesale_price && (
          <p className="text-sm text-gray-600 mt-1">
            Atacado: {formatCurrency(product.wholesale_price)}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
