
import React, { useState } from 'react';
import { ProductVariation } from '@/types/product';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Plus, Minus, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GradeConfigurationFormProps {
  variations: ProductVariation[];
  onVariationsGenerated: (variations: ProductVariation[]) => void;
  productId?: string;
  storeId?: string;
}

const GradeConfigurationForm: React.FC<GradeConfigurationFormProps> = ({
  variations,
  onVariationsGenerated,
  productId,
  storeId
}) => {
  const { toast } = useToast();
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [pairsPerSize, setPairsPerSize] = useState<number>(1);

  const commonColors = [
    'Preto', 'Branco', 'Azul', 'Vermelho', 'Verde',
    'Amarelo', 'Rosa', 'Roxo', 'Marrom', 'Cinza'
  ];

  const commonSizes = [
    '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'
  ];

  const gradeTemplates = [
    { name: 'Grade Baixa', sizes: ['35', '36', '37', '38', '39'] },
    { name: 'Grade Média', sizes: ['34', '35', '36', '37', '38', '39', '40'] },
    { name: 'Grade Alta', sizes: ['36', '37', '38', '39', '40', '41', '42'] },
    { name: 'Grade Masculina', sizes: ['38', '39', '40', '41', '42', '43', '44'] },
    { name: 'Grade Infantil', sizes: ['20', '21', '22', '23', '24', '25', '26'] }
  ];

  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const addCustomColor = () => {
    if (customColor.trim() && !selectedColors.includes(customColor.trim())) {
      setSelectedColors(prev => [...prev, customColor.trim()]);
      setCustomColor('');
    }
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const applyGradeTemplate = (template: typeof gradeTemplates[0]) => {
    setSelectedSizes(template.sizes);
  };

  const generateVariations = () => {
    if (selectedColors.length === 0 || selectedSizes.length === 0) {
      toast({
        title: "Configuração incompleta",
        description: "Selecione pelo menos uma cor e um tamanho.",
        variant: "destructive"
      });
      return;
    }

    const newVariations: ProductVariation[] = [];

    selectedColors.forEach(color => {
      selectedSizes.forEach(size => {
        const uniqueId = `variation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        newVariations.push({
          id: uniqueId,
          product_id: productId || '',
          color,
          size,
          stock: pairsPerSize,
          price_adjustment: 0,
          is_active: true,
          sku: `${color.toLowerCase()}-${size}`,
          image_url: '',
          variation_type: 'grade',
          is_grade: true,
          grade_name: `Grade ${color}`,
          grade_sizes: selectedSizes,
          grade_pairs: selectedSizes.map(() => pairsPerSize),
          grade_quantity: selectedSizes.length * pairsPerSize,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
    });

    onVariationsGenerated(newVariations);

    toast({
      title: "Grade criada com sucesso!",
      description: `${newVariations.length} variações foram geradas.`
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Configuração de Grades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de Cores */}
          <div>
            <Label className="text-base font-semibold">1. Escolha as Cores</Label>
            <p className="text-sm text-gray-600 mb-3">
              Selecione as cores disponíveis para este produto
            </p>
            
            <div className="grid grid-cols-5 gap-2 mb-4">
              {commonColors.map(color => (
                <Button
                  key={color}
                  variant={selectedColors.includes(color) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleColor(color)}
                  className="text-xs"
                >
                  {color}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Cor personalizada"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomColor()}
              />
              <Button onClick={addCustomColor} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {selectedColors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-2">Cores selecionadas:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedColors.map(color => (
                    <Badge 
                      key={color} 
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => toggleColor(color)}
                    >
                      {color} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Templates de Grade */}
          <div>
            <Label className="text-base font-semibold">2. Escolha a Grade de Tamanhos</Label>
            <p className="text-sm text-gray-600 mb-3">
              Use um template pronto ou selecione tamanhos individuais
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
              {gradeTemplates.map(template => (
                <Button
                  key={template.name}
                  variant="outline"
                  size="sm"
                  onClick={() => applyGradeTemplate(template)}
                  className="justify-start"
                >
                  <Package className="w-4 h-4 mr-2" />
                  {template.name}
                  <Badge variant="secondary" className="ml-auto">
                    {template.sizes.length}
                  </Badge>
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
              {commonSizes.map(size => (
                <Button
                  key={size}
                  variant={selectedSizes.includes(size) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>

            {selectedSizes.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-2">Tamanhos selecionados:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSizes.map(size => (
                    <Badge 
                      key={size} 
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => toggleSize(size)}
                    >
                      {size} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quantidade por Tamanho */}
          <div>
            <Label className="text-base font-semibold">3. Pares por Tamanho</Label>
            <p className="text-sm text-gray-600 mb-3">
              Quantos pares de cada tamanho você terá em estoque?
            </p>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPairsPerSize(Math.max(1, pairsPerSize - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[3rem] text-center">
                {pairsPerSize}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPairsPerSize(pairsPerSize + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">pares por tamanho</span>
            </div>
          </div>

          {/* Resumo */}
          {selectedColors.length > 0 && selectedSizes.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Resumo da Grade:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Cores: </span>
                  <span className="font-medium">{selectedColors.length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Tamanhos: </span>
                  <span className="font-medium">{selectedSizes.length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Pares por tamanho: </span>
                  <span className="font-medium">{pairsPerSize}</span>
                </div>
                <div>
                  <span className="text-blue-700">Total de variações: </span>
                  <span className="font-medium text-blue-900">
                    {selectedColors.length * selectedSizes.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Botão de Geração */}
          <div className="pt-4">
            <Button
              onClick={generateVariations}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
              disabled={selectedColors.length === 0 || selectedSizes.length === 0}
            >
              <Package className="w-5 h-5 mr-2" />
              Gerar Grade ({selectedColors.length * selectedSizes.length} variações)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradeConfigurationForm;
