
import React, { useState, memo, useCallback, useMemo } from 'react';
import { Heart, ShoppingCart, Eye, Share2, TrendingUp, AlertCircle } from 'lucide-react';
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

interface MinimalTemplateProps {
  product: Product;
  catalogType: CatalogType;
  onAddToCart: (product: Product) => void;
  onAddToWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isInWishlist: boolean;
  showPrices: boolean;
  showStock: boolean;
}

const MinimalTemplate: React.FC<MinimalTemplateProps> = memo(({
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
  const productVariations = product.variations || variations;

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
      <Card className="group hover:shadow-lg transition-all duration-200 border border-gray-100 bg-white overflow-hidden">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {!imageError ? (
            <img
              src={product.image_url || '/placeholder.svg'}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-200 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-400 text-sm">Sem imagem</span>
            </div>
          )}

          {/* Badges minimalistas */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {catalogMode === 'hybrid' && discountPercentage > 0 && (
              <Badge className="bg-black text-white text-xs px-2 py-1">
                -{discountPercentage}%
              </Badge>
            )}
            {product.stock <= 0 && (
              <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                Esgotado
              </Badge>
            )}
            {productVariations.length > 0 && (
              <Badge className="bg-gray-800 text-white text-xs px-2 py-1">
                {productVariations.length} opções
              </Badge>
            )}
          </div>

          {/* Indicador de Economia - Modo Híbrido */}
          {catalogMode === 'hybrid' && showSavings && potentialSavings && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white p-1 rounded text-xs">
              <div className="flex items-center gap-1 font-medium">
                <TrendingUp size={10} />
                <span>+{potentialSavings.qtyRemaining}</span>
              </div>
            </div>
          )}

          {/* Botões de ação simples */}
          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAddToWishlist}
              className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
            >
              <Heart size={14} className={isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleQuickView}
              className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
            >
              <Eye size={14} className="text-gray-600" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleShare}
              className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
            >
              <Share2 size={14} className="text-gray-600" />
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">
              {product.name}
            </h3>

            {/* Informações no Carrinho - Modo Híbrido */}
            {catalogMode === 'hybrid' && cartQuantity > 0 && (
              <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <ShoppingCart size={10} />
                  <span>{cartQuantity} no carrinho</span>
                </div>
                {potentialSavings && (
                  <div className="mt-1">
                    +{potentialSavings.qtyRemaining} para economizar {potentialSavings.savingsPercentage.toFixed(0)}%
                  </div>
                )}
              </div>
            )}

            {showPrices && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      R$ {effectivePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {catalogMode === 'hybrid' && product.wholesale_price && product.wholesale_price < product.retail_price && (
                      <span className="text-xs text-gray-500 line-through">
                        R$ {product.retail_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  {catalogType === 'wholesale' && product.min_wholesale_qty && (
                    <p className="text-xs text-gray-500">
                      Mín. {product.min_wholesale_qty}
                    </p>
                  )}
                  {/* Indicador de Preço Híbrido */}
                  {catalogMode === 'hybrid' && product.wholesale_price && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <AlertCircle size={10} />
                      <span>Atacado disponível</span>
                    </div>
                  )}
                </div>

                {showStock && (
                  <span className="text-xs text-gray-500">
                    {product.stock} unid.
                  </span>
                )}
              </div>
            )}

            <Button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm py-2"
            >
              {product.stock <= 0 ? 'Esgotado' : 
               productVariations.length > 0 ? 'Ver Opções' : 
               'Adicionar'}
            </Button>

            {/* Incentivo para Atacado - Modo Híbrido */}
            {catalogMode === 'hybrid' && potentialSavings && (
              <div className="text-center">
                <p className="text-xs text-orange-600">
                  💰 Compre {potentialSavings.minQtyNeeded} e economize R$ {potentialSavings.savings.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={product}
        catalogType={catalogType}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
  );
});

MinimalTemplate.displayName = 'MinimalTemplate';

export default MinimalTemplate;
