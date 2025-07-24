
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Heart,
  Star,
  Plus,
  Minus,
  X,
  Share2,
  TrendingDown,
  AlertCircle,
  Palette,
  Package,
  Layers,
} from "lucide-react";
import { Product } from "@/types/product";
import { CatalogType } from "@/hooks/useCatalog";
import { useProductVariations } from "@/hooks/useProductVariations";
import { useToast } from "@/hooks/use-toast";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import { useProductPriceTiers } from "@/hooks/useProductPriceTiers";
import { PriceModelType } from "@/types/price-models";
import ProductVariationSelector from "./ProductVariationSelector";
import ProductPriceDisplay from "./ProductPriceDisplay";
import MultipleVariationSelector from "./MultipleVariationSelector";
import VariationModeSelector from "./VariationModeSelector";
import { formatCurrency } from "@/lib/utils";

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, variation?: any) => void;
  catalogType: CatalogType;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  catalogType,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [selectionMode, setSelectionMode] = useState<'single' | 'multiple'>('single');
  const { variations, loading: variationsLoading } = useProductVariations(product?.id);
  const { priceModel, loading: priceModelLoading } = useStorePriceModel(product?.store_id);
  const { tiers } = useProductPriceTiers(product?.id, {
    wholesale_price: product?.wholesale_price,
    min_wholesale_qty: product?.min_wholesale_qty,
    retail_price: product?.retail_price,
  });
  const { toast } = useToast();
  
  const modelKey = priceModel?.price_model || ("retail_only" as PriceModelType);

  // Verificar se produto tem variações
  const hasVariations = useMemo(() => {
    return variations.length > 0;
  }, [variations]);

  // Calcular informações sobre variações
  const variationInfo = useMemo(() => {
    if (variations.length === 0) return null;

    const colors = [...new Set(variations.filter(v => v.color).map(v => v.color))];
    const sizes = [...new Set(variations.filter(v => v.size).map(v => v.size))];
    const grades = variations.filter(v => v.is_grade || v.variation_type === 'grade');

    return {
      hasColors: colors.length > 0,
      hasSizes: sizes.length > 0,
      hasGrades: grades.length > 0,
      colorCount: colors.length,
      sizeCount: sizes.length,
      gradeCount: grades.length,
      totalVariations: variations.length,
      colors,
      sizes,
      grades,
    };
  }, [variations]);

  // Calcular preço usando o hook de cálculo de preços
  const priceCalculation = usePriceCalculation(product?.store_id || '', {
    product_id: product?.id || '',
    retail_price: product?.retail_price || 0,
    wholesale_price: product?.wholesale_price,
    min_wholesale_qty: product?.min_wholesale_qty,
    quantity,
    price_tiers: product?.enable_gradual_wholesale ? tiers : [],
    enable_gradual_wholesale: product?.enable_gradual_wholesale,
  });

  // Determinar quantidade mínima baseada no modelo de preço
  const minQuantity = useMemo(() => {
    if (!product) return 1;
    
    if (modelKey === "wholesale_only") {
      return product.min_wholesale_qty || 1;
    }
    return 1;
  }, [modelKey, product?.min_wholesale_qty]);

  // Resetar estado quando o produto muda
  useEffect(() => {
    if (product && modelKey === "wholesale_only") {
      setQuantity(Math.max(minQuantity, 1));
    } else {
      setQuantity(1);
    }
    setSelectedVariation(null);
    setSelectionMode('single');
  }, [product?.id, modelKey, minQuantity]);

  const handleSingleVariationAdd = useCallback(() => {
    if (!product) return;
    
    // Verificar se precisa de variação
    if (hasVariations && !selectedVariation) {
      toast({
        title: "Selecione uma variação",
        description: "Este produto possui variações. Selecione uma opção antes de adicionar ao carrinho.",
        variant: "destructive",
      });
      return;
    }

    // Verificar estoque da variação ou produto
    const availableStock = selectedVariation ? selectedVariation.stock : product.stock;
    if (!product.allow_negative_stock && availableStock < quantity) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${availableStock} unidades disponíveis.`,
        variant: "destructive",
      });
      return;
    }

    // Garantir quantidade mínima para wholesale_only
    let finalQuantity = quantity;
    if (modelKey === "wholesale_only") {
      finalQuantity = Math.max(quantity, minQuantity);
    }

    // Produto com configurações de modelo de preço
    const productWithModel = {
      ...product,
      allow_negative_stock: product.allow_negative_stock || false,
      price_model: modelKey,
      enable_gradual_wholesale: product.enable_gradual_wholesale || false,
    };

    onAddToCart(productWithModel, finalQuantity, selectedVariation);
    onClose();

    toast({
      title: "Produto adicionado!",
      description: `${finalQuantity} unidade(s) adicionada(s) ao carrinho.`,
    });
  }, [product, quantity, selectedVariation, hasVariations, modelKey, minQuantity, onAddToCart, onClose, toast]);

  const handleMultipleVariationAdd = useCallback((selections: any[]) => {
    if (!product) return;
    
    // Adicionar cada seleção ao carrinho
    selections.forEach(selection => {
      const productWithModel = {
        ...product,
        allow_negative_stock: product.allow_negative_stock || false,
        price_model: modelKey,
        enable_gradual_wholesale: product.enable_gradual_wholesale || false,
      };
      
      onAddToCart(productWithModel, selection.quantity, selection.variation);
    });

    onClose();

    const totalItems = selections.reduce((total, sel) => total + sel.quantity, 0);
    toast({
      title: "Produtos adicionados!",
      description: `${totalItems} itens de ${selections.length} variações adicionados ao carrinho.`,
    });
  }, [product, modelKey, onAddToCart, onClose, toast]);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (!product) return;
    
    const finalQuantity = Math.max(newQuantity, minQuantity);
    setQuantity(finalQuantity);
  }, [minQuantity]);

  // Se não há produto, não renderizar o modal
  if (!product) {
    return null;
  }

  const loading = priceModelLoading || variationsLoading;
  const canAddMore = selectedVariation ? 
    (selectedVariation.stock > quantity || product.allow_negative_stock) :
    (product.stock > quantity || product.allow_negative_stock);
  const canDecrease = quantity > minQuantity;

  // Verificar se pode adicionar ao carrinho (só para modo single)
  const canAddToCart = !hasVariations || (selectionMode === 'single' && selectedVariation);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="line-clamp-1">{product.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {(selectedVariation?.image_url || product.image_url) ? (
              <img
                src={selectedVariation?.image_url || product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span>Sem imagem</span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            {/* Category and SKU */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.category && (
                <Badge variant="outline">{product.category}</Badge>
              )}
              {selectedVariation?.sku && (
                <Badge variant="outline" className="text-xs">
                  SKU: {selectedVariation.sku}
                </Badge>
              )}
              {modelKey === "wholesale_only" && (
                <Badge className="bg-orange-500 text-white">
                  Apenas Atacado
                </Badge>
              )}
            </div>

            {/* Variation Summary */}
            {variationInfo && (
              <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {variationInfo.totalVariations} Variações Disponíveis
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {variationInfo.hasColors && (
                    <div className="flex items-center gap-1">
                      <Palette className="h-3 w-3 text-blue-500" />
                      <span>{variationInfo.colorCount} cores</span>
                    </div>
                  )}
                  {variationInfo.hasSizes && (
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3 text-green-500" />
                      <span>{variationInfo.sizeCount} tamanhos</span>
                    </div>
                  )}
                  {variationInfo.hasGrades && (
                    <div className="flex items-center gap-1">
                      <Layers className="h-3 w-3 text-purple-500" />
                      <span>{variationInfo.gradeCount} grades</span>
                    </div>
                  )}
                </div>

                {/* Preview das primeiras variações */}
                {variationInfo.colors.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-700">Cores disponíveis:</span>
                    <div className="flex flex-wrap gap-1">
                      {variationInfo.colors.slice(0, 5).map((color, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {color}
                        </Badge>
                      ))}
                      {variationInfo.colors.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{variationInfo.colors.length - 5} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {variationInfo.sizes.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-700">Tamanhos disponíveis:</span>
                    <div className="flex flex-wrap gap-1">
                      {variationInfo.sizes.slice(0, 5).map((size, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {size}
                        </Badge>
                      ))}
                      {variationInfo.sizes.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{variationInfo.sizes.length - 5} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-gray-600 text-sm">{product.description}</p>
            )}

            {/* Price Display */}
            {loading ? (
              <div className="text-gray-500">Carregando preços...</div>
            ) : (
              <ProductPriceDisplay
                storeId={product.store_id}
                productId={product.id}
                retailPrice={product.retail_price}
                wholesalePrice={product.wholesale_price}
                minWholesaleQty={product.min_wholesale_qty}
                quantity={quantity}
                priceTiers={product.enable_gradual_wholesale ? tiers : []}
                catalogType={catalogType}
                showSavings={true}
                showNextTierHint={true}
                showTierName={true}
                size="lg"
              />
            )}

            {/* Stock Information */}
            <div className="text-sm">
              {selectedVariation ? (
                <div className="flex items-center gap-2">
                  <span className={selectedVariation.stock > 0 ? "text-green-600" : "text-red-600"}>
                    {selectedVariation.stock > 0 ? 
                      `${selectedVariation.stock} em estoque` : 
                      "Produto esgotado"
                    }
                  </span>
                  {product.allow_negative_stock && selectedVariation.stock === 0 && (
                    <Badge variant="outline" className="text-xs">
                      Aceita pedido sem estoque
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={product.stock > 0 ? "text-green-600" : "text-red-600"}>
                    {product.stock > 0 ? 
                      `${product.stock} em estoque` : 
                      "Produto esgotado"
                    }
                  </span>
                  {product.allow_negative_stock && product.stock === 0 && (
                    <Badge variant="outline" className="text-xs">
                      Aceita pedido sem estoque
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Variation Selection */}
            {hasVariations && (
              <div className="space-y-4">
                {/* Mode Selector */}
                <VariationModeSelector
                  mode={selectionMode}
                  onModeChange={setSelectionMode}
                  variationCount={variations.length}
                />

                <Separator />

                {/* Variation Selectors */}
                {selectionMode === 'single' ? (
                  <div className="space-y-4">
                    <ProductVariationSelector
                      variations={variations}
                      selectedVariation={selectedVariation}
                      onVariationChange={setSelectedVariation}
                      loading={variationsLoading}
                    />
                    
                    {/* Validation Message */}
                    {!selectedVariation && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-800">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Selecione uma variação para continuar
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Quantity Selector for Single Mode */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Quantidade</label>
                        {modelKey === "wholesale_only" && product.min_wholesale_qty && (
                          <div className="text-xs text-orange-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>Mín: {product.min_wholesale_qty} un.</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={!canDecrease}
                          className="h-10 w-10 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="text-lg font-medium">{quantity}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={!canAddMore}
                          className="h-10 w-10 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Add to Cart for Single Mode */}
                    <Button
                      onClick={handleSingleVariationAdd}
                      disabled={!canAddToCart || (!product.allow_negative_stock && 
                        ((selectedVariation && selectedVariation.stock === 0) || 
                         (!selectedVariation && product.stock === 0)))}
                      className="w-full"
                      size="lg"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {selectedVariation ? 
                        `Adicionar ao Carrinho - ${formatCurrency(priceCalculation.price * quantity)}` :
                        'Selecione uma variação'
                      }
                    </Button>
                  </div>
                ) : (
                  /* Multiple Selection Mode */
                  <MultipleVariationSelector
                    product={product}
                    variations={variations}
                    onAddToCart={handleMultipleVariationAdd}
                    catalogType={catalogType}
                  />
                )}
              </div>
            )}

            {/* For products without variations, show quantity and add to cart */}
            {!hasVariations && (
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Quantidade</label>
                    {modelKey === "wholesale_only" && product.min_wholesale_qty && (
                      <div className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Mín: {product.min_wholesale_qty} un.</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={!canDecrease}
                      className="h-10 w-10 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center">
                      <span className="text-lg font-medium">{quantity}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={!canAddMore}
                      className="h-10 w-10 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Add to Cart */}
                <Button
                  onClick={handleSingleVariationAdd}
                  disabled={(!product.allow_negative_stock && product.stock === 0)}
                  className="w-full"
                  size="lg"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Adicionar ao Carrinho - {formatCurrency(priceCalculation.price * quantity)}
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Favoritar
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
