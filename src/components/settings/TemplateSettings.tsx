
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Palette, Eye, Download, Upload } from 'lucide-react';

const TemplateSettings = () => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState('modern');

  const templates = [
    {
      id: 'modern',
      name: 'Moderno',
      description: 'Design limpo e minimalista',
      preview: '/placeholder.svg',
      colors: ['#3B82F6', '#1E40AF', '#EFF6FF']
    },
    {
      id: 'classic',
      name: 'Clássico',
      description: 'Design tradicional e elegante',
      preview: '/placeholder.svg',
      colors: ['#374151', '#111827', '#F9FAFB']
    },
    {
      id: 'vibrant',
      name: 'Vibrante',
      description: 'Cores alegres e chamativas',
      preview: '/placeholder.svg',
      colors: ['#EC4899', '#BE185D', '#FCE7F3']
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      description: 'Tema escuro elegante',
      preview: '/placeholder.svg',
      colors: ['#1F2937', '#111827', '#374151']
    },
    {
      id: 'nature',
      name: 'Natureza',
      description: 'Inspirado na natureza',
      preview: '/placeholder.svg',
      colors: ['#059669', '#047857', '#ECFDF5']
    },
    {
      id: 'luxury',
      name: 'Luxo',
      description: 'Design sofisticado e premium',
      preview: '/placeholder.svg',
      colors: ['#D97706', '#92400E', '#FEF3C7']
    }
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    toast({
      title: "Template selecionado",
      description: `Template ${templates.find(t => t.id === templateId)?.name} foi aplicado`,
    });
  };

  const previewTemplate = (templateId: string) => {
    toast({
      title: "Prévia do template",
      description: "Abrindo prévia em nova aba...",
    });
  };

  return (
    <div className="space-y-6">
      {/* Templates Disponíveis */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Templates Disponíveis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <CardHeader className="p-4">
                <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <Palette className="h-8 w-8 text-gray-400" />
                </div>
                <CardTitle className="text-base">{template.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex gap-2 mb-3">
                  {template.colors.map((color, index) => (
                    <div 
                      key={index}
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => previewTemplate(template.id)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Prévia
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`flex-1 ${
                      selectedTemplate === template.id ? 'bg-blue-600' : ''
                    }`}
                  >
                    {selectedTemplate === template.id ? 'Selecionado' : 'Selecionar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Personalização Avançada */}
      <Card>
        <CardHeader>
          <CardTitle>Personalização Avançada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Cor Primária</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  defaultValue="#3B82F6" 
                  className="w-12 h-10 rounded border"
                />
                <input 
                  type="text" 
                  defaultValue="#3B82F6" 
                  className="flex-1 px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cor Secundária</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  defaultValue="#1E40AF" 
                  className="w-12 h-10 rounded border"
                />
                <input 
                  type="text" 
                  defaultValue="#1E40AF" 
                  className="flex-1 px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cor de Fundo</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  defaultValue="#FFFFFF" 
                  className="w-12 h-10 rounded border"
                />
                <input 
                  type="text" 
                  defaultValue="#FFFFFF" 
                  className="flex-1 px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cor do Texto</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  defaultValue="#1F2937" 
                  className="w-12 h-10 rounded border"
                />
                <input 
                  type="text" 
                  defaultValue="#1F2937" 
                  className="flex-1 px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Importar Tema
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Exportar Tema
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button className="btn-primary w-full">
        Aplicar Configurações de Template
      </Button>
    </div>
  );
};

export default TemplateSettings;
