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
  Star,
  AlertTriangle,
  ShoppingBag,
  Layers,
  Camera,
} from "lucide-react";
import { Product } from "@/types/product";
import ProductStockBadge from "./ProductStockBadge";
import ProductImageManagerModal from "./ProductImageManagerModal";

interface ProductInfoCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onView?: (product: Product) => void;
  onListUpdate?: () => void; // 🎯 NOVO: Callback para atualizar lista
}

const ProductInfoCard: React.FC<ProductInfoCardProps> = ({
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

  const handleView = () => {
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
        <div className="relative w-full">
          {/* 🎯 MELHORADO: Product Image com aspect ratio 1:1 */}
          <div className="relative aspect-square overflow-hidden">
            {images.length > 0 ? (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 relative">
                <img
                  src={images[0].image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* 🎯 REORGANIZADOS: Badges sem sobreposição */}
                <div className="absolute inset-3 pointer-events-none">
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
                    {/* Enhanced Image Count Indicator */}
                    {images.length > 1 && (
                      <button
                        onClick={handleImageManagerOpen}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 pointer-events-auto"
                        title="Gerenciar imagens"
                      >
                        <Image className="h-3 w-3" />
                        <span className="font-semibold">{images.length}</span>
                      </button>
                    )}
                  </div>

                  {/* Bottom Left - Status e variações */}
                  <div className="absolute bottom-0 left-0 flex flex-col gap-1">
                    {/* Status Indicator */}
                    <div
                      className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                        product.is_active ? "bg-green-500" : "bg-red-500"
                      }`}
                    />

                    {variations.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-white/90 shadow-sm"
                      >
                        {variations.length} variações
                      </Badge>
                    )}
                  </div>

                  {/* Bottom Right - Badges de ação hover */}
                  <div className="absolute bottom-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Badge para produtos com 1 imagem */}
                    {images.length === 1 && (
                      <button
                        onClick={handleImageManagerOpen}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 opacity-0 group-hover:opacity-100 pointer-events-auto"
                        title="Gerenciar imagens"
                      >
                        <Camera className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted via-muted/80 to-muted/60 flex items-center justify-center relative">
                <Package className="h-12 w-12 text-muted-foreground" />

                {/* Badge de destaque para produto sem imagem */}
                {product.is_featured && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-medium shadow-sm">
                      ✨ Destaque
                    </Badge>
                  </div>
                )}

                {/* Status Indicator para produto sem imagem */}
                <div
                  className={`absolute bottom-3 left-3 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                    product.is_active ? "bg-green-500" : "bg-red-500"
                  }`}
                />

                {/* Badge para adicionar imagens quando não há nenhuma */}
                <button
                  onClick={handleImageManagerOpen}
                  className="absolute bottom-3 right-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  title="Adicionar imagens"
                >
                  <Camera className="h-3 w-3" />
                  <span>+</span>
                </button>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4 space-y-4">
            {/* Product Title and Category */}
            <div>
              <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
                {product.name}
              </h3>
              {product.category && (
                <p className="text-sm text-muted-foreground mt-1">
                  {product.category}
                </p>
              )}
            </div>

            {/* Price Information */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(product.retail_price)}
                </span>
                {product.is_featured && (
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                )}
              </div>

              {product.wholesale_price && (
                <div className="text-sm text-muted-foreground">
                  Atacado: {formatCurrency(product.wholesale_price)}
                  {product.min_wholesale_qty && (
                    <span className="ml-1">
                      (mín. {product.min_wholesale_qty})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Stock Information */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Estoque: {totalStock} unidades
              </span>
              {totalStock <= (product.stock_alert_threshold || 5) && (
                <Badge variant="destructive" className="text-xs">
                  Baixo estoque
                </Badge>
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
          </div>
        </div>
      </Card>

      {/* 🎯 NOVO: Modal de Gerenciamento de Imagens */}
      {product.id && (
        <ProductImageManagerModal
          isOpen={showImageManager}
          onClose={() => setShowImageManager(false)}
          productId={product.id}
          productName={product.name}
          onImagesUpdated={handleImagesUpdated} // 🎯 NOVO: Passar callback para o modal
        />
      )}
    </>
  );
};

export default ProductInfoCard;
