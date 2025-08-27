import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Moon, 
  Zap, 
  Building,
  Shirt,
  Smartphone,
  Coffee,
  Sparkles,
  Eye,
  Check,
  Crown,
  Shield,
  Star,
  Cpu
} from 'lucide-react';

interface TemplateStyleSelectorProps {
  currentTemplate: string;
  onTemplateChange: (templateName: string) => void;
}

// Novos templates modernos e profissionais
const MODERN_TEMPLATES = [
  {
    id: 'fashion-luxe',
    name: 'Fashion Luxe',
    description: 'Design premium para moda com gradientes elegantes',
    icon: Crown,
    colors: ['#e11d48', '#8b5cf6', '#f97316'],
    features: ['Gradientes premium', 'Animações suaves', 'Layout VIP'],
    preview: 'bg-gradient-to-br from-pink-500 to-purple-600 text-white',
    category: 'Premium'
  },
  {
    id: 'clean-professional',
    name: 'Clean Professional',
    description: 'Layout minimalista e profissional para qualquer negócio',
    icon: Shield,
    colors: ['#3b82f6', '#1f2937', '#f8fafc'],
    features: ['Design limpo', 'Alta legibilidade', 'Layout corporativo'],
    preview: 'bg-white border-2 border-blue-200',
    category: 'Profissional'
  },
  {
    id: 'tech-modern',
    name: 'Tech Modern',
    description: 'Visual futurista para tecnologia e eletrônicos',
    icon: Cpu,
    colors: ['#0ea5e9', '#14b8a6', '#1e293b'],
    features: ['Tema tech', 'Efeitos visuais', 'Design futurista'],
    preview: 'bg-gradient-to-br from-slate-900 to-blue-900 text-cyan-400',
    category: 'Tecnologia'
  },
  {
    id: 'elegant-store',
    name: 'Elegant Store',
    description: 'Sofisticação e elegância para lojas premium',
    icon: Star,
    colors: ['#d97706', '#f59e0b', '#fef3c7'],
    features: ['Layout elegante', 'Tipografia sofisticada', 'Visual premium'],
    preview: 'bg-gradient-to-br from-amber-50 to-rose-50 border-amber-200',
    category: 'Elegante'
  }
];

const TEMPLATE_STYLES = [
  {
    style: 'minimal',
    name: 'Minimalista',
    description: 'Design limpo e focado no essencial',
    icon: Palette,
    colors: ['#2c3338', '#6b7280', '#8b5cf6'],
    features: ['Espaços brancos', 'Tipografia clara', 'Navegação simples'],
    preview: 'bg-white border-gray-200'
  },
  {
    style: 'dark',
    name: 'Escuro',
    description: 'Estética premium com tema escuro',
    icon: Moon,
    colors: ['#eab308', '#f97316', '#8b5cf6'],
    features: ['Tema escuro', 'Acentos dourados', 'Visual premium'],
    preview: 'bg-slate-900 border-yellow-400'
  },
  {
    style: 'vibrant',
    name: 'Vibrante',
    description: 'Cores energéticas e design jovem',
    icon: Zap,
    colors: ['#8b5cf6', '#e11d48', '#f97316'],
    features: ['Cores vibrantes', 'Animações', 'Visual energético'],
    preview: 'bg-purple-50 border-purple-400'
  },
  {
    style: 'neutral',
    name: 'Neutro',
    description: 'Profissional e confiável',
    icon: Building,
    colors: ['#3b82f6', '#16a34a', '#f97316'],
    features: ['Cores corporativas', 'Layout confiável', 'Visual profissional'],
    preview: 'bg-blue-50 border-blue-400'
  }
];

const TEMPLATE_NICHES = [
  {
    niche: 'fashion',
    name: 'Moda & Lifestyle',
    description: 'Para roupas, acessórios e lifestyle',
    icon: Shirt,
    adaptations: {
      minimal: 'Tons elegantes e sofisticados',
      dark: 'Luxury com dourados e prateados',
      vibrant: 'Cores fashion e gradientes',
      neutral: 'Tons terrosos e profissionais'
    }
  },
  {
    niche: 'electronics',
    name: 'Eletrônicos & Tech',
    description: 'Para tecnologia e eletrônicos',
    icon: Smartphone,
    adaptations: {
      minimal: 'Azul tech e visual limpo',
      dark: 'Cyber punk com neons',
      vibrant: 'Sci-fi com cores tech',
      neutral: 'Azuis corporativos'
    }
  },
  {
    niche: 'food',
    name: 'Alimentos & Bebidas',
    description: 'Para comidas, bebidas e gastronomia',
    icon: Coffee,
    adaptations: {
      minimal: 'Verde natural e clean',
      dark: 'Gourmet com warm tones',
      vibrant: 'Fresh com cores naturais',
      neutral: 'Orgânico com verdes/marrons'
    }
  },
  {
    niche: 'cosmetics',
    name: 'Cosméticos & Beleza',
    description: 'Para beleza, cuidados e bem-estar',
    icon: Sparkles,
    adaptations: {
      minimal: 'Magenta suave e clean',
      dark: 'Premium com metálicos',
      vibrant: 'Colorful e criativo',
      neutral: 'Rosa/bege profissional'
    }
  }
];

