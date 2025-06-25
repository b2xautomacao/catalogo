
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { toast } from 'sonner';
import { Smartphone, Grid2X2, Grid3X3 } from 'lucide-react';

const MobileLayoutSettings: React.FC = () => {
  const { settings, updateSettings } = useCatalogSettings();

  const handleMobileColumnsChange = async (value: string) => {
    const columns = parseInt(value);
    const result = await updateSettings({ mobile_columns: columns });
    
    if (result.data && !result.error) {
      toast.success(`Layout mobile alterado para ${columns} coluna${columns > 1 ? 's' : ''}!`);
    } else {
      toast.error('Erro ao salvar configuração de layout mobile');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Layout Mobile
        </CardTitle>
        <CardDescription>
          Configure quantas colunas de produtos serão exibidas em dispositivos móveis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">Número de Colunas no Mobile</Label>
          <RadioGroup
            value={settings?.mobile_columns?.toString() || '2'}
            onValueChange={handleMobileColumnsChange}
            className="mt-3"
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="1" id="mobile-1-col" />
                <Label htmlFor="mobile-1-col" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Grid2X2 className="h-6 w-6 text-gray-500" />
                  <div>
                    <div className="font-medium">1 Coluna</div>
                    <div className="text-sm text-gray-500">
                      Produtos em lista vertical. Ideal para produtos com muitas informações.
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="2" id="mobile-2-col" />
                <Label htmlFor="mobile-2-col" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Grid3X3 className="h-6 w-6 text-gray-500" />
                  <div>
                    <div className="font-medium">2 Colunas (Recomendado)</div>
                    <div className="text-sm text-gray-500">
                      Layout em grade compacta. Melhor aproveitamento do espaço da tela.
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
            <Smartphone className="h-4 w-4" />
            Prévia do Layout
          </div>
          <p className="text-sm text-blue-600">
            {settings?.mobile_columns === 1 
              ? 'Os produtos aparecerão em uma única coluna no mobile, ocupando toda a largura da tela.'
              : 'Os produtos aparecerão em duas colunas no mobile, criando uma grade compacta.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileLayoutSettings;
