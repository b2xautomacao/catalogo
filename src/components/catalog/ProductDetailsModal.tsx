
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Package, Truck, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Product, ProductVariation } from '@/types/product';
import { CatalogType } from '@/hooks/useCatalog';
import ProductImageGallery from '@/components/products/ProductImageGallery';
import HierarchicalColorSizeSelector from './HierarchicalColorSizeSelector';
import ProductVariationSelector from './ProductVariationSelector';
import { useProductDisplayPrice } from '@/hooks/useProductDisplayPrice';
import { formatCurrency } from '@/lib/utils';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number, variation?: ProductVariation) => void;
  catalogType: CatalogType;
  showStock?: boolean;
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
  showStock = true
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);

  if (!product) return null;

  const priceInfo = useProductDisplayPrice({
    product,
    catalogType,
    quantity: 1,
  });

  const price = priceInfo.displayPrice;
  const minQuantity = priceInfo.minQuantity;

  // Detectar se há variações de grade
  const hasVariations = product.variations && product.variations.length > 0;
  const hasGradeVariations = hasVariations && product.variations?.some(v => 
    v.is_grade || v.variation_type === 'grade'
  );

  const handleMultipleAddToCart = (selections: VariationSelection[]) => {
    if (selections.length === 0) return;
    
    selections.forEach(({ variation, quantity }) => {
      onAddToCart(product, quantity, variation);
    });
    
    onClose();
  };

  const handleSingleVariationAddToCart = (variation: ProductVariation) => {
    onAddToCart(product, minQuantity, variation);
    onClose();
  };

  const handleSimpleAddToCart = () => {
    onAddToCart(product, minQuantity);
    onClose();
  };

  const isDescriptionLong = product.description && product.description.length > 120;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
        {/* Header Fixo */}
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10 p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold text-left pr-8 line-clamp-2">
              {product.name}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="p-6 pt-2">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Galeria de Imagens */}
              <div className="order-1">
                <ProductImageGallery
                  productId={product.id || ''}
                  productName={product.name}
                />
              </div>

              {/* Informações do Produto */}
              <div className="order-2 space-y-6">
                {/* Preço e Categoria */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="space-y-1">
                      <div className="text-3xl md:text-4xl font-bold text-primary">
                        {formatCurrency(price)}
                      </div>
                      
                      {/* Mostrar preço original apenas se for diferente e maior que zero */}
                      {priceInfo.shouldShowRetailPrice && 
                       priceInfo.originalPrice !== price && 
                       priceInfo.originalPrice > 0 && (
                        <div className="text-sm text-muted-foreground line-through">
                          Varejo: {formatCurrency(priceInfo.originalPrice)}
                        </div>
                      )}
                    </div>
                    {product.category && (
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Informações de atacado */}
                  {priceInfo.isWholesaleOnly && minQuantity > 1 && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
                      <Package className="h-4 w-4" />
                      <span>Quantidade mínima: {minQuantity} unidades</span>
                    </div>
                  )}
                  
                  {!priceInfo.isWholesaleOnly && catalogType === 'wholesale' && minQuantity > 1 && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
                      <Package className="h-4 w-4" />
                      <span>Quantidade mínima para atacado: {minQuantity} unidades</span>
                    </div>
                  )}
                </div>

                {/* Descrição Compacta */}
                {product.description && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-base">Sobre o produto</h3>
                    <div>
                      <p className={`text-sm text-muted-foreground leading-relaxed ${
                        !showFullDescription && isDescriptionLong ? 'line-clamp-2' : ''
                      }`}>
                        {product.description}
                      </p>
                      {isDescriptionLong && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setShowFullDescription(!showFullDescription)}
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
                        <h4 className="font-medium text-base">Selecione a grade:</h4>
                        <ProductVariationSelector
                          variations={product.variations || []}
                          selectedVariation={selectedVariation}
                          onVariationChange={setSelectedVariation}
                          basePrice={price}
                          showPriceInCards={false}
                        />
                        
                        {/* Botões para variação de grade */}
                        <div className="space-y-3 pt-4">
                          <Button 
                            size="lg" 
                            className="w-full h-12 text-base"
                            onClick={() => selectedVariation && handleSingleVariationAddToCart(selectedVariation)}
                            disabled={!selectedVariation}
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
                      </div>
                    ) : (
                      // Usar HierarchicalColorSizeSelector para variações tradicionais
                      <HierarchicalColorSizeSelector
                        product={product}
                        variations={product.variations || []}
                        onAddToCart={handleMultipleAddToCart}
                        catalogType={catalogType}
                        showStock={showStock}
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
                  <h4 className="font-medium text-sm text-muted-foreground">Benefícios da compra</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3 text-green-600">
                      <Truck className="h-4 w-4 flex-shrink-0" />
                      <span>Entrega rápida disponível</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-600">
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      <span>Compra 100% protegida</span>
                    </div>
                    {showStock && (
                      <div className="flex items-center gap-3 text-purple-600">
                        <Package className="h-4 w-4 flex-shrink-0" />
                        <span>Estoque disponível</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
