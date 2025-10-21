import React from "react";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CrossSellUpsellProps {
  type: "cross-sell" | "upsell";
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  title?: string;
  maxItems?: number;
}

const CrossSellUpsell: React.FC<CrossSellUpsellProps> = ({
  type,
  products,
  onAddToCart,
  onViewProduct,
  title,
  maxItems = 4,
}) => {
  if (!products || products.length === 0) return null;

  const displayProducts = products.slice(0, maxItems);
  const defaultTitle = type === "cross-sell" 
    ? "Quem comprou este item também comprou" 
    : "Complete sua compra com";

  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">
          {title || defaultTitle}
        </h3>
        <Badge variant="outline" className="text-xs">
          {displayProducts.length} produtos
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {displayProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group"
          >
            {/* Imagem do produto */}
            <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0].image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ShoppingCart className="h-8 w-8" />
                </div>
              )}
            </div>

            {/* Informações do produto */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                {product.name}
              </h4>
              
              <div className="flex items-center justify-between">
                <span className="font-bold text-green-600">
                  {formatCurrency(product.retail_price || 0)}
                </span>
                
                {product.wholesale_price && product.wholesale_price < product.retail_price && (
                  <span className="text-xs text-gray-500 line-through">
                    {formatCurrency(product.wholesale_price)}
                  </span>
                )}
              </div>

              {/* Botões de ação */}
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs h-8"
                  onClick={() => onViewProduct(product)}
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Ver
                </Button>
                
                <Button
                  size="sm"
                  className="flex-1 text-xs h-8"
                  onClick={() => onAddToCart(product)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CrossSellUpsell;
