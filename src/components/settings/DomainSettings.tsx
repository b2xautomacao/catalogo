
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, Check, AlertCircle, ExternalLink, Copy, Loader2, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useDomainValidation } from '@/hooks/useDomainValidation';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';

const DomainSettings = () => {
  const { settings, loading, updateSettings } = useCatalogSettings();
  const { validateDomain, validateSlug, isValidating } = useDomainValidation();
  const { toast } = useToast();
  
  // Estados locais para evitar perda de foco
  const [localCustomDomain, setLocalCustomDomain] = useState('');
  const [localCatalogSlug, setLocalCatalogSlug] = useState('');
  
  // Estados para validação
  const [domainValidation, setDomainValidation] = useState<any>(null);
  const [slugValidation, setSlugValidation] = useState<any>(null);
  
  // Debounce para evitar muitas validações
  const debouncedDomain = useDebounce(localCustomDomain, 1000);
  const debouncedSlug = useDebounce(localCatalogSlug, 500);
  
  const [saving, setSaving] = useState(false);

  // Sincronizar com settings quando carregam
  useEffect(() => {
    if (settings) {
      setLocalCustomDomain(settings.custom_domain || '');
      setLocalCatalogSlug(settings.catalog_url_slug || '');
    }
  }, [settings]);

  // Validar domínio quando debounced value muda
  useEffect(() => {
    if (debouncedDomain && debouncedDomain !== settings?.custom_domain) {
      validateDomain(debouncedDomain).then(setDomainValidation);
    } else if (!debouncedDomain) {
      setDomainValidation(null);
    }
  }, [debouncedDomain, validateDomain, settings?.custom_domain]);

  // Validar slug quando debounced value muda
  useEffect(() => {
    if (debouncedSlug && debouncedSlug !== settings?.catalog_url_slug) {
      const result = validateSlug(debouncedSlug);
      setSlugValidation(result);
    } else if (!debouncedSlug) {
      setSlugValidation(null);
    }
  }, [debouncedSlug, validateSlug, settings?.catalog_url_slug]);

  // Salvar no banco quando validação é bem-sucedida
  useEffect(() => {
    const saveDomain = async () => {
      if (domainValidation?.isValid && debouncedDomain !== settings?.custom_domain) {
        setSaving(true);
        try {
          await updateSettings({ custom_domain: debouncedDomain || null });
          toast({
            title: "Domínio atualizado",
            description: "Domínio personalizado foi salvo com sucesso",
          });
        } catch (error) {
          toast({
            title: "Erro ao salvar domínio",
            description: "Tente novamente em alguns instantes",
            variant: "destructive"
          });
        } finally {
          setSaving(false);
        }
      }
    };
    
    saveDomain();
  }, [domainValidation, debouncedDomain, settings?.custom_domain, updateSettings, toast]);

  useEffect(() => {
    const saveSlug = async () => {
      if (slugValidation?.isValid && debouncedSlug !== settings?.catalog_url_slug) {
        setSaving(true);
        try {
          await updateSettings({ catalog_url_slug: debouncedSlug || null });
          toast({
            title: "URL atualizada",
            description: "URL do catálogo foi salva com sucesso",
          });
        } catch (error) {
          toast({
            title: "Erro ao salvar URL",
            description: "Tente novamente em alguns instantes",
            variant: "destructive"
          });
        } finally {
          setSaving(false);
        }
      }
    };
    
    saveSlug();
  }, [slugValidation, debouncedSlug, settings?.catalog_url_slug, updateSettings, toast]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência",
    });
  };

  const generateCatalogUrl = () => {
    if (!settings) return '';
    
    const baseUrl = settings.custom_domain 
      ? `https://${settings.custom_domain}`
      : 'https://catalogo.seusite.com'; // URL base padrão do sistema
    
    const slug = settings.catalog_url_slug || 'loja';
    
    return `${baseUrl}/${slug}`;
  };

  const getValidationIcon = (validation: any, isValidating: boolean) => {
    if (isValidating) return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    if (!validation) return null;
    if (validation.isValid) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <p className="text-gray-500">Erro ao carregar configurações de domínio</p>
        </CardContent>
      </Card>
    );
  }

  const catalogUrl = generateCatalogUrl();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-600" />
            Configurações de Domínio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Domínio Personalizado */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="custom_domain">Domínio Personalizado</Label>
              {getValidationIcon(domainValidation, isValidating)}
              {saving && <Badge variant="outline" className="text-blue-600 border-blue-200">Salvando...</Badge>}
            </div>
            
            <div className="relative">
              <Input
                id="custom_domain"
                placeholder="www.meusite.com.br"
                value={localCustomDomain}
                onChange={(e) => setLocalCustomDomain(e.target.value)}
                className="font-mono"
              />
            </div>
            
            {domainValidation && !domainValidation.isValid && (
              <div className="space-y-2">
                {domainValidation.errors.map((error: string, index: number) => (
                  <p key={index} className="text-sm text-red-600">{error}</p>
                ))}
                {domainValidation.suggestions && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Sugestões:</p>
                    {domainValidation.suggestions.map((suggestion: string, index: number) => (
                      <p key={index} className="ml-2">• {suggestion}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              Deixe em branco para usar o domínio padrão do sistema
            </p>
          </div>

          {/* URL do Catálogo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="catalog_url_slug">URL do Catálogo</Label>
              {getValidationIcon(slugValidation, false)}
            </div>
            
            <Input
              id="catalog_url_slug"
              placeholder="minha-loja"
              value={localCatalogSlug}
              onChange={(e) => setLocalCatalogSlug(e.target.value)}
              className="font-mono"
            />
            
            {slugValidation && !slugValidation.isValid && (
              <div className="space-y-2">
                {slugValidation.errors.map((error: string, index: number) => (
                  <p key={index} className="text-sm text-red-600">{error}</p>
                ))}
                {slugValidation.suggestions && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Sugestões:</p>
                    {slugValidation.suggestions.map((suggestion: string, index: number) => (
                      <p key={index} className="ml-2">• {suggestion}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              Personaliza a URL do seu catálogo (apenas letras, números e hífens)
            </p>
          </div>

          {/* Preview da URL */}
          <div className="space-y-3">
            <Label>Preview da URL do Catálogo</Label>
            
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
              <code className="flex-1 text-sm font-mono text-blue-600">
                {catalogUrl}
              </code>
              
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(catalogUrl)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(catalogUrl, '_blank')}
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instruções de Configuração DNS */}
      {localCustomDomain && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Configuração DNS Necessária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Para ativar seu domínio personalizado, você precisa configurar os registros DNS no seu provedor.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-3">1. Verificação de Propriedade (TXT Record)</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><strong>Tipo:</strong> TXT</div>
                    <div><strong>Nome:</strong> _lovable-verify</div>
                    <div><strong>Valor:</strong> verify-abc123xyz</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-3">2. Direcionamento (CNAME Record)</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><strong>Tipo:</strong> CNAME</div>
                    <div><strong>Nome:</strong> {localCustomDomain.replace('https://', '').replace('http://', '')}</div>
                    <div><strong>Destino:</strong> proxy.lovable.dev</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Instruções por Provedor:</h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2">Cloudflare</h5>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Acesse o painel do Cloudflare</li>
                    <li>Vá em DNS → Records</li>
                    <li>Adicione os registros TXT e CNAME</li>
                    <li>Aguarde até 10 minutos</li>
                  </ol>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2">Registro.br / GoDaddy</h5>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Acesse o painel de DNS</li>
                    <li>Adicione os registros necessários</li>
                    <li>Aguarde propagação (até 24h)</li>
                  </ol>
                </div>
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Certificado SSL:</strong> Será gerado automaticamente após a verificação.
                Seu catálogo ficará disponível em HTTPS.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Informações de Segurança */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Segurança:</strong> Todos os domínios personalizados passam por verificação rigorosa. 
          URLs maliciosas ou inadequadas são bloqueadas automaticamente.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DomainSettings;
