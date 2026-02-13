import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Heart,
  Package,
  Truck,
  Shield,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  ChevronRight,
  Share2,
  MessageCircle,
  Star,
  MapPin,
  Clock,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Product, ProductVariation } from "@/types/product";
import { CatalogType } from "@/hooks/useCatalog";
import ProductImageGallery from "@/components/products/ProductImageGallery";
import HierarchicalColorSizeSelector from "./HierarchicalColorSizeSelector";
import ProductVariationSelector from "@/components/catalog/ProductVariationSelector";
import { useProductDisplayPrice } from "@/hooks/useProductDisplayPrice";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { createCartItem } from "@/utils/cartHelpers";
import { useCart } from "@/hooks/useCart";
import type { CustomGradeSelection } from "@/types/flexible-grade";

// Componente para exibir imagem do produto relacionado
const RelatedProductImage: React.FC<{
  productId: string;
  productName: string;
}> = ({ productId, productName }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const { data: productImages } = await supabase
          .from("product_images")
          .select("image_url")
          .eq("product_id", productId)
          .order("is_primary", { ascending: false })
          .order("image_order", { ascending: true })
          .limit(1);

        if (productImages && productImages.length > 0) {
          setImageUrl(productImages[0].image_url);
        }
      } catch (error) {
        console.error("Erro ao carregar imagem:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchImage();
    }
  }, [productId]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <Package className="h-8 w-8 text-gray-400 animate-pulse" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <Package className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={productName}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
        const placeholder = target.nextElementSibling as HTMLElement;
        if (placeholder) placeholder.style.display = "flex";
      }}
    />
  );
};

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity?: number,
    variation?: ProductVariation
  ) => void;
  catalogType: CatalogType;
  showStock?: boolean;
  showPrices?: boolean;
  storeName?: string;
  storePhone?: string;
  relatedProducts?: Product[];
}

