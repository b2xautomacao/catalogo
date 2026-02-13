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
  Users,
  TrendingUp,
  Zap,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Product, ProductVariation } from "@/types/product";
import { CatalogType } from "@/hooks/useCatalog";
import ProductImageGallery from "@/components/products/ProductImageGallery";
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

// Componentes de conversão
import UrgencyBadges from "./conversion/UrgencyBadges";
import ProductReviews from "./conversion/ProductReviews";
import PriceStrategy from "./conversion/PriceStrategy";
import TrustBadges from "./conversion/TrustBadges";
import UrgencyTimer from "./conversion/UrgencyTimer";
import CrossSellUpsell from "./conversion/CrossSellUpsell";

interface ProductDetailsModalOptimizedProps {
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
  showConversionElements?: boolean;
  cartTotal?: number;
}

interface VariationSelection {
  variation: ProductVariation;
  quantity: number;
}

const ProductDetailsModalOptimized: React.FC<ProductDetailsModalOptimizedProps> = ({
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
  showConversionElements = true,
  cartTotal = 0,
}) => {
  const { toast } = useToast();
  const { addItem } = useCart();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [quickAddItems, setQuickAddItems] = useState<VariationSelection[]>([]);
  const [isGradeSelected, setIsGradeSelected] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  // 🔴 NOVO: Estado para grade flexível
  const [flexibleGradeMode, setFlexibleGradeMode] = useState<'full' | 'half' | 'custom'>('full');
  const [customGradeSelection, setCustomGradeSelection] = useState<CustomGradeSelection | null>(null);

  // Dados simulados para demonstração
  const mockData = {
    rating: Math.random() * 2 + 3,
    reviewCount: Math.floor(Math.random() * 100) + 10,
    salesCount: Math.floor(Math.random() * 500) + 50,
    viewsCount: Math.floor(Math.random() * 50) + 5,
    stock: Math.floor(Math.random() * 20) + 1,
    isBestSeller: Math.random() > 0.7,
    isOnSale: false,
    isNew: Math.random() > 0.8,
    isLimited: Math.random() > 0.9,
  };

  // Timer de oferta
  const offerEndTime = new Date();
  offerEndTime.setHours(offerEndTime.getHours() + 24);

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
    quantity: quantity,
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

  const isDescriptionLong = product.description && product.description.length > 200;

  const handleAddToCart = () => {
    if (hasVariations && !selectedVariation) {
      toast({
        title: "Selecione uma variação",
        description: "Escolha cor, tamanho ou grade antes de adicionar ao carrinho.",
        variant: "destructive",
      });
      return;
    }

    // 🔴 NOVO: Se for grade flexível, usar createCartItem diretamente
    if (selectedVariation?.is_grade && selectedVariation?.flexible_grade_config) {
      const finalQuantity = selectedVariation.is_grade ? 1 : quantity;
      const cartItem = createCartItem(
        product,
        catalogType,
        finalQuantity,
        selectedVariation,
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
        title: "Produto adicionado!",
        description: `${selectedVariation.color || ""} ${
          selectedVariation.size || ""
        }${
          selectedVariation.is_grade 
            ? ` (${selectedVariation.grade_name || "Grade"}${flexibleGradeMode === 'half' ? ' - Meia Grade' : flexibleGradeMode === 'custom' ? ' - Personalizada' : ''})` 
            : ""
        } adicionado.`,
      });
      return;
    }

    onAddToCart(product, quantity, selectedVariation || undefined);
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho.`,
    });
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removido da wishlist" : "Adicionado à wishlist",
      description: `${product.name} ${isWishlisted ? "removido da" : "adicionado à"} sua lista de desejos.`,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Confira este produto: ${product.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "Link do produto copiado para a área de transferência.",
      });
    }
  };

  const handleWhatsAppShare = () => {
    const message = `Olá! Gostaria de saber mais sobre este produto: ${product.name}`;
    const url = `https://wa.me/${storePhone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
        {/* Header fixo */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
          <DialogHeader className="flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <DialogTitle className="text-xl md:text-2xl font-bold text-left line-clamp-2 flex-1">
                {product.name}
              </DialogTitle>
              
              {/* Badges de conversão no header */}
              {showConversionElements && (
                <div className="flex gap-2 flex-shrink-0">
                  <UrgencyBadges
                    stock={mockData.stock}
                    isBestSeller={mockData.isBestSeller}
                    isOnSale={mockData.isOnSale}
                    discountPercentage={0}
                    viewsCount={mockData.viewsCount}
                    salesCount={mockData.salesCount}
                    isNew={mockData.isNew}
                    isLimited={mockData.isLimited}
                  />
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex-shrink-0 h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
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
                <div className="space-y-4">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    {showPrices ? (
                      showConversionElements ? (
                        <PriceStrategy
                          originalPrice={product.retail_price || 0}
                          currentPrice={price}
                          minQuantity={minQuantity}
                          showInstallments={true}
                          showSavings={true}
                          showFreeShipping={true}
                          freeShippingThreshold={200}
                          cartTotal={cartTotal}
                        />
                      ) : (
                        <div className="space-y-1">
                          <div className="text-3xl md:text-4xl font-bold text-primary">
                            {formatCurrency(price)}
                          </div>
                          {priceInfo.shouldShowRetailPrice &&
                            priceInfo.originalPrice !== price &&
                            priceInfo.originalPrice > 0 && (
                              <div className="text-sm text-muted-foreground line-through">
                                Varejo: {formatCurrency(priceInfo.retailPrice)}
                              </div>
                            )}
                        </div>
                      )
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

                  {/* Avaliações e prova social */}
                  {showConversionElements && (
                    <ProductReviews
                      rating={mockData.rating}
                      reviewCount={mockData.reviewCount}
                      salesCount={mockData.salesCount}
                      size="md"
                    />
                  )}

                  {/* Botões de Ação Rápida */}
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
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleWishlist}
                      className={`flex-1 ${isWishlisted ? "text-red-500 border-red-200" : ""}`}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isWishlisted ? "fill-current" : ""}`} />
                      {isWishlisted ? "Favorito" : "Favoritar"}
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
                </div>

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
                    <ProductVariationSelector
                      variations={product.variations || []}
                      selectedVariation={selectedVariation}
                      onVariationChange={setSelectedVariation}
                      basePrice={price}
                      showPriceInCards={true}
                      showStock={showStock}
                      // 🔴 NOVO: Passar callbacks para capturar modo de grade flexível
                      onFlexibleGradeModeChange={(mode) => {
                        // Armazenar modo para usar ao adicionar ao carrinho
                        setFlexibleGradeMode(mode);
                      }}
                      onCustomSelectionChange={(selection) => {
                        setCustomGradeSelection(selection ? {
                          items: selection.items.map(item => ({
                            color: item.color || '',
                            size: item.size || '',
                            quantity: item.quantity || 0,
                          })),
                          totalPairs: selection.totalPairs || 0,
                          meetsMinimum: selection.meetsMinimum || false,
                          estimatedPrice: selection.estimatedPrice,
                        } : null);
                      }}
                    />
                  </div>
                ) : null}

                {/* Quantidade */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantidade</label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Botão de Adicionar ao Carrinho */}
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:shadow-lg"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Adicionar ao Carrinho - {formatCurrency(price * quantity)}
                </Button>

                {/* Trust Badges */}
                {showConversionElements && (
                  <TrustBadges
                    showSecurity={true}
                    showGuarantee={true}
                    showShipping={true}
                    showReturns={true}
                    showAwards={true}
                    compact={false}
                  />
                )}

                {/* Informações de Entrega */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Informações de Entrega
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Frete grátis para compras acima de R$ 200</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>Entrega em 2-5 dias úteis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-500" />
                      <span>Compra 100% segura</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cross-sell e Upsell */}
            {showConversionElements && relatedProducts.length > 0 && (
              <CrossSellUpsell
                type="cross-sell"
                products={relatedProducts}
                onAddToCart={(product) => onAddToCart(product, 1)}
                onViewProduct={(product) => {
                  // Implementar navegação para o produto
                  console.log("Ver produto:", product.name);
                }}
                maxItems={4}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModalOptimized;
