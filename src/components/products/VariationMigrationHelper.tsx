
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowRight, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { HierarchicalVariation, VARIATION_TEMPLATES } from '@/types/variation';

interface VariationMigrationHelperProps {
  simpleVariations: any[];
  onMigrate: (hierarchicalVariations: HierarchicalVariation[], templateKey: string) => void;
  onDeleteSimple: () => void;
}

const VariationMigrationHelper: React.FC<VariationMigrationHelperProps> = ({
  simpleVariations,
  onMigrate,
  onDeleteSimple
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  console.log('🔄 MIGRATION HELPER - Renderizando:', {
    simpleVariationsCount: simpleVariations.length,
    selectedTemplate
  });

  const handleMigration = async () => {
    if (!selectedTemplate) return;

    setIsProcessing(true);
    
    try {
      const template = VARIATION_TEMPLATES.find(t => 
        t.secondary 
          ? `${t.primary}+${t.secondary}` === selectedTemplate
          : t.primary === selectedTemplate
      );

      if (!template) return;

      console.log('🔄 MIGRATION - Iniciando migração com template:', template.label);

      // Migração inteligente baseada no template selecionado
      let hierarchicalVariations: HierarchicalVariation[] = [];

      if (template.secondary) {
        // Template com atributo secundário (ex: cor + tamanho)
        const groups = new Map<string, any[]>();
        
        simpleVariations.forEach((variation, index) => {
          const primaryValue = variation[template.primary] || `${template.primary} ${index + 1}`;
          if (!groups.has(primaryValue)) {
            groups.set(primaryValue, []);
          }
          groups.get(primaryValue)!.push(variation);
        });

        // Criar variações hierárquicas
        groups.forEach((variations, primaryValue) => {
          const mainVariation: HierarchicalVariation = {
            id: `main-${Date.now()}-${Math.random()}`,
            variation_type: 'main',
            variation_value: primaryValue,
            [template.primary]: primaryValue,
            stock: 0, // Será calculado a partir das subvariações
            price_adjustment: 0,
            is_active: true,
            display_order: hierarchicalVariations.length,
            children: []
          };

          // Criar subvariações
          variations.forEach((variation, subIndex) => {
            const secondaryValue = variation[template.secondary!] || `${template.secondary} ${subIndex + 1}`;
            const subVariation: HierarchicalVariation = {
              id: `sub-${Date.now()}-${Math.random()}-${subIndex}`,
              variation_type: 'sub',
              variation_value: secondaryValue,
              [template.primary]: primaryValue,
              [template.secondary!]: secondaryValue,
              sku: variation.sku || '',
              stock: variation.stock || 0,
              price_adjustment: variation.price_adjustment || 0,
              is_active: variation.is_active !== false,
              image_url: variation.image_url,
              display_order: subIndex
            };

            mainVariation.children!.push(subVariation);
            mainVariation.stock += subVariation.stock;
          });

          hierarchicalVariations.push(mainVariation);
        });
      } else {
        // Template com apenas atributo primário
        hierarchicalVariations = simpleVariations.map((variation, index) => ({
          id: `simple-${Date.now()}-${index}`,
          variation_type: 'main' as const,
          variation_value: variation[template.primary] || `${template.primary} ${index + 1}`,
          [template.primary]: variation[template.primary] || `${template.primary} ${index + 1}`,
          sku: variation.sku || '',
          stock: variation.stock || 0,
          price_adjustment: variation.price_adjustment || 0,
          is_active: variation.is_active !== false,
          image_url: variation.image_url,
          display_order: index,
          children: []
        }));
      }

      console.log('✅ MIGRATION - Migração concluída:', {
        originalCount: simpleVariations.length,
        hierarchicalCount: hierarchicalVariations.length
      });

      onMigrate(hierarchicalVariations, selectedTemplate);
    } catch (error) {
      console.error('❌ MIGRATION - Erro durante migração:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Migração para Sistema Hierárquico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Este produto possui {simpleVariations.length} variação(ões) no sistema simples. 
            Você pode migrar para o sistema hierárquico ou remover as variações existentes.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Variações Atuais (Sistema Simples):</h4>
            <div className="flex flex-wrap gap-2">
              {simpleVariations.map((variation, index) => (
                <Badge key={index} variant="outline">
                  {variation.color && `${variation.color}`}
                  {variation.color && variation.size && ' • '}
                  {variation.size && `${variation.size}`}
                  {!variation.color && !variation.size && `Variação ${index + 1}`}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="migration-template">Escolha o Template para Migração:</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template hierárquico" />
                </SelectTrigger>
                <SelectContent>
                  {VARIATION_TEMPLATES.map((template) => {
                    const key = template.secondary 
                      ? `${template.primary}+${template.secondary}`
                      : template.primary;
                    return (
                      <SelectItem key={key} value={key}>
                        <div>
                          <div className="font-medium">{template.label}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleMigration}
                disabled={!selectedTemplate || isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Migrar para Sistema Hierárquico
              </Button>

              <Button
                variant="destructive"
                onClick={onDeleteSimple}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remover Variações Simples
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VariationMigrationHelper;
