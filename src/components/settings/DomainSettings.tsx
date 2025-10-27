import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  Info,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  generateDomainVerificationToken,
  checkDNSVerification,
  verifyAndUpdateDomain,
  validateSubdomain,
  checkSubdomainAvailability,
} from '@/utils/dnsValidator';
import { useAuth } from '@/hooks/useAuth';

interface DomainSettingsProps {
  settings: any;
  onUpdate: (field: string, value: any) => void;
}

const DomainSettings: React.FC<DomainSettingsProps> = ({
  settings,
  onUpdate,
}) => {
  const { profile } = useAuth();
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [isVerifyingDNS, setIsVerifyingDNS] = useState(false);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string>('');

  // Carregar token existente
  useEffect(() => {
    if (settings.custom_domain_verification_token) {
      setVerificationToken(settings.custom_domain_verification_token);
    }
  }, [settings.custom_domain_verification_token]);

  /**
   * Verificar disponibilidade de subdomínio
   */
  const handleCheckSubdomain = async () => {
    const subdomain = settings.subdomain?.trim().toLowerCase();
    
    if (!subdomain) {
      setSubdomainError('Digite um subdomínio');
      return;
    }

    // Validar formato
    const validation = validateSubdomain(subdomain);
    if (!validation.valid) {
      setSubdomainError(validation.error || 'Subdomínio inválido');
      return;
    }

    setIsCheckingSubdomain(true);
    setSubdomainError(null);

    const result = await checkSubdomainAvailability(subdomain);

    setIsCheckingSubdomain(false);

    if (result.available) {
      toast.success(`✅ Subdomínio "${subdomain}" está disponível!`);
      setSubdomainError(null);
    } else {
      setSubdomainError(result.error || 'Subdomínio não disponível');
      toast.error(`❌ Subdomínio "${subdomain}" já está em uso`);
    }
  };

  /**
   * Gerar token de verificação
   */
  const handleGenerateToken = async () => {
    if (!profile?.store_id) {
      toast.error('Store ID não encontrado');
      return;
    }

    const domain = settings.custom_domain?.trim().toLowerCase();
    if (!domain) {
      toast.error('Digite um domínio primeiro');
      return;
    }

    setIsGeneratingToken(true);

    const result = await generateDomainVerificationToken(profile.store_id, domain);

    setIsGeneratingToken(false);

    if (result.error) {
      toast.error(`Erro: ${result.error}`);
    } else {
      setVerificationToken(result.token);
      onUpdate('custom_domain_verification_token', result.token);
      onUpdate('custom_domain', domain);
      toast.success('Token gerado! Configure o DNS conforme instruções abaixo.');
    }
  };

  /**
   * Verificar DNS
   */
  const handleVerifyDNS = async () => {
    if (!profile?.store_id) {
      toast.error('Store ID não encontrado');
      return;
    }

    const domain = settings.custom_domain?.trim().toLowerCase();
    const token = settings.custom_domain_verification_token || verificationToken;

    if (!domain) {
      toast.error('Configure o domínio primeiro');
      return;
    }

    if (!token) {
      toast.error('Gere o token de verificação primeiro');
      return;
    }

    setIsVerifyingDNS(true);

    const result = await verifyAndUpdateDomain(profile.store_id, domain, token);

    setIsVerifyingDNS(false);

    if (result.success) {
      onUpdate('custom_domain_verified', true);
      onUpdate('custom_domain_verified_at', new Date().toISOString());
      toast.success('✅ Domínio verificado com sucesso!');
    } else {
      toast.error(`❌ Verificação falhou: ${result.error}`);
    }
  };

  /**
   * Copiar para clipboard
   */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência!');
  };

  // Gerar URLs de preview
  const slugUrl = settings.catalog_url_slug 
    ? `https://app.aoseudispor.com.br/catalog/${settings.catalog_url_slug}`
    : 'Configure o slug da loja primeiro';

  const subdomainUrl = settings.subdomain
    ? `https://${settings.subdomain}.aoseudispor.com.br`
    : 'Configure o subdomínio';

  const customDomainUrl = settings.custom_domain
    ? `https://${settings.custom_domain}`
    : 'Configure o domínio próprio';

  return (
    <div className="space-y-6">
      {/* Modo de Acesso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Modo de Acesso ao Catálogo
          </CardTitle>
          <CardDescription>
            Escolha como seus clientes acessarão o catálogo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={settings.domain_mode || 'slug'}
            onValueChange={(value) => onUpdate('domain_mode', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="slug" id="mode-slug" />
              <Label htmlFor="mode-slug" className="font-normal cursor-pointer">
                <div>
                  <div className="font-medium">Slug Tradicional</div>
                  <div className="text-xs text-gray-500">{slugUrl}</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="subdomain" id="mode-subdomain" />
              <Label htmlFor="mode-subdomain" className="font-normal cursor-pointer">
                <div>
                  <div className="font-medium">Subdomínio</div>
                  <div className="text-xs text-gray-500">{subdomainUrl}</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom_domain" id="mode-custom" />
              <Label htmlFor="mode-custom" className="font-normal cursor-pointer">
                <div>
                  <div className="font-medium">Domínio Próprio</div>
                  <div className="text-xs text-gray-500">{customDomainUrl}</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Subdomínio */}
      <Card>
        <CardHeader>
          <CardTitle>Subdomínio</CardTitle>
          <CardDescription>
            Configure um subdomínio gratuito para seu catálogo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="subdomain-enabled">Habilitar Subdomínio</Label>
              <p className="text-xs text-gray-500 mt-1">
                Ativar acesso via subdomínio personalizado
              </p>
            </div>
            <Switch
              id="subdomain-enabled"
              checked={settings.subdomain_enabled || false}
              onCheckedChange={(checked) => onUpdate('subdomain_enabled', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="subdomain">Escolha seu Subdomínio</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex">
                  <Input
                    id="subdomain"
                    placeholder="mirazzi"
                    value={settings.subdomain || ''}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      onUpdate('subdomain', value);
                      setSubdomainError(null);
                    }}
                    className={subdomainError ? 'border-red-500' : ''}
                  />
                  <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md">
                    .aoseudispor.com.br
                  </span>
                </div>
                {subdomainError && (
                  <p className="text-xs text-red-600 mt-1">{subdomainError}</p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={handleCheckSubdomain}
                disabled={isCheckingSubdomain || !settings.subdomain}
              >
                {isCheckingSubdomain ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Verificar'
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Apenas letras minúsculas, números e hífen. Mínimo 3 caracteres.
            </p>
          </div>

          {settings.subdomain && !subdomainError && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                <div className="space-y-2">
                  <p className="font-medium">Seu catálogo ficará disponível em:</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                      https://{settings.subdomain}.aoseudispor.com.br
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(`https://${settings.subdomain}.aoseudispor.com.br`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Domínio Próprio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Domínio Próprio
            {settings.custom_domain_verified && (
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Use seu próprio domínio (ex: www.mirazzi.com.br)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="custom-domain-enabled">Habilitar Domínio Próprio</Label>
              <p className="text-xs text-gray-500 mt-1">
                Ativar acesso via domínio personalizado
              </p>
            </div>
            <Switch
              id="custom-domain-enabled"
              checked={settings.custom_domain_enabled || false}
              onCheckedChange={(checked) => onUpdate('custom_domain_enabled', checked)}
              disabled={!settings.custom_domain_verified}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="custom-domain">Seu Domínio</Label>
            <Input
              id="custom-domain"
              placeholder="www.mirazzi.com.br"
              value={settings.custom_domain || ''}
              onChange={(e) => onUpdate('custom_domain', e.target.value.toLowerCase().trim())}
            />
            <p className="text-xs text-gray-500">
              Digite o domínio completo, incluindo www se necessário
            </p>
          </div>

          {/* Passo 1: Gerar Token */}
          <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">1. Gerar Token de Verificação</h4>
              <Button
                size="sm"
                onClick={handleGenerateToken}
                disabled={isGeneratingToken || !settings.custom_domain}
              >
                {isGeneratingToken ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {verificationToken ? 'Gerar Novo Token' : 'Gerar Token'}
              </Button>
            </div>

            {verificationToken && (
              <div className="space-y-2">
                <Label className="text-xs">Token Gerado:</Label>
                <div className="flex gap-2">
                  <Input
                    value={verificationToken}
                    readOnly
                    className="font-mono text-xs bg-white"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(verificationToken)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Passo 2: Configurar DNS */}
          {verificationToken && (
            <div className="border rounded-lg p-4 bg-amber-50 border-amber-200 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2 text-amber-900">
                <AlertCircle className="h-4 w-4" />
                2. Configure o DNS do seu Domínio
              </h4>
              
              <div className="space-y-3 text-sm">
                <p className="text-amber-900">
                  Adicione os seguintes registros no painel DNS do seu provedor:
                </p>

                {/* Registro TXT de Verificação */}
                <div className="bg-white rounded p-3 space-y-2 border border-amber-300">
                  <p className="font-medium text-xs text-gray-700">Registro TXT (Verificação):</p>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-gray-500">Tipo:</span>
                      <div className="bg-gray-100 px-2 py-1 rounded mt-1">TXT</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Nome:</span>
                      <div className="bg-gray-100 px-2 py-1 rounded mt-1">
                        _vendmais-verification
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Valor:</span>
                      <div className="bg-gray-100 px-2 py-1 rounded mt-1 flex items-center justify-between">
                        <span className="truncate">{verificationToken.substring(0, 20)}...</span>
                        <Copy 
                          className="h-3 w-3 cursor-pointer text-gray-500 hover:text-gray-700"
                          onClick={() => copyToClipboard(verificationToken)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registro A/CNAME */}
                <div className="bg-white rounded p-3 space-y-2 border border-amber-300">
                  <p className="font-medium text-xs text-gray-700">Registro A ou CNAME (Apontamento):</p>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-gray-500">Tipo:</span>
                      <div className="bg-gray-100 px-2 py-1 rounded mt-1">CNAME</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Nome:</span>
                      <div className="bg-gray-100 px-2 py-1 rounded mt-1">
                        {settings.custom_domain?.startsWith('www.') ? 'www' : '@'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Valor:</span>
                      <div className="bg-gray-100 px-2 py-1 rounded mt-1">
                        app.aoseudispor.com.br
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-amber-800">
                  ⏱️ Aguarde 5-60 minutos para propagação DNS antes de verificar.
                </p>
              </div>
            </div>
          )}

          {/* Passo 3: Verificar */}
          {verificationToken && (
            <div className="border rounded-lg p-4 bg-green-50 border-green-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-green-900">
                  3. Verificar Configuração DNS
                </h4>
                <Button
                  size="sm"
                  onClick={handleVerifyDNS}
                  disabled={isVerifyingDNS}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isVerifyingDNS ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Verificar DNS
                </Button>
              </div>

              {settings.custom_domain_verified && settings.custom_domain_verified_at && (
                <Alert className="bg-green-100 border-green-300">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900 text-sm">
                    ✅ Domínio verificado em {new Date(settings.custom_domain_verified_at).toLocaleString('pt-BR')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Instruções SSL */}
          {settings.custom_domain_verified && (
            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                <div className="space-y-2">
                  <p className="font-medium">4. Configurar SSL (HTTPS)</p>
                  <p>
                    Para ativar HTTPS no seu domínio, execute no servidor:
                  </p>
                  <code className="block bg-blue-100 px-3 py-2 rounded text-xs">
                    sudo certbot --nginx -d {settings.custom_domain}
                  </code>
                  <p className="text-xs">
                    Certbot configurará automaticamente o certificado Let's Encrypt.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* URLs Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Links do Catálogo</CardTitle>
          <CardDescription>
            Compartilhe seu catálogo com clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Slug */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Slug (Sempre Disponível):</Label>
            <div className="flex gap-2">
              <Input value={slugUrl} readOnly className="text-sm" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(slugUrl)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(slugUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Subdomínio */}
          {settings.subdomain && settings.subdomain_enabled && (
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Subdomínio:</Label>
              <div className="flex gap-2">
                <Input value={subdomainUrl} readOnly className="text-sm" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(subdomainUrl)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(subdomainUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Domínio Próprio */}
          {settings.custom_domain && settings.custom_domain_enabled && settings.custom_domain_verified && (
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Domínio Próprio:</Label>
              <div className="flex gap-2">
                <Input value={customDomainUrl} readOnly className="text-sm" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(customDomainUrl)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(customDomainUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DomainSettings;
