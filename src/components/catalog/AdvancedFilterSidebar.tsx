
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Filter, 
  X, 
  Package, 
  DollarSign, 
  Tag, 
  Palette, 
  Ruler,
  RotateCcw 
} from 'lucide-react';

interface FilterOptions {
  categories: string[];
  priceRange: [number, number];
  inStock: boolean;
  colors: string[];
  sizes: string[];
}

interface AdvancedFilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  availableCategories: string[];
  availableColors: string[];
  availableSizes: string[];
  priceRange: [number, number];
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  activeFilters: Partial<FilterOptions>;
}

const AdvancedFilterSidebar: React.FC<AdvancedFilterSidebarProps> = ({
  isOpen,
  onClose,
  availableCategories,
  availableColors,
  availableSizes,
  priceRange,
  onFilterChange,
  activeFilters,
}) => {
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(
    activeFilters.priceRange || priceRange
  );

  const handleCategoryToggle = (category: string) => {
    const currentCategories = activeFilters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    onFilterChange({ categories: newCategories });
  };

  const handleColorToggle = (color: string) => {
    const currentColors = activeFilters.colors || [];
    const newColors = currentColors.includes(color)
      ? currentColors.filter(c => c !== color)
      : [...currentColors, color];
    
    onFilterChange({ colors: newColors });
  };

  const handleSizeToggle = (size: string) => {
    const currentSizes = activeFilters.sizes || [];
    const newSizes = currentSizes.includes(size)
      ? currentSizes.filter(s => s !== size)
      : [...currentSizes, size];
    
    onFilterChange({ sizes: newSizes });
  };

  const handlePriceRangeChange = (values: number[]) => {
    const newRange: [number, number] = [values[0], values[1]];
    setLocalPriceRange(newRange);
    onFilterChange({ priceRange: newRange });
  };

  const clearAllFilters = () => {
    setLocalPriceRange(priceRange);
    onFilterChange({
      categories: [],
      colors: [],
      sizes: [],
      priceRange: priceRange,
      inStock: false
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.categories?.length) count += activeFilters.categories.length;
    if (activeFilters.colors?.length) count += activeFilters.colors.length;  
    if (activeFilters.sizes?.length) count += activeFilters.sizes.length;
    if (activeFilters.inStock) count += 1;
    if (activeFilters.priceRange && 
        (activeFilters.priceRange[0] !== priceRange[0] || activeFilters.priceRange[1] !== priceRange[1])) {
      count += 1;
    }
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Overlay para mobile */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-lg lg:relative lg:w-full lg:h-auto lg:shadow-none">
        <Card className="h-full rounded-none border-0 lg:rounded-lg lg:border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtros
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {getActiveFilterCount() > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-8 px-2"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-120px)] lg:h-[60vh] px-6">
              <div className="space-y-6 pb-6">
                
                {/* Filtro de Estoque */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Disponibilidade
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inStock"
                      checked={activeFilters.inStock || false}
                      onCheckedChange={(checked) => 
                        onFilterChange({ inStock: checked as boolean })
                      }
                    />
                    <label htmlFor="inStock" className="text-sm cursor-pointer">
                      Apenas produtos em estoque
                    </label>
                  </div>
                </div>

                <Separator />

                {/* Filtro de Faixa de Preço */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Faixa de Preço
                  </h4>
                  <div className="px-2">
                    <Slider
                      value={localPriceRange}
                      onValueChange={handlePriceRangeChange}
                      max={priceRange[1]}
                      min={priceRange[0]}
                      step={1}
                      className="mb-3"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>R$ {localPriceRange[0]}</span>
                      <span>R$ {localPriceRange[1]}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Filtro de Categorias */}
                {availableCategories.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        Categorias
                      </h4>
                      <div className="space-y-2">
                        {availableCategories.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category}`}
                              checked={activeFilters.categories?.includes(category) || false}
                              onCheckedChange={() => handleCategoryToggle(category)}
                            />
                            <label 
                              htmlFor={`category-${category}`} 
                              className="text-sm cursor-pointer flex-1"
                            >
                              {category}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Filtro de Cores */}
                {availableColors.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Palette className="h-4 w-4 text-primary" />
                        Cores
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {availableColors.map((color) => (
                          <div 
                            key={color} 
                            className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${
                              activeFilters.colors?.includes(color) 
                                ? 'bg-primary/10 border border-primary' 
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => handleColorToggle(color)}
                          >
                            <div 
                              className="w-4 h-4 rounded-full border border-border shadow-sm"
                              style={{ backgroundColor: color.toLowerCase() }}
                            />
                            <span className="text-sm flex-1">{color}</span>
                            {activeFilters.colors?.includes(color) && (
                              <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Filtro de Tamanhos */}
                {availableSizes.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-primary" />
                      Tamanhos
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSizes.map((size) => (
                        <Button
                          key={size}
                          variant={activeFilters.sizes?.includes(size) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSizeToggle(size)}
                          className="h-10"
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedFilterSidebar;
