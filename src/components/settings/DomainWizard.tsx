import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Globe,
  CheckCircle2,
  ArrowRight,
  Copy,
  ExternalLink,
  Link,
  Crown,
  Zap,
  Info,
  Loader2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStores } from '@/hooks/useStores';
import {
  validateSubdomain,
  checkSubdomainAvailability,
} from '@/utils/dnsValidator';
import AutomaticSubdomainInfo from './AutomaticSubdomainInfo';

interface DomainWizardProps {
  settings: any;
  onUpdate: (field: string, value: any) => void;
}

type DomainType = 'slug' | 'subdomain' | 'custom_domain';

interface DomainOption {
  type: DomainType;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  features: string[];
  example: string;
}

const DomainWizard: React.FC<DomainWizardProps> = ({
  settings,
  onUpdate,
}) => {
  const { currentStore } = useStores();
  const [selectedType, setSelectedType] = useState<DomainType | null>(null);
  const [currentStep, setCurrentStep] = useState<'select' | 'configure'>('select');
  const [subdomainInput, setSubdomainInput] = useState('');
  const [customDomainInput, setCustomDomainInput] = useState('');
  
  // Estados para verificação de disponibilidade
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean | null;
    error: string | null;
    checked: boolean;
  }>({ available: null, error: null, checked: false });

  // Estado para mostrar guia do Easypanel
  const [showEasypanelGuide, setShowEasypanelGuide] = useState(false);
  const [savedSubdomain, setSavedSubdomain] = useState('');

  // Função para verificar disponibilidade de subdomínio
  const checkAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setAvailabilityStatus({ available: null, error: null, checked: false });
      return;
    }

    // Validar formato primeiro
    const validation = validateSubdomain(subdomain);
    if (!validation.valid) {
      setAvailabilityStatus({ 
        available: false, 
        error: validation.error || 'Formato inválido', 
        checked: true 
      });
      return;
    }

    setIsCheckingAvailability(true);
    
    try {
      const result = await checkSubdomainAvailability(subdomain, currentStore?.id);
      
      setAvailabilityStatus({
        available: result.available,
        error: result.error,
        checked: true
      });
    } catch (error) {
      setAvailabilityStatus({
        available: false,
        error: 'Erro ao verificar disponibilidade',
        checked: true
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Verificar disponibilidade quando o input muda
  useEffect(() => {
    if (subdomainInput) {
      const timeoutId = setTimeout(() => {
        checkAvailability(subdomainInput);
      }, 500); // Debounce de 500ms
      
      return () => clearTimeout(timeoutId);
    } else {
      setAvailabilityStatus({ available: null, error: null, checked: false });
    }
  }, [subdomainInput, currentStore?.id]);

  // URL atual baseada no tipo selecionado
  const getCurrentUrl = () => {
    const storeName = currentStore?.url_slug || currentStore?.name || 'minhaloja';
    
    switch (settings.domain_mode || 'slug') {
      case 'subdomain':
        return settings.subdomain 
          ? `https://${settings.subdomain}.aoseudispor.com.br`
          : `https://[subdominio].aoseudispor.com.br`;
      case 'custom_domain':
        return settings.custom_domain 
          ? `https://${settings.custom_domain}`
          : `https://www.seudominio.com.br`;
      default:
        return `https://app.aoseudispor.com.br/catalog/${storeName}`;
    }
  };

  const domainOptions: DomainOption[] = [
    {
      type: 'slug',
      title: 'Slug Tradicional',
      description: 'Modo padrão e gratuito',
      icon: <Link className="h-8 w-8" />,
      badge: 'Atual',
      features: [
        'Funciona imediatamente',
        'Sem configuração adicional',
        'SSL automático',
        'Totalmente gratuito'
      ],
      example: 'app.aoseudispor.com.br/catalog/minhaloja'
    },
    {
      type: 'subdomain',
      title: 'Subdomínio Gratuito',
      description: 'URL mais profissional',
      icon: <Globe className="h-8 w-8" />,
      badge: 'Popular',
      features: [
        'URL mais limpa',
        'Totalmente gratuito',
        'SSL automático',
        'Configuração em 2 minutos'
      ],
      example: 'minhaloja.aoseudispor.com.br'
    },
    {
      type: 'custom_domain',
      title: 'Domínio Próprio',
      description: 'Máxima profissionalidade',
      icon: <Crown className="h-8 w-8" />,
      badge: 'Premium',
      features: [
        'Sua marca própria',
        'Máxima credibilidade',
        'SEO otimizado',
        'Controle total'
      ],
      example: 'www.minhaloja.com.br'
    }
  ];

  const handleTypeSelection = (type: DomainType) => {
    setSelectedType(type);
    setCurrentStep('configure');
    
    if (type === 'slug') {
      // Slug é imediato
      onUpdate('domain_mode', 'slug');
      toast.success('Modo slug ativado! Funciona imediatamente.');
      setCurrentStep('select');
    }
  };

  const handleSubdomainSave = async () => {
    if (!subdomainInput || subdomainInput.length < 3) {
      toast.error('Subdomínio deve ter pelo menos 3 caracteres');
      return;
    }

    // Verificar se já foi validado e está disponível
    if (!availabilityStatus.checked || !availabilityStatus.available) {
      if (availabilityStatus.error) {
        toast.error(availabilityStatus.error);
      } else {
        toast.error('Aguarde a verificação de disponibilidade');
      }
      return;
    }

    try {
      // Salvar configurações
      await onUpdate('subdomain', subdomainInput);
      await onUpdate('subdomain_enabled', true);
      await onUpdate('domain_mode', 'subdomain');

      // Salvar subdomínio e mostrar guia
      setSavedSubdomain(subdomainInput);
      setShowEasypanelGuide(true);

      toast.success('Subdomínio configurado! Agora configure no Easypanel.');
      setCurrentStep('select');
    } catch (error) {
      toast.error('Erro ao configurar subdomínio');
      console.error('Erro:', error);
    }
  };

  const handleCustomDomainSave = async () => {
    if (!customDomainInput || !customDomainInput.includes('.')) {
      toast.error('Digite um domínio válido (ex: www.exemplo.com.br)');
      return;
    }

    // Salvar configurações
    await onUpdate('custom_domain', customDomainInput.toLowerCase());
    await onUpdate('custom_domain_enabled', true);
    await onUpdate('domain_mode', 'custom_domain');

    toast.success('Domínio configurado! Complete a verificação DNS.');
    setCurrentStep('select');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copiada para área de transferência!');
  };

  if (currentStep === 'configure' && selectedType) {
    const option = domainOptions.find(opt => opt.type === selectedType)!;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentStep('select')}
          >
            ← Voltar
          </Button>
        </div>

        {/* Configuração */}
        <Card className="border-2 border-primary">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              {option.icon}
              <div>
                <CardTitle>{option.title}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {selectedType === 'subdomain' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subdomain-config">Escolha seu Subdomínio</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        id="subdomain-config"
                        placeholder="minhaloja"
                        value={subdomainInput}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                          setSubdomainInput(value);
                        }}
                        className={`pr-10 ${
                          availabilityStatus.checked && availabilityStatus.available === false
                            ? 'border-red-500 focus:border-red-500'
                            : availabilityStatus.checked && availabilityStatus.available === true
                            ? 'border-green-500 focus:border-green-500'
                            : ''
                        }`}
                      />
                      
                      {/* Ícone de status */}
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {isCheckingAvailability && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                        {!isCheckingAvailability && availabilityStatus.checked && availabilityStatus.available === true && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {!isCheckingAvailability && availabilityStatus.checked && availabilityStatus.available === false && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center px-3 text-sm bg-gray-100 border rounded-md">
                      .aoseudispor.com.br
                    </div>
                  </div>
                  
                  {/* Status de verificação */}
                  {availabilityStatus.checked && (
                    <div className={`p-2 rounded-md text-sm ${
                      availabilityStatus.available 
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                      {availabilityStatus.available 
                        ? '✅ Subdomínio disponível!'
                        : `❌ ${availabilityStatus.error}`
                      }
                    </div>
                  )}
                  
                  {subdomainInput && availabilityStatus.available && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm font-medium text-blue-800">
                        Sua URL será: <code className="bg-blue-100 px-1 rounded">
                          https://{subdomainInput}.aoseudispor.com.br
                        </code>
                      </p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleSubdomainSave}
                  disabled={
                    !subdomainInput || 
                    subdomainInput.length < 3 || 
                    isCheckingAvailability ||
                    !availabilityStatus.available
                  }
                  className="w-full"
                >
                  {isCheckingAvailability ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Ativar Subdomínio
                    </>
                  )}
                </Button>
              </>
            )}

            {selectedType === 'custom_domain' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="custom-domain-config">Digite seu Domínio</Label>
                  <Input
                    id="custom-domain-config"
                    placeholder="www.minhaloja.com.br"
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value.toLowerCase().trim())}
                  />
                  
                  {customDomainInput && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm font-medium text-blue-800">
                        Sua URL será: <code className="bg-blue-100 px-1 rounded">
                          https://{customDomainInput}
                        </code>
                      </p>
                    </div>
                  )}
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Após salvar, você precisará configurar o DNS do seu domínio para apontar para nossos servidores.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handleCustomDomainSave}
                  disabled={!customDomainInput || !customDomainInput.includes('.')}
                  className="w-full"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Configurar Domínio Próprio
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* URL Atual */}
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-gray-600">URL Atual do Catálogo</p>
            <div className="flex items-center justify-center gap-2">
              <code className="px-3 py-2 bg-white border rounded-md text-sm font-mono">
                {getCurrentUrl()}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(getCurrentUrl())}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(getCurrentUrl(), '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            
              <div className="flex items-center gap-2">
                <Badge variant={settings.domain_mode === 'slug' ? 'default' : 'secondary'}>
                  Modo: {settings.domain_mode === 'subdomain' ? 'Subdomínio' : 
                         settings.domain_mode === 'custom_domain' ? 'Domínio Próprio' : 'Slug Tradicional'}
                </Badge>
                
                {/* Botão para mostrar informações do sistema automático */}
                {settings.domain_mode === 'subdomain' && settings.subdomain && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEasypanelGuide(!showEasypanelGuide)}
                    className="text-xs"
                  >
                    {showEasypanelGuide ? 'Ocultar' : 'Mostrar'} Sistema Automático
                  </Button>
                )}
              </div>
          </div>
        </CardContent>
      </Card>

      {/* Título */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Escolha como seus clientes acessarão seu catálogo</h3>
        <p className="text-sm text-muted-foreground">
          Selecione uma opção abaixo para configurar a URL do seu catálogo
        </p>
      </div>

      {/* Cards de Opções */}
      <div className="grid gap-4 md:grid-cols-3">
        {domainOptions.map((option) => {
          const isActive = settings.domain_mode === option.type;
          
          return (
            <Card 
              key={option.type}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isActive ? 'border-primary border-2 bg-primary/5' : ''
              }`}
              onClick={() => handleTypeSelection(option.type)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <div>
                      <CardTitle className="text-base">{option.title}</CardTitle>
                      <CardDescription className="text-xs">{option.description}</CardDescription>
                    </div>
                  </div>
                  {option.badge && (
                    <Badge 
                      variant={option.badge === 'Atual' ? 'default' : 
                              option.badge === 'Popular' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {option.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-3">
                {/* Exemplo de URL */}
                <div className="p-2 bg-gray-50 rounded text-xs font-mono text-gray-600">
                  {option.example}
                </div>
                
                {/* Features */}
                <ul className="space-y-1">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {/* Botão */}
                <Button 
                  variant={isActive ? "default" : "outline"} 
                  size="sm" 
                  className="w-full"
                >
                  {isActive ? 'Configurado' : 'Selecionar'}
                  {!isActive && <ArrowRight className="h-3 w-3 ml-1" />}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Links de Ajuda */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Dica:</strong> Você pode mudar entre os modos a qualquer momento. 
          O modo Slug sempre funciona como backup.
        </AlertDescription>
      </Alert>

      {/* Informações do Sistema Automático */}
      <AutomaticSubdomainInfo 
        subdomain={savedSubdomain || settings.subdomain || ''}
        isVisible={showEasypanelGuide || (settings.domain_mode === 'subdomain' && settings.subdomain)}
      />
    </div>
  );
};

export default DomainWizard;
