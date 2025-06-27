
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Settings, Eye, AlertCircle, Info } from 'lucide-react';
import { VariationGroup, HierarchicalVariation, VARIATION_TEMPLATES } from '@/types/variation';
import { useVariationGroups } from '@/hooks/useVariationGroups';
import HierarchicalVariationSetup from './HierarchicalVariationSetup';
import HierarchicalVariationPreview from './HierarchicalVariationPreview';
import VariationMigrationHelper from './VariationMigrationHelper';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HierarchicalVariationsManagerProps {
  productId?: string;
  variations: any[];
  onChange: (variations: any[]) => void;
}

const HierarchicalVariationsManager: React.FC<HierarchicalVariationsManagerProps> = ({
  productId,
  variations = [],
  onChange
}) => {
  const { groups, variations: hierarchicalVariations, loading, saveVariationGroup } = useVariationGroups(productId);
  const [currentTemplate, setCurrentTemplate] = useState<string>('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [localVariations, setLocalVariations] = useState<HierarchicalVariation[]>([]);
  const [showMigration, setShowMigration] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  console.log('🎯 HIERARCHICAL MANAGER - Renderizando:', {
    productId,
    groupsCount: groups?.length || 0,
    hierarchicalVariationsCount: hierarchicalVariations?.length || 0,
    legacyVariationsCount: variations?.length || 0,
    isConfiguring,
    currentTemplate
  });

  // Verificar se já existe um sistema hierárquico configurado
  const hasHierarchicalSystem = groups && groups.length > 0;
  
  // Verificar se é um produto em edição com variações simples
  const isEditingWithLegacyVariations = productId && variations && variations.length > 0 && !hasHierarchicalSystem;

  // Evitar loops de renderização
  useEffect(() => {
    if (isInitialized) return;

    if (hasHierarchicalSystem && groups && groups.length > 0) {
      const group = groups[0];
      const templateKey = group.secondary_attribute 
        ? `${group.primary_attribute}+${group.secondary_attribute}`
        : group.primary_attribute;
      
      console.log('🔧 HIERARCHICAL MANAGER - Configurando sistema existente:', templateKey);
      setCurrentTemplate(templateKey);
      setLocalVariations(hierarchicalVariations || []);
      setIsConfiguring(true);
      setShowMigration(false);
      setIsInitialized(true);
    } else if (isEditingWithLegacyVariations) {
      console.log('🔄 HIERARCHICAL MANAGER - Detectadas variações legadas:', variations.length);
      setShowMigration(true);
      setIsConfiguring(false);
      
      // Converter variações legadas para preview
      const convertedVariations = variations.map((v, index) => ({
        id: v.id || `legacy-${index}`,
        variation_type: 'simple' as const,
        variation_value: v.color || v.size || `Variação ${index + 1}`,
        color: v.color,
        size: v.size,
        sku: v.sku,
        stock: v.stock || 0,
        price_adjustment: v.price_adjustment || 0,
        is_active: v.is_active !== false,
        image_url: v.image_url,
        display_order: index,
        children: []
      }));
      setLocalVariations(convertedVariations);
      setIsInitialized(true);
    } else {
      // Produto novo ou sem variações
      console.log('🆕 HIERARCHICAL MANAGER - Produto novo ou sem configuração');
      setShowMigration(false);
      setIsConfiguring(false);
      setLocalVariations([]);
      setIsInitialized(true);
    }
  }, [groups, hierarchicalVariations, variations, productId, hasHierarchicalSystem, isEditingWithLegacyVariations, isInitialized]);

  const handleTemplateSelect = (templateKey: string) => {
    console.log('📋 HIERARCHICAL MANAGER - Selecionando template:', templateKey);
    setCurrentTemplate(templateKey);
    setIsConfiguring(true);
    setShowMigration(false);
    setLocalVariations([]);
  };

  const handleMigration = (hierarchicalVariations: HierarchicalVariation[], templateKey: string) => {
    console.log('🔄 HIERARCHICAL MANAGER - Iniciando migração:', {
      templateKey,
      hierarchicalCount: hierarchicalVariations.length
    });
    
    setCurrentTemplate(templateKey);
    setLocalVariations(hierarchicalVariations);
    setIsConfiguring(true);
    setShowMigration(false);
    
    // Limpar variações legadas
    onChange([]);
  };

  const handleDeleteLegacyVariations = () => {
    console.log('🗑 HIERARCHICAL MANAGER - Removendo variações legadas');
    onChange([]);
    setShowMigration(false);
    setLocalVariations([]);
  };

  const handleVariationsChange = (newVariations: HierarchicalVariation[]) => {
    console.log('🔄 HIERARCHICAL MANAGER - Atualizando variações:', newVariations.length);
    setLocalVariations(newVariations);
    
    // Converter para o formato esperado pelo componente pai (compatibilidade)
    const legacyFormat = newVariations.flatMap(main => {
      if (main.children && main.children.length > 0) {
        return main.children.map(child => ({
          id: child.id,
          color: child.color,
          size: child.size,
          sku: child.sku,
          stock: child.stock,
          price_adjustment: child.price_adjustment,
          is_active: child.is_active,
          image_url: child.image_url,
          image_file: child.image_file
        }));
      } else {
        return [{
          id: main.id,
          color: main.color,
          size: main.size,
          sku: main.sku,
          stock: main.stock,
          price_adjustment: main.price_adjustment,
          is_active: main.is_active,
          image_url: main.image_url,
          image_file: main.image_file
        }];
      }
    });
    
    onChange(legacyFormat);
  };

  const handleSave = async () => {
    if (!productId || !currentTemplate) {
      console.warn('⚠️ HIERARCHICAL MANAGER - Não é possível salvar sem productId ou template');
      return;
    }

    const template = VARIATION_TEMPLATES.find(t => 
      t.secondary 
        ? `${t.primary}+${t.secondary}` === currentTemplate
        : t.primary === currentTemplate
    );

    if (!template) {
      console.error('❌ HIERARCHICAL MANAGER - Template não encontrado:', currentTemplate);
      return;
    }

    console.log('💾 HIERARCHICAL MANAGER - Salvando configuração:', {
      productId,
      template: template.label,
      variationsCount: localVariations.length
    });

    const groupData: Omit<VariationGroup, 'id' | 'created_at' | 'updated_at'> = {
      product_id: productId,
      primary_attribute: template.primary,
      secondary_attribute: template.secondary
    };

    const result = await saveVariationGroup(productId, groupData, localVariations);
    
    if (result.success) {
      console.log('✅ HIERARCHICAL MANAGER - Salvamento concluído com sucesso');
      setIsConfiguring(false);
    }
  };

  const selectedTemplate = VARIATION_TEMPLATES.find(t => 
    t.secondary 
      ? `${t.primary}+${t.secondary}` === currentTemplate
      : t.primary === currentTemplate
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Sistema de Variações Hierárquicas</h3>
        <p className="text-sm text-muted-foreground">
          Configure variações organizadas em grupos (ex: Cor → Tamanhos) para facilitar o cadastro e melhorar a experiência do cliente.
        </p>
      </div>

      {/* Sistema funciona mesmo sem productId para novos produtos */}
      {!productId && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Você pode configurar o sistema de variações hierárquicas agora. As configurações serão salvas quando o produto for criado.
          </AlertDescription>
        </Alert>
      )}

      {/* Mostrar helper de migração apenas para produtos em edição com variações legadas */}
      {showMigration && isEditingWithLegacyVariations && (
        <VariationMigrationHelper
          simpleVariations={variations}
          onMigrate={handleMigration}
          onDeleteSimple={handleDeleteLegacyVariations}
        />
      )}

      {/* Para produtos novos ou sem sistema configurado, mostrar seletor de template */}
      {!hasHierarchicalSystem && !showMigration && !isConfiguring ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Configure o Sistema de Variações</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Escolha como organizar as variações deste produto
                </p>
                
                <div className="space-y-3 max-w-md mx-auto">
                  <Label>Tipo de Variação</Label>
                  <Select value={currentTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de variação" />
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
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurar
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Visualizar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Configuração de Variações
                    {selectedTemplate && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedTemplate.label}
                      </Badge>
                    )}
                  </CardTitle>
                  {isConfiguring && productId && localVariations.length > 0 && (
                    <Button onClick={handleSave} size="sm">
                      Salvar Configuração
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <HierarchicalVariationSetup
                    template={selectedTemplate}
                    variations={localVariations}
                    onChange={handleVariationsChange}
                  />
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Selecione um tipo de variação para começar a configurar.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <HierarchicalVariationPreview
              template={selectedTemplate}
              variations={localVariations}
            />
          </TabsContent>
        </Tabs>
      )}

      {localVariations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Resumo das Variações:</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• {localVariations.length} variação(ões) principal(is) configurada(s)</p>
            <p>• {localVariations.reduce((sum, v) => sum + (v.children?.length || 0), 0)} subvariação(ões) total</p>
            <p>• Estoque total: {localVariations.reduce((sum, v) => sum + (v.children?.reduce((subSum, child) => subSum + child.stock, 0) || v.stock), 0)} unidades</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HierarchicalVariationsManager;
