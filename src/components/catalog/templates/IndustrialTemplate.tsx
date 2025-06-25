import React, { useState, memo, useCallback, useMemo } from 'react';
import { Heart, ShoppingCart, Eye, TrendingUp, AlertTriangle, Share2, Star, AlertCircle } from 'lucide-react';
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

interface IndustrialTemplateProps {
  product: Product;
  catalogType: CatalogType;
  onAddToCart: (product: Product) => void;
  onAddToWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isInWishlist: boolean;
  showPrices: boolean;
  showStock: boolean;
}

const IndustrialTemplate: React.FC<IndustrialTemplateProps> = memo(({
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
  const isWholesale = catalogType === 'wholesale';
  const canShowWholesale = product.wholesale_price && product.min_wholesale_qty;
  const isLowStock = product.stock <= 5;

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
      <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 hover:border-blue-900 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
        {/* Chanfro superior direito */}
        <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-blue-900 to-slate-700 clip-path-triangle"></div>
        
        {/* Container da imagem com efeito industrial */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
          {!imageError ? (
            <img
              src={product.image_url || '/placeholder.svg'}
              alt={product.name}
              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
              <span className="text-slate-500 text-sm font-medium">Sem imagem</span>
            </div>
          )}
          
          {/* Overlay metálico */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Badges metálicos */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {catalogMode === 'hybrid' && discountPercentage > 0 && (
              <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white font-bold px-3 py-1 clip-path-badge shadow-lg animate-pulse">
                <TrendingUp size={12} className="mr-1" />
                -{discountPercentage}% ATACADO
              </Badge>
            )}
            {isWholesale && (
              <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white font-bold px-3 py-1 clip-path-badge shadow-lg">
                <TrendingUp size={12} className="mr-1" />
                ATACADO
              </Badge>
            )}
            {isLowStock && showStock && (
              <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-3 py-1 clip-path-badge shadow-lg">
                <AlertTriangle size={12} className="mr-1" />
                ESTOQUE BAIXO
              </Badge>
            )}
            {product.is_featured && (
              <Badge className="bg-gradient-to-r from-blue-900 to-slate-700 text-white font-bold px-3 py-1 clip-path-badge shadow-lg">
                ⭐ DESTAQUE
              </Badge>
            )}
            {productVariations.length > 0 && (
              <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold px-3 py-1 clip-path-badge shadow-lg">
                {productVariations.length} VARIAÇÕES
              </Badge>
            )}
          </div>

          {/* Indicador de Economia - Modo Híbrido */}
          {catalogMode === 'hybrid' && showSavings && potentialSavings && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white p-2 rounded-lg shadow-lg animate-bounce border-2 border-orange-300">
              <div className="flex items-center gap-1 text-xs font-bold">
                <TrendingUp size={12} />
                <span>FALTAM {potentialSavings.qtyRemaining}</span>
              </div>
              <div className="text-xs">
                ECONOMIZE {potentialSavings.savingsPercentage.toFixed(0)}%
              </div>
            </div>
          )}

          {/* Botões de ação flutuantes */}
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              variant="secondary"
              className="w-10 h-10 p-0 bg-slate-800/80 hover:bg-slate-700 text-white border-2 border-slate-600 rounded-none clip-path-button"
              onClick={handleAddToWishlist}
            >
              <Heart size={16} className={isInWishlist ? 'fill-red-500 text-red-500' : ''} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="w-10 h-10 p-0 bg-slate-800/80 hover:bg-slate-700 text-white border-2 border-slate-600 rounded-none clip-path-button"
              onClick={handleQuickView}
            >
              <Eye size={16} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="w-10 h-10 p-0 bg-slate-800/80 hover:bg-slate-700 text-white border-2 border-slate-600 rounded-none clip-path-button"
              onClick={handleShare}
            >
              <Share2 size={16} />
            </Button>
          </div>
        </div>

        <CardContent className="p-4 bg-gradient-to-b from-white to-slate-50">
          {/* Título do produto */}
          <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-900 transition-colors duration-300">
            {product.name}
          </h3>

          {/* Categoria */}
          {product.category && (
            <p className="text-sm text-slate-600 mb-2 font-medium uppercase tracking-wide">
              {product.category}
            </p>
          )}

          {/* Rating Industrial */}
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} className="text-yellow-500" fill="currentColor" />
            ))}
            <span className="text-xs text-slate-600 ml-1 font-bold">(24 AVALIAÇÕES)</span>
          </div>

          {/* Informações no Carrinho - Modo Híbrido */}
          {catalogMode === 'hybrid' && cartQuantity > 0 && (
            <div className="mb-4 p-3 bg-blue-900/10 rounded-lg border-2 border-blue-900/20">
              <div className="flex items-center gap-1 text-sm text-blue-900 font-bold">
                <ShoppingCart size={14} />
                <span>{cartQuantity} NO CARRINHO</span>
              </div>
              {potentialSavings && (
                <div className="text-sm text-blue-800 mt-1 font-medium">
                  ADICIONE +{potentialSavings.qtyRemaining} PARA ECONOMIZAR {potentialSavings.savingsPercentage.toFixed(0)}%
                </div>
              )}
            </div>
          )}

          {/* Preços com design industrial */}
          {showPrices && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-blue-900 bg-gradient-to-r from-blue-900 to-slate-700 bg-clip-text text-transparent">
                  R$ {effectivePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                {catalogMode === 'hybrid' && product.wholesale_price && product.wholesale_price < product.retail_price && (
                  <span className="text-sm text-slate-500 line-through font-bold">
                    R$ {product.retail_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                )}
                {isWholesale && product.min_wholesale_qty && (
                  <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-bold px-2 py-1 clip-path-badge">
                    MIN. {product.min_wholesale_qty}
                  </Badge>
                )}
              </div>
              
              {/* Indicador de Preço Híbrido */}
              {catalogMode === 'hybrid' && product.wholesale_price && (
                <div className="flex items-center gap-1 text-sm text-green-700 font-bold">
                  <AlertCircle size={14} />
                  <span>PREÇO DE ATACADO DISPONÍVEL</span>
                </div>
              )}
            </div>
          )}

          {/* Stock info */}
          {showStock && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium">ESTOQUE:</span>
                <span className={`font-bold ${isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                  {product.stock} UNIDADES
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isLowStock ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-green-500 to-green-600'
                  }`}
                  style={{ width: `${Math.min((product.stock / 50) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Botão de adicionar ao carrinho industrial */}
          <Button
            onClick={handleAddToCart}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-4 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl clip-path-button-large"
            disabled={product.stock <= 0}
          >
            <ShoppingCart size={18} className="mr-2" />
            {product.stock <= 0 ? 'INDISPONÍVEL' : productVariations.length > 0 ? 'VER OPÇÕES' : 'ADICIONAR AO CARRINHO'}
          </Button>

          {/* Incentivo para Atacado - Modo Híbrido */}
          {catalogMode === 'hybrid' && potentialSavings && (
            <div className="mt-3 text-center">
              <p className="text-sm text-orange-700 font-bold bg-orange-100 p-2 rounded border-2 border-orange-300">
                💰 COMPRE {potentialSavings.minQtyNeeded} E ECONOMIZE R$ {potentialSavings.savings.toFixed(2)}
              </p>
            </div>
          )}
        </CardContent>

        {/* Efeito de borda metálica */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-gradient-to-r group-hover:from-blue-900 group-hover:to-slate-700 pointer-events-none rounded-lg"></div>
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

IndustrialTemplate.displayName = 'IndustrialTemplate';

export default IndustrialTemplate;
