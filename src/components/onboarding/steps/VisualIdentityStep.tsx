
import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImageIcon, Upload, X, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StoreWizardData } from '@/hooks/useStoreWizard';

interface VisualIdentityStepProps {
  data: StoreWizardData;
  onUpdate: (updates: Partial<StoreWizardData>) => void;
}

export const VisualIdentityStep: React.FC<VisualIdentityStepProps> = ({ 
  data, 
  onUpdate 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(data.logo_url || '');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);

    // Atualizar dados
    onUpdate({ logo_file: file, logo_url: '' });
  };

  const handleRemoveLogo = () => {
    setPreview('');
    onUpdate({ logo_file: null, logo_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-6 w-6 text-purple-600" />
          Identidade Visual da Sua Loja
        </CardTitle>
        <p className="text-gray-600">
          Adicione um logo para deixar sua loja mais profissional
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>Logo da loja (opcional)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Um logo profissional aumenta a confiança dos clientes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-4">
            {preview ? (
              <div className="relative max-w-xs">
                <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                  <img 
                    src={preview} 
                    alt="Preview do logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div 
                className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                onClick={triggerFileSelect}
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 text-center">
                  Clique para adicionar
                </span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={triggerFileSelect}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {preview ? 'Trocar logo' : 'Adicionar logo'}
              </Button>
              
              {preview && (
                <Button
                  variant="ghost"
                  onClick={handleRemoveLogo}
                  className="text-red-600 hover:text-red-700"
                >
                  Remover
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Dicas para um logo perfeito:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use imagens quadradas ou retangulares (proporção 1:1 ou 16:9)</li>
            <li>• Prefira fundos transparentes (PNG) ou brancos</li>
            <li>• Tamanho recomendado: mínimo 200x200 pixels</li>
            <li>• Evite textos muito pequenos que ficam ilegíveis</li>
            <li>• Você pode adicionar ou alterar o logo depois nas configurações</li>
          </ul>
        </div>

        {!preview && (
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">
              Não se preocupe! Você pode pular esta etapa e adicionar um logo mais tarde.
              <br />
              <span className="font-medium">Sua loja funcionará perfeitamente sem logo.</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
