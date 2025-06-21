
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useToast } from '@/hooks/use-toast';
import { 
  Store, 
  ArrowLeftRight, 
  ToggleLeft, 
  ShoppingCart,
  Package,
  Zap,
  Users,
  TrendingUp
} from 'lucide-react';

const CatalogModeSettings = () => {
  const { settings, updateSettings } = useCatalogSettings();
  const { toast } = useToast();

  const handleModeChange = async (newMode: 'separated' | 'hybrid' | 'toggle') => {
    try {
      const { error } = await updateSettings({ catalog_mode: newMode });
      
      if (error) {
        toast({
          title: "Erro ao atualizar configuração",
          description: "Tente novamente em alguns instantes",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Modo de catálogo atualizado",
        description: `Modo ${getModeLabel(newMode)} ativado com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar configuração",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'separated': return 'Separado';
      case 'hybrid': return 'Híbrido';
      case 'toggle': return 'Alternável';
      default: return 'Separado';
    }
  };

  if (!settings) return null;

  const catalogModes = [
    {
      id: 'separated',
      label: 'Catálogos Separados',
      description: 'Links distintos para varejo e atacado',
      icon: Store,
      benefits: [
        'Experiência focada por tipo de público',
        'SEO otimizado para cada catálogo',
        'Configurações independentes',
        'Controle total sobre visibilidade'
      ],
      recommended: 'Recomendado para lojas com públicos muito distintos'
    },
    {
      id: 'hybrid',
      label: 'Catálogo Híbrido',
      description: 'Preços mudam automaticamente por quantidade',
      icon: Zap,
      benefits: [
        'Conversão automática para atacado',
        'Experiência fluida para o cliente',
        'Incentiva compras em maior quantidade',
        'Reduz fricção no processo de compra'
      ],
      recommended: 'Ideal para produtos com desconto progressivo',
      badge: 'Inteligente'
    },
    {
      id: 'toggle',
      label: 'Catálogo Alternável',
      description: 'Cliente pode alternar entre varejo e atacado',
      icon: ToggleLeft,
      benefits: [
        'Flexibilidade total para o cliente',
        'Comparação fácil entre preços',
        'Controle na mão do usuário',
        'Experiência personalizada'
      ],
      recommended: 'Perfeito para clientes que compram nos dois modos',
      badge: 'Flexível'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-blue-600" />
          Modo de Exibição dos Catálogos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-6">
          Escolha como seus clientes vão acessar e visualizar os preços de varejo e atacado.
        </p>

        <RadioGroup
          value={settings.catalog_mode}
          onValueChange={(value) => handleModeChange(value as 'separated' | 'hybrid' | 'toggle')}
          className="space-y-6"
        >
          {catalogModes.map((mode) => {
            const IconComponent = mode.icon;
            const isSelected = settings.catalog_mode === mode.id;
            
            return (
              <div
                key={mode.id}
                className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-2 mb-4">
                  <RadioGroupItem value={mode.id} id={mode.id} />
                  <Label htmlFor={mode.id} className="cursor-pointer">
                    <div className="flex items-center gap-3">
                      <IconComponent className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                      <span className="font-semibold text-lg">{mode.label}</span>
                      {mode.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {mode.badge}
                        </Badge>
                      )}
                    </div>
                  </Label>
                </div>
                
                <p className="text-gray-600 mb-4 ml-6">{mode.description}</p>
                
                <div className="ml-6 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {mode.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-gray-400'}`} />
                        <span className={isSelected ? 'text-blue-700' : 'text-gray-600'}>
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className={`p-3 rounded-lg text-sm font-medium ${
                    isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <TrendingUp className="inline w-4 h-4 mr-2" />
                    {mode.recommended}
                  </div>
                </div>
              </div>
            );
          })}
        </RadioGroup>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Como isso afeta seus clientes:
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            {settings.catalog_mode === 'separated' && (
              <>
                <p>• Clientes acessam links diferentes para varejo e atacado</p>
                <p>• Experiência focada no tipo de compra desejada</p>
                <p>• Ideal para segmentação clara de público</p>
              </>
            )}
            {settings.catalog_mode === 'hybrid' && (
              <>
                <p>• Preços mudam automaticamente ao atingir quantidade mínima</p>
                <p>• Cliente vê economia em tempo real</p>
                <p>• Incentiva compras maiores naturalmente</p>
              </>
            )}
            {settings.catalog_mode === 'toggle' && (
              <>
                <p>• Cliente pode alternar entre modo varejo e atacado</p>
                <p>• Comparação fácil entre preços</p>
                <p>• Flexibilidade total na experiência de compra</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CatalogModeSettings;
