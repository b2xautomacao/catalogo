import React, { useState, memo, useCallback, useMemo } from 'react';
import { Heart, ShoppingCart, Eye, Star, Share2, TrendingUp, AlertCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/hooks/useProducts';
import { CatalogType } from '@/hooks/useCatalog';
import { useProductVariations } from '@/hooks/useProductVariations';
import { useCart } from '@/hooks/useCart';
import { useCatalogMode } from '@/hooks/useCatalogMode';
import { useToast } from '@/hooks/use-toast';
import { createCartItem } from '@/utils/cartHelpers';
import ProductDetailsModal from '../ProductDetailsModal';

interface ElegantTemplateProps {
  product: Product;
  catalogType: CatalogType;
  onAddToCart: (product: Product) => void;
  onAddToWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isInWishlist: boolean;
  showPrices: boolean;
  showStock: boolean;
}

const ElegantTemplate: React.FC<ElegantTemplateProps> = memo(({
  product,
  catalogType,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  isInWishlist,
  showPrices,
  showStock
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { variations } = useProductVariations(product.id);
  const { addItem, items } = useCart();
  const { toast } = useToast();
  
  const {
    catalogMode,
    currentCatalogType,
    calculatePrice,
    shouldShowSavingsIndicator,
    calculatePotentialSavings
  } = useCatalogMode();

  // Usar variações do produto se disponíveis, senão usar do hook
  const productVariations = product.variations || variations || [];

  // Calcular quantidade atual no carrinho para este produto
  const cartQuantity = useMemo(() => {
    return items
      .filter(item => item.product.id === product.id)
      .reduce((total, item) => total + item.quantity, 0);
  }, [items, product.id]);

  // Calcular preço baseado no modo e quantidade do carrinho
  const effectivePrice = useMemo(() => {
    return calculatePrice(product, cartQuantity + 1);
  }, [calculatePrice, product, cartQuantity]);

  // Calcular economia potencial
  const potentialSavings = useMemo(() => {
    return calculatePotentialSavings(product, cartQuantity + 1);
  }, [calculatePotentialSavings, product, cartQuantity]);

  // Verificar se deve mostrar indicador de economia
  const showSavings = useMemo(() => {
    return shouldShowSavingsIndicator(product, cartQuantity + 1);
  }, [shouldShowSavingsIndicator, product, cartQuantity]);

  const price = catalogType === 'wholesale' ? product.wholesale_price : product.retail_price;

  const discountPercentage = catalogType === 'wholesale' && product.wholesale_price
    ? Math.round(((product.retail_price - product.wholesale_price) / product.retail_price) * 100)
    : 0;

  const handleShare = useCallback(async () => {
    const shareData = {
      title: product.name,
      text: product.description || 'Confira este produto incrível!',
      url: window.location.href + `/produto/${product.id}`
    };

    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Link copiado!",
        description: "O link do produto foi copiado para a área de transferência.",
      });
    }
  }, [product.name, product.description, product.id, toast]);

  const handleAddToCart = useCallback(() => {
    // Se o produto tem variações, abrir modal de detalhes
    if (productVariations.length > 0) {
      setShowDetailsModal(true);
    } else {
      // Usar a lógica original de adicionar ao carrinho
      const cartItem = createCartItem(product, catalogType, 1);
      addItem(cartItem);
    }
  }, [productVariations.length, product, catalogType, addItem]);

  const handleAddToWishlist = useCallback(() => {
    onAddToWishlist(product);
  }, [onAddToWishlist, product]);

  const handleQuickView = useCallback(() => {
    setShowDetailsModal(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  return (
    <>
      <Card className="group hover:shadow-2xl transition-all duration-500 border border-gold-200 bg-gradient-to-br from-white via-amber-50/30 to-white overflow-hidden relative">
        {/* Borda dourada elegante */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 via-gold-300/20 to-amber-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-lg"></div>
        
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-white">
          {!imageError ? (
            <img
              src={product.image_url || '/placeholder.svg'}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-white">
              <span className="text-amber-600 text-sm font-medium">Sem imagem</span>
            </div>
          )}

          {/* Overlay elegante */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Badges elegantes */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {catalogMode === 'hybrid' && discountPercentage > 0 && (
              <Badge className="bg-gradient-to-r from-amber-500 to-gold-600 text-white font-medium px-3 py-1 rounded-full shadow-lg">
                <Crown size={12} className="mr-1" />
                -{discountPercentage}% Atacado
              </Badge>
            )}
            {product.stock <= 0 && (
              <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white font-medium px-3 py-1 rounded-full shadow-lg">
                Esgotado
              </Badge>
            )}
            {product.stock <= 5 && product.stock > 0 && (
              <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium px-3 py-1 rounded-full shadow-lg">
                Últimas Peças
              </Badge>
            )}
            {productVariations.length > 0 && (
              <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium px-3 py-1 rounded-full shadow-lg">
                {productVariations.length} Variações
              </Badge>
            )}
          </div>

          {/* Indicador de Economia - Modo Híbrido */}
          {catalogMode === 'hybrid' && showSavings && potentialSavings && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-gold-600 text-white p-2 rounded-full shadow-lg">
              <div className="flex items-center gap-1 text-xs font-medium">
                <TrendingUp size={12} />
                <span>+{potentialSavings.qtyRemaining}</span>
              </div>
              <div className="text-xs text-center">
                -{potentialSavings.savingsPercentage.toFixed(0)}%
              </div>
            </div>
          )}

          {/* Botões flutuantes elegantes */}
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAddToWishlist}
              className="w-10 h-10 p-0 bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm rounded-full border-2 border-amber-200"
            >
              <Heart size={16} className={isInWishlist ? 'fill-red-500 text-red-500' : 'text-amber-600'} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleQuickView}
              className="w-10 h-10 p-0 bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm rounded-full border-2 border-amber-200"
            >
              <Eye size={16} className="text-amber-600" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleShare}
              className="w-10 h-10 p-0 bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm rounded-full border-2 border-amber-200"
            >
              <Share2 size={16} className="text-amber-600" />
            </Button>
          </div>
        </div>

        <CardContent className="p-6 relative">
          <div className="space-y-4">
            {/* Categoria elegante */}
            {product.category && (
              <p className="text-xs text-amber-700 uppercase tracking-widest font-medium">
                {product.category}
              </p>
            )}

            <h3 className="font-serif text-lg text-gray-900 line-clamp-2 group-hover:text-amber-800 transition-colors duration-300 leading-relaxed">
              {product.name}
            </h3>

            {product.description && (
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Rating elegante */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="text-amber-400" fill="currentColor" />
              ))}
              <span className="text-sm text-gray-500 ml-2 font-medium">(24 avaliações)</span>
            </div>

            {/* Informações no Carrinho - Modo Híbrido */}
            {catalogMode === 'hybrid' && cartQuantity > 0 && (
              <div className="p-3 bg-gradient-to-r from-amber-50 to-gold-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <ShoppingCart size={14} />
                  <span className="font-medium">{cartQuantity} no carrinho</span>
                </div>
                {potentialSavings && (
                  <div className="text-sm text-amber-700 mt-1">
                    Adicione +{potentialSavings.qtyRemaining} para economizar {potentialSavings.savingsPercentage.toFixed(0)}%
                  </div>
                )}
              </div>
            )}

            {showPrices && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-serif font-bold text-gray-900">
                    R$ {effectivePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  {catalogMode === 'hybrid' && product.wholesale_price && product.wholesale_price < product.retail_price && (
                    <span className="text-lg text-gray-500 line-through font-serif">
                      R$ {product.retail_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                {catalogType === 'wholesale' && product.min_wholesale_qty && (
                  <p className="text-sm text-amber-700 font-medium">
                    Mínimo {product.min_wholesale_qty} unidades
                  </p>
                )}
                {/* Indicador de Preço Híbrido */}
                {catalogMode === 'hybrid' && product.wholesale_price && (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <AlertCircle size={14} />
                    <span className="font-medium">Preço de atacado disponível</span>
                  </div>
                )}
              </div>
            )}

            {showStock && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">Estoque:</span>
                <span className={`font-bold ${product.stock <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                  {product.stock} disponível
                </span>
              </div>
            )}

            <Button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-full bg-gradient-to-r from-amber-600 to-gold-700 hover:from-amber-700 hover:to-gold-800 text-white font-medium py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <ShoppingCart size={18} className="mr-2" />
              {product.stock <= 0 ? 'Indisponível' : 
               productVariations.length > 0 ? 'Ver Opções' : 
               'Adicionar ao Carrinho'}
            </Button>

            {/* Incentivo para Atacado - Modo Híbrido */}
            {catalogMode === 'hybrid' && potentialSavings && (
              <div className="text-center p-3 bg-gradient-to-r from-amber-100 to-gold-100 rounded-lg border border-amber-300">
                <p className="text-sm text-amber-800 font-medium">
                  <Crown size={14} className="inline mr-1" />
                  Compre {potentialSavings.minQtyNeeded} e economize R$ {potentialSavings.savings.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={{
          ...product,
          description: product.description || ''
        }}
        catalogType={catalogType}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
  );
});

ElegantTemplate.displayName = 'ElegantTemplate';

export default ElegantTemplate;
