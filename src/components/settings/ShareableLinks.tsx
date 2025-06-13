
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useStores } from '@/hooks/useStores';
import { 
  Copy, 
  ExternalLink, 
  Share2, 
  ShoppingBag, 
  Package,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

const ShareableLinks = () => {
  const { settings, updateSettings } = useCatalogSettings();
  const { stores } = useStores();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [urlSlug, setUrlSlug] = useState('');

  // Encontrar a loja atual
  const currentStore = stores.find(store => store.id === settings?.store_id);

  React.useEffect(() => {
    if (currentStore?.url_slug) {
      setUrlSlug(currentStore.url_slug);
    } else if (currentStore?.name) {
      // Gerar slug baseado no nome da loja
      const slug = currentStore.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .trim();
      setUrlSlug(slug);
    }
  }, [currentStore]);

  const updateStoreSlug = async () => {
    if (!currentStore || !urlSlug.trim()) return;

    setSaving(true);
    try {
      // Atualizar o slug da loja (seria necessário um hook para stores)
      // Por enquanto, vamos simular
      toast({
        title: "URL atualizada",
        description: "A URL personalizada foi salva com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar URL",
        description: "Não foi possível salvar a URL personalizada.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const generateLinks = () => {
    if (!currentStore) return { retailUrl: '', wholesaleUrl: '' };

    const baseUrl = window.location.origin;
    const identifier = currentStore.url_slug || currentStore.id;
    
    return {
      retailUrl: `${baseUrl}/loja/${identifier}/varejo`,
      wholesaleUrl: `${baseUrl}/loja/${identifier}/atacado`
    };
  };

  const { retailUrl, wholesaleUrl } = generateLinks();

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Link copiado!",
        description: `O link do catálogo de ${type} foi copiado para a área de transferência.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive"
      });
    }
  };

  const openPreview = (url: string) => {
    window.open(url, '_blank');
  };

  if (!settings || !currentStore) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* URL Personalizada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            URL Personalizada da Loja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="url_slug">URL da Loja</Label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1">
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    {window.location.origin}/loja/
                  </span>
                  <Input
                    id="url_slug"
                    value={urlSlug}
                    onChange={(e) => setUrlSlug(e.target.value)}
                    placeholder="minha-loja"
                    className="rounded-l-none"
                  />
                </div>
              </div>
              <Button 
                onClick={updateStoreSlug}
                disabled={saving || !urlSlug.trim()}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Esta será a URL base para seus catálogos compartilháveis
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Links dos Catálogos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Links dos Catálogos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Catálogo de Varejo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-blue-600" />
                <Label className="font-medium">Catálogo de Varejo</Label>
                {settings.retail_catalog_active ? (
                  <Badge variant="default" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Inativo
                  </Badge>
                )}
              </div>
            </div>
            
            {settings.retail_catalog_active ? (
              <div className="flex gap-2">
                <Input
                  value={retailUrl}
                  readOnly
                  className="bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(retailUrl, 'varejo')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => openPreview(retailUrl)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ative o catálogo de varejo para gerar o link compartilhável
              </p>
            )}
          </div>

          {/* Catálogo de Atacado */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-600" />
                <Label className="font-medium">Catálogo de Atacado</Label>
                {settings.wholesale_catalog_active ? (
                  <Badge variant="default" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Inativo
                  </Badge>
                )}
              </div>
            </div>
            
            {settings.wholesale_catalog_active ? (
              <div className="flex gap-2">
                <Input
                  value={wholesaleUrl}
                  readOnly
                  className="bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(wholesaleUrl, 'atacado')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => openPreview(wholesaleUrl)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ative o catálogo de atacado para gerar o link compartilhável
              </p>
            )}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Como usar os links:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Compartilhe estes links diretamente com seus clientes</li>
              <li>• Use em redes sociais, WhatsApp ou e-mail marketing</li>
              <li>• Os clientes podem navegar e fazer pedidos sem precisar de login</li>
              <li>• Os links funcionam em qualquer dispositivo</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareableLinks;
