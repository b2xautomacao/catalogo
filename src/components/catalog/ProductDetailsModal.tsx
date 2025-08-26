
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShoppingCart,
  MessageCircle,
  Package,
  Star,
  Truck,
  Shield,
  X,
  Minus,
  Plus,
} from "lucide-react";
import { Product, ProductVariation } from "@/types/product";
import { useProductVariations } from "@/hooks/useProductVariations";
import HierarchicalVariationSelector from "./HierarchicalVariationSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  catalogType: "retail" | "wholesale";
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  catalogType,
}) => {
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  const { 
    variations, 
    loading: variationsLoading 
  } = useProductVariations(product?.id);

  if (!product) return null;

  // Calcular preço baseado no tipo de catálogo e variação
  const basePrice = catalogType === "wholesale" 
    ? (product.wholesale_price || product.retail_price) 
    : product.retail_price;

  const finalPrice = selectedVariation 
    ? basePrice + (selectedVariation.price_adjustment || 0)
    : basePrice;

  // Verificar disponibilidade
  const maxStock = selectedVariation 
    ? selectedVariation.stock 
    : product.stock;

  const isAvailable = maxStock > 0;

  // URLs para WhatsApp
  const whatsappUrl = `https://wa.me/${product.whatsapp_number || "5511999999999"}?text=${encodeURIComponent(
    `Olá! Tenho interesse no produto: *${product.name}*${
      selectedVariation 
        ? `\n📦 Variação: ${selectedVariation.color || ''} ${selectedVariation.size || ''}`.trim()
        : ''
    }\n💰 Preço: R$ ${finalPrice.toFixed(2)}\n📞 Quantidade: ${quantity}`
  )}`;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity);
    }
  };

  const handleVariationChange = (variation: ProductVariation | null) => {
    setSelectedVariation(variation);
    // Ajustar quantidade se necessário
    if (variation && quantity > variation.stock) {
      setQuantity(Math.max(1, variation.stock));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold line-clamp-2 pr-8">
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
            {/* Coluna Esquerda - Imagem e Informações */}
            <div className="space-y-6">
              {/* Imagem Principal */}
              <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Descrição */}
              {product.description && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-3">Descrição do Produto</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Informações Adicionais */}
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3">Informações</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>Estoque: {maxStock} unidades</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span>Envio disponível</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>Produto garantido</span>
                    </div>
                    {product.sku && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">SKU:</span>
                        <span className="font-mono">{product.sku}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coluna Direita - Compra */}
            <div className="space-y-6">
              {/* Preço */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-primary">
                      R$ {finalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    {selectedVariation?.price_adjustment !== 0 && selectedVariation && (
                      <div className="text-sm text-muted-foreground">
                        Preço base: R$ {basePrice.toFixed(2)} 
                        <Badge 
                          variant={selectedVariation.price_adjustment > 0 ? "destructive" : "default"}
                          className="ml-2"
                        >
                          {selectedVariation.price_adjustment > 0 ? "+" : ""}
                          R$ {selectedVariation.price_adjustment.toFixed(2)}
                        </Badge>
                      </div>
                    )}
                    {catalogType === "wholesale" && product.min_wholesale_qty && (
                      <p className="text-sm text-muted-foreground">
                        Quantidade mínima: {product.min_wholesale_qty} unidades
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Seleção de Variações */}
              {variations && variations.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <HierarchicalVariationSelector
                      variations={variations}
                      selectedVariation={selectedVariation}
                      onVariationChange={handleVariationChange}
                      loading={variationsLoading}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Seleção de Quantidade */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Quantidade</h4>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className="h-10 w-10 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                        className="w-20 text-center"
                        min="1"
                        max={maxStock}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= maxStock}
                        className="h-10 w-10 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Máximo disponível: {maxStock} unidades
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Botões de Ação */}
              <div className="space-y-3">
                {isAvailable ? (
                  <>
                    <Button size="lg" className="w-full" disabled={!selectedVariation && variations.length > 0}>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Adicionar ao Carrinho
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={() => window.open(whatsappUrl, "_blank")}
                      disabled={!selectedVariation && variations.length > 0}
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Pedir via WhatsApp
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-3">Produto Esgotado</p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(whatsappUrl, "_blank")}
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Consultar Disponibilidade
                    </Button>
                  </div>
                )}

                {!selectedVariation && variations.length > 0 && (
                  <p className="text-sm text-center text-muted-foreground">
                    ⚠️ Selecione uma variação para continuar
                  </p>
                )}
              </div>

              {/* Total */}
              <Separator />
              <div className="text-center">
                <div className="text-lg font-semibold">
                  Total: R$ {(finalPrice * quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-muted-foreground">
                  {quantity} {quantity === 1 ? "unidade" : "unidades"}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
