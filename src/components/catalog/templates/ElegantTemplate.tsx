import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/product";
import { Store } from "@/types/store";
import { CatalogType } from "@/hooks/useCatalog";
import { Heart, ShoppingCart, Eye, Package } from "lucide-react";

export interface CatalogSettingsData {
  colors: {
    primary: string;
    secondary: string;
    surface: string;
    text: string;
  };
  global: {
    borderRadius: number;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
  };
  productCard: {
    showQuickView: boolean;
    showAddToCart: boolean;
    productCardStyle: string;
  };
}

export interface ElegantTemplateProps {
  product: Product;
  catalogType: CatalogType;
  onAddToCart: (product: Product) => void;
  onAddToWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isInWishlist: boolean;
  showPrices: boolean;
  showStock: boolean;
  editorSettings?: CatalogSettingsData;
  store?: Store;
  products?: Product[];
}

const ElegantTemplate: React.FC<ElegantTemplateProps> = ({
  product,
  catalogType,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  isInWishlist,
  showPrices,
  showStock,
  editorSettings
}) => {
  const displayPrice = catalogType === 'wholesale' && product.wholesale_price 
    ? product.wholesale_price 
    : product.retail_price;

  const handleAddToCart = () => {
    onAddToCart(product);
  };

  const handleAddToWishlist = () => {
    onAddToWishlist(product);
  };

  const handleQuickView = () => {
    onQuickView(product);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
      <div className="relative aspect-square overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            <Package className="h-12 w-12" />
          </div>
        )}
        
        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleQuickView}
              className="backdrop-blur-sm bg-white/90"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAddToWishlist}
              className={`backdrop-blur-sm ${
                isInWishlist ? 'bg-red-100 text-red-600' : 'bg-white/90'
              }`}
            >
              <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {product.is_featured && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              Destaque
            </Badge>
          )}
          {showStock && product.stock <= 5 && product.stock > 0 && (
            <Badge variant="destructive">
              Últimas unidades
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        {showPrices && (
          <div className="mb-3">
            <div className="text-2xl font-bold text-primary mb-1">
              {formatCurrency(displayPrice)}
            </div>
            {catalogType === 'retail' && product.wholesale_price && (
              <div className="text-sm text-gray-500">
                Atacado: {formatCurrency(product.wholesale_price)}
              </div>
            )}
          </div>
        )}

        {showStock && (
          <div className="text-sm text-gray-500 mb-3">
            {product.stock > 0 ? (
              <>Estoque: {product.stock} unidades</>
            ) : (
              <span className="text-red-500">Fora de estoque</span>
            )}
          </div>
        )}

        <Button
          onClick={handleAddToCart}
          className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300"
          disabled={product.stock === 0}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {product.stock === 0 ? 'Fora de Estoque' : 'Adicionar ao Carrinho'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ElegantTemplate;