const TemplateStyleSelector: React.FC<TemplateStyleSelectorProps> = ({
  currentTemplate,
  onTemplateChange
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(currentTemplate || 'clean-professional');
  const [selectedStyle, setSelectedStyle] = useState<string>('minimal');
  const [selectedNiche, setSelectedNiche] = useState<string>('fashion');
  const [viewMode, setViewMode] = useState<'modern' | 'classic'>('modern');

  // Aplicar template selecionado
  const handleApplyTemplate = () => {
    if (viewMode === 'modern') {
      onTemplateChange(selectedTemplate);
    } else {
      const combinedTemplate = `${selectedStyle}-${selectedNiche}`;
      onTemplateChange(combinedTemplate);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Escolha seu Template
        </h3>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Selecione um design moderno ou personalize com estilo e nicho específicos
        </p>
        
        {/* Toggle de visualização */}
        <div className="flex justify-center">
          <div className="bg-gray-100 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setViewMode('modern')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                viewMode === 'modern' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Templates Modernos
            </button>
            <button
              onClick={() => setViewMode('classic')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                viewMode === 'classic' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Personalizar Estilo
            </button>
          </div>
        </div>
      </div>

      {/* Templates Modernos */}
      {viewMode === 'modern' && (
        <div className="space-y-6">
          <h4 className="text-xl font-semibold text-center">Templates Prontos - Modernos e Profissionais</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MODERN_TEMPLATES.map((template) => {
              const IconComponent = template.icon;
              const isSelected = selectedTemplate === template.id;
              
              return (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all border-2 hover:shadow-xl ${
                    isSelected
                      ? 'border-blue-500 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Preview */}
                    <div className={`h-24 rounded-lg ${template.preview} flex items-center justify-center relative overflow-hidden`}>
                      <IconComponent className="w-8 h-8" />
                      <Badge className="absolute top-2 right-2 text-xs bg-white text-gray-800">
                        {template.category}
                      </Badge>
                    </div>
                    
                    {/* Info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-lg font-semibold">{template.name}</h5>
                        {isSelected && (
                          <Badge className="bg-blue-500">
                            <Check className="w-3 h-3 mr-1" />
                            Selecionado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    
                    {/* Cores */}
                    <div className="flex gap-1">
                      {template.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-1">
                      {template.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Personalização Clássica */}
      {viewMode === 'classic' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">1. Escolha o Estilo Base</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {TEMPLATE_STYLES.map((style) => {
                const IconComponent = style.icon;
                const isSelected = selectedStyle === style.style;
                
                return (
                  <Card
                    key={style.style}
                    className={`cursor-pointer transition-all border-2 hover:shadow-lg ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedStyle(style.style)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg ${
                          isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100'
                        }`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        {isSelected && (
                          <Badge className="bg-blue-500">
                            <Check className="w-3 h-3 mr-1" />
                            Selecionado
                          </Badge>
                        )}
                      </div>
                      
                      <div>
                        <h5 className="font-semibold">{style.name}</h5>
                        <p className="text-xs text-muted-foreground">{style.description}</p>
                      </div>
                      
                      <div className="flex gap-1">
                        {style.colors.map((color, index) => (
                          <div
                            key={index}
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">2. Escolha seu Nicho de Mercado</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATE_NICHES.map((niche) => {
                const IconComponent = niche.icon;
                const isSelected = selectedNiche === niche.niche;
                const adaptation = niche.adaptations[selectedStyle as keyof typeof niche.adaptations];
                
                return (
                  <Card
                    key={niche.niche}
                    className={`cursor-pointer transition-all border-2 hover:shadow-lg ${
                      isSelected
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedNiche(niche.niche)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isSelected ? 'bg-green-500 text-white' : 'bg-gray-100'
                          }`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="font-semibold">{niche.name}</h5>
                            <p className="text-xs text-muted-foreground">{niche.description}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <Badge className="bg-green-500">
                            <Check className="w-3 h-3 mr-1" />
                            Selecionado
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
                        <strong>Adaptação {TEMPLATE_STYLES.find(s => s.style === selectedStyle)?.name}:</strong>
                        <br />
                        {adaptation}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Botão de aplicar */}
      <div className="flex justify-center pt-6 border-t">
        <Button 
          onClick={handleApplyTemplate} 
          size="lg"
          className="px-12 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Eye className="w-5 h-5 mr-2" />
          Aplicar Template Selecionado
        </Button>
      </div>
    </div>
  );
};

export default TemplateStyleSelector;