interface VariationSelection {
  variation: ProductVariation;
  quantity: number;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  catalogType,
  showStock = true,
  showPrices = true,
  storeName = "",
  storePhone = "",
  relatedProducts = [],
}) => {
  const { toast } = useToast();
  const { addItem } = useCart();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedVariation, setSelectedVariation] =
    useState<ProductVariation | null>(null);
  const [quickAddItems, setQuickAddItems] = useState<VariationSelection[]>([]);
  const [isGradeSelected, setIsGradeSelected] = useState(false);
  // 🔴 NOVO: Estado para grade flexível
  const [flexibleGradeMode, setFlexibleGradeMode] = useState<'full' | 'half' | 'custom'>('full');
  const [customGradeSelection, setCustomGradeSelection] = useState<CustomGradeSelection | null>(null);

  // Usar um produto "vazio" para manter consistência dos hooks
  const safeProduct =
    product ||
    ({
      id: "",
      name: "",
      retail_price: 0,
      wholesale_price: 0,
      min_wholesale_qty: 1,
      store_id: "",
    } as Product);

  const priceInfo = useProductDisplayPrice({
    product: safeProduct,
    catalogType,
    quantity: 1,
  });

  // Early return apenas após todos os hooks
  if (!product || !isOpen) {
    return null;
  }

  const price = priceInfo.displayPrice;
  const minQuantity = priceInfo.minQuantity;

  // Detectar se há variações de grade
  const hasVariations = product.variations && product.variations.length > 0;
  const hasGradeVariations =
    hasVariations &&
    product.variations?.some((v) => v.is_grade || v.variation_type === "grade");

  // Debug para variações
  console.log("🔍 ProductDetailsModal - Debug variações:", {
    productName: product.name,
    hasVariations,
    variationsCount: product.variations?.length || 0,
    hasGradeVariations,
    variations: product.variations?.map((v) => ({
      id: v.id,
      color: v.color,
      size: v.size,
      is_grade: v.is_grade,
      variation_type: v.variation_type,
      grade_name: v.grade_name,
      grade_sizes: v.grade_sizes,
      grade_pairs: v.grade_pairs,
      // Debug: verificar todos os campos disponíveis
      allFields: Object.keys(v),
      // Debug: verificar valores específicos
      rawData: v,
    })),
  });

  // Debug adicional: verificar se o produto tem as variações corretas
  console.log("🔍 ProductDetailsModal - Debug produto completo:", {
    productId: product.id,
    productName: product.name,
    productKeys: Object.keys(product),
    variationsRaw: product.variations,
    firstVariation: product.variations?.[0],
  });

  const handleQuickAdd = (
    variation: ProductVariation,
    quantity: number = minQuantity
  ) => {
    console.log("🚀 ProductDetailsModal - handleQuickAdd CHAMADO:", {
      variationId: variation.id,
      variationColor: variation.color,
      isGrade: variation.is_grade,
      gradeName: variation.grade_name,
    });

    // Para produtos com grade, quantidade sempre é 1 (1 grade completa)
    const finalQuantity = variation.is_grade ? 1 : quantity;

    console.log("🛒 ProductDetailsModal - handleQuickAdd:", {
      productName: product.name,
      variationId: variation.id,
      variationColor: variation.color,
      variationIsGrade: variation.is_grade,
      variationGradeName: variation.grade_name,
      variationGradePairs: variation.grade_pairs,
      variationGradeSizes: variation.grade_sizes,
      quantityOriginal: quantity,
      quantityFinal: finalQuantity,
      catalogType,
      basePrice:
        catalogType === "wholesale"
          ? product.wholesale_price || product.retail_price || 0
          : product.retail_price || 0,
      // Debug completo da variação
      variationComplete: {
        id: variation.id,
        color: variation.color,
        size: variation.size,
        is_grade: variation.is_grade,
        grade_name: variation.grade_name,
        grade_color: variation.grade_color,
        grade_quantity: variation.grade_quantity,
        grade_sizes: variation.grade_sizes,
        grade_pairs: variation.grade_pairs,
        variation_type: variation.variation_type,
        stock: variation.stock,
        price_adjustment: variation.price_adjustment,
      },
    });

    onAddToCart(product, finalQuantity, variation);

    toast({
      title: "Adicionado ao carrinho!",
      description: `${finalQuantity}x ${variation.color || ""} ${
        variation.size || ""
      }${
        variation.is_grade ? ` (${variation.grade_name || "Grade"})` : ""
      } adicionado.`,
    });

    // Adicionar ao preview local
    setQuickAddItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.variation.id === variation.id
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { variation, quantity }];
    });
  };

  const handleMultipleAddToCart = (selections: VariationSelection[]) => {
    if (selections.length === 0) return;

    selections.forEach(({ variation, quantity }) => {
      onAddToCart(product, quantity, variation);
    });

    toast({
      title: "Produtos adicionados!",
      description: `${selections.length} variações adicionadas ao carrinho.`,
    });

    onClose();
  };

  const handleSingleVariationAddToCart = (variation: ProductVariation) => {
    // Para produtos com grade, quantidade sempre é 1 (1 grade completa)
    const finalQuantity = variation.is_grade ? 1 : minQuantity;

    // 🔴 NOVO: Se for grade flexível, usar createCartItem diretamente com flexibleGradeMode
    if (variation.is_grade && variation.flexible_grade_config) {
      const cartItem = createCartItem(
        product,
        catalogType,
        finalQuantity,
        variation,
        flexibleGradeMode,
        customGradeSelection ? {
          items: customGradeSelection.items.map(item => ({
            color: item.color || '',
            size: item.size || '',
            quantity: item.quantity || 0,
          })),
          totalPairs: customGradeSelection.totalPairs || 0,
        } : undefined
      );
      
      addItem(cartItem);
      
      toast({
        title: "Adicionado ao carrinho!",
        description: `${variation.color || ""} ${
          variation.size || ""
        }${
          variation.is_grade 
            ? ` (${variation.grade_name || "Grade"}${flexibleGradeMode === 'half' ? ' - Meia Grade' : flexibleGradeMode === 'custom' ? ' - Personalizada' : ''})` 
            : ""
        } adicionado.`,
      });
      return;
    }

    onAddToCart(product, finalQuantity, variation);

    toast({
      title: "Produto adicionado!",
      description: `${finalQuantity}x ${variation.color || ""} ${
        variation.size || ""
      }${
        variation.is_grade ? ` (${variation.grade_name || "Grade"})` : ""
      } adicionado.`,
    });

    onClose();
  };

  const handleSimpleAddToCart = () => {
    onAddToCart(product, minQuantity);

    toast({
      title: "Produto adicionado!",
      description: `${minQuantity}x ${product.name} adicionado ao carrinho.`,
    });

    onClose();
  };

  // Função para compartilhar no WhatsApp
  const handleWhatsAppShare = () => {
    const productUrl = window.location.origin + window.location.pathname;
    const message = `Olha esse produto incrível que encontrei na ${storeName}!\n\n*${
      product.name
    }*${
      showPrices ? `\nPreço: ${formatCurrency(price)}` : ""
    }\n\n${productUrl}`;

    if (storePhone) {
      const whatsappUrl = `https://wa.me/${storePhone.replace(
        /\D/g,
        ""
      )}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    }

    toast({
      title: "Compartilhado!",
      description: "Produto compartilhado no WhatsApp.",
    });
  };

  // Função para compartilhar genérico
  const handleShare = async () => {
    const productUrl = window.location.origin + window.location.pathname;
    const shareData = {
      title: product.name,
      text: `Confira este produto: ${product.name}`,
      url: productUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Compartilhado!",
          description: "Produto compartilhado com sucesso.",
        });
      } catch (error) {
        // Fallback para copiar URL
        navigator.clipboard.writeText(productUrl);
        toast({
          title: "Link copiado!",
          description: "Link do produto copiado para a área de transferência.",
        });
      }
    } else {
      // Fallback para copiar URL
      navigator.clipboard.writeText(productUrl);
      toast({
        title: "Link copiado!",
        description: "Link do produto copiado para a área de transferência.",
      });
    }
  };

  const isDescriptionLong =
    product.description && product.description.length > 120;
  const totalQuickAddItems = quickAddItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
        {/* Header Fixo com botão de fechar */}
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10 p-6 pb-4">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-xl md:text-2xl font-bold text-left line-clamp-2 flex-1">
                {product.name}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="flex-shrink-0 h-8 w-8 p-0 hover:bg-muted"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </div>
          </DialogHeader>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="p-6 pt-2">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <span>Catálogo</span>
              <ChevronRight className="h-3 w-3" />
              {product.category && (
                <>
                  <span className="hover:text-foreground cursor-pointer transition-colors">
                    {product.category}
                  </span>
                  <ChevronRight className="h-3 w-3" />
                </>
              )}
              <span className="text-foreground font-medium">
                {product.name}
              </span>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Galeria de Imagens */}
              <div className="order-1">
                <ProductImageGallery
                  productId={product.id || ""}
                  productName={product.name}
                />
              </div>

              {/* Informações do Produto */}
              <div className="order-2 space-y-6">
                {/* Preço e Categoria */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    {showPrices ? (
                      <div className="space-y-1">
                        <div className="text-3xl md:text-4xl font-bold text-primary">
                          {formatCurrency(price)}
                        </div>

                        {/* Mostrar preço original apenas se for diferente e maior que zero */}
                        {priceInfo.shouldShowRetailPrice &&
                          priceInfo.originalPrice !== price &&
                          priceInfo.originalPrice > 0 && (
                            <div className="text-sm text-muted-foreground line-through">
                              Varejo: {formatCurrency(priceInfo.retailPrice)}
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-lg font-medium text-muted-foreground">
                          Entre em contato para preços
                        </div>
                      </div>
                    )}
                    {product.category && (
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        {product.category}
                      </Badge>
                    )}
                  </div>

                  {/* Botões de Compartilhamento */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="flex-1"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                    {storePhone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleWhatsAppShare}
                        className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                    )}
                  </div>

                  {/* Informações de atacado */}
                  {priceInfo.isWholesaleOnly && minQuantity > 1 && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
                      <Package className="h-4 w-4" />
                      <span>Quantidade mínima: {minQuantity} unidades</span>
                    </div>
                  )}

                  {!priceInfo.isWholesaleOnly &&
                    catalogType === "wholesale" &&
                    minQuantity > 1 && (
                      <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
                        <Package className="h-4 w-4" />
                        <span>
                          Quantidade mínima para atacado: {minQuantity} unidades
                        </span>
                      </div>
                    )}
                </div>

                {/* Preview do Carrinho Rápido */}
                {totalQuickAddItems > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-green-700">
                        <ShoppingCart className="inline h-4 w-4 mr-1" />
                        {totalQuickAddItems} itens adicionados
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickAddItems([])}
                        className="text-xs"
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Descrição Compacta */}
                {product.description && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-base">Sobre o produto</h3>
                    <div>
                      <p
                        className={`text-sm text-muted-foreground leading-relaxed ${
                          !showFullDescription && isDescriptionLong
                            ? "line-clamp-2"
                            : ""
                        }`}
                      >
                        {product.description}
                      </p>
                      {isDescriptionLong && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() =>
                            setShowFullDescription(!showFullDescription)
                          }
                          className="h-auto p-0 mt-1 text-xs text-primary hover:text-primary/80"
                        >
                          {showFullDescription ? (
                            <span className="flex items-center gap-1">
                              Ver menos <ChevronUp className="h-3 w-3" />
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              Ver mais <ChevronDown className="h-3 w-3" />
                            </span>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Seletor de Variações */}
                {hasVariations ? (
                  <div className="space-y-4">
                    {hasGradeVariations ? (
                      // Usar ProductVariationSelector para variações de grade
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-base">
                            {isGradeSelected
                              ? "Grade selecionada:"
                              : "Selecione a grade:"}
                          </h4>
                          {isGradeSelected && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsGradeSelected(false);
                                setSelectedVariation(null);
                              }}
                              className="text-xs"
                            >
                              Ver outras grades
                            </Button>
                          )}
                        </div>
                        <ProductVariationSelector
                          variations={
                            isGradeSelected && selectedVariation
                              ? [selectedVariation] // Mostrar apenas a grade selecionada
                              : product.variations || []
                          }
                          selectedVariation={selectedVariation}
                          onVariationChange={(variation) => {
                            setSelectedVariation(variation);
                            setIsGradeSelected(!!variation?.is_grade);
                            // Resetar modo quando variação muda
                            if (variation?.id !== selectedVariation?.id) {
                              setFlexibleGradeMode('full');
                              setCustomGradeSelection(null);
                            }
                          }}
                          basePrice={
                            catalogType === "wholesale"
                              ? product.wholesale_price ||
                                product.retail_price ||
                                0
                              : product.retail_price || 0
                          }
                          showPriceInCards={false}
                          showStock={showStock}
                          // 🔴 NOVO: Passar callbacks para capturar modo de grade flexível
                          onFlexibleGradeModeChange={setFlexibleGradeMode}
                          onCustomSelectionChange={(selection) => {
                            setCustomGradeSelection(selection ? {
                              items: selection.items.map(item => ({
                                color: item.color || '',
                                size: item.size || '',
                                quantity: item.quantity || 0,
                              })),
                              totalPairs: selection.totalPairs || 0,
                            } : null);
                          }}
                        />

                        {/* Card de variação selecionada */}
                        {selectedVariation && selectedVariation.is_grade && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-blue-900 flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Variação Selecionada
                              </h5>
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-800"
                              >
                                {selectedVariation.color || "Grade"}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              {/* Informações básicas */}
                              <div className="space-y-2">
                                <div className="text-sm">
                                  <span className="text-gray-600">SKU:</span>
                                  <span className="ml-2 font-medium">
                                    {selectedVariation.sku ||
                                      selectedVariation.color}
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-600">Grade:</span>
                                  <span className="ml-2 font-medium text-blue-700">
                                    {selectedVariation.grade_name}
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-600">
                                    Estoque:
                                  </span>
                                  <span className="ml-2 font-medium text-green-600">
                                    {selectedVariation.stock} unidades
                                  </span>
                                </div>
                              </div>

                              {/* Preços */}
                              <div className="space-y-2">
                                <div className="text-lg font-bold text-blue-700">
                                  {formatCurrency(
                                    selectedVariation.grade_pairs &&
                                      selectedVariation.grade_sizes
                                      ? (catalogType === "wholesale"
                                          ? product.wholesale_price ||
                                            product.retail_price ||
                                            0
                                          : product.retail_price || 0) *
                                          (Array.isArray(
                                            selectedVariation.grade_pairs
                                          )
                                            ? selectedVariation.grade_pairs.reduce(
                                                (sum: number, pairs: number) =>
                                                  sum + pairs,
                                                0
                                              )
                                            : 0)
                                      : selectedVariation.price_adjustment || 0
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Preço unitário:{" "}
                                  {formatCurrency(
                                    catalogType === "wholesale"
                                      ? product.wholesale_price ||
                                          product.retail_price ||
                                          0
                                      : product.retail_price || 0
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Total de pares:{" "}
                                  {selectedVariation.grade_pairs &&
                                  Array.isArray(selectedVariation.grade_pairs)
                                    ? selectedVariation.grade_pairs.reduce(
                                        (sum: number, pairs: number) =>
                                          sum + pairs,
                                        0
                                      )
                                    : 0}
                                </div>
                              </div>
                            </div>

                            {/* Composição da grade */}
                            {selectedVariation.grade_sizes &&
                              selectedVariation.grade_pairs && (
                                <div className="border-t border-blue-200 pt-3">
                                  <h6 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                                    <Package className="h-3 w-3" />
                                    Composição da Grade:
                                  </h6>
                                  <div className="grid grid-cols-3 gap-2 text-sm">
                                    {Array.isArray(
                                      selectedVariation.grade_sizes
                                    ) &&
                                      Array.isArray(
                                        selectedVariation.grade_pairs
                                      ) &&
                                      selectedVariation.grade_sizes.map(
                                        (size, index) => (
                                          <div
                                            key={index}
                                            className="flex justify-between bg-white rounded px-2 py-1 border"
                                          >
                                            <span className="text-gray-600">
                                              Tamanho {size}:
                                            </span>
                                            <span className="font-medium text-blue-700">
                                              {
                                                selectedVariation.grade_pairs[
                                                  index
                                                ]
                                              }{" "}
                                              pares
                                            </span>
                                          </div>
                                        )
                                      )}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {/* Botões para variação de grade com adição rápida */}
                        <div className="space-y-3 pt-4">
                          <div className="flex gap-2">
                            <Button
                              size="lg"
                              className="flex-1 h-12 text-base"
                              onClick={() =>
                                selectedVariation &&
                                handleSingleVariationAddToCart(
                                  selectedVariation
                                )
                              }
                              disabled={!selectedVariation}
                            >
                              <ShoppingCart className="h-5 w-5 mr-2" />
                              Adicionar e Fechar
                            </Button>

                            <Button
                              variant="outline"
                              size="lg"
                              className="h-12 px-4"
                              onClick={() =>
                                selectedVariation &&
                                handleQuickAdd(selectedVariation)
                              }
                              disabled={!selectedVariation}
                              title="Adicionar sem fechar modal"
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          </div>

                          <Button
                            variant="outline"
                            size="lg"
                            className="w-full h-12"
                          >
                            <Heart className="h-5 w-5 mr-2" />
                            Adicionar aos Favoritos
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Usar HierarchicalColorSizeSelector para variações tradicionais
                      <HierarchicalColorSizeSelector
                        product={product}
                        variations={product.variations || []}
                        onAddToCart={handleMultipleAddToCart}
                        catalogType={catalogType}
                        showStock={showStock}
                        onQuickAdd={handleQuickAdd}
                      />
                    )}
                  </div>
                ) : (
                  /* Botões de Ação para Produto Simples */
                  <div className="space-y-3 pt-4">
                    <Button
                      size="lg"
                      className="w-full h-12 text-base"
                      onClick={handleSimpleAddToCart}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Adicionar ao Carrinho
                      {minQuantity > 1 && ` (${minQuantity} un.)`}
                    </Button>

                    <Button variant="outline" size="lg" className="w-full h-12">
                      <Heart className="h-5 w-5 mr-2" />
                      Adicionar aos Favoritos
                    </Button>
                  </div>
                )}

                {/* Informações Adicionais */}
                <div className="space-y-3 pt-6 border-t">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Benefícios da compra
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3 text-green-600">
                      <Truck className="h-4 w-4 flex-shrink-0" />
                      <span>Entrega rápida disponível</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-600">
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      <span>Compra 100% protegida</span>
                    </div>
                    {showStock &&
                      (() => {
                        // Calcular estoque total
                        const totalStock = hasVariations
                          ? product.variations?.reduce(
                              (sum, v) => sum + (v.stock || 0),
                              0
                            ) || 0
                          : product.stock || 0;

                        const isInStock =
                          totalStock > 0 || product.allow_negative_stock;

                        return (
                          <div
                            className={`flex items-center gap-3 ${
                              isInStock ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            <Package className="h-4 w-4 flex-shrink-0" />
                            <span>
                              {product.allow_negative_stock
                                ? "Sempre disponível"
                                : isInStock
                                ? `${totalStock} ${
                                    totalStock === 1
                                      ? "unidade disponível"
                                      : "unidades disponíveis"
                                  }`
                                : "Produto fora de estoque"}
                            </span>
                          </div>
                        );
                      })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção de Avaliações */}
            <Separator className="my-8" />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Avaliações dos Clientes</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <span className="font-medium">4.8</span>
                  <span className="text-sm text-muted-foreground">
                    (127 avaliações)
                  </span>
                </div>
                <Button variant="outline" size="sm">
                  <Star className="h-4 w-4 mr-2" />
                  Avaliar Produto
                </Button>
              </div>

              {/* Comentários de exemplo */}
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      M
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">Maria Silva</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className="h-3 w-3 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Produto excelente! Chegou rapidinho e exatamente como
                        mostrado nas fotos. Recomendo!
                      </p>
                      <span className="text-xs text-muted-foreground">
                        Há 2 dias
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-medium">
                      J
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">João Santos</span>
                        <div className="flex">
                          {[1, 2, 3, 4].map((star) => (
                            <Star
                              key={star}
                              className="h-3 w-3 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                          <Star className="h-3 w-3 text-gray-300" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Boa qualidade, mas demorou um pouco para chegar. No
                        geral, estou satisfeito.
                      </p>
                      <span className="text-xs text-muted-foreground">
                        Há 1 semana
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Produtos Relacionados */}
            {relatedProducts.length > 0 && (
              <>
                <Separator className="my-8" />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Produtos Relacionados
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {relatedProducts.slice(0, 4).map((relatedProduct) => (
                      <div
                        key={relatedProduct.id}
                        className="group cursor-pointer"
                      >
                        <div className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                          <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                            <RelatedProductImage
                              productId={relatedProduct.id}
                              productName={relatedProduct.name}
                            />
                          </div>
                          <h4 className="font-medium text-sm line-clamp-2 mb-1">
                            {relatedProduct.name}
                          </h4>
                          {showPrices && (
                            <p className="text-sm font-medium text-primary">
                              {formatCurrency(
                                catalogType === "wholesale"
                                  ? relatedProduct.wholesale_price || 0
                                  : relatedProduct.retail_price || 0
                              )}
                            </p>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2 text-xs"
                            onClick={() => {
                              // Aqui você chamaria a função para abrir a modal do produto relacionado
                              console.log("Ver produto:", relatedProduct.id);
                            }}
                          >
                            Ver Produto
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
