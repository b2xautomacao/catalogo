
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, Heart, Package, Minus, Plus, AlertCircle } from 'lucide-react';
import { Product } from '@/types/product';
import { ProductVariation } from '@/types/variation';
import ProductImageGallery from '@/components/products/ProductImageGallery';
import ProductVariationSelector from '@/components/catalog/ProductVariationSelector';
import { useProductVariations } from '@/hooks/useProductVariations';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product, quantity: number, variation?: ProductVariation) => void;
  onAddToWishlist?: (product: Product) => void;
  catalogType?: 'retail' | 'wholesale';
  isInWishlist?: boolean;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onAddToWishlist,
  catalogType = 'retail',
  isInWishlist = false
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [showVariationError, setShowVariationError] = useState(false);

  // Hook para carregar variações do produto
  const { variations, loading: variationsLoading } = useProductVariations(product?.id);

  console.log('🎨 MODAL - Dados recebidos:', {
    productId: product?.id,
    variationsCount: variations?.length || 0,
    selectedVariation: selectedVariation ? {
      id: selectedVariation.id,
      color: selectedVariation.color,
      size: selectedVariation.size
    } : null
  });

  // Reset quando produto muda
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSelectedVariation(null);
      setShowVariationError(false);
    }
  }, [product?.id]);

  // Reset variação selecionada quando variações carregam
  useEffect(() => {
    if (variations && variations.length > 0 && !selectedVariation) {
      // Não selecionar automaticamente - deixar usuário escolher
      setSelectedVariation(null);
    } else if (variations && variations.length === 0) {
      // Se não há variações, limpar seleção
      setSelectedVariation(null);
    }
  }, [variations, selectedVariation]);

  if (!product) return null;

  const hasVariations = variations && variations.length > 0;
  const requiresVariationSelection = hasVariations;

  // Calcular preço baseado na variação selecionada
  const basePrice = catalogType === 'wholesale' && product.wholesale_price 
    ? product.wholesale_price 
    : product.retail_price;
  
  const finalPrice = selectedVariation 
    ? basePrice + (selectedVariation.price_adjustment || 0)
    : basePrice;

  // Calcular estoque disponível
  const availableStock = selectedVariation 
    ? selectedVariation.stock 
    : product.stock;

  const isWholesale = catalogType === 'wholesale';
  const minQty = isWholesale ? (product.min_wholesale_qty || 1) : 1;

  const handleQuantityChange = (newQuantity: number) => {
    const maxQty = Math.max(minQty, Math.min(newQuantity, availableStock));
    if (newQuantity >= minQty && newQuantity <= availableStock) {
      setQuantity(newQuantity);
    }
  };

  const handleVariationChange = (variation: ProductVariation | null) => {
    console.log('🎯 MODAL - Variação selecionada:', variation);
    setSelectedVariation(variation);
    setShowVariationError(false);
    
    // Ajustar quantidade se exceder o estoque da variação
    if (variation && quantity > variation.stock) {
      setQuantity(Math.max(1, Math.min(variation.stock, quantity)));
    }
  };

  const handleAddToCart = () => {
    // Validar seleção de variação obrigatória
    if (requiresVariationSelection && !selectedVariation) {
      setShowVariationError(true);
      return;
    }

    if (onAddToCart) {
      console.log('🛒 MODAL - Adicionando ao carrinho:', {
        product: product.name,
        quantity,
        variation: selectedVariation ? {
          id: selectedVariation.id,
          color: selectedVariation.color,
          size: selectedVariation.size,
          price_adjustment: selectedVariation.price_adjustment
        } : null
      });
      
      onAddToCart(product, quantity, selectedVariation || undefined);
      onClose();
    }
  };

  const handleAddToWishlist = () => {
    if (onAddToWishlist) {
      onAddToWishlist(product);
    }
  };

  const isOutOfStock = availableStock === 0;
  const canAddToCart = !isOutOfStock && (!requiresVariationSelection || selectedVariation);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
          {/* Galeria de Imagens */}
          <div>
            <ProductImageGallery 
              productId={product.id} 
              productName={product.name}
              selectedVariationImage={selectedVariation?.image_url}
            />
          </div>

          {/* Informações do Produto */}
          <div className="space-y-6">
            {/* Cabeçalho */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {product.name}
              </h2>
              {product.category && (
                <Badge variant="secondary" className="mb-4">
                  {product.category}
                </Badge>
              )}
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">
                R$ {finalPrice.toFixed(2).replace('.', ',')}
              </div>
              {selectedVariation && selectedVariation.price_adjustment !== 0 && (
                <div className="text-sm text-gray-500">
                  Preço base: R$ {basePrice.toFixed(2).replace('.', ',')}
                  {selectedVariation.price_adjustment > 0 ? ' + ' : ' - '}
                  R$ {Math.abs(selectedVariation.price_adjustment).toFixed(2).replace('.', ',')}
                </div>
              )}
              {isWholesale && product.retail_price !== basePrice && (
                <div className="text-sm text-gray-500">
                  Varejo: R$ {product.retail_price.toFixed(2).replace('.', ',')}
                </div>
              )}
              {isWholesale && minQty > 1 && (
                <div className="text-sm text-orange-600">
                  Quantidade mínima: {minQty} unidades
                </div>
              )}
            </div>

            {/* Estoque */}
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4" />
              {availableStock > 0 ? (
                <span className="text-green-600">
                  {availableStock} em estoque
                  {selectedVariation && (
                    <span className="text-gray-500 ml-1">
                      (desta variação)
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-red-600">Fora de estoque</span>
              )}
            </div>

            {/* Seleção de Variações */}
            {hasVariations && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">Selecione as opções:</h3>
                  <ProductVariationSelector
                    variations={variations}
                    selectedVariation={selectedVariation}
                    onVariationChange={handleVariationChange}
                    loading={variationsLoading}
                  />
                </div>
                
                {/* Erro de variação obrigatória */}
                {showVariationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Por favor, selecione uma opção antes de adicionar ao carrinho.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Descrição */}
            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Controles de Quantidade */}
            {!isOutOfStock && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quantidade
                  </label>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= minQty}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-16 text-center font-medium">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= availableStock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {minQty > 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Mínimo: {minQty} unidades
                    </p>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleAddToCart}
                    className="w-full"
                    size="lg"
                    disabled={!canAddToCart}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Adicionar ao Carrinho
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleAddToWishlist}
                    className="w-full"
                    size="lg"
                  >
                    <Heart className={`h-5 w-5 mr-2 ${isInWishlist ? 'fill-current' : ''}`} />
                    {isInWishlist ? 'Remover da Lista' : 'Adicionar à Lista de Desejos'}
                  </Button>
                </div>
              </div>
            )}

            {/* Produto Fora de Estoque */}
            {isOutOfStock && (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-gray-600 mb-3">
                  {selectedVariation 
                    ? 'Esta variação está temporariamente fora de estoque'
                    : 'Este produto está temporariamente fora de estoque'
                  }
                </p>
                <Button
                  variant="outline"
                  onClick={handleAddToWishlist}
                  className="w-full"
                >
                  <Heart className={`h-5 w-5 mr-2 ${isInWishlist ? 'fill-current' : ''}`} />
                  Adicionar à Lista de Desejos
                </Button>
              </div>
            )}

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <strong>🐛 DEBUG MODAL:</strong>
                <div>Variações carregadas: {variations?.length || 0}</div>
                <div>Variação selecionada: {selectedVariation ? `${selectedVariation.color || 'S/C'} ${selectedVariation.size || 'S/T'}` : 'Nenhuma'}</div>
                <div>Requer seleção: {requiresVariationSelection ? 'Sim' : 'Não'}</div>
                <div>Pode adicionar: {canAddToCart ? 'Sim' : 'Não'}</div>
                <div>Estoque disponível: {availableStock}</div>
                <div>Preço final: R$ {finalPrice.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
