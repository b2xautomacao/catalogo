
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Package, DollarSign, Hash } from 'lucide-react';
import { HierarchicalVariation, VariationTemplate } from '@/types/variation';

interface HierarchicalVariationPreviewProps {
  template?: VariationTemplate;
  variations: HierarchicalVariation[];
}

const HierarchicalVariationPreview: React.FC<HierarchicalVariationPreviewProps> = ({
  template,
  variations
}) => {
  console.log('👁 HIERARCHICAL PREVIEW - Renderizando:', {
    template: template?.label,
    variationsCount: variations.length
  });

  if (!template || variations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Nenhuma Variação para Visualizar</h3>
          <p className="text-sm text-gray-500">
            Configure algumas variações na aba "Configurar" para ver a prévia aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getAttributeLabel = (attribute: string) => {
    const labels: Record<string, string> = {
      color: 'Cor',
      size: 'Tamanho',
      material: 'Material',
      style: 'Estilo',
      weight: 'Peso'
    };
    return labels[attribute] || attribute;
  };

  const totalStock = variations.reduce((sum, main) => {
    if (main.children && main.children.length > 0) {
      return sum + main.children.reduce((subSum, child) => subSum + child.stock, 0);
    }
    return sum + main.stock;
  }, 0);

  const totalSubvariations = variations.reduce((sum, main) => sum + (main.children?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Prévia: {template.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{variations.length}</div>
              <div className="text-xs text-muted-foreground">
                {getAttributeLabel(template.primary)}(s)
              </div>
            </div>
            {template.secondary && (
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{totalSubvariations}</div>
                <div className="text-xs text-muted-foreground">
                  {getAttributeLabel(template.secondary)}(s)
                </div>
              </div>
            )}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalStock}</div>
              <div className="text-xs text-muted-foreground">
                Estoque Total
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {variations.filter(v => v.is_active).length}
              </div>
              <div className="text-xs text-muted-foreground">
                Ativas
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de variações */}
      <div className="space-y-4">
        {variations.map((mainVariation, index) => (
          <Card key={mainVariation.id || index} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {getAttributeLabel(template.primary)}: {mainVariation.variation_value}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {mainVariation.children && mainVariation.children.length > 0 
                          ? mainVariation.children.reduce((sum, child) => sum + child.stock, 0)
                          : mainVariation.stock} unidades
                      </span>
                      {mainVariation.price_adjustment !== 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {mainVariation.price_adjustment > 0 ? '+' : ''}
                          R$ {mainVariation.price_adjustment.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!mainVariation.is_active && (
                    <Badge variant="secondary">Inativa</Badge>
                  )}
                  {mainVariation.image_url && (
                    <Badge variant="outline" className="text-xs">
                      Com Imagem
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Subvariações */}
            {mainVariation.children && mainVariation.children.length > 0 && (
              <CardContent className="pt-0">
                <div className="border-t pt-3">
                  <h5 className="text-sm font-medium mb-3">
                    {getAttributeLabel(template.secondary!)}s Disponíveis:
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {mainVariation.children.map((subVariation, subIndex) => (
                      <div
                        key={subVariation.id || `sub-${subIndex}`}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {subVariation.variation_value}
                          </span>
                          {!subVariation.is_active && (
                            <Badge variant="secondary" className="text-xs">
                              Inativa
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Estoque:</span>
                            <span className="font-medium">{subVariation.stock}</span>
                          </div>
                          {subVariation.price_adjustment !== 0 && (
                            <div className="flex items-center justify-between">
                              <span>Ajuste:</span>
                              <span className="font-medium">
                                {subVariation.price_adjustment > 0 ? '+' : ''}
                                R$ {subVariation.price_adjustment.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {subVariation.sku && (
                            <div className="flex items-center justify-between">
                              <span>SKU:</span>
                              <span className="font-medium">{subVariation.sku}</span>
                            </div>
                          )}
                        </div>

                        {subVariation.image_url && (
                          <div className="mt-2">
                            <div className="w-full h-16 bg-gray-100 rounded overflow-hidden">
                              <img
                                src={subVariation.image_url}
                                alt={`${subVariation.variation_value}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}

            {/* Imagem da variação principal (se não tiver subvariações) */}
            {(!mainVariation.children || mainVariation.children.length === 0) && mainVariation.image_url && (
              <CardContent className="pt-0">
                <div className="border-t pt-3">
                  <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden">
                    <img
                      src={mainVariation.image_url}
                      alt={`${mainVariation.variation_value}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HierarchicalVariationPreview;
