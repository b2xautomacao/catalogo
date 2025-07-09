import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  Heart,
  Package,
  Minus,
  Plus,
  AlertCircle,
  Loader2,
  Grid,
  List,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Product } from "@/types/product";
import { ProductVariation } from "@/types/variation";
import ProductImageGallery from "@/components/products/ProductImageGallery";
import ProductVariationSelector from "@/components/catalog/ProductVariationSelector";
import MultipleVariationSelector from "@/components/catalog/MultipleVariationSelector";
import { useProductVariations } from "@/hooks/useProductVariations";
import { useToast } from "@/hooks/use-toast";
import { CatalogType } from "@/hooks/useCatalog";

interface VariationSelection {
  variation: ProductVariation;
  quantity: number;
}

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (
    product: Product,
    quantity: number,
    variation?: ProductVariation
  ) => void;
  onAddToWishlist?: (product: Product) => void;
  catalogType?: "retail" | "wholesale";
  isInWishlist?: boolean;
}

// Componente para descrição expandível
const ExpandableDescription: React.FC<{ description: string }> = ({
  description,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Verificar se a descrição é longa (mais de 200 caracteres)
  const isLongDescription = description.length > 200;
  const shortDescription = isLongDescription
    ? description.substring(0, 200) + "..."
    : description;

  if (!isLongDescription) {
    return <p className="text-gray-600 leading-relaxed">{description}</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-gray-600 leading-relaxed">
        {isExpanded ? description : shortDescription}
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
      >
        <span className="flex items-center gap-1">
          {isExpanded ? "Ver menos" : "Ver mais"}
          {isExpanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </span>
      </Button>
    </div>
  );
};

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onAddToWishlist,
  catalogType = "retail",
  isInWishlist = false,
}) => {
  // ✅ VERIFICAÇÃO ANTES DOS HOOKS
  if (!product) {
    return null;
  }

  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] =
    useState<ProductVariation | null>(null);
  const [showVariationError, setShowVariationError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [quantityChangeKey, setQuantityChangeKey] = useState(0);
  const [selectionMode, setSelectionMode] = useState<"single" | "multiple">(
    "single"
  );
  const { toast } = useToast();

  // Hook para carregar variações do produto
  const { variations, loading: variationsLoading } = useProductVariations(
    product.id
  );

  // Obter imagem da variação selecionada
  const selectedVariationImage = useMemo(() => {
    if (!selectedVariation || !selectedVariation.image_url) return null;
    return selectedVariation.image_url;
  }, [selectedVariation]);

  // Reset quando produto muda
  useEffect(() => {
    if (product && isOpen) {
      setQuantity(1);
      setSelectedVariation(null);
      setShowVariationError(false);
      setIsAddingToCart(false);
      setQuantityChangeKey((prev) => prev + 1);
      setSelectionMode("single");
    }
  }, [product?.id, isOpen]);

  // Reset variação selecionada quando variações carregam
  useEffect(() => {
    if (variations && variations.length > 0 && !selectedVariation) {
      setSelectedVariation(null);
    } else if (variations && variations.length === 0) {
      setSelectedVariation(null);
    }
  }, [variations, selectedVariation]);

  const hasVariations = variations && variations.length > 0;
  const requiresVariationSelection = hasVariations;

  // Calcular preço baseado na variação selecionada
  const basePrice =
    catalogType === "wholesale" && product.wholesale_price
      ? product.wholesale_price
      : product.retail_price;

  const finalPrice = selectedVariation
    ? basePrice + (selectedVariation.price_adjustment || 0)
    : basePrice;

  // Calcular estoque disponível
  const availableStock = selectedVariation
    ? selectedVariation.stock
    : product.stock;

  const isWholesale = catalogType === "wholesale";
  const minQty = isWholesale ? product.min_wholesale_qty || 1 : 1;
  const maxQty = Math.min(availableStock, 999); // Limite máximo de 999 unidades

  // Função melhorada para mudança de quantidade
  const handleQuantityChange = useCallback(
    (newQuantity: number) => {
      // Validar limites
      let validQuantity = newQuantity;

      if (validQuantity < minQty) {
        validQuantity = minQty;
      }

      if (validQuantity > maxQty) {
        validQuantity = maxQty;
      }

      // Atualizar estado apenas se houve mudança
      if (validQuantity !== quantity) {
        setQuantity(validQuantity);
        setQuantityChangeKey((prev) => prev + 1);

        // Feedback visual
        toast({
          title: "Quantidade atualizada",
          description: `Quantidade alterada para ${validQuantity} unidade${
            validQuantity > 1 ? "s" : ""
          }`,
          duration: 1500,
        });
      }
    },
    [quantity, minQty, maxQty, toast]
  );

  const handleVariationChange = useCallback(
    (variation: ProductVariation | null) => {
      setSelectedVariation(variation);
      setShowVariationError(false);

      // Ajustar quantidade se exceder o estoque da variação
      if (variation && quantity > variation.stock) {
        const newQuantity = Math.max(
          minQty,
          Math.min(variation.stock, quantity)
        );
        handleQuantityChange(newQuantity);
      }
    },
    [quantity, minQty, handleQuantityChange]
  );

  const handleAddToCart = useCallback(async () => {
    // Validar seleção de variação obrigatória
    if (requiresVariationSelection && !selectedVariation) {
      setShowVariationError(true);
      toast({
        title: "Seleção obrigatória",
        description:
          "Por favor, selecione uma opção antes de adicionar ao carrinho.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Validar estoque disponível
    if (quantity > availableStock) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${availableStock} unidade${
          availableStock > 1 ? "s" : ""
        } disponível${availableStock > 1 ? "eis" : ""}.`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!onAddToCart) {
      toast({
        title: "Erro",
        description: "Função de adicionar ao carrinho não disponível.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      setIsAddingToCart(true);

      await onAddToCart(product, quantity, selectedVariation || undefined);

      toast({
        title: "Produto adicionado!",
        description: `${product.name} foi adicionado ao carrinho com sucesso.`,
        duration: 2000,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Erro ao adicionar",
        description:
          "Ocorreu um erro ao adicionar o produto ao carrinho. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsAddingToCart(false);
    }
  }, [
    requiresVariationSelection,
    selectedVariation,
    quantity,
    availableStock,
    onAddToCart,
    product,
    onClose,
    toast,
  ]);

  // Função para seleção múltipla de variações
  const handleMultipleAddToCart = useCallback(
    async (selections: VariationSelection[]) => {
      if (!onAddToCart || selections.length === 0) return;

      setIsAddingToCart(true);

      try {
        // Adicionar cada seleção ao carrinho
        for (const selection of selections) {
          await onAddToCart(product, selection.quantity, selection.variation);
        }

        const totalItems = selections.reduce(
          (sum, sel) => sum + sel.quantity,
          0
        );

        toast({
          title: "Sucesso!",
          description: `${totalItems} item(ns) adicionado(s) ao carrinho`,
        });

        // Fechar modal após adicionar
        onClose();
      } catch (error) {
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao adicionar os produtos ao carrinho",
          variant: "destructive",
        });
      } finally {
        setIsAddingToCart(false);
      }
    },
    [onAddToCart, product, toast, onClose]
  );

  const handleAddToWishlist = useCallback(() => {
    if (onAddToWishlist) {
      onAddToWishlist(product);
      toast({
        title: isInWishlist
          ? "Removido da lista"
          : "Adicionado à lista de desejos",
        description: `${product.name} foi ${
          isInWishlist ? "removido da" : "adicionado à"
        } lista de desejos.`,
        duration: 2000,
      });
    }
  }, [onAddToWishlist, product, isInWishlist, toast]);

  const isOutOfStock = availableStock === 0;
  const canAddToCart =
    !isOutOfStock &&
    (!requiresVariationSelection || selectedVariation) &&
    !isAddingToCart;

  // Verificar se os botões de quantidade devem estar habilitados
  const canDecreaseQuantity = quantity > minQty && !isAddingToCart;
  const canIncreaseQuantity = quantity < maxQty && !isAddingToCart;

  // Gerar avaliação fictícia
  const rating = useMemo(() => {
    const hash = product.id.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return 3.5 + (Math.abs(hash) % 15) / 10;
  }, [product.id]);

  const reviewCount = useMemo(() => {
    const hash = product.name.length + (product.retail_price || 0);
    return Math.floor(5 + (hash % 45));
  }, [product.name, product.retail_price]);

  // Função para renderizar as estrelas
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative h-4 w-4">
            <Star className="h-4 w-4 text-gray-300 absolute" />
            <div className="overflow-hidden w-1/2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }
    return stars;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Galeria de Imagens */}
          <div>
            <ProductImageGallery
              productId={product.id}
              productName={product.name}
              selectedVariationImage={selectedVariationImage}
            />
          </div>

          {/* Informações do Produto */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                {product.name}
              </h1>

              {/* Descrição completa disponível no modal */}
              {product.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Descrição</h3>
                  <ExpandableDescription description={product.description} />
                </div>
              )}
            </div>

            {/* Preços */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  R${" "}
                  {finalPrice.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
                {selectedVariation?.price_adjustment !== 0 &&
                  selectedVariation?.price_adjustment && (
                    <Badge variant="outline" className="text-sm">
                      {selectedVariation.price_adjustment > 0 ? "+" : ""}
                      R${" "}
                      {selectedVariation.price_adjustment.toLocaleString(
                        "pt-BR",
                        { minimumFractionDigits: 2 }
                      )}
                    </Badge>
                  )}
              </div>

              {product.wholesale_price &&
                product.wholesale_price !== product.retail_price && (
                  <div className="text-lg text-green-600 font-semibold">
                    Atacado: R${" "}
                    {product.wholesale_price.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                    {isWholesale && minQty > 1 && (
                      <span className="text-sm text-gray-600 ml-2">
                        (mín. {minQty} un.)
                      </span>
                    )}
                  </div>
                )}
            </div>

            {/* Estoque */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                Estoque disponível:
              </span>
              <span
                className={`font-bold ${
                  availableStock <= 5 ? "text-orange-600" : "text-green-600"
                }`}
              >
                {availableStock > 0 ? `${availableStock} unidades` : "Esgotado"}
              </span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">{renderStars(rating)}</div>
              <span className="text-sm text-gray-600">
                {rating.toFixed(1)} ({reviewCount} avaliações)
              </span>
            </div>

            {/* Seleção de Variações */}
            {hasVariations && (
              <div className="space-y-4">
                <Tabs
                  value={selectionMode}
                  onValueChange={(value) =>
                    setSelectionMode(value as "single" | "multiple")
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="single"
                      className="flex items-center gap-2"
                    >
                      <List className="w-4 h-4" />
                      Seleção Única
                    </TabsTrigger>
                    <TabsTrigger
                      value="multiple"
                      className="flex items-center gap-2"
                    >
                      <Grid className="w-4 h-4" />
                      Seleção Múltipla
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="single" className="mt-4">
                    <ProductVariationSelector
                      variations={variations}
                      selectedVariation={selectedVariation}
                      onVariationChange={handleVariationChange}
                      loading={variationsLoading}
                    />

                    {showVariationError && (
                      <Alert className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Por favor, selecione uma variação antes de adicionar
                          ao carrinho.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Controle de Quantidade - Modo Único */}
                    {(!requiresVariationSelection || selectedVariation) &&
                      availableStock > 0 && (
                        <div className="space-y-4 mt-6">
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">
                              Quantidade:
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(quantity - 1)
                                }
                                disabled={quantity <= minQty}
                                className="w-10 h-10 p-0"
                              >
                                <Minus size={16} />
                              </Button>
                              <span className="w-16 text-center font-medium text-lg">
                                {quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(quantity + 1)
                                }
                                disabled={quantity >= maxQty}
                                className="w-10 h-10 p-0"
                              >
                                <Plus size={16} />
                              </Button>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={handleAddToCart}
                              disabled={isAddingToCart || availableStock === 0}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12"
                            >
                              {isAddingToCart ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Adicionando...
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="mr-2 h-4 w-4" />
                                  Adicionar ao Carrinho
                                </>
                              )}
                            </Button>

                            <Button
                              variant="outline"
                              onClick={handleAddToWishlist}
                              className="h-12 px-4"
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  isInWishlist
                                    ? "fill-red-500 text-red-500"
                                    : ""
                                }`}
                              />
                            </Button>
                          </div>
                        </div>
                      )}
                  </TabsContent>

                  <TabsContent value="multiple" className="mt-4">
                    <MultipleVariationSelector
                      product={product}
                      variations={variations}
                      onAddToCart={handleMultipleAddToCart}
                      catalogType={catalogType}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Produto sem variações */}
            {!hasVariations && availableStock > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantidade:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= minQty}
                      className="w-10 h-10 p-0"
                    >
                      <Minus size={16} />
                    </Button>
                    <span className="w-16 text-center font-medium text-lg">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= maxQty}
                      className="w-10 h-10 p-0"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || availableStock === 0}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12"
                  >
                    {isAddingToCart ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Adicionar ao Carrinho
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleAddToWishlist}
                    className="h-12 px-4"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        isInWishlist ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>
            )}

            {/* Produto Esgotado */}
            {availableStock === 0 && (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <h3 className="font-medium text-gray-900 mb-2">
                  Produto Esgotado
                </h3>
                <p className="text-sm text-gray-600">
                  Este produto está temporariamente fora de estoque.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
