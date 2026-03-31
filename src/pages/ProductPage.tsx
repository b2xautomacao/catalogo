/**
 * Página Dedicada do Produto
 * Substitui o modal por uma página completa e profissional
 * Melhor para SEO, compartilhamento e anúncios
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductVariation } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { useProductDisplayPrice } from "@/hooks/useProductDisplayPrice";
import { useCatalogSettings } from "@/hooks/useCatalogSettings";
import { useConversionTracking } from "@/hooks/useConversionTracking";
import { formatCurrency } from "@/lib/utils";
import { createCartItem } from "@/utils/cartHelpers";
import ProductImageGallery from "@/components/products/ProductImageGallery";
import ProductVariationSelector from "@/components/catalog/ProductVariationSelector";
import ImprovedGradeSelector from "@/components/catalog/ImprovedGradeSelector";
import type { CustomGradeSelection } from "@/types/flexible-grade";
import FloatingCart from "@/components/catalog/FloatingCart";
import EnhancedCheckout from "@/components/catalog/checkout/EnhancedCheckout";
import CheckoutModalWrapper from "@/components/catalog/checkout/CheckoutModalWrapper";
import VariationPicker from "@/components/catalog/VariationPicker";
// 🚀 Componentes de Conversão - FASE 1
import UrgencyBadges from "@/components/catalog/conversion/UrgencyBadges";
import EnhancedPriceDisplay from "@/components/catalog/conversion/EnhancedPriceDisplay";
import TrustSection from "@/components/catalog/conversion/TrustSection";
import OptimizedCTA from "@/components/catalog/conversion/OptimizedCTA";
import SimpleRating from "@/components/catalog/conversion/SimpleRating";
// 🎯 Componentes de Conversão - FASE 2 (melhorias solicitadas)
import SocialProofCarousel from "@/components/catalog/conversion/SocialProofCarousel";
import ProductVideoSection from "@/components/catalog/conversion/ProductVideoSection";
import SocialProofTestimonials from "@/components/catalog/conversion/SocialProofTestimonials";
import AutoSizeChart from "@/components/catalog/conversion/AutoSizeChart";
import ProductCareSection from "@/components/catalog/conversion/ProductCareSection";
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Package,
  Truck,
  Shield,
  Star,
  Loader2,
  Home,
} from "lucide-react";

interface ProductPageProps {
  isPublicContext?: boolean;
  storeContext?: {
    id: string;
    name: string;
    slug: string;
  };
}

const ProductPage: React.FC<ProductPageProps> = ({
  isPublicContext = false,
  storeContext = null
}) => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem, items: cartItems, totalAmount, toggleCart } = useCart();
  // Passar storeIdentifier quando estiver no contexto público
  const { settings: storeSettings } = useCatalogSettings(
    isPublicContext && storeContext ? storeContext.id || storeContext.slug : undefined
  );
  const { trackProductView, trackAddToCart, trackInitiateCheckout } = useConversionTracking();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  // 🔴 NOVO: Rastrear cores adicionadas ao carrinho (para sugestões)
  const [addedColors, setAddedColors] = useState<string[]>([]);
  // 🖼️ Imagem da cor selecionada (atualiza galeria ao selecionar cor, mesmo sem tamanho)
  const [selectedColorImage, setSelectedColorImage] = useState<string | undefined>(undefined);
  const [storeName, setStoreName] = useState<string>('');
  const [storePhone, setStorePhone] = useState<string>('');
  const [catalogUrl, setCatalogUrl] = useState<string>('/');
  // 🎬 FASE 2: Dados de vídeo e extras
  const [productVideo, setProductVideo] = useState<{
    video_url: string;
    video_type: 'youtube' | 'vimeo' | 'direct';
    thumbnail_url?: string;
  } | null>(null);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  // Debug: Log das configurações de produto
  useEffect(() => {
    if (storeSettings) {
      console.log("🔧 ProductPage - Configurações carregadas:", {
        product_show_urgency_badges: storeSettings.product_show_urgency_badges,
        product_show_social_proof_carousel: storeSettings.product_show_social_proof_carousel,
        product_show_ratings: storeSettings.product_show_ratings,
        product_show_trust_section: storeSettings.product_show_trust_section,
        product_show_videos: storeSettings.product_show_videos,
        product_show_testimonials: storeSettings.product_show_testimonials,
        store_id: storeSettings.store_id,
        isPublicContext,
        storeContext: storeContext ? { id: storeContext.id, slug: storeContext.slug } : null,
      });
    } else {
      console.warn("⚠️ ProductPage - storeSettings está null/undefined");
    }
  }, [storeSettings, isPublicContext, storeContext]);

  // Carregar produto
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        if (isPublicContext && storeContext) {
          window.location.href = `https://${storeContext.slug}.aoseudispor.com.br`;
        } else {
          navigate('/');
        }
        return;
      }

      try {
        setIsLoading(true);

        console.log("📥 ProductPage - Carregando produto:", productId);

        // Buscar produto
        let productQuery = supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('is_active', true);

        // No contexto público, filtrar pela loja específica
        if (isPublicContext && storeContext) {
          productQuery = productQuery.eq('store_id', storeContext.id);
        }

        const { data: productData, error: productError } = await productQuery.single();

        if (productError || !productData) {
          console.error("❌ Erro ao buscar produto:", productError);

          if (!isPublicContext) {
            toast({
              title: "Produto não encontrado",
              description: "Este produto não está disponível",
              variant: "destructive",
            });
          }

          if (isPublicContext && storeContext) {
            window.location.href = `https://${storeContext.slug}.aoseudispor.com.br`;
          } else {
            navigate('/');
          }
          return;
        }

        // Buscar variações
        const { data: variations } = await supabase
          .from('product_variations')
          .select('*')
          .eq('product_id', productId)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        console.log("📦 Variações carregadas:", variations?.length || 0);

        // Buscar imagens
        const { data: images } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId)
          .order('display_order', { ascending: true });

        console.log("📸 Imagens carregadas:", {
          count: images?.length || 0,
          images: images?.map(img => ({
            url: img.image_url,
            order: img.display_order,
            isPrimary: img.is_primary,
          })),
        });

        // TODO: Implementar quando as tabelas forem criadas no banco de dados

        // Montar produto completo
        const fullProduct = {
          ...productData,
          variations: variations || [],
          images: images || [],
        };

        console.log("✅ Produto completo montado:", {
          name: fullProduct.name,
          hasImages: fullProduct.images.length > 0,
          hasVariations: fullProduct.variations.length > 0,
          storeId: productData.store_id,
        });

        setProduct(fullProduct);

        // Definir informações da loja baseado no contexto
        if (isPublicContext && storeContext) {
          setStoreName(storeContext.name);
          setCatalogUrl(`https://${storeContext.slug}.aoseudispor.com.br`);
          console.log("🏪 Contexto público - Loja:", storeContext.name);
        }

        // 📊 Tracking: ViewContent (produto visualizado)
        trackProductView({
          id: fullProduct.id,
          name: fullProduct.name,
          category: fullProduct.category || '',
          price: fullProduct.retail_price,
        });

        // Buscar dados da loja (nome, telefone, url_slug) para checkout e navegação
        supabase
          .from('stores')
          .select('name, phone, url_slug')
          .eq('id', productData.store_id)
          .single()
          .then(({ data: storeData, error: storeError }) => {
            if (!storeError && storeData) {
              setStoreName(storeData.name || '');
              setStorePhone(storeData.phone || '');
              setCatalogUrl(storeData.url_slug ? `/catalog/${storeData.url_slug}` : '/');
              console.log("✅ Dados da loja carregados:", {
                name: storeData.name,
                phone: storeData.phone,
                url_slug: storeData.url_slug,
                catalogUrl: storeData.url_slug ? `/catalog/${storeData.url_slug}` : '/',
              });
            } else {
              console.warn("⚠️ Erro ao buscar loja (usando fallbacks):", storeError);
              setCatalogUrl('/');
            }
          });

      } catch (error) {
        console.error("Erro ao carregar produto:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o produto",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId, navigate, toast, isPublicContext, storeContext]);

  // Calcular preço
  const priceInfo = useProductDisplayPrice({
    product: product || {
      id: '',
      name: '',
      retail_price: 0,
      wholesale_price: 0,
      min_wholesale_qty: 1,
      store_id: '',
    } as Product,
    catalogType: 'retail',
    quantity,
    variation: selectedVariation,
  });

  const handleAddToCart = () => {
    if (!product) {
      console.error("❌ handleAddToCart - Produto não encontrado");
      return;
    }

    // Se tem variações e nenhuma foi selecionada
    if (product.variations && product.variations.length > 0 && !selectedVariation) {
      console.warn("⚠️ handleAddToCart - Nenhuma variação selecionada");
      toast({
        title: "Selecione uma opção",
        description: "Por favor, escolha cor, tamanho ou grade",
        variant: "destructive",
      });
      return;
    }

    console.log("🛒 handleAddToCart - Criando item do carrinho:", {
      productId: product.id,
      productName: product.name,
      quantity,
      selectedVariation: selectedVariation ? {
        id: selectedVariation.id,
        grade_name: selectedVariation.grade_name,
        color: selectedVariation.color,
        is_grade: selectedVariation.is_grade,
        grade_quantity: selectedVariation.grade_quantity,
      } : null,
    });

    try {
      // ⚠️ createCartItem(product, catalogType, quantity, variation)
      const cartItem = createCartItem(product, 'retail', quantity, selectedVariation || undefined);

      console.log("🛒 CartItem criado:", {
        id: cartItem.id,
        productName: cartItem.product.name,
        quantity: cartItem.quantity,
        price: cartItem.price,
        hasVariation: !!cartItem.variation,
        hasGradeInfo: !!cartItem.gradeInfo,
        gradeInfo: cartItem.gradeInfo,
      });

      addItem(cartItem);

      console.log("✅ addItem() chamado com sucesso");

      // 📊 Tracking: AddToCart
      trackAddToCart({
        id: product.id,
        name: product.name,
        price: priceInfo.displayPrice,
        quantity: quantity,
      });

      // Lógica simples: Mostrar toast e abrir carrinho
      toast({
        title: "✅ Adicionado ao carrinho!",
        description: `${quantity}x ${product.name}${selectedVariation ? ` - ${selectedVariation.color || selectedVariation.grade_name}` : ''}`,
      });

      // Abrir FloatingCart automaticamente
      console.log("🛒 Abrindo FloatingCart...");
      toggleCart();

    } catch (error) {
      console.error("❌ Erro ao adicionar ao carrinho:", error);
      toast({
        title: "❌ Erro ao adicionar",
        description: "Não foi possível adicionar o item ao carrinho",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url,
        });
      } catch (error) {
        // Usuário cancelou
      }
    } else {
      // Copiar para clipboard
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copiado!",
        description: "O link do produto foi copiado",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const hasVariations = product.variations && product.variations.length > 0;
  const hasGradeVariations = hasVariations && product.variations?.some(v => v.is_grade);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Navegação */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                console.log("⬅️ Voltando ao catálogo:", catalogUrl);
                window.location.href = catalogUrl;
              }}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>

            <div className="flex gap-2">
              {/* Botão Carrinho com Badge */}
              <Button
                variant="outline"
                onClick={toggleCart}
                className="relative gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline">Carrinho</span>
                {cartItems.length > 0 && (
                  <>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {cartItems.length}
                    </div>
                    <span className="text-sm font-semibold text-blue-600 hidden md:inline">
                      {formatCurrency(totalAmount)}
                    </span>
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  console.log("🏠 Indo ao catálogo:", catalogUrl);
                  window.location.href = catalogUrl;
                }}
                title="Ir ao catálogo"
              >
                <Home className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                title="Compartilhar produto"
              >
                <Share2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={isWishlisted ? "text-red-600" : ""}
                title={isWishlisted ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Coluna Esquerda - Imagens */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <ProductImageGallery
              productId={product.id}
              productName={product.name}
              selectedVariationImage={selectedVariation?.image_url || selectedColorImage || product.image_url}
            />

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {product.is_featured && (
                <Badge className="bg-yellow-500">⭐ Destaque</Badge>
              )}
              {hasGradeVariations && (
                <Badge variant="secondary">📦 Grade Disponível</Badge>
              )}
              {product.stock && product.stock > 0 && (
                <Badge variant="outline" className="text-green-600">
                  ✓ Em Estoque
                </Badge>
              )}
            </div>

            {/* 🎯 FASE 2: Vídeo do Produto (abaixo das imagens) - SÓ SE HOUVER VÍDEO CADASTRADO */}
            <div className="mt-6 space-y-4">
              {storeSettings?.product_show_videos && productVideo && (
                <ProductVideoSection
                  videoUrl={productVideo.video_url}
                  videoType={productVideo.video_type}
                  thumbnailUrl={productVideo.thumbnail_url || product.image_url}
                  productName={product.name}
                />
              )}

              {/* 🎯 FASE 2: Depoimentos de Clientes - SÓ SE HOUVER DEPOIMENTOS */}
              {storeSettings?.product_show_testimonials && testimonials && testimonials.length > 0 && (
                <SocialProofTestimonials
                  testimonials={testimonials}
                  maxDisplay={storeSettings.product_testimonials_max_display || 3}
                />
              )}
            </div>
          </div>

          {/* Coluna Direita - Informações */}
          <div className="space-y-6">
            {/* ── Seletor de Variações ─────────────────────────────────────── */}
            {hasVariations && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="font-semibold text-lg mb-4">Opções do Produto</h2>

                {hasGradeVariations ? (
                  /* Grade: seletor original */
                  <ProductVariationSelector
                    variations={product.variations || []}
                    selectedVariation={selectedVariation}
                    onVariationChange={setSelectedVariation}
                    basePrice={product.retail_price}
                    showPriceInCards={true}
                    showStock={true}
                    onAddToCart={(variation, gradeMode, customSel) => {
                      if (!product) return;
                      const cartItem = createCartItem(
                        product,
                        'retail',
                        1,
                        variation,
                        gradeMode,
                        customSel ? {
                          items: customSel.items.map(item => ({
                            color: item.color || '',
                            size: item.size || '',
                            quantity: item.quantity || 0,
                          })),
                          totalPairs: customSel.totalPairs || 0,
                        } : undefined
                      );
                      addItem(cartItem);
                      const color = variation.grade_color || variation.color || '';
                      if (color && !addedColors.includes(color)) {
                        setAddedColors(prev => [...prev, color]);
                      }
                      trackAddToCart({ id: product.id, name: product.name, price: cartItem.price, quantity: 1 });
                      toast({
                        title: "✅ Adicionado ao carrinho!",
                        description: `${color} (${variation.grade_name || "Grade"}${gradeMode === 'half' ? ' - Meia Grade' : gradeMode === 'custom' ? ' - Personalizada' : ''}) adicionado.`,
                      });
                      toggleCart();
                    }}
                    addedColors={addedColors}
                  />
                ) : (
                  /* Variações simples: seletor por etapas (cor → tamanho → qty → CTA) */
                  <VariationPicker
                    variations={product.variations || []}
                    basePrice={product.retail_price}
                    onAddToCart={(variation, qty) => {
                      if (!product) return;
                      const cartItem = createCartItem(product, 'retail', qty, variation);
                      addItem(cartItem);
                      trackAddToCart({ id: product.id, name: product.name, price: cartItem.price, quantity: qty });
                      const color = variation.color || '';
                      if (color && !addedColors.includes(color)) {
                        setAddedColors(prev => [...prev, color]);
                      }
                    }}
                    onViewCart={toggleCart}
                    onColorChange={(_color, imageUrl) => setSelectedColorImage(imageUrl)}
                  />
                )}
              </div>
            )}
            {/* Título */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>

              {product.category && (
                <p className="text-sm text-gray-500 mb-4">{product.category}</p>
              )}

              <Separator className="my-4" />

              {/* 🚀 BADGES DE URGÊNCIA - Gatilho Mental #1 */}
              {storeSettings?.product_show_urgency_badges && (
                <UrgencyBadges
                  stock={storeSettings.product_show_low_stock_badge ? (product.stock || 0) : 999}
                  lowStockThreshold={storeSettings.product_low_stock_threshold || 10}
                  hasFreeShipping={storeSettings.product_show_free_shipping_badge !== false}
                  isFastDelivery={storeSettings.product_show_fast_delivery_badge !== false}
                  isNew={false}
                  isBestSeller={storeSettings.product_show_best_seller_badge && product.is_featured}
                  salesCount={storeSettings.product_show_sales_count ? 75 : undefined}
                  viewsLast24h={storeSettings.product_show_views_count ? 42 : undefined}
                />
              )}

              {/* 🚀 PROVA SOCIAL EM CARROSSEL - Gatilho Mental #2 (FASE 2: Melhorado) */}
              {storeSettings?.product_show_social_proof_carousel && (
                <SocialProofCarousel
                  salesCount={75}
                  viewsLast24h={42}
                  viewsNow={3}
                  stockStatus="in_stock"
                  isBestSeller={product.is_featured}
                  recentPurchases={[
                    {
                      customerName: "Maria S.",
                      city: "São Paulo",
                      timeAgo: "há 2 horas",
                    },
                    {
                      customerName: "João P.",
                      city: "Rio de Janeiro",
                      timeAgo: "há 5 horas",
                    },
                  ]}
                  autoRotateInterval={storeSettings.product_social_proof_autorotate ? (storeSettings.product_social_proof_interval || 4000) : undefined}
                />
              )}

              {/* 🚀 RATING - Gatilho Mental #3 */}
              {storeSettings?.product_show_ratings && (
                <SimpleRating
                  rating={4.8}
                  reviewCount={127}
                  showDistribution={storeSettings.product_show_rating_distribution !== false}
                />
              )}

              <Separator className="my-6" />

              {/* TODO: Implementar EnhancedPriceDisplay quando hooks tiverem campos necessários */}
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-primary">
                  {formatCurrency(priceInfo.displayPrice)}
                </div>
                {priceInfo.originalPrice > priceInfo.displayPrice && (
                  <div className="text-lg text-gray-500 line-through">
                    {formatCurrency(priceInfo.originalPrice)}
                  </div>
                )}
              </div>
            </div>

            {/* ── Seletor de Variações ─────────────────────────────────────── */}
            {hasVariations && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="font-semibold text-lg mb-4">Opções do Produto</h2>

                {hasGradeVariations ? (
                  /* Grade: seletor original */
                  <ProductVariationSelector
                    variations={product.variations || []}
                    selectedVariation={selectedVariation}
                    onVariationChange={setSelectedVariation}
                    basePrice={product.retail_price}
                    showPriceInCards={true}
                    showStock={true}
                    onAddToCart={(variation, gradeMode, customSel) => {
                      if (!product) return;
                      const cartItem = createCartItem(
                        product,
                        'retail',
                        1,
                        variation,
                        gradeMode,
                        customSel ? {
                          items: customSel.items.map(item => ({
                            color: item.color || '',
                            size: item.size || '',
                            quantity: item.quantity || 0,
                          })),
                          totalPairs: customSel.totalPairs || 0,
                        } : undefined
                      );
                      addItem(cartItem);
                      const color = variation.grade_color || variation.color || '';
                      if (color && !addedColors.includes(color)) {
                        setAddedColors(prev => [...prev, color]);
                      }
                      trackAddToCart({ id: product.id, name: product.name, price: cartItem.price, quantity: 1 });
                      toast({
                        title: "✅ Adicionado ao carrinho!",
                        description: `${color} (${variation.grade_name || "Grade"}${gradeMode === 'half' ? ' - Meia Grade' : gradeMode === 'custom' ? ' - Personalizada' : ''}) adicionado.`,
                      });
                      toggleCart();
                    }}
                    addedColors={addedColors}
                  />
                ) : (
                  /* Variações simples: seletor por etapas (cor → tamanho → qty → CTA) */
                  <VariationPicker
                    variations={product.variations || []}
                    basePrice={product.retail_price}
                    onAddToCart={(variation, qty) => {
                      if (!product) return;
                      const cartItem = createCartItem(product, 'retail', qty, variation);
                      addItem(cartItem);
                      trackAddToCart({ id: product.id, name: product.name, price: cartItem.price, quantity: qty });
                      const color = variation.color || '';
                      if (color && !addedColors.includes(color)) {
                        setAddedColors(prev => [...prev, color]);
                      }
                    }}
                    onViewCart={toggleCart}
                    onColorChange={(_color, imageUrl) => setSelectedColorImage(imageUrl)}
                  />
                )}
              </div>
            )}

            {/* Descrição */}
            {product.description && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="font-semibold text-lg mb-3">Descrição</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {/* Quantidade e Adicionar ao Carrinho — só para produtos SEM variações */}
            {!hasVariations && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="space-y-6">
                  {/* Quantidade */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Quantidade
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        -
                      </Button>
                      <span className="text-xl font-semibold w-16 text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* 🚀 BOTÃO CTA OTIMIZADO - Gatilho Mental #5 */}
                  <OptimizedCTA
                    onClick={handleAddToCart}
                    disabled={false}
                    isLoading={false}
                    price={priceInfo.displayPrice}
                    buttonText="🛒 COMPRAR AGORA"
                    showSecurityBadge={true}
                    isSticky={false}
                  />

                  {/* Total */}
                  <div className="text-center pt-2 border-t">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(priceInfo.displayPrice * quantity)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 🚀 SEÇÃO DE CONFIANÇA - Gatilho Mental #6 */}
            {storeSettings?.product_show_trust_section && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <TrustSection
                  hasFreeShipping={storeSettings.product_trust_free_shipping !== false}
                  hasMoneyBackGuarantee={storeSettings.product_trust_money_back !== false}
                  hasFastDelivery={storeSettings.product_trust_fast_delivery !== false}
                  hasSecurePayment={storeSettings.product_trust_secure_payment !== false}
                  deliveryDays={storeSettings.product_trust_delivery_days || "2-5"}
                  returnDays={storeSettings.product_trust_return_days || 7}
                  isAuthorizedDealer={false}
                  brandName={product.category}
                />
              </div>
            )}

            {/* 🎬 FASE 2: Vídeo do Produto */}
            {storeSettings?.product_show_videos && product.video_url && (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <ProductVideoSection
                  videoUrl={product.video_url}
                  productName={product.name}
                />
              </div>
            )}

            {/* 🎯 FASE 2: Tabela de Medidas Automática - SÓ para calçado e roupa */}
            {storeSettings?.product_show_size_chart &&
              product.product_gender &&
              product.product_category_type &&
              (product.product_category_type === 'calcado' ||
                product.product_category_type === 'roupa_superior' ||
                product.product_category_type === 'roupa_inferior') && (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <AutoSizeChart
                    gender={product.product_gender as any}
                    category={product.product_category_type as any}
                    isCollapsible={true}
                    defaultOpen={storeSettings.product_size_chart_default_open || false}
                  />
                </div>
              )}

            {/* 💬 FASE 2: Depoimentos de Clientes */}
            {storeSettings?.product_show_testimonials && (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <SocialProofTestimonials
                  testimonials={testimonials}
                  maxDisplay={storeSettings.product_testimonials_max_display || 3}
                />
              </div>
            )}

            {/* 🎯 FASE 2: Cuidados do Produto - Usa dados cadastrados ou auto-gera */}
            {storeSettings?.product_show_care_section &&
              (product.product_category_type || product.material) && (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <ProductCareSection
                    productCategory={product.product_category_type || 'calcado'}
                    material={product.material}
                    isCollapsible={true}
                    defaultOpen={storeSettings.product_care_section_default_open || false}
                  />
                </div>
              )}
          </div>
        </div>
      </div>

      {/* FloatingCart - Carrinho lateral flutuante */}
      <FloatingCart
        onCheckout={() => {
          console.log("🛒 Abrindo checkout...");

          // 📊 Tracking: InitiateCheckout
          trackInitiateCheckout(totalAmount, cartItems.length);

          setShowCheckout(true);
        }}
        storeId={product.store_id}
      />

      {/* Checkout Modal */}
      {showCheckout && product && (
        <CheckoutModalWrapper
          onClose={() => {
            console.log("❌ Fechando checkout");
            setShowCheckout(false);
          }}
        >
          <EnhancedCheckout
            storeId={product.store_id}
            storeName={storeName}
            storePhone={storePhone}
            onClose={() => {
              console.log("❌ Fechando checkout");
              setShowCheckout(false);
            }}
          />
        </CheckoutModalWrapper>
      )}
    </div>
  );
};

export default ProductPage;

