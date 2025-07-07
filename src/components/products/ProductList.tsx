import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Wand2, TrendingDown } from "lucide-react";
import { Product } from "@/types/product";
import { useProductPriceTiers } from "@/hooks/useProductPriceTiers";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProductImages } from "@/hooks/useProductImages";
import { supabase } from "@/integrations/supabase/client";

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onGenerateDescription: (id: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onEdit,
  onDelete,
  onGenerateDescription,
}) => {
  const { profile } = useAuth();
  const [modalProductId, setModalProductId] = useState<string | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  // Componente para exibir níveis de preço de um produto
  const ProductPriceTiers = ({ product }: { product: Product }) => {
    const { tiers, loading } = useProductPriceTiers(
      product.id,
      profile?.store_id
    );

    if (loading || !tiers || tiers.length <= 1) {
      return null;
    }

    // Filtrar apenas níveis ativos (exceto varejo)
    const activeTiers = tiers.filter(
      (tier) => tier.tier_order > 1 && tier.is_active
    );

    if (activeTiers.length === 0) {
      return null;
    }

    // Calcular desconto máximo
    const maxDiscountTier = activeTiers.reduce(
      (max, tier) => {
        const savingsAmount = product.retail_price - tier.price;
        const savingsPercentage = (savingsAmount / product.retail_price) * 100;
        return savingsPercentage > max.percentage
          ? { tier, percentage: savingsPercentage }
          : max;
      },
      { tier: activeTiers[0], percentage: 0 }
    );

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <TrendingDown className="h-3 w-3" />
          <span className="font-medium">Níveis Progressivos:</span>
          <Badge
            variant="outline"
            className="text-xs bg-orange-100 text-orange-700"
          >
            Descontos até {maxDiscountTier.percentage.toFixed(0)}%
          </Badge>
        </div>
        {activeTiers.map((tier) => {
          const savingsAmount = product.retail_price - tier.price;
          const savingsPercentage =
            (savingsAmount / product.retail_price) * 100;

          return (
            <div
              key={tier.id}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-1">
                <span className="text-gray-700">{tier.tier_name}:</span>
                <Badge variant="outline" className="text-xs">
                  {tier.min_quantity}+ un
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-green-700">
                  R$ {tier.price.toFixed(2).replace(".", ",")}
                </span>
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-700"
                >
                  -{savingsPercentage.toFixed(0)}%
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  if (!products || products.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Nenhum produto cadastrado ainda.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Clique em "Novo Produto" para começar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => {
        const showSetMainImage = !product.image_url;
        return (
          <Card key={product.id + refreshFlag} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">
                    {product.name}
                  </CardTitle>
                  {product.category && (
                    <Badge variant="outline" className="mt-2">
                      {product.category}
                    </Badge>
                  )}
                </div>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.image_url && (
                <div className="aspect-video overflow-hidden rounded-md bg-muted">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* Botão para definir imagem principal se não houver image_url */}
              {showSetMainImage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalProductId(product.id)}
                  className="w-full mb-2"
                >
                  Definir imagem principal
                </Button>
              )}

              {product.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {product.description}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Varejo:</span>
                  <span className="font-semibold">
                    R${" "}
                    {product.retail_price.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* Níveis de preço progressivos */}
                <ProductPriceTiers product={product} />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estoque:</span>
                  <Badge
                    variant={product.stock > 0 ? "default" : "destructive"}
                  >
                    {product.stock} unidades
                  </Badge>
                </div>

                {product.variations && product.variations.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Variações:</span>
                    <Badge variant="outline">
                      {product.variations.length} opções
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(product)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGenerateDescription(product.id)}
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(product.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>

            {/* Modal de seleção de imagem principal */}
            {modalProductId === product.id && (
              <SelectMainImageModal
                productId={product.id}
                productName={product.name}
                onClose={() => setModalProductId(null)}
                onImageSelected={async (imageUrl) => {
                  await supabase
                    .from("products")
                    .update({ image_url: imageUrl })
                    .eq("id", product.id);
                  setModalProductId(null);
                  setRefreshFlag((f) => f + 1); // Forçar re-render
                }}
              />
            )}
          </Card>
        );
      })}
    </div>
  );
};

// Modal de seleção de imagem principal
const SelectMainImageModal = ({
  productId,
  productName,
  onClose,
  onImageSelected,
}) => {
  const { images, loading } = useProductImages(productId);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>
            Selecionar imagem principal para {productName}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-center py-8">Carregando imagens...</div>
        ) : images.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma imagem encontrada para este produto.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {images.map((img) => (
              <button
                key={img.id}
                className="aspect-square rounded border-2 border-transparent hover:border-primary focus:border-primary transition-all overflow-hidden"
                onClick={() => onImageSelected(img.image_url)}
                type="button"
              >
                <img
                  src={img.image_url}
                  alt="Imagem do produto"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductList;
