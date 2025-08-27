
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Product } from '@/types/product';
import { X } from 'lucide-react';

interface AdvancedFilterSidebarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  selectedColors: string[];
  onColorsChange: (colors: string[]) => void;
  selectedSizes: string[];
  onSizesChange: (sizes: string[]) => void;
  showInStock: boolean;
  onShowInStockChange: (show: boolean) => void;
  products: Product[];
  onClearFilters: () => void;
}

const AdvancedFilterSidebar: React.FC<AdvancedFilterSidebarProps> = ({
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  selectedColors,
  onColorsChange,
  selectedSizes,
  onSizesChange,
  showInStock,
  onShowInStockChange,
  products,
  onClearFilters
}) => {
  // Extrair categorias únicas dos produtos
  const categories = React.useMemo(() => {
    const categorySet = new Set<string>();
    products.forEach(product => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [products]);

  // Extrair cores únicas das variações
  const availableColors = React.useMemo(() => {
    const colorSet = new Set<string>();
    products.forEach(product => {
      if (product.variations) {
        product.variations.forEach(variation => {
          if (variation.color) {
            colorSet.add(variation.color);
          }
        });
      }
    });
    return Array.from(colorSet).sort();
  }, [products]);

  // Extrair tamanhos únicos das variações
  const availableSizes = React.useMemo(() => {
    const sizeSet = new Set<string>();
    products.forEach(product => {
      if (product.variations) {
        product.variations.forEach(variation => {
          if (variation.size) {
            sizeSet.add(variation.size);
          }
        });
      }
    });
    return Array.from(sizeSet).sort();
  }, [products]);

  const handleColorToggle = (color: string) => {
    const newColors = selectedColors.includes(color)
      ? selectedColors.filter(c => c !== color)
      : [...selectedColors, color];
    onColorsChange(newColors);
  };

  const handleSizeToggle = (size: string) => {
    const newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter(s => s !== size)
      : [...selectedSizes, size];
    onSizesChange(newSizes);
  };

  return (
    <div className="space-y-6">
      {/* Header com botão limpar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtros</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-sm"
        >
          <X className="w-4 h-4 mr-1" />
          Limpar
        </Button>
      </div>

      {/* Filtro por Categoria */}
      {categories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Categorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => onCategoryChange('')}
            >
              Todas as categorias
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filtro de Preço */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Faixa de Preço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Slider
              value={priceRange}
              onValueChange={(value) => onPriceRangeChange(value as [number, number])}
              max={1000}
              min={0}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>R$ {priceRange[0]}</span>
              <span>R$ {priceRange[1]}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtro por Cores */}
      {availableColors.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableColors.map(color => (
                <Badge
                  key={color}
                  variant={selectedColors.includes(color) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => handleColorToggle(color)}
                >
                  {color}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtro por Tamanhos */}
      {availableSizes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tamanhos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map(size => (
                <Badge
                  key={size}
                  variant={selectedSizes.includes(size) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => handleSizeToggle(size)}
                >
                  {size}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtro de Estoque */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Disponibilidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="in-stock"
              checked={showInStock}
              onCheckedChange={onShowInStockChange}
            />
            <Label htmlFor="in-stock" className="text-sm">
              Apenas produtos em estoque
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedFilterSidebar;
