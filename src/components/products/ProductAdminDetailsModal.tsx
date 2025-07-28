import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Palette, Layers, Edit, Trash2, AlertCircle, Image } from 'lucide-react';
import { Product } from '@/types/product';
import { formatCurrency } from '@/lib/utils';
import { useProductImages } from '@/hooks/useProductImages';
import ProductCardImageGallery from '@/components/catalog/ProductCardImageGallery';

interface ProductAdminDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
}

const ProductAdminDetailsModal: React.FC<ProductAdminDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { images } = useProductImages(product?.id);

  if (!product) return null;

  // Calcular informações sobre variações
  const variationInfo = React.useMemo(() => {
    if (!product.variations || product.variations.length === 0) {
      return null;
    }

    const colors = [...new Set(product.variations.filter(v => v.color).map(v => v.color))];
    const sizes = [...new Set(product.variations.filter(v => v.size).map(v => v.size))];
    const grades = product.variations.filter(v => v.is_grade || v.variation_type === 'grade');
    
    return {
      total: product.variations.length,
      colors: colors.length,
      sizes: sizes.length,
      grades: grades.length,
      hasVariations: true,
    };
  }, [product.variations]);

  const totalStock = React.useMemo(() => {
    if (variationInfo?.hasVariations) {
      return product.variations?.reduce((sum, variation) => sum + variation.stock, 0) || 0;
    }
    return product.stock;
  }, [product.variations, product.stock, variationInfo]);

  const handleEdit = () => {
    onEdit?.(product);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      onDelete?.(product.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Produto</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Gallery */}
          <div className="w-full">
            <ProductCardImageGallery 
              productId={product.id}
              productName={product.name}
              maxImages={5}
              className="w-full"
            />
          </div>

          {/* Product Header */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
            
            {/* Status Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.category && (
                <Badge variant="outline" className="bg-background/60">
                  {product.category}
                </Badge>
              )}
              {product.is_featured && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  ⭐ Destaque
                </Badge>
              )}
              {!product.is_active && (
                <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                  Inativo
                </Badge>
              )}
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {product.is_active ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </div>

          {/* Price Information */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-4 rounded-2xl border border-blue-100">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
              Informações de Preço
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between bg-white/60 px-3 py-2 rounded-lg">
                <span className="text-sm text-gray-700 font-semibold">Varejo:</span>
                <span className="font-bold text-xl text-gray-900">{formatCurrency(product.retail_price)}</span>
              </div>
              {product.wholesale_price && (
                <div className="flex items-center justify-between bg-white/60 px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-700 font-semibold">Atacado:</span>
                  <span className="font-bold text-xl text-orange-600">
                    {formatCurrency(product.wholesale_price)}
                  </span>
                </div>
              )}
              {product.min_wholesale_qty && (
                <div className="flex items-center justify-between text-sm bg-white/40 px-3 py-2 rounded-lg">
                  <span className="text-gray-600 font-medium">Qtd. Mín.:</span>
                  <span className="font-bold text-gray-800">{product.min_wholesale_qty} un.</span>
                </div>
              )}
            </div>
          </div>

          {/* Stock Information */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-100">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600" />
              Informações de Estoque
            </h4>
            <div className="flex items-center justify-between bg-white/60 px-3 py-2 rounded-lg">
              <span className="text-sm text-gray-700 font-semibold">Estoque Total:</span>
              <span className={`font-bold text-xl ${totalStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalStock}
                {totalStock <= (product.stock_alert_threshold || 5) && totalStock > 0 && (
                  <AlertCircle className="inline h-4 w-4 text-amber-500 ml-2" />
                )}
              </span>
            </div>
          </div>

          {/* Variation Information */}
          {variationInfo?.hasVariations && (
            <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 p-4 rounded-2xl border border-purple-100">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="h-5 w-5 text-purple-600" />
                <span className="font-bold text-gray-800">
                  {variationInfo.total} Variações Disponíveis
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {variationInfo.colors > 0 && (
                  <div className="text-center bg-white/80 py-3 px-3 rounded-xl border border-blue-100">
                    <Palette className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                    <div className="text-sm font-bold text-gray-700">{variationInfo.colors}</div>
                    <div className="text-xs text-gray-500 font-medium">cores</div>
                  </div>
                )}
                {variationInfo.sizes > 0 && (
                  <div className="text-center bg-white/80 py-3 px-3 rounded-xl border border-green-100">
                    <Package className="h-5 w-5 text-green-500 mx-auto mb-2" />
                    <div className="text-sm font-bold text-gray-700">{variationInfo.sizes}</div>
                    <div className="text-xs text-gray-500 font-medium">tamanhos</div>
                  </div>
                )}
                {variationInfo.grades > 0 && (
                  <div className="text-center bg-white/80 py-3 px-3 rounded-xl border border-purple-100">
                    <Layers className="h-5 w-5 text-purple-500 mx-auto mb-2" />
                    <div className="text-sm font-bold text-gray-700">{variationInfo.grades}</div>
                    <div className="text-xs text-gray-500 font-medium">grades</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-2xl border border-gray-100">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-gray-500 to-slate-600 rounded-full"></div>
                Descrição
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductAdminDetailsModal;