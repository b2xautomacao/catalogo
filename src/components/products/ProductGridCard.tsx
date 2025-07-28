import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Eye, Edit, Trash2, Image } from 'lucide-react';
import { Product } from '@/types/product';
import { formatCurrency } from '@/lib/utils';
import { useProductImages } from '@/hooks/useProductImages';
import ProductStockBadge from './ProductStockBadge';

interface ProductGridCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onView?: (product: Product) => void;
}

const ProductGridCard: React.FC<ProductGridCardProps> = ({
  product,
  onEdit,
  onDelete,
  onView,
}) => {
  const { images } = useProductImages(product.id);
  
  const totalStock = React.useMemo(() => {
    if (product.variations && product.variations.length > 0) {
      return product.variations.reduce((sum, variation) => sum + variation.stock, 0);
    }
    return product.stock;
  }, [product.variations, product.stock]);

  const handleEdit = () => onEdit?.(product);
  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      onDelete?.(product.id);
    }
  };
  const handleView = () => onView?.(product);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white overflow-hidden h-fit">
      <CardHeader className="p-4 pb-3">
        {/* Enhanced Product Image */}
        <div className="relative">
          {images.length > 0 ? (
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/60 border border-border/50 shadow-sm">
              <img
                src={images[0].image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Stock Badge */}
              <ProductStockBadge 
                stock={totalStock} 
                stockAlertThreshold={product.stock_alert_threshold}
              />
              
              {/* Image Count Badge */}
              {images.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Image className="h-3 w-3" />
                  <span className="font-medium">{images.length}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full aspect-square bg-gradient-to-br from-muted via-muted/80 to-muted/60 rounded-xl flex items-center justify-center border border-border/50 shadow-sm">
              <Package className="h-8 w-8 text-muted-foreground" />
              
              {/* Stock Badge for no image */}
              <ProductStockBadge 
                stock={totalStock} 
                stockAlertThreshold={product.stock_alert_threshold}
              />
            </div>
          )}
          
          {/* Status Indicator */}
          <div className={`absolute -bottom-1 -left-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
            product.is_active ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        {/* Product Title */}
        <div>
          <h3 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors mb-2">
            {product.name}
          </h3>
          
          {/* Status Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.category && (
              <Badge variant="outline" className="text-xs bg-background/60 border-border/60">
                {product.category}
              </Badge>
            )}
            {product.is_featured && (
              <Badge className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                ⭐ Destaque
              </Badge>
            )}
            {!product.is_active && (
              <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive">
                Inativo
              </Badge>
            )}
          </div>
        </div>

        {/* Price Display */}
        <div className="text-center py-2">
          <div className="text-lg font-bold text-foreground">
            {formatCurrency(product.retail_price)}
          </div>
          {product.wholesale_price && (
            <div className="text-xs text-muted-foreground">
              Atacado: {formatCurrency(product.wholesale_price)}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleView}
            className="h-9 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Ver
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEdit}
            className="h-9 text-xs"
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDelete}
            className="h-9 text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductGridCard;