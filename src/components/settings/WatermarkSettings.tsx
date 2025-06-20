
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Droplet, 
  Type, 
  Image, 
  Upload, 
  Loader2, 
  Eye,
  Save
} from 'lucide-react';

const WatermarkSettings = () => {
  const { settings, loading, updateSettings } = useCatalogSettings();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('/placeholder.svg');

  const handleToggle = async (field: string, value: boolean) => {
    setSaving(true);
    const { error } = await updateSettings({ [field]: value });
    
    if (error) {
      toast({
        title: "Erro ao atualizar configuração",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Configuração atualizada",
        description: "As alterações foram salvas com sucesso"
      });
    }
    setSaving(false);
  };

  const handleInputChange = async (field: string, value: string | number) => {
    setSaving(true);
    const { error } = await updateSettings({ [field]: value });
    
    if (error) {
      toast({
        title: "Erro ao atualizar configuração",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Configuração atualizada",
        description: "As alterações foram salvas com sucesso"
      });
    }
    setSaving(false);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas imagens",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Upload para o bucket watermark-logos
      const fileName = `${profile.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('watermark-logos')
        .upload(fileName, file);

      if (error) throw error;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('watermark-logos')
        .getPublicUrl(data.path);

      // Atualizar configurações
      await handleInputChange('watermark_logo_url', urlData.publicUrl);

      toast({
        title: "Logo carregado",
        description: "Logo da marca d'água foi atualizado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível carregar o logo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <p className="text-gray-500">Erro ao carregar configurações</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ativar/Desativar Marca d'água */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-blue-600" />
            Marca d'Água
            {settings.watermark_enabled && (
              <Badge variant="default" className="text-xs">Ativo</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="font-medium">Ativar Marca d'Água</Label>
              <p className="text-sm text-muted-foreground">
                Aplicar marca d'água automaticamente em todas as imagens dos produtos
              </p>
            </div>
            <Switch
              checked={settings.watermark_enabled}
              onCheckedChange={(checked) => handleToggle('watermark_enabled', checked)}
              disabled={saving}
            />
          </div>

          {settings.watermark_enabled && (
            <>
              {/* Tipo de Marca d'água */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tipo de Marca d'Água</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      settings.watermark_type === 'text' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('watermark_type', 'text')}
                  >
                    <div className="flex items-center gap-3">
                      <Type className="h-5 w-5 text-blue-600" />
                      <div>
                        <Label className="font-medium">Texto</Label>
                        <p className="text-sm text-muted-foreground">
                          Usar texto personalizado como marca d'água
                        </p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      settings.watermark_type === 'logo' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('watermark_type', 'logo')}
                  >
                    <div className="flex items-center gap-3">
                      <Image className="h-5 w-5 text-blue-600" />
                      <div>
                        <Label className="font-medium">Logo</Label>
                        <p className="text-sm text-muted-foreground">
                          Usar logo personalizado como marca d'água
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configurações de Texto */}
              {settings.watermark_type === 'text' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Configurações de Texto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="watermark_text">Texto da Marca d'Água</Label>
                      <Input
                        id="watermark_text"
                        value={settings.watermark_text}
                        onChange={(e) => handleInputChange('watermark_text', e.target.value)}
                        placeholder="Ex: Minha Loja"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <Label htmlFor="watermark_color">Cor do Texto</Label>
                      <Input
                        id="watermark_color"
                        type="color"
                        value={settings.watermark_color}
                        onChange={(e) => handleInputChange('watermark_color', e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Tamanho da Fonte: {settings.watermark_size}px</Label>
                    <Slider
                      value={[settings.watermark_size]}
                      onValueChange={([value]) => handleInputChange('watermark_size', value)}
                      min={12}
                      max={48}
                      step={2}
                      className="mt-2"
                      disabled={saving}
                    />
                  </div>
                </div>
              )}

              {/* Configurações de Logo */}
              {settings.watermark_type === 'logo' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Configurações de Logo</h3>
                  <div>
                    <Label>Upload do Logo</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="watermark-logo-upload"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="watermark-logo-upload"
                        className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary"
                      >
                        {settings.watermark_logo_url ? (
                          <img 
                            src={settings.watermark_logo_url} 
                            alt="Logo marca d'água" 
                            className="h-24 w-24 object-contain" 
                          />
                        ) : (
                          <div className="text-center">
                            {uploading ? (
                              <Loader2 className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                            ) : (
                              <Upload className="mx-auto h-8 w-8 text-gray-400" />
                            )}
                            <span className="text-sm text-gray-500 mt-2">
                              {uploading ? 'Carregando...' : 'Clique para carregar logo'}
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label>Tamanho do Logo: {settings.watermark_size}px</Label>
                    <Slider
                      value={[settings.watermark_size]}
                      onValueChange={([value]) => handleInputChange('watermark_size', value)}
                      min={40}
                      max={120}
                      step={10}
                      className="mt-2"
                      disabled={saving}
                    />
                  </div>
                </div>
              )}

              {/* Configurações Gerais */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Posicionamento e Opacidade</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Posição</Label>
                    <Select 
                      value={settings.watermark_position} 
                      onValueChange={(value) => handleInputChange('watermark_position', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top-left">Superior Esquerdo</SelectItem>
                        <SelectItem value="top-right">Superior Direito</SelectItem>
                        <SelectItem value="bottom-left">Inferior Esquerdo</SelectItem>
                        <SelectItem value="bottom-right">Inferior Direito</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Opacidade: {Math.round(settings.watermark_opacity * 100)}%</Label>
                    <Slider
                      value={[settings.watermark_opacity]}
                      onValueChange={([value]) => handleInputChange('watermark_opacity', value)}
                      min={0.1}
                      max={1}
                      step={0.1}
                      className="mt-2"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Preview</h3>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  
                  {/* Preview da marca d'água */}
                  {settings.watermark_type === 'logo' && settings.watermark_logo_url ? (
                    <div
                      className={`absolute pointer-events-none ${
                        settings.watermark_position === 'top-left' ? 'top-4 left-4' :
                        settings.watermark_position === 'top-right' ? 'top-4 right-4' :
                        settings.watermark_position === 'bottom-left' ? 'bottom-4 left-4' :
                        settings.watermark_position === 'bottom-right' ? 'bottom-4 right-4' :
                        'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
                      }`}
                      style={{ opacity: settings.watermark_opacity }}
                    >
                      <img
                        src={settings.watermark_logo_url}
                        alt="Logo"
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                  ) : (
                    <div
                      className={`absolute text-white font-bold pointer-events-none ${
                        settings.watermark_position === 'top-left' ? 'top-4 left-4' :
                        settings.watermark_position === 'top-right' ? 'top-4 right-4' :
                        settings.watermark_position === 'bottom-left' ? 'bottom-4 left-4' :
                        settings.watermark_position === 'bottom-right' ? 'bottom-4 right-4' :
                        'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
                      }`}
                      style={{
                        opacity: settings.watermark_opacity,
                        fontSize: `${settings.watermark_size * 0.75}px`,
                        color: settings.watermark_color
                      }}
                    >
                      {settings.watermark_text}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Este é um preview de como a marca d'água aparecerá nas imagens dos produtos.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Salvando...
        </div>
      )}
    </div>
  );
};

export default WatermarkSettings;
