import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Eye,
  Edit,
  Trash2,
  Image,
  AlertCircle,
  Copy,
  Package2,
  Power,
  PowerOff,
  Palette,
} from "lucide-react";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { useProductImages } from "@/hooks/useProductImages";
import QuickColorImageModal from "./QuickColorImageModal";

interface ProductListCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onView?: (product: Product) => void;
  onDuplicate?: (product: Product) => void; // 🎯 NOVO: Callback para duplicar produto
  onManageStock?: (product: Product) => void; // 🎯 NOVO: Callback para gerenciar estoque
  onToggleStatus?: (product: Product, isActive: boolean) => void; // 🎯 NOVO: Callback para ativar/desativar
  onListUpdate?: () => void; // 🎯 NOVO: Callback para atualizar lista
}

const ProductListCard: React.FC<ProductListCardProps> = ({
  product,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  onManageStock,
  onToggleStatus,
  onListUpdate,
}) => {
  const { images } = useProductImages(product.id);
  const [showColorImageModal, setShowColorImageModal] = useState(false);

  // Verificar se produto tem variações com cor
  const hasColorVariations = React.useMemo(() => {
    return product.variations?.some((v) => v.color) || false;
  }, [product.variations]);

  const totalStock = React.useMemo(() => {
    if (product.variations && product.variations.length > 0) {
      const stock = product.variations.reduce(
        (sum, variation) => sum + (variation.stock || 0),
        0
      );
      console.log(
        `📊 ${product.name}: ${stock} estoque (${product.variations.length} variações)`
      );
      return stock;
    }
    console.log(
      `📊 ${product.name}: ${product.stock || 0} estoque (produto simples)`
    );
    return product.stock || 0;
  }, [product.variations, product.stock, product.name]);

  const handleEdit = () => onEdit?.(product);
  const handleDelete = () => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      onDelete?.(product.id);
    }
  };
  const handleView = () => onView?.(product);
  const handleDuplicate = () => onDuplicate?.(product);
  const handleManageStock = () => onManageStock?.(product);
  const handleToggleStatus = () =>
    onToggleStatus?.(product, !product.is_active);

  // 🎯 NOVA FUNÇÃO: Callback quando imagens são atualizadas (não usado neste componente)
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
      <Card className="group hover:shadow-md transition-all duration-200 border border-border/50 bg-white overflow-hidden">
        <div className="relative">
          {/* Product Image Container */}
          <div className="relative aspect-square bg-muted">
            {images.length > 0 ? (
              <img
                src={images[0].image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            {/* 🎯 NOVO: Badge de Imagens no Canto Superior Direito */}
            {images.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                <Image className="h-3 w-3" />
                <span className="font-medium">{images.length}</span>
              </div>
            )}

            {/* 🎯 NOVO: Badge de Estoque no Canto Inferior Direito */}
            <div className="absolute bottom-2 right-2 bg-white/90 text-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm border border-border/30">
              <Package className="h-3 w-3" />
              <span
                className={`font-medium ${totalStock > 0 ? "text-green-600" : "text-red-600"
                  }`}
                title={`${totalStock} unidades em estoque${product.variations?.length > 0
                  ? ` (${product.variations.length} variações)`
                  : ""
                  }`}
              >
                {totalStock}
              </span>
              {totalStock <= (product.stock_alert_threshold || 5) &&
                totalStock > 0 && (
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                )}
            </div>

            {/* Status Indicator */}
            <div
              className={`absolute top-2 left-2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${product.is_active ? "bg-green-500" : "bg-red-500"
                }`}
            />
          </div>

          {/* Product Info */}
          <div className="p-4 space-y-2">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm line-clamp-2 text-foreground">
                {product.name}
              </h3>

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
            </div>

            {/* Price Info */}
            <div className="space-y-1">
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

            {/* Actions */}
            <div className="flex items-center gap-1 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleView}
                className="h-8 w-8 p-0"
                title="Visualizar produto"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-8 w-8 p-0"
                title="Editar produto"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDuplicate}
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="Duplicar produto"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleStatus}
                className={`h-8 w-8 p-0 ${product.is_active
                  ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  : "text-green-600 hover:text-green-700 hover:bg-green-50"
                  }`}
                title={product.is_active ? "Desativar produto" : "Ativar produto"}
              >
                {product.is_active ? (
                  <PowerOff className="h-4 w-4" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
              </Button>
              {product.variations && product.variations.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManageStock}
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  title="Gerenciar estoque das variações"
                >
                  <Package2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                title="Excluir produto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {hasColorVariations && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowColorImageModal(true)}
                  className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  title="Vincular imagens às cores"
                >
                  <Palette className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 🎨 Modal de Vinculação Cor-Imagem */}
      {
        product.id && hasColorVariations && (
          <QuickColorImageModal
            isOpen={showColorImageModal}
            onClose={() => setShowColorImageModal(false)}
            productId={product.id}
            productName={product.name}
            onSaved={handleImagesUpdated}
          />
        )
      }
    </>
  );
};

export default ProductListCard;
