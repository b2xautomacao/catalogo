import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Heart,
  Plus,
  Minus,
  X,
  Share2,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Product } from "@/types/product";
import { ProductVariation } from "@/types/variation";
import { useToast } from "@/hooks/use-toast";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import { useProductPriceTiers } from "@/hooks/useProductPriceTiers";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { useProductVariations } from "@/hooks/useProductVariations";
import { formatCurrency } from "@/lib/utils";
import ProductPriceDisplay from "./ProductPriceDisplay";
import GradePriceDisplay from "./GradePriceDisplay";
import VariationSelectionAlert from "./VariationSelectionAlert";
import MultipleVariationSelector from "./MultipleVariationSelector";
import { useCart } from "@/hooks/useCart";

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    variation?: ProductVariation
  ) => void;
  catalogType: "retail" | "wholesale";
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  catalogType,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] =
    useState<ProductVariation | null>(null);
  const [selectionMode, setSelectionMode] = useState<"single" | "multiple">(
    "single"
  );
  const { toast } = useToast();
  const { addItem } = useCart();

  // 🎯 CORRIGIDO: Hooks para cálculo de preços
  const priceCalculation = usePriceCalculation(
    product?.store_id || "",
    {
      product_id: product?.id || "",
      retail_price: product?.retail_price || 0,
      wholesale_price: product?.wholesale_price || 0,
      min_wholesale_qty: product?.min_wholesale_qty || 0,
      quantity,
      price_tiers: [],
      enable_gradual_wholesale: product?.enable_gradual_wholesale || false,
    }
  );

  const { tiers } = useProductPriceTiers(
    product?.id || "",
    {
      wholesale_price: product?.wholesale_price,
      min_wholesale_qty: product?.min_wholesale_qty,
      retail_price: product?.retail_price,
    }
  );

  const { priceModel } = useStorePriceModel(product?.store_id || "");
  const { variations, loading: variationsLoading } = useProductVariations(
    product?.id || ""
  );

  // 🎯 CORRIGIDO: Calcular quantidade mínima baseada no modelo de preço
  const minQuantity = useMemo(() => {
    if (priceModel?.price_model === "wholesale_only" && product?.min_wholesale_qty) {
      return product.min_wholesale_qty;
    }
    return 1;
  }, [priceModel?.price_model, product?.min_wholesale_qty]);

  // 🎯 CORRIGIDO: Verificar se tem variações
  const hasVariations = useMemo(() => {
    return variations && variations.length > 0;
  }, [variations]);

  // 🎯 CORRIGIDO: Informações sobre variações
  const variationInfo = useMemo(() => {
    if (!variations || variations.length === 0) return null;

    const colors = [
      ...new Set(variations.filter((v) => v.color).map((v) => v.color)),
    ];
    const sizes = [
      ...new Set(variations.filter((v) => v.size).map((v) => v.size)),
    ];
    const grades = variations.filter(
      (v) => v.is_grade || v.variation_type === "grade"
    );

    return {
      totalVariations: variations.length,
      hasColors: colors.length > 0,
      hasSizes: sizes.length > 0,
      hasGrades: grades.length > 0,
      colorCount: colors.length,
      sizeCount: sizes.length,
      gradeCount: grades.length,
    };
  }, [variations]);

  // 🎯 CORRIGIDO: Resetar quantidade quando produto mudar
  useEffect(() => {
    if (product?.id) {
      setQuantity(minQuantity);
      setSelectedVariation(null);
    }
  }, [product?.id, minQuantity]);

  // 🎯 CORRIGIDO: Função para adicionar produto único ao carrinho
  const handleSingleVariationAdd = useCallback(() => {
    if (!product) return;

    // Verificar se precisa de variação
    if (hasVariations && !selectedVariation) {
      toast({
        title: "Selecione uma variação",
        description:
          "Este produto possui variações. Selecione uma opção antes de adicionar ao carrinho.",
        variant: "destructive",
      });
      return;
    }

    // Verificar estoque da variação ou produto
    const availableStock = selectedVariation
      ? selectedVariation.stock
      : product?.stock || 0;
    if (!product?.allow_negative_stock && availableStock < quantity) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${availableStock} unidades disponíveis.`,
        variant: "destructive",
      });
      return;
    }

    // Garantir quantidade mínima para wholesale_only
    let finalQuantity = quantity;
    if (priceModel?.price_model === "wholesale_only") {
      finalQuantity = Math.max(quantity, minQuantity);
    }

    // 🎯 CORRIGIDO: Para produtos com grade, ajustar o preço
    let productWithModel = {
      ...product,
      allow_negative_stock: product?.allow_negative_stock || false,
      price_model: priceModel?.price_model,
      enable_gradual_wholesale: product?.enable_gradual_wholesale || false,
    };

    // Se for produto com grade, calcular o preço total da grade
    if (hasVariations && variationInfo?.hasGrades && selectedVariation) {
      const pricePerPair = product?.wholesale_price || product?.retail_price || 0;
      const totalGradePrice = pricePerPair * (selectedVariation.grade_quantity || 0);
      const finalGradeTotalPrice = totalGradePrice * finalQuantity; // finalQuantity = número de grades

      productWithModel = {
        ...productWithModel,
        // 🎯 IMPORTANTE: Sobrescrever o preço para o preço total das grades
        retail_price: finalGradeTotalPrice,
        wholesale_price: finalGradeTotalPrice,
      };

      console.log("🎯 GRADE - Preço ajustado para carrinho:", {
        originalPrice: product?.retail_price,
        pricePerPair,
        gradeQuantity: selectedVariation.grade_quantity,
        totalGradePrice,
        numberOfGrades: finalQuantity,
        finalGradeTotalPrice,
      });
    }

    onAddToCart(productWithModel, finalQuantity, selectedVariation);
    onClose();

    toast({
      title: "Produto adicionado!",
      description:
        hasVariations && variationInfo?.hasGrades
          ? `${finalQuantity} grade${finalQuantity > 1 ? 's' : ''} de ${
              selectedVariation?.grade_quantity || 0
            } pares adicionada${finalQuantity > 1 ? 's' : ''} ao carrinho.`
          : `${finalQuantity} unidade(s) adicionada(s) ao carrinho.`,
    });
  }, [
    product?.id,
    quantity,
    selectedVariation?.id,
    hasVariations,
    priceModel?.price_model,
    minQuantity,
    onAddToCart,
    onClose,
    toast,
    variationInfo?.hasGrades,
  ]);

  // 🎯 CORRIGIDO: Função para adicionar múltiplas variações
  const handleMultipleVariationAdd = useCallback(
    (selections: any[]) => {
      if (!product) return;

      // Adicionar cada seleção ao carrinho
      selections.forEach((selection) => {
        let productWithModel = {
          ...product,
          allow_negative_stock: product?.allow_negative_stock || false,
          price_model: priceModel?.price_model,
          enable_gradual_wholesale: product?.enable_gradual_wholesale || false,
        };

        // 🎯 CORRIGIDO: Para produtos com grade, ajustar o preço
        if (hasVariations && variationInfo?.hasGrades && selection.variation) {
          const pricePerPair = product?.wholesale_price || product?.retail_price || 0;
          const totalGradePrice = pricePerPair * (selection.variation.grade_quantity || 0);
          const finalGradeTotalPrice = totalGradePrice * selection.quantity; // selection.quantity = número de grades

          productWithModel = {
            ...productWithModel,
            // 🎯 IMPORTANTE: Sobrescrever o preço para o preço total das grades
            retail_price: finalGradeTotalPrice,
            wholesale_price: finalGradeTotalPrice,
          };
        }

        onAddToCart(productWithModel, selection.quantity, selection.variation);
      });

      onClose();

      const totalItems = selections.reduce(
        (total, sel) => total + sel.quantity,
        0
      );

      // 🎯 Melhorar descrição para produtos com grade
      const hasGrades = selections.some((sel) => sel.variation?.is_grade);
      const description = hasGrades
        ? `${selections.length} grade(s) adicionada(s) ao carrinho.`
        : `${totalItems} itens de ${selections.length} variações adicionados ao carrinho.`;

      toast({
        title: "Produtos adicionados!",
        description,
      });
    },
    [
      product?.id,
      priceModel?.price_model,
      onAddToCart,
      onClose,
      toast,
      hasVariations,
      variationInfo?.hasGrades,
    ]
  );

  // 🎯 CORRIGIDO: Função para alterar quantidade
  const handleQuantityChange = useCallback(
    (newQuantity: number) => {
      if (!product) return;

      // 🎯 MELHORADO: Permitir quantidade maior que estoque se allow_negative_stock
      const availableStock = selectedVariation
        ? selectedVariation.stock
        : product?.stock || 0;
      const maxQuantity = product?.allow_negative_stock ? 999 : availableStock;

      const finalQuantity = Math.max(newQuantity, minQuantity);
      const clampedQuantity = Math.min(finalQuantity, maxQuantity);

      console.log(
        `🔄 Quantidade alterada: ${newQuantity} → ${clampedQuantity} (estoque: ${availableStock}, min: ${minQuantity})`
      );
      setQuantity(clampedQuantity);
    },
    [minQuantity, product?.allow_negative_stock, selectedVariation?.id]
  );

  // 🎯 CORRIGIDO: Função para calcular preço total
  const getTotalPrice = useCallback(() => {
    if (!product) return 0;

    if (hasVariations && variationInfo?.hasGrades && selectedVariation) {
      // Para produtos com grade, multiplicar o preço total da grade pela quantidade de grades
      const pricePerPair = product?.wholesale_price || product?.retail_price || 0;
      const totalGradePrice = pricePerPair * (selectedVariation.grade_quantity || 0);
      const totalPrice = totalGradePrice * quantity; // quantity = número de grades
      
      console.log("🎯 GRADE - Cálculo do preço total:", {
        pricePerPair,
        gradeQuantity: selectedVariation.grade_quantity,
        totalGradePrice,
        quantity, // número de grades
        totalPrice,
        hasVariations,
        hasGrades: variationInfo?.hasGrades,
        selectedVariation: selectedVariation?.id,
      });
      
      return totalPrice;
    } else {
      // Para produtos normais, multiplicar pela quantidade
      const basePrice = priceCalculation?.price || product?.retail_price || 0;
      const totalPrice = basePrice * quantity;
      
      console.log("🎯 NORMAL - Cálculo do preço total:", {
        basePrice,
        quantity,
        totalPrice,
      });
      
      return totalPrice;
    }
  }, [
    hasVariations,
    variationInfo?.hasGrades,
    selectedVariation?.id,
    product?.wholesale_price,
    product?.retail_price,
    priceCalculation?.price,
    quantity,
  ]);

  // 🎯 CORRIGIDO: Permitir adicionar mais itens mesmo com estoque limitado
  const availableStock = selectedVariation
    ? selectedVariation.stock
    : product?.stock || 0;
  const canAddMore = product?.allow_negative_stock || availableStock > quantity;
  const canDecrease = quantity > minQuantity;

  // Verificar se pode adicionar ao carrinho (só para modo single)
  const canAddToCart =
    !hasVariations || (selectionMode === "single" && selectedVariation);
  const isOutOfStock = selectedVariation
    ? selectedVariation.stock === 0 && !product?.allow_negative_stock
    : (product?.stock || 0) === 0 && !product?.allow_negative_stock;

  // Se não há produto, não renderizar o modal
  if (!product) {
    return null;
  }

  const loading = variationsLoading;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isOpen ? "block" : "hidden"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Detalhes do Produto</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Product Images */}
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            <img
              src={product.image_url || "/placeholder-product.jpg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold">{product.name}</h3>

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
              {priceModel?.price_model === "wholesale_only" && (
                <Badge className="bg-orange-500 text-white">
                  Apenas Atacado
                </Badge>
              )}
            </div>

            {/* Variation Summary */}
            {variationInfo && (
              <VariationSelectionAlert
                type="info"
                variationCount={variationInfo.totalVariations}
                hasGrades={variationInfo.hasGrades}
                hasColors={variationInfo.hasColors}
                hasSizes={variationInfo.hasSizes}
                title="Produto com múltiplas opções"
                description={`${
                  variationInfo.totalVariations
                } variações disponíveis. ${
                  variationInfo.hasGrades ? "Inclui grades completas. " : ""
                }${
                  variationInfo.hasColors
                    ? `${variationInfo.colorCount} cores diferentes. `
                    : ""
                }${
                  variationInfo.hasSizes
                    ? `${variationInfo.sizeCount} tamanhos variados.`
                    : ""
                }`}
              />
            )}

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                {/* Desktop: Descrição completa */}
                <div className="hidden md:block">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Mobile: Descrição responsiva com toggle */}
                <div className="md:hidden">
                  <div className="space-y-2">
                    <p
                      id="product-description-mobile"
                      className="text-gray-600 text-sm leading-relaxed line-clamp-3 transition-all duration-200"
                    >
                      {product.description}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary text-xs p-0 h-auto font-medium hover:underline"
                      onClick={() => {
                        const element = document.getElementById(
                          "product-description-mobile"
                        );
                        if (element) {
                          const isExpanded =
                            !element.classList.contains("line-clamp-3");
                          if (isExpanded) {
                            element.classList.add("line-clamp-3");
                            element.classList.remove("line-clamp-none");
                          } else {
                            element.classList.remove("line-clamp-3");
                            element.classList.add("line-clamp-none");
                          }
                        }
                      }}
                    >
                      Ver mais detalhes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Price Display */}
            {loading ? (
              <div className="text-gray-500">Carregando preços...</div>
            ) : hasVariations && variationInfo?.hasGrades ? (
              // 🎯 Produto com Grade - Usar GradePriceDisplay
              <GradePriceDisplay
                retailPrice={product.retail_price}
                wholesalePrice={product.wholesale_price}
                minWholesaleQty={product.min_wholesale_qty}
                gradeSizes={variations[0]?.grade_sizes || []}
                gradePairs={variations[0]?.grade_pairs || []}
                gradeQuantity={variations[0]?.grade_quantity || 0}
                size="lg"
                showGradeBreakdown={true}
                selectedQuantity={quantity}
              />
            ) : (
              // 🎯 Produto Normal - Usar ProductPriceDisplay
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
                  <span
                    className={
                      selectedVariation.stock > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {selectedVariation.stock > 0
                      ? `${selectedVariation.stock} em estoque`
                      : "Produto esgotado"}
                  </span>
                  {product.allow_negative_stock &&
                    selectedVariation.stock === 0 && (
                      <Badge variant="outline" className="text-xs">
                        Aceita pedido sem estoque
                      </Badge>
                    )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className={
                      product.stock > 0 ? "text-green-600" : "text-red-600"
                    }
                  >
                    {product.stock > 0
                      ? `${product.stock} em estoque`
                      : "Produto esgotado"}
                  </span>
                  {product.allow_negative_stock && product.stock === 0 && (
                    <Badge variant="outline" className="text-xs">
                      Aceita pedido sem estoque
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Section */}
          {!isOutOfStock && (
            <div className="space-y-4 pt-4 border-t">
              {/* 🎯 RESTAURADO: Seletor de Modo (Single/Multiple) */}
              {hasVariations && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Modo de Seleção:
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        selectionMode === "single" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectionMode("single")}
                      className="flex-1"
                    >
                      Seleção Única
                    </Button>
                    <Button
                      variant={
                        selectionMode === "multiple" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectionMode("multiple")}
                      className="flex-1"
                    >
                      Seleção Múltipla
                    </Button>
                  </div>
                </div>
              )}

              {selectionMode === "single" ? (
                /* Single Selection Mode */
                <div className="space-y-4">
                  {/* Variation Selector */}
                  {hasVariations && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Selecione uma variação:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {variations.map((variation) => (
                          <Button
                            key={variation.id}
                            variant={
                              selectedVariation?.id === variation.id
                                ? "outline"
                                : "outline"
                            }
                            onClick={() => setSelectedVariation(variation)}
                            className={`h-auto p-3 text-left transition-all duration-200 ${
                              selectedVariation?.id === variation.id
                                ? "border-2 border-primary bg-primary/10 text-primary shadow-sm"
                                : "hover:bg-muted/50 border border-border"
                            }`}
                            disabled={
                              variation.stock === 0 &&
                              !product.allow_negative_stock
                            }
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-medium">
                                {variation.color || variation.size || "Padrão"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {variation.stock > 0
                                  ? `${variation.stock} disponível`
                                  : "Esgotado"}
                              </span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity Selector for Single Mode */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        {hasVariations && variationInfo?.hasGrades ? "Quantidade de Grades:" : "Quantidade"}
                      </label>
                      {priceModel?.price_model === "wholesale_only" &&
                        product.min_wholesale_qty && (
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
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => {
                            const newQty =
                              parseInt(e.target.value) || minQuantity;
                            handleQuantityChange(newQty);
                          }}
                          className="w-20 h-10 text-center text-lg font-medium"
                          min={minQuantity}
                          max={
                            product.allow_negative_stock
                              ? 999
                              : selectedVariation
                              ? selectedVariation.stock
                              : product.stock
                          }
                        />
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
                    disabled={!canAddToCart || isOutOfStock}
                    className={`w-full transition-all duration-200 ${
                      canAddToCart && !isOutOfStock ? "hover:scale-[1.02]" : ""
                    }`}
                    size="lg"
                  >
                    {!canAddToCart ? (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Selecione uma variação
                      </>
                    ) : isOutOfStock ? (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Produto esgotado
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Adicionar ao Carrinho -{" "}
                        {formatCurrency(getTotalPrice())}
                      </>
                    )}
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
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;
