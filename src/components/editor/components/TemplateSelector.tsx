
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Eye } from 'lucide-react';
import { useEditorStore } from '../stores/useEditorStore';
import { EditorTemplate } from '../templates/EditorTemplate';

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
  };
  category: 'minimalist' | 'elegant' | 'modern' | 'industrial';
}

const predefinedTemplates: Template[] = [
  EditorTemplate,
  {
    id: 'modern',
    name: 'Modern',
    description: 'Design contemporâneo com cores vibrantes',
    preview: 'bg-gradient-to-br from-blue-500 to-purple-600',
    colors: {
      primary: '#0057FF',
      secondary: '#FF6F00',
      accent: '#8E2DE2',
      background: '#F8FAFC',
      text: '#1E293B',
      border: '#E2E8F0'
    },
    category: 'modern'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simplicidade e elegância em primeiro lugar',
    preview: 'bg-gradient-to-br from-gray-800 to-gray-600',
    colors: {
      primary: '#1F2937',
      secondary: '#059669',
      accent: '#DC2626',
      background: '#FFFFFF',
      text: '#111827',
      border: '#E5E7EB'
    },
    category: 'minimalist'
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sofisticação com tons dourados',
    preview: 'bg-gradient-to-br from-amber-600 to-orange-700',
    colors: {
      primary: '#D97706',
      secondary: '#92400E',
      accent: '#7C2D12',
      background: '#FFFBEB',
      text: '#78350F',
      border: '#FDE68A'
    },
    category: 'elegant'
  },
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Visual robusto e profissional',
    preview: 'bg-gradient-to-br from-slate-600 to-amber-500',
    colors: {
      primary: '#475569',
      secondary: '#F59E0B',
      accent: '#DC2626',
      background: '#F1F5F9',
      text: '#334155',
      border: '#CBD5E1'
    },
    category: 'industrial'
  }
];

export const TemplateSelector: React.FC = () => {
  const { configuration, applyTemplate, currentTemplate } = useEditorStore();

  const handleApplyTemplate = (template: Template) => {
    console.log('Aplicando template:', template.name);
    applyTemplate(template.id, template.colors);
    
    // Aplicar estilos CSS imediatamente
    const root = document.documentElement;
    root.style.setProperty('--template-primary', template.colors.primary);
    root.style.setProperty('--template-secondary', template.colors.secondary);
    root.style.setProperty('--template-accent', template.colors.accent);
    root.style.setProperty('--template-background', template.colors.background);
    root.style.setProperty('--template-text', template.colors.text);
    root.style.setProperty('--template-border', template.colors.border);
    root.style.setProperty('--template-gradient-from', template.colors.primary);
    root.style.setProperty('--template-gradient-to', template.colors.secondary);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Templates Predefinidos</h3>
        <p className="text-sm text-gray-600 mb-4">
          Escolha um template e personalize conforme necessário
        </p>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {predefinedTemplates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              currentTemplate === template.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 ${template.preview}`} />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm flex items-center gap-1">
                      {template.name}
                      {currentTemplate === template.id && (
                        <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      )}
                      {template.id === 'editor' && (
                        <Badge variant="outline" className="text-xs">Recomendado</Badge>
                      )}
                    </h4>
                    <p className="text-xs text-gray-600 leading-tight">{template.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">{template.category}</Badge>
              </div>

              {/* Preview das cores */}
              <div className="flex gap-1 mb-2">
                {Object.entries(template.colors).slice(0, 3).map(([key, color]) => (
                  <div
                    key={key}
                    className="w-4 h-4 rounded-full border border-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                    title={key}
                  />
                ))}
              </div>

              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => handleApplyTemplate(template)}
                  className="flex-1 h-8 text-xs template-button-primary"
                  variant={currentTemplate === template.id ? "default" : "outline"}
                >
                  {currentTemplate === template.id ? 'Aplicado' : 'Aplicar'}
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 template-button-secondary">
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
