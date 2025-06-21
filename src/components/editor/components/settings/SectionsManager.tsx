
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';

const SectionsManager: React.FC = () => {
  const { configuration, updateConfiguration, reorderSections } = useEditorStore();
  const { sections, sectionOrder } = configuration;

  const sectionLabels: Record<string, string> = {
    banner: 'Banner Principal',
    categories: 'Categorias',
    featuredProducts: 'Produtos em Destaque',
    testimonials: 'Depoimentos',
    newsletter: 'Newsletter',
    footer: 'Rodapé',
  };

  const handleSectionToggle = (sectionKey: string, enabled: boolean) => {
    updateConfiguration(`sections.${sectionKey}`, enabled);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...sectionOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      reorderSections(newOrder);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Gerenciar Seções</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label>Seções Ativas</Label>
          
          <div className="space-y-2">
            {sectionOrder.map((sectionKey, index) => {
              const isEnabled = sections[sectionKey as keyof typeof sections];
              const label = sectionLabels[sectionKey] || sectionKey;
              
              return (
                <div
                  key={sectionKey}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    isEnabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical size={16} className="text-gray-400 cursor-grab" />
                    <div className="flex items-center gap-2">
                      {isEnabled ? (
                        <Eye size={16} className="text-green-600" />
                      ) : (
                        <EyeOff size={16} className="text-gray-400" />
                      )}
                      <span className="font-medium text-sm">{label}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === sectionOrder.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        ↓
                      </Button>
                    </div>
                    
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleSectionToggle(sectionKey, checked)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t">
          <Label className="text-xs text-gray-600">
            Arraste as seções para reordená-las ou use os botões de seta. 
            Use o switch para ativar/desativar cada seção.
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default SectionsManager;
