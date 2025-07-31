import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProductImages } from "@/hooks/useProductImages";
import { useVariationStats } from "@/hooks/useVariationStats";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  Image,
  Edit3,
  Trash2,
  Eye,
  ShoppingCart,
  Star,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { Product } from "@/types/product";
import ProductStockBadge from "./ProductStockBadge";
import ProductImageManagerModal from "./ProductImageManagerModal";

interface ProductGridCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onView?: (product: Product) => void;
  onListUpdate?: () => void; // 🎯 NOVO: Callback para atualizar lista
}

const ProductGridCard: React.FC<ProductGridCardProps> = ({
  product,
  onEdit,
  onDelete,
  onView,
  onListUpdate, // 🎯 NOVO: Receber callback
}) => {
  const { images } = useProductImages(product.id || "");
  const { totalStock, variations } = useVariationStats(product.id || "");
  const [showImageManager, setShowImageManager] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(product);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && product.id) {
      onDelete(product.id);
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView(product);
    }
  };

  // 🎯 NOVA FUNÇÃO: Abrir modal de gerenciamento de imagens
  const handleImageManagerOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowImageManager(true);
  };

  // 🎯 NOVA FUNÇÃO: Callback quando imagens são atualizadas
  const handleImagesUpdated = () => {
    if (onListUpdate) {
      console.log(
        "🔄 CARD - Notificando atualização da lista após edição de imagens"
      );
      onListUpdate();
    }
  };

  return (
    <>
      <Card
        className={`group hover:shadow-lg transition-all duration-200 border overflow-hidden cursor-pointer ${
          product.is_featured
            ? "border-yellow-300 bg-gradient-to-br from-yellow-50 to-background shadow-md ring-1 ring-yellow-200"
            : "border-border/50 bg-gradient-to-br from-background to-muted/20 hover:border-primary/20"
        }`}
      >
        <CardHeader className="p-4 pb-3">
          {/* 🎯 MELHORADO: Product Image com aspect ratio 1:1 */}
          <div className="relative">
            {images.length > 0 ? (
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/60 border border-border/50 shadow-sm relative">
                <img
                  src={images[0].image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* 🎯 REORGANIZADOS: Badges sem sobreposição */}
                <div className="absolute inset-2 pointer-events-none">
                  {/* Top Left - Badge de Destaque */}
                  {product.is_featured && (
                    <div className="absolute top-0 left-0">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-medium shadow-sm">
                        ✨ Destaque
                      </Badge>
                    </div>
                  )}

                  {/* Top Right - Contadores e gerenciamento */}
                  <div className="absolute top-0 right-0 flex flex-col gap-1 items-end">
                    {/* Stock Badge */}
                    <ProductStockBadge
                      stock={totalStock}
                      stockAlertThreshold={product.stock_alert_threshold}
                    />

                    {/* Image Count Badge - Múltiplas imagens */}
                    {images.length > 1 && (
                      <button
                        onClick={handleImageManagerOpen}
                        className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm hover:bg-black/90 transition-colors pointer-events-auto"
                        title="Gerenciar imagens"
                      >
                        <Image className="h-3 w-3" />
                        <span className="font-medium">{images.length}</span>
                      </button>
                    )}
                  </div>

                  {/* Bottom Right - Badges de ação hover */}
                  <div className="absolute bottom-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Badge para produtos com 1 imagem */}
                    {images.length === 1 && (
                      <button
                        onClick={handleImageManagerOpen}
                        className="bg-blue-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm hover:bg-blue-600/90 transition-colors pointer-events-auto"
                        title="Gerenciar imagens"
                      >
                        <Camera className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-square bg-gradient-to-br from-muted via-muted/80 to-muted/60 rounded-xl flex items-center justify-center border border-border/50 shadow-sm relative">
                <Package className="h-8 w-8 text-muted-foreground" />

                {/* Stock Badge para produto sem imagem */}
                <div className="absolute top-2 right-2">
                  <ProductStockBadge
                    stock={totalStock}
                    stockAlertThreshold={product.stock_alert_threshold}
                  />
                </div>

                {/* Badge de destaque para produto sem imagem */}
                {product.is_featured && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-medium shadow-sm">
                      ✨ Destaque
                    </Badge>
                  </div>
                )}

                {/* Badge para adicionar imagens quando não há nenhuma */}
                <button
                  onClick={handleImageManagerOpen}
                  className="absolute bottom-2 right-2 bg-green-500/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm hover:bg-green-600/80 transition-colors opacity-0 group-hover:opacity-100"
                  title="Adicionar imagens"
                >
                  <Camera className="h-3 w-3" />
                  <span>+</span>
                </button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 space-y-3">
          <div>
            <h3 className="font-semibold text-base line-clamp-2 leading-tight">
              {product.name}
            </h3>
            {product.category && (
              <p className="text-xs text-muted-foreground mt-1">
                {product.category}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(product.retail_price)}
              </span>
              {variations.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {variations.length} variações
                </Badge>
              )}
            </div>

            {product.wholesale_price && (
              <div className="text-xs text-muted-foreground">
                Atacado: {formatCurrency(product.wholesale_price)}
                {product.min_wholesale_qty &&
                  ` (min: ${product.min_wholesale_qty})`}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleView}
              className="flex-1 flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              Ver
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex items-center gap-1"
            >
              <Edit3 className="h-3 w-3" />
              Editar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 🎯 NOVO: Modal de Gerenciamento de Imagens */}
      {product.id && (
        <ProductImageManagerModal
          isOpen={showImageManager}
          onClose={() => setShowImageManager(false)}
          productId={product.id}
          productName={product.name}
          onImagesUpdated={handleImagesUpdated} // 🎯 PASSAR CALLBACK PARA O MODAL
        />
      )}
    </>
  );
};

export default ProductGridCard;
