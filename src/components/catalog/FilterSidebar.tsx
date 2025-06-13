
import React, { useState, useEffect } from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useCategories } from '@/hooks/useCategories';

export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  inStock: boolean;
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFilter: (filters: FilterState) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  isOpen, 
  onClose, 
  onFilter
}) => {
  const { categories } = useCategories();
  
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    inStock: false
  });

  // Função para sanitizar e validar filtros antes de enviar
  const sanitizeFilters = (rawFilters: any) => {
    const sanitized = {
      category: rawFilters.category || null,
      minPrice: rawFilters.minPrice ? parseFloat(rawFilters.minPrice) : null,
      maxPrice: rawFilters.maxPrice ? parseFloat(rawFilters.maxPrice) : null,
      inStock: Boolean(rawFilters.inStock)
    };

    // Remover valores nulos para evitar problemas de tipo
    const cleanFilters: any = {};
    Object.entries(sanitized).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        cleanFilters[key] = value;
      }
    });

    return cleanFilters;
  };

  const applyFilters = () => {
    console.log('FilterSidebar: Aplicando filtros brutos:', filters);
    
    const sanitizedFilters = sanitizeFilters(filters);
    console.log('FilterSidebar: Filtros sanitizados:', sanitizedFilters);
    
    // Converter para formato FilterState esperado pelo Catalog.tsx
    const filterState: FilterState = {
      categories: sanitizedFilters.category ? [sanitizedFilters.category] : [],
      priceRange: [
        sanitizedFilters.minPrice || 0,
        sanitizedFilters.maxPrice || 99999
      ],
      inStock: sanitizedFilters.inStock
    };
    
    onFilter(filterState);
    onClose();
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: '',
      minPrice: '',
      maxPrice: '',
      inStock: false
    };
    
    setFilters(clearedFilters);
    
    // Aplicar filtros limpos imediatamente
    const filterState: FilterState = {
      categories: [],
      priceRange: [0, 99999],
      inStock: false
    };
    
    console.log('FilterSidebar: Limpando filtros:', filterState);
    onFilter(filterState);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Overlay para mobile */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 lg:hidden" 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:shadow-none lg:w-full">
        <Card className="h-full rounded-none lg:rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter size={20} />
              Filtros
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="lg:hidden"
            >
              <X size={16} />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Categoria */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Categoria</Label>
              <select 
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <Separator />

            {/* Faixa de Preço */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Faixa de Preço</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="minPrice" className="text-xs text-gray-600">
                    Preço mínimo
                  </Label>
                  <Input
                    id="minPrice"
                    type="number"
                    placeholder="R$ 0"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="maxPrice" className="text-xs text-gray-600">
                    Preço máximo
                  </Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    placeholder="R$ 1000"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Disponibilidade */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Disponibilidade</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inStock"
                  checked={filters.inStock}
                  onCheckedChange={(checked) => 
                    setFilters({...filters, inStock: checked as boolean})
                  }
                />
                <Label htmlFor="inStock" className="text-sm">
                  Apenas produtos em estoque
                </Label>
              </div>
            </div>

            <Separator />

            {/* Botões de Ação */}
            <div className="space-y-2 pt-4">
              <Button 
                onClick={applyFilters}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Aplicar Filtros
              </Button>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FilterSidebar;
