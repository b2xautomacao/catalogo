import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Eye, Edit, Trash2, Image, AlertCircle } from "lucide-react";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { useProductImages } from "@/hooks/useProductImages";

interface ProductListCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onView?: (product: Product) => void;
  onListUpdate?: () => void; // 🎯 NOVO: Callback para atualizar lista
}

const ProductListCard: React.FC<ProductListCardProps> = ({
  product,
  onEdit,
  onDelete,
  onView,
  onListUpdate, // 🎯 NOVO: Receber callback (implementar depois)
}) => {
  const { images } = useProductImages(product.id);

  const totalStock = React.useMemo(() => {
    if (product.variations && product.variations.length > 0) {
      return product.variations.reduce(
        (sum, variation) => sum + variation.stock,
        0
      );
    }
    return product.stock;
  }, [product.variations, product.stock]);

  const handleEdit = () => onEdit?.(product);
  const handleDelete = () => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      onDelete?.(product.id);
    }
  };
  const handleView = () => onView?.(product);

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border border-border/50 bg-white overflow-hidden">
      <div className="flex items-center p-4 gap-4">
        {/* Product Image - 20% */}
        <div className="flex-shrink-0 relative">
          {images.length > 0 ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted border border-border/30">
              <img
                src={images[0].image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              {images.length > 1 && (
                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Image className="h-2.5 w-2.5" />
                  <span className="text-xs font-medium">{images.length}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center border border-border/30">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}

          {/* Status Indicator */}
          <div
            className={`absolute -bottom-1 -left-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
              product.is_active ? "bg-green-500" : "bg-red-500"
            }`}
          />
        </div>

        {/* Product Info - 40% */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-sm line-clamp-1 text-foreground">
              {product.name}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {product.category && (
              <Badge variant="outline" className="text-xs bg-background/60">
                {product.category}
              </Badge>
            )}
            {product.is_featured && (
              <Badge className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                ⭐
              </Badge>
            )}
            {!product.is_active && (
              <Badge
                variant="secondary"
                className="text-xs bg-destructive/10 text-destructive"
              >
                Inativo
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              Estoque:
              <span
                className={`font-semibold ${
                  totalStock > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalStock}
                {totalStock <= (product.stock_alert_threshold || 5) &&
                  totalStock > 0 && (
                    <AlertCircle className="inline h-3 w-3 text-amber-500 ml-1" />
                  )}
              </span>
            </span>
          </div>
        </div>

        {/* Price Info - 20% */}
        <div className="flex-shrink-0 text-right space-y-1">
          <div className="font-bold text-sm text-foreground">
            {formatCurrency(product.retail_price)}
          </div>
          {product.wholesale_price && (
            <div className="text-xs text-muted-foreground">
              Atacado: {formatCurrency(product.wholesale_price)}
            </div>
          )}
          {product.min_wholesale_qty && (
            <div className="text-xs text-muted-foreground">
              Mín: {product.min_wholesale_qty}un
            </div>
          )}
        </div>

        {/* Actions - 20% */}
        <div className="flex-shrink-0 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleView}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductListCard;
