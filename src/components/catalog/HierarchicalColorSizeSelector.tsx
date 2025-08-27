import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Plus, Minus, Package, ArrowLeft, Palette, Ruler, CheckCircle2 } from 'lucide-react';
import { Product, ProductVariation } from '@/types/product';
import { CatalogType } from '@/hooks/useCatalog';
import ColorStep from './ColorStep';
import SizeStep from './SizeStep';
import { useToast } from '@/components/ui/use-toast';

interface HierarchicalColorSizeSelectorProps {
  product: Product;
  variations: ProductVariation[];
  onAddToCart: (selections: VariationSelection[]) => void;
  catalogType: CatalogType;
  showStock?: boolean;
}

interface VariationSelection {
  variation: ProductVariation;
  quantity: number;
}

interface ColorGroup {
  color: string;
  totalStock: number;
  variations: ProductVariation[];
  isAvailable: boolean;
}

interface SizeGroup {
  size: string;
  variation: ProductVariation;
  isAvailable: boolean;
}

const HierarchicalColorSizeSelector: React.FC<HierarchicalColorSizeSelectorProps> = ({
  product,
  variations,
  onAddToCart,
  catalogType,
  showStock = true
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'color' | 'size' | 'quantity'>('color');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<VariationSelection[]>([]);

  // Agrupar variações por cor
  const colorGroups = useMemo<ColorGroup[]>(() => {
    const groups = variations.reduce<Record<string, ColorGroup>>((acc, variation) => {
      const color = variation.color || 'Sem cor';
      
      if (!acc[color]) {
        acc[color] = {
          color,
          totalStock: 0,
          variations: [],
          isAvailable: false,
        };
      }
      
      acc[color].totalStock += variation.stock || 0;
      acc[color].variations.push(variation);
      acc[color].isAvailable = acc[color].totalStock > 0;
      
      return acc;
    }, {});
    
    return Object.values(groups).sort((a, b) => b.totalStock - a.totalStock);
  }, [variations]);

  // Obter tamanhos disponíveis para a cor selecionada
  const availableSizes = useMemo<SizeGroup[]>(() => {
    if (!selectedColor) return [];
    
    const colorGroup = colorGroups.find(group => group.color === selectedColor);
    if (!colorGroup) return [];
    
    return colorGroup.variations
      .map(variation => ({
        size: variation.size || 'Único',
        variation,
        isAvailable: (variation.stock || 0) > 0,
      }))
      .sort((a, b) => {
        // Ordenar tamanhos numericamente quando possível
        const aNum = parseInt(a.size);
        const bNum = parseInt(b.size);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.size.localeCompare(b.size);
      });
  }, [selectedColor, colorGroups]);

  // Preço baseado no catálogo
  const getVariationPrice = (variation: ProductVariation) => {
    // As variações usam price_adjustment sobre o preço base do produto
    const basePrice = catalogType === 'wholesale' && product.wholesale_price 
      ? product.wholesale_price 
      : product.retail_price;
    
    return basePrice + (variation.price_adjustment || 0);
  };

  // Quantidade mínima
  const minQuantity = catalogType === 'wholesale' && product.min_wholesale_qty 
    ? product.min_wholesale_qty 
    : 1;

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setSelectedSize(null);
    setSelectedVariation(null);
    setStep('size');
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const variation = availableSizes.find(s => s.size === size)?.variation;
    setSelectedVariation(variation || null);
    setQuantity(minQuantity);
    setStep('quantity');
  };

  const handleAddToSelection = () => {
    if (!selectedVariation) return;

    const maxStock = selectedVariation.stock || 0;
    if (quantity > maxStock) {
      toast({
        title: "Quantidade indisponível",
        description: `Estoque máximo disponível: ${maxStock} unidades`,
        variant: "destructive",
      });
      return;
    }

    const newSelection: VariationSelection = {
      variation: selectedVariation,
      quantity,
    };

    setCart(prev => {
      const existingIndex = prev.findIndex(
        item => item.variation.id === selectedVariation.id
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      
      return [...prev, newSelection];
    });

    toast({
      title: "Produto adicionado",
      description: `${quantity}x ${selectedColor} - ${selectedSize}`,
    });

    // Reset para permitir nova seleção
    setStep('color');
    setSelectedColor(null);
    setSelectedSize(null);
    setSelectedVariation(null);
    setQuantity(1);
  };

  const handleRemoveFromCart = (variationId: string) => {
    setCart(prev => prev.filter(item => item.variation.id !== variationId));
  };

  const handleFinalize = () => {
    if (cart.length === 0) return;
    onAddToCart(cart);
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const price = getVariationPrice(item.variation);
    return sum + (price * item.quantity);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          step === 'color' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          <Palette className="h-4 w-4" />
        </div>
        <div className="w-8 h-0.5 bg-muted" />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          step === 'size' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          <Ruler className="h-4 w-4" />
        </div>
        <div className="w-8 h-0.5 bg-muted" />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          step === 'quantity' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          <Package className="h-4 w-4" />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {step === 'color' && (
          <ColorStep
            colorGroups={colorGroups}
            selectedColor={selectedColor}
            onColorSelect={handleColorSelect}
            showStock={showStock}
          />
        )}

        {step === 'size' && selectedColor && (
          <SizeStep
            sizeGroups={availableSizes}
            selectedSize={selectedSize}
            onSizeSelect={handleSizeSelect}
            onBack={() => setStep('color')}
            selectedColor={selectedColor}
            showStock={showStock}
          />
        )}

        {step === 'quantity' && selectedVariation && (
          <div className="space-y-6">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStep('size')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos tamanhos
            </Button>

            {/* Selected Variation Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                  style={{ backgroundColor: selectedVariation.hex_color || '#666' }}
                />
                <div>
                  <span className="font-semibold">{selectedColor}</span>
                  <span className="mx-2">•</span>
                  <span className="font-semibold">{selectedSize}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-primary">
                  R$ {getVariationPrice(selectedVariation).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                {showStock && (
                  <Badge variant="outline" className="text-sm">
                    {selectedVariation.stock} disponível
                  </Badge>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Quantidade</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                  disabled={quantity <= minQuantity}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || minQuantity;
                    const maxStock = selectedVariation.stock || 0;
                    setQuantity(Math.min(maxStock, Math.max(minQuantity, val)));
                  }}
                  className="w-20 text-center"
                  min={minQuantity}
                  max={selectedVariation.stock || 0}
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const maxStock = selectedVariation.stock || 0;
                    setQuantity(Math.min(maxStock, quantity + 1));
                  }}
                  disabled={quantity >= (selectedVariation.stock || 0)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {showStock && (
                <p className="text-sm text-muted-foreground">
                  Máximo disponível: {selectedVariation.stock} unidades
                </p>
              )}
            </div>

            {/* Add to Selection Button */}
            <Button 
              size="lg" 
              className="w-full"
              onClick={handleAddToSelection}
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar à Seleção
            </Button>
          </div>
        )}
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="border-t pt-6">
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Selecionados ({totalItems} itens)
            </h4>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.variation.id} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                  <div className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: item.variation.hex_color || '#666' }}
                    />
                    <span>{item.variation.color} - {item.variation.size}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.quantity}x
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFromCart(item.variation.id!)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-semibold">Total: R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <Button onClick={handleFinalize} size="lg">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HierarchicalColorSizeSelector;
