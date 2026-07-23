
import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { X, Filter, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import VariationFilters, { VariationFilterState } from './VariationFilters';
import { Product } from '@/types/product';

export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  inStock: boolean;
  variations: VariationFilterState;
}

interface FilterSidebarProps {
  onFilter: (filters: FilterState) => void;
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  isMobile?: boolean;
  showCategories?: boolean;
  showPrice?: boolean;
}

const FilterSidebar: React.FC<FilterSidebarProps> = memo(({
  onFilter,
  isOpen,
  onClose,
  products = [],
  isMobile = false,
  showCategories = true,
  showPrice = true
}) => {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 1000],
    inStock: false,
    variations: {
      sizes: [],
      colors: [],
      materials: []
    }
  });

  // Memoize categorias disponíveis
  const availableCategories = useMemo(() => {
    const categories = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(categories).sort();
  }, [products]);

  // Memoize faixa de preços
  const priceRange = useMemo(() => {
    if (products.length === 0) return [0, 1000];
    
    const prices = products.map(p => p.retail_price || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    return [Math.floor(min), Math.ceil(max)];
  }, [products]);

  // Stable callback for category change
  const handleCategoryChange = useCallback((category: string, checked: boolean) => {
    setFilters(prev => {
      const newCategories = checked 
        ? [...prev.categories, category]
        : prev.categories.filter(c => c !== category);
      
      const newFilters = { ...prev, categories: newCategories };
      onFilter(newFilters);
      return newFilters;
    });
  }, [onFilter]);

  // Stable callback for price range change
  const handlePriceRangeChange = useCallback((values: number[]) => {
    setFilters(prev => {
      const newFilters = { ...prev, priceRange: values as [number, number] };
      onFilter(newFilters);
      return newFilters;
    });
  }, [onFilter]);

  // Stable callback for stock change
  const handleInStockChange = useCallback((checked: boolean) => {
    setFilters(prev => {
      const newFilters = { ...prev, inStock: checked };
      onFilter(newFilters);
      return newFilters;
    });
  }, [onFilter]);

  // Stable callback for variation filters
  const handleVariationFilterChange = useCallback((variationFilters: VariationFilterState) => {
    setFilters(prev => {
      const newFilters = { ...prev, variations: variationFilters };
      onFilter(newFilters);
      return newFilters;
    });
  }, [onFilter]);

  // Stable callback for clearing filters
  const clearAllFilters = useCallback(() => {
    const clearedFilters = {
      categories: [],
      priceRange: priceRange as [number, number],
      inStock: false,
      variations: {
        sizes: [],
        colors: [],
        materials: []
      }
    };
    setFilters(clearedFilters);
    onFilter(clearedFilters);
  }, [priceRange, onFilter]);

  // Update price range when products change
  useEffect(() => {
    if (products.length > 0) {
      setFilters(prev => ({
        ...prev,
        priceRange: priceRange as [number, number]
      }));
    }
  }, [priceRange, products.length]);

  const FilterContent = memo(() => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Filtros</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-sm"
        >
          Limpar Tudo
        </Button>
      </div>

      {/* Categorias */}
      {showCategories && availableCategories.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Categorias</h3>
          <div className="space-y-2">
            {availableCategories.map(category => (
              <label
                key={category}
                className="flex items-center space-x-2 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={filters.categories.includes(category)}
                  onCheckedChange={(checked) => 
                    handleCategoryChange(category, checked as boolean)
                  }
                />
                <span>{category}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Faixa de Preço */}
      {showPrice && <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <h3 className="font-medium">Faixa de Preço</h3>
        </div>
        <div className="px-2">
          <Slider
            value={filters.priceRange}
            onValueChange={handlePriceRangeChange}
            max={priceRange[1]}
            min={priceRange[0]}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>R$ {filters.priceRange[0]}</span>
            <span>R$ {filters.priceRange[1]}</span>
          </div>
        </div>
      </div>}

      {/* Disponibilidade */}
      <div className="space-y-3">
        <h3 className="font-medium">Disponibilidade</h3>
        <label className="flex items-center space-x-2 text-sm cursor-pointer">
          <Checkbox
            checked={filters.inStock}
            onCheckedChange={handleInStockChange}
          />
          <span>Apenas em estoque</span>
        </label>
      </div>

      {/* Filtros de Variações */}
      <VariationFilters
        products={products}
        onFilterChange={handleVariationFilterChange}
      />
    </div>
  ));

  FilterContent.displayName = 'FilterContent';

  // Mobile (Sheet)
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 h-fit sticky top-6">
      <FilterContent />
    </div>
  );
});

FilterSidebar.displayName = 'FilterSidebar';

export default FilterSidebar;
