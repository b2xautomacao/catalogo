
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useEditorStore } from '../../stores/useEditorStore';
import ColorPicker from '../ColorPicker';

const GlobalSettings: React.FC = () => {
  const { configuration, updateConfiguration } = useEditorStore();
  const globalConfig = configuration.global;

  const fontOptions = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Lato', label: 'Lato' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Configurações Globais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Paleta de Cores */}
        <div className="space-y-4">
          <Label>Paleta de Cores</Label>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Cor Primária</Label>
              <ColorPicker
                color={globalConfig.primaryColor}
                onChange={(color) => updateConfiguration('global.primaryColor', color)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Cor Secundária</Label>
              <ColorPicker
                color={globalConfig.secondaryColor}
                onChange={(color) => updateConfiguration('global.secondaryColor', color)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Cor de Destaque</Label>
              <ColorPicker
                color={globalConfig.accentColor}
                onChange={(color) => updateConfiguration('global.accentColor', color)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Cor de Fundo</Label>
              <ColorPicker
                color={globalConfig.backgroundColor}
                onChange={(color) => updateConfiguration('global.backgroundColor', color)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Cor do Texto</Label>
              <ColorPicker
                color={globalConfig.textColor}
                onChange={(color) => updateConfiguration('global.textColor', color)}
              />
            </div>
          </div>
        </div>

        {/* Tipografia */}
        <div className="space-y-4">
          <Label>Tipografia</Label>
          
          <div className="space-y-2">
            <Label className="text-xs">Família da Fonte</Label>
            <Select
              value={globalConfig.fontFamily}
              onValueChange={(value) => updateConfiguration('global.fontFamily', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Fonte Pequena: {globalConfig.fontSize.small}px</Label>
              <Slider
                value={[globalConfig.fontSize.small]}
                onValueChange={([value]) => updateConfiguration('global.fontSize.small', value)}
                max={18}
                min={10}
                step={1}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Fonte Média: {globalConfig.fontSize.medium}px</Label>
              <Slider
                value={[globalConfig.fontSize.medium]}
                onValueChange={([value]) => updateConfiguration('global.fontSize.medium', value)}
                max={24}
                min={12}
                step={1}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Fonte Grande: {globalConfig.fontSize.large}px</Label>
              <Slider
                value={[globalConfig.fontSize.large]}
                onValueChange={([value]) => updateConfiguration('global.fontSize.large', value)}
                max={32}
                min={16}
                step={1}
              />
            </div>
          </div>
        </div>

        {/* Espaçamento */}
        <div className="space-y-4">
          <Label>Espaçamento</Label>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Espaçamento Pequeno: {globalConfig.spacing.small}px</Label>
              <Slider
                value={[globalConfig.spacing.small]}
                onValueChange={([value]) => updateConfiguration('global.spacing.small', value)}
                max={16}
                min={4}
                step={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Espaçamento Médio: {globalConfig.spacing.medium}px</Label>
              <Slider
                value={[globalConfig.spacing.medium]}
                onValueChange={([value]) => updateConfiguration('global.spacing.medium', value)}
                max={32}
                min={8}
                step={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Espaçamento Grande: {globalConfig.spacing.large}px</Label>
              <Slider
                value={[globalConfig.spacing.large]}
                onValueChange={([value]) => updateConfiguration('global.spacing.large', value)}
                max={48}
                min={16}
                step={2}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalSettings;
