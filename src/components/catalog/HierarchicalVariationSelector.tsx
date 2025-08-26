
import React, { useState, useMemo, useEffect } from 'react';
import { ProductVariation } from '@/types/product';
import ColorStep from './ColorStep';
import SizeStep from './SizeStep';

interface ColorGroup {
  color: string;
  totalStock: number;
  variations: ProductVariation[];
  isAvailable: boolean;
}

interface HierarchicalVariationSelectorProps {
  variations: ProductVariation[];
  selectedVariation: ProductVariation | null;
  onVariationChange: (variation: ProductVariation | null) => void;
  loading?: boolean;
}

const HierarchicalVariationSelector: React.FC<HierarchicalVariationSelectorProps> = ({
  variations,
  selectedVariation,
  onVariationChange,
  loading = false,
}) => {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [step, setStep] = useState<'color' | 'size'>('color');

  // Sincronizar com variação selecionada externamente
  useEffect(() => {
    if (selectedVariation?.color && selectedVariation.color !== selectedColor) {
      setSelectedColor(selectedVariation.color);
      setStep('size');
    }
  }, [selectedVariation, selectedColor]);

  // Agrupar variações por cor
  const colorGroups: ColorGroup[] = useMemo(() => {
    if (!variations || variations.length === 0) return [];

    const groups = new Map<string, ColorGroup>();

    variations.forEach((variation) => {
      const color = variation.color || 'Sem cor';
      
      if (!groups.has(color)) {
        groups.set(color, {
          color,
          totalStock: 0,
          variations: [],
          isAvailable: false,
        });
      }

      const group = groups.get(color)!;
      group.variations.push(variation);
      group.totalStock += variation.stock;
      if (variation.stock > 0) {
        group.isAvailable = true;
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      // Ordenar por disponibilidade primeiro, depois por nome
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return a.color.localeCompare(b.color);
    });
  }, [variations]);

  // Obter variações disponíveis para a cor selecionada
  const availableVariationsForColor = useMemo(() => {
    if (!selectedColor || !variations) return [];
    
    return variations
      .filter(v => v.color === selectedColor)
      .sort((a, b) => {
        // Ordenar por disponibilidade primeiro, depois por tamanho
        if (a.stock > 0 && b.stock === 0) return -1;
        if (a.stock === 0 && b.stock > 0) return 1;
        
        // Ordenação numérica de tamanhos se possível
        const sizeA = parseFloat(a.size || '0') || 999;
        const sizeB = parseFloat(b.size || '0') || 999;
        return sizeA - sizeB;
      });
  }, [variations, selectedColor]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setStep('size');
    
    // Limpar seleção atual se for de cor diferente
    if (selectedVariation?.color !== color) {
      onVariationChange(null);
    }
  };

  const handleVariationSelect = (variation: ProductVariation) => {
    onVariationChange(variation);
  };

  const handleBackToColors = () => {
    setStep('color');
    setSelectedColor(null);
    onVariationChange(null);
  };

  // Se não há variações ou loading
  if (loading || !variations || variations.length === 0) {
    return (
      <ColorStep
        colorGroups={[]}
        selectedColor={null}
        onColorSelect={() => {}}
        loading={loading}
      />
    );
  }

  // Verificar se todas as variações têm a mesma cor (não precisa de seleção hierárquica)
  const uniqueColors = [...new Set(variations.map(v => v.color))].filter(Boolean);
  
  if (uniqueColors.length <= 1) {
    // Se há apenas uma cor ou nenhuma cor, pular para seleção de tamanho
    const singleColor = uniqueColors[0] || 'Padrão';
    
    return (
      <div className="space-y-4">
        <SizeStep
          selectedColor={singleColor}
          availableVariations={variations}
          selectedVariation={selectedVariation}
          onVariationSelect={handleVariationSelect}
          onBackToColors={() => {}} // Não há volta se só tem uma cor
          loading={loading}
        />
      </div>
    );
  }

  // Renderizar etapa atual
  if (step === 'color' || !selectedColor) {
    return (
      <ColorStep
        colorGroups={colorGroups}
        selectedColor={selectedColor}
        onColorSelect={handleColorSelect}
        loading={loading}
      />
    );
  }

  return (
    <SizeStep
      selectedColor={selectedColor}
      availableVariations={availableVariationsForColor}
      selectedVariation={selectedVariation}
      onVariationSelect={handleVariationSelect}
      onBackToColors={handleBackToColors}
      loading={loading}
    />
  );
};

export default HierarchicalVariationSelector;
