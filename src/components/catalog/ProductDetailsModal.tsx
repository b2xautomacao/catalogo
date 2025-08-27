
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShoppingCart,
  MessageCircle,
  Package,
  Star,
  Truck,
  Shield,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Product, ProductVariation } from "@/types/product";
import { useProductVariations } from "@/hooks/useProductVariations";
import HierarchicalColorSizeSelector from "./HierarchicalColorSizeSelector";
import ProductImageGallery from "@/components/products/ProductImageGallery";
import { Card, CardContent } from "@/components/ui/card";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";

interface VariationSelection {
  variation: ProductVariation;
  quantity: number;
}

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number, variation?: ProductVariation) => void;
  catalogType: "retail" | "wholesale";
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  catalogType,
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedVariationImage, setSelectedVariationImage] = useState<string | null>(null);
  
  const { 
    variations, 
    loading: variationsLoading 
  } = useProductVariations(product?.id);

  const priceCalculation = usePriceCalculation(
    product?.store_id || "",
    {
      product_id: product?.id || "",
      retail_price: product?.retail_price || 0,
      wholesale_price: product?.wholesale_price,
      min_wholesale_qty: product?.min_wholesale_qty,
      quantity: 1,
      price_tiers: product?.price_tiers,
      enable_gradual_wholesale: product?.enable_gradual_wholesale,
    }
  );

  if (!product) return null;

  // URLs para WhatsApp
  const whatsappUrl = `https://wa.me/${product.whatsapp_number || "5511999999999"}?text=${encodeURIComponent(
    `Olá! Tenho interesse no produto: *${product.name}*\n💰 Preço: R$ ${priceCalculation.formattedUnitPrice}\n📞 Gostaria de mais informações.`
  )}`;

  const handleMultipleAddToCart = (selections: VariationSelection[]) => {
    selections.forEach(({ variation, quantity }) => {
      onAddToCart(product, quantity, variation);
      
      // Atualizar imagem selecionada se a variação tem imagem
      if (variation.image_url) {
        setSelectedVariationImage(variation.image_url);
      }
    });
  };

  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const shouldShowReadMore = product.description && product.description.length > 150;
  const hasVariations = variations && variations.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold line-clamp-2 pr-8">
                {product.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="capitalize">
                  {catalogType === "retail" ? "Varejo" : "Atacado"}
                </Badge>
                {product.category && (
                  <Badge variant="secondary">{product.category}</Badge>
                )}
                {product.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    Destaque
                  </Badge>
                )}
                {hasVariations && (
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    {variations.length} Variações
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-6">
            {/* Coluna Esquerda - Galeria de Imagens */}
            <div className="space-y-6">
              {/* Galeria de Imagens Melhorada */}
              <ProductImageGallery
                productId={product.id || ''}
                productName={product.name}
                selectedVariationImage={selectedVariationImage}
                className="w-full"
              />

              {/* Descrição */}
              {product.description && (
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <h4 className="font-semibold mb-3 text-lg">Descrição do Produto</h4>
                    <div className="text-muted-foreground leading-relaxed">
                      {showFullDescription ? (
                        <p className="whitespace-pre-wrap">{product.description}</p>
                      ) : (
                        <p>{truncateDescription(product.description)}</p>
                      )}
                      {shouldShowReadMore && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto mt-3 text-primary font-medium"
                          onClick={() => setShowFullDescription(!showFullDescription)}
                        >
                          {showFullDescription ? (
                            <>
                              Ver menos <ChevronUp className="h-4 w-4 ml-1" />
                            </>
                          ) : (
                            <>
                              Ver mais <ChevronDown className="h-4 w-4 ml-1" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Informações Adicionais */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <h4 className="font-semibold mb-3 text-lg">Informações do Produto</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Estoque</div>
                        <div className="text-sm text-muted-foreground">{product.stock} unidades</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Entrega</div>
                        <div className="text-sm text-muted-foreground">Disponível</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Garantia</div>
                        <div className="text-sm text-muted-foreground">Produto garantido</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Qualidade</div>
                        <div className="text-sm text-muted-foreground">Premium</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coluna Direita - Compra */}
            <div className="space-y-6">
              {/* Preço - Para produtos sem variações */}
              {!hasVariations && (
                <Card className="border-primary/20">
                  <CardContent className="pt-6 pb-6">
                    <div className="text-center space-y-4">
                      <div className="text-3xl font-bold text-primary">
                        {priceCalculation.formattedUnitPrice}
                      </div>
                      {priceCalculation.savings > 0 && (
                        <div>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-base px-3 py-1">
                            Economia: {priceCalculation.formattedSavings}
                          </Badge>
                        </div>
                      )}
                      <div className="text-muted-foreground">
                        Nível: {priceCalculation.currentTier.tier_name}
                      </div>
                      {catalogType === "wholesale" && product.min_wholesale_qty && (
                        <p className="text-sm text-muted-foreground">
                          Quantidade mínima: {product.min_wholesale_qty} unidades
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Seleção de Variações */}
              {hasVariations && (
                <Card>
                  <CardContent className="pt-6 pb-6">
                    <h4 className="font-semibold mb-4 text-lg">Selecionar Variações</h4>
                    <HierarchicalColorSizeSelector
                      product={product}
                      variations={variations}
                      onAddToCart={handleMultipleAddToCart}
                      catalogType={catalogType}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Botões de Ação - Produtos sem Variações */}
              {!hasVariations && (
                <div className="space-y-4">
                  {product.stock > 0 ? (
                    <>
                      <Button 
                        size="lg" 
                        className="w-full h-12 text-lg font-semibold"
                        onClick={() => onAddToCart(product, 1)}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Adicionar ao Carrinho
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full h-12 text-lg"
                        onClick={() => window.open(whatsappUrl, "_blank")}
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Pedir via WhatsApp
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-lg text-muted-foreground mb-4">Produto Esgotado</p>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => window.open(whatsappUrl, "_blank")}
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Consultar Disponibilidade
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Dica para Próximo Nível de Preço */}
              {!hasVariations && priceCalculation.nextTierHint && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4 pb-4">
                    <div className="text-center">
                      <p className="text-blue-800 font-semibold mb-2">
                        💡 Dica de Economia
                      </p>
                      <p className="text-blue-700 text-sm">
                        Adicione mais {priceCalculation.nextTierHint.quantityNeeded} unidades 
                        e economize até R$ {priceCalculation.nextTierHint.potentialSavings.toFixed(2)} por item!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
