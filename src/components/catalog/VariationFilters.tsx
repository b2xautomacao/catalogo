
import React, { useState, useMemo } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

interface VariationFiltersProps {
  products: any[];
  onFilterChange: (filters: VariationFilterState) => void;
}

export interface VariationFilterState {
  sizes: string[];
  colors: string[];
  materials: string[];
  [key: string]: string[];
}

const VariationFilters: React.FC<VariationFiltersProps> = ({
  products,
  onFilterChange
}) => {
  const [filters, setFilters] = useState<VariationFilterState>({
    sizes: [],
    colors: [],
    materials: []
  });
  const [openSections, setOpenSections] = useState<string[]>(['sizes', 'colors']);

  // Extrair variações únicas dos produtos
  const availableVariations = useMemo(() => {
    const variations = {
      sizes: new Set<string>(),
      colors: new Set<string>(),
      materials: new Set<string>()
    };

    products.forEach(product => {
      if (product.variations && Array.isArray(product.variations)) {
        product.variations.forEach((variation: any) => {
          if (variation.size) variations.sizes.add(variation.size);
          if (variation.color) variations.colors.add(variation.color);
          if (variation.material) variations.materials.add(variation.material);
        });
      }
    });

    return {
      sizes: Array.from(variations.sizes).sort(),
      colors: Array.from(variations.colors).sort(),
      materials: Array.from(variations.materials).sort()
    };
  }, [products]);

  const handleFilterChange = (category: keyof VariationFilterState, value: string, checked: boolean) => {
    const newFilters = { ...filters };
    
    if (checked) {
      newFilters[category] = [...newFilters[category], value];
    } else {
      newFilters[category] = newFilters[category].filter(item => item !== value);
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      sizes: [],
      colors: [],
      materials: []
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const activeFiltersCount = Object.values(filters).flat().length;

  if (!availableVariations.sizes.length && !availableVariations.colors.length && !availableVariations.materials.length) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-medium">Filtrar por Variações</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            Limpar
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {/* Tamanhos */}
        {availableVariations.sizes.length > 0 && (
          <Collapsible
            open={openSections.includes('sizes')}
            onOpenChange={() => toggleSection('sizes')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="text-sm font-medium">Tamanhos</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${
                  openSections.includes('sizes') ? 'rotate-180' : ''
                }`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {availableVariations.sizes.map(size => (
                  <label
                    key={size}
                    className="flex items-center space-x-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.sizes.includes(size)}
                      onCheckedChange={(checked) => 
                        handleFilterChange('sizes', size, checked as boolean)
                      }
                    />
                    <span>{size}</span>
                  </label>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Cores */}
        {availableVariations.colors.length > 0 && (
          <Collapsible
            open={openSections.includes('colors')}
            onOpenChange={() => toggleSection('colors')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="text-sm font-medium">Cores</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${
                  openSections.includes('colors') ? 'rotate-180' : ''
                }`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              <div className="space-y-2">
                {availableVariations.colors.map(color => (
                  <label
                    key={color}
                    className="flex items-center space-x-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.colors.includes(color)}
                      onCheckedChange={(checked) => 
                        handleFilterChange('colors', color, checked as boolean)
                      }
                    />
                    <span>{color}</span>
                  </label>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Materiais */}
        {availableVariations.materials.length > 0 && (
          <Collapsible
            open={openSections.includes('materials')}
            onOpenChange={() => toggleSection('materials')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="text-sm font-medium">Materiais</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${
                  openSections.includes('materials') ? 'rotate-180' : ''
                }`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              <div className="space-y-2">
                {availableVariations.materials.map(material => (
                  <label
                    key={material}
                    className="flex items-center space-x-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.materials.includes(material)}
                      onCheckedChange={(checked) => 
                        handleFilterChange('materials', material, checked as boolean)
                      }
                    />
                    <span>{material}</span>
                  </label>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
};

export default VariationFilters;
