
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Trash2, RefreshCw } from 'lucide-react';
import { ProductVariation, HierarchicalVariation, VARIATION_TEMPLATES } from '@/types/variation';

interface VariationMigrationHelperProps {
  simpleVariations: ProductVariation[];
  onMigrate: (hierarchicalVariations: HierarchicalVariation[], templateKey: string) => void;
  onDeleteSimple: () => void;
}

const VariationMigrationHelper: React.FC<VariationMigrationHelperProps> = ({
  simpleVariations,
  onMigrate,
  onDeleteSimple
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analisar variações existentes para sugerir template
  const analyzeVariations = () => {
    setIsAnalyzing(true);
    
    const hasColors = simpleVariations.some(v => v.color && v.color.trim());
    const hasSizes = simpleVariations.some(v => v.size && v.size.trim());
    
    let suggestedTemplate = '';
    
    if (hasColors && hasSizes) {
      suggestedTemplate = 'color+size';
    } else if (hasColors) {
      suggestedTemplate = 'color';
    } else if (hasSizes) {
      suggestedTemplate = 'size';
    } else {
      suggestedTemplate = 'color'; // fallback
    }
    
    setSelectedTemplate(suggestedTemplate);
    setIsAnalyzing(false);
  };

  const performMigration = () => {
    if (!selectedTemplate) return;

    const template = VARIATION_TEMPLATES.find(t => 
      t.secondary 
        ? `${t.primary}+${t.secondary}` === selectedTemplate
        : t.primary === selectedTemplate
    );

    if (!template) return;

    // Agrupar variações por atributo principal
    const groupedVariations = new Map<string, ProductVariation[]>();
    
    simpleVariations.forEach(variation => {
      const primaryValue = template.primary === 'color' 
        ? variation.color || 'Sem cor'
        : variation.size || 'Sem tamanho';
      
      if (!groupedVariations.has(primaryValue)) {
        groupedVariations.set(primaryValue, []);
      }
      groupedVariations.get(primaryValue)!.push(variation);
    });

    // Converter para estrutura hierárquica
    const hierarchicalVariations: HierarchicalVariation[] = [];
    let displayOrder = 0;

    groupedVariations.forEach((variations, primaryValue) => {
      const mainVariation: HierarchicalVariation = {
        variation_type: 'main',
        variation_value: primaryValue,
        color: template.primary === 'color' ? primaryValue : null,
        size: template.primary === 'size' ? primaryValue : null,
        sku: variations[0].sku || '',
        stock: template.secondary ? 0 : variations.reduce((sum, v) => sum + v.stock, 0),
        price_adjustment: variations[0].price_adjustment || 0,
        is_active: variations.some(v => v.is_active),
        display_order: displayOrder++,
        children: []
      };

      // Se há atributo secundário, criar subvariações
      if (template.secondary) {
        mainVariation.children = variations.map((variation, index) => ({
          variation_type: 'sub' as const,
          variation_value: template.secondary === 'size' 
            ? variation.size || `Tamanho ${index + 1}`
            : variation.color || `Cor ${index + 1}`,
          color: template.secondary === 'color' 
            ? variation.color 
            : mainVariation.color,
          size: template.secondary === 'size' 
            ? variation.size 
            : mainVariation.size,
          sku: variation.sku || '',
          stock: variation.stock,
          price_adjustment: variation.price_adjustment || 0,
          is_active: variation.is_active,
          image_url: variation.image_url,
          display_order: index
        }));
      } else {
        // Se não há secundário, usar dados da primeira variação
        mainVariation.image_url = variations[0].image_url;
      }

      hierarchicalVariations.push(mainVariation);
    });

    onMigrate(hierarchicalVariations, selectedTemplate);
  };

  const selectedTemplateData = VARIATION_TEMPLATES.find(t => 
    t.secondary 
      ? `${t.primary}+${t.secondary}` === selectedTemplate
      : t.primary === selectedTemplate
  );

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="text-amber-800 flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Migração para Sistema Hierárquico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Detectamos {simpleVariations.length} variação(ões) no sistema simples. 
            Você pode migrar para o sistema hierárquico para melhor organização.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Variações Atuais (Sistema Simples)</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {simpleVariations.slice(0, 5).map((variation, index) => (
                <div key={index} className="text-sm bg-white p-2 rounded border">
                  {variation.color && <Badge variant="outline">{variation.color}</Badge>}
                  {variation.size && <Badge variant="outline">{variation.size}</Badge>}
                  <span className="ml-2">Estoque: {variation.stock}</span>
                </div>
              ))}
              {simpleVariations.length > 5 && (
                <div className="text-xs text-gray-500">
                  +{simpleVariations.length - 5} mais...
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Sugestão de Template</h4>
            <div className="space-y-3">
              <Button 
                onClick={analyzeVariations} 
                disabled={isAnalyzing}
                variant="outline"
                size="sm"
              >
                {isAnalyzing ? 'Analisando...' : 'Analisar Variações'}
              </Button>

              {selectedTemplate && selectedTemplateData && (
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-medium text-green-700">{selectedTemplateData.label}</h5>
                  <p className="text-sm text-gray-600">{selectedTemplateData.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedTemplate && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                Pronto para migrar para {selectedTemplateData?.label}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onDeleteSimple}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Apenas Deletar
              </Button>
              <Button onClick={performMigration} size="sm">
                Migrar Agora
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VariationMigrationHelper;
