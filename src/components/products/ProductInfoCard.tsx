import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/product";
import {
  Image as ImageIcon,
  Package,
  TrendingUp,
  DollarSign,
  Eye,
  Edit,
  ShoppingCart,
  Star,
} from "lucide-react";
import { useProductPriceTiers } from "@/hooks/useProductPriceTiers";
import ProductPriceDisplay from "@/components/catalog/ProductPriceDisplay";

interface ProductInfoCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onView?: (product: Product) => void;
  className?: string;
}

const ProductInfoCard: React.FC<ProductInfoCardProps> = ({
  product,
  onEdit,
  onView,
  className = "",
}) => {
  // HOOK PARA NÍVEIS DE PREÇO
  const { tiers: priceTiers, loading: tiersLoading } = useProductPriceTiers(
    product.id,
    {
      wholesale_price: product.wholesale_price,
      min_wholesale_qty: product.min_wholesale_qty,
      retail_price: product.retail_price,
    }
  );

  // Thumb principal
  const mainImage =
    product.image_url ||
    (product.variations?.find((v) => v.image_url)?.image_url ?? null);

  // Quantidade de imagens
  const getImageCount = () => {
    let count = 0;
    if (product.image_url) count++;
    if (product.variations) {
      count += product.variations.filter((v) => v.image_url).length;
    }
    return count;
  };
  const imageCount = getImageCount();

  // Badges
  const hasWholesalePrice =
    product.wholesale_price && product.wholesale_price < product.retail_price;
  const hasPriceTiers = priceTiers && priceTiers.length > 0;
  const hasWholesaleAvailable = hasWholesalePrice || hasPriceTiers;

  // Avaliação fictícia
  const generateRating = () => {
    const hash = product.id.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return 3.5 + (Math.abs(hash) % 15) / 10;
  };
  const rating = generateRating();
  const reviewCount = Math.floor(
    5 + ((product.name.length + (product.retail_price || 0)) % 45)
  );

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-300 ${className}`}
    >
      {/* Thumb principal */}
      <div className="w-full aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
            <ImageIcon className="h-16 w-16 mb-2" />
            <span className="text-sm">Sem imagem</span>
          </div>
        )}
      </div>

      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {product.name}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              ID: {product.id.slice(0, 8)}...
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(product)}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(product)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preço principal padronizado */}
        <ProductPriceDisplay
          storeId={product.store_id}
          productId={product.id}
          retailPrice={product.retail_price}
          wholesalePrice={product.wholesale_price}
          minWholesaleQty={product.min_wholesale_qty}
          quantity={1}
          priceTiers={priceTiers}
          catalogType="retail"
          showSavings={true}
          showNextTierHint={false}
          showTierName={true}
          size="md"
        />

        {/* Níveis de preço configurados (cards/boxes) */}
        {hasPriceTiers && priceTiers.length > 0 && (
          <div className="mt-2">
            <div className="font-medium text-sm mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Níveis de Preço Configurados:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {priceTiers.map((tier) => (
                <div
                  key={tier.id}
                  className="border rounded-lg p-2 flex flex-col text-sm bg-gray-50"
                >
                  <span className="font-semibold">{tier.tier_name}</span>
                  <span>
                    {tier.min_quantity}+ un. • {formatCurrency(tier.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informações básicas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium">Preço Varejo:</span>
              <span className="text-green-600 font-bold">
                {formatCurrency(product.retail_price)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-orange-600" />
              <span className="font-medium">Estoque:</span>
              <span
                className={`font-bold ${
                  product.stock > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {product.stock} un.
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <ImageIcon className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Imagens:</span>
              <span className="font-bold text-purple-600">
                {imageCount} {imageCount === 1 ? "imagem" : "imagens"}
              </span>
            </div>
            {product.variations && (
              <div className="flex items-center gap-2 text-sm">
                <ShoppingCart className="h-4 w-4 text-pink-600" />
                <span className="font-medium">Variações:</span>
                <span className="font-bold text-pink-600">
                  {product.variations.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Badges de status */}
        <div className="flex flex-wrap gap-2">
          {product.is_featured && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              ⭐ Destaque
            </Badge>
          )}
          {hasWholesaleAvailable && (
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <TrendingUp className="h-3 w-3 mr-1" />
              Atacado
            </Badge>
          )}
          {product.variations && product.variations.length > 0 && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <ShoppingCart className="h-3 w-3 mr-1" />
              {product.variations.length} Variações
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="destructive">Sem estoque</Badge>
          )}
          {product.stock > 0 &&
            product.stock <= (product.stock_alert_threshold || 5) && (
              <Badge className="bg-orange-500 text-white">Estoque baixo</Badge>
            )}
        </div>

        {/* Avaliação e categoria */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {rating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">
              ({reviewCount} avaliações)
            </span>
          </div>
          {product.category && (
            <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">
              Categoria:{" "}
              <span className="font-semibold">{product.category}</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductInfoCard;
