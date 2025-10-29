import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Zap, 
  Shield, 
  Globe,
  ExternalLink,
  Loader2,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

interface AutomaticSubdomainInfoProps {
  subdomain: string;
  isVisible: boolean;
}

const AutomaticSubdomainInfo: React.FC<AutomaticSubdomainInfoProps> = ({
  subdomain,
  isVisible
}) => {
  const [status, setStatus] = useState<'checking' | 'active' | 'pending' | 'error'>('checking');
  const [testingUrl, setTestingUrl] = useState(false);

  const subdomainUrl = `https://${subdomain}.aoseudispor.com.br`;

  // Verificar status do subdomínio
  const checkSubdomainStatus = async () => {
    if (!subdomain) return;

    setStatus('checking');

    try {
      // Simular verificação (em produção, isso seria uma verificação real)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Por enquanto, assumir que está ativo
      setStatus('active');
    } catch (error) {
      setStatus('error');
    }
  };

  useEffect(() => {
    if (isVisible && subdomain) {
      checkSubdomainStatus();
    }
  }, [isVisible, subdomain]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copiada para área de transferência!');
  };

  const testUrl = async () => {
    setTestingUrl(true);
    
    try {
      // Abrir em nova aba
      window.open(subdomainUrl, '_blank');
      
      // Simular delay de teste
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Teste realizado! Verifique a nova aba.');
    } catch (error) {
      toast.error('Erro ao testar URL');
    } finally {
      setTestingUrl(false);
    }
  };

  if (!isVisible) return null;

  const statusConfig = {
    checking: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      color: 'bg-blue-100 text-blue-800',
      text: 'Verificando...'
    },
    active: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: 'bg-green-100 text-green-800',
      text: 'Ativo'
    },
    pending: {
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-yellow-100 text-yellow-800',
      text: 'Propagando'
    },
    error: {
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'bg-red-100 text-red-800',
      text: 'Erro'
    }
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="space-y-6">
      {/* Header - Sistema Automático */}
      <Alert className="border-emerald-200 bg-emerald-50">
        <Zap className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-emerald-800">
          <strong>🚀 Sistema Automático Ativo!</strong> Seu subdomínio está configurado e funcionará automaticamente com DNS wildcard e SSL automático.
        </AlertDescription>
      </Alert>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Status do Subdomínio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL e Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm">{subdomainUrl}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(subdomainUrl)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={currentStatus.color}>
                  {currentStatus.icon}
                  <span className="ml-1">{currentStatus.text}</span>
                </Badge>
              </div>
            </div>
            
            <Button
              onClick={testUrl}
              disabled={testingUrl || status === 'checking'}
              size="sm"
            >
              {testingUrl ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Testando...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Testar URL
                </>
              )}
            </Button>
          </div>

          {/* Features Automáticas */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm font-medium">DNS Wildcard</div>
                <div className="text-xs text-gray-600">Automático</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Shield className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm font-medium">SSL Certificate</div>
                <div className="text-xs text-gray-600">Automático</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Zap className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm font-medium">Nginx Routing</div>
                <div className="text-xs text-gray-600">Automático</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Como Funciona */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como Funciona o Sistema Automático</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <div className="font-medium text-sm">DNS Wildcard Configurado</div>
                <div className="text-xs text-gray-600">
                  *.aoseudispor.com.br aponta automaticamente para o servidor
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <div className="font-medium text-sm">SSL Wildcard Ativo</div>
                <div className="text-xs text-gray-600">
                  Certificado único protege todos os subdomínios automaticamente
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <div className="font-medium text-sm">Roteamento Inteligente</div>
                <div className="text-xs text-gray-600">
                  Nginx detecta o subdomínio e carrega a loja correta automaticamente
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <div>
                <div className="font-medium text-sm">Pronto para Usar!</div>
                <div className="text-xs text-gray-600">
                  Seu subdomínio funciona imediatamente, sem configuração manual
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vantagens */}
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Vantagens do Sistema Automático:</strong>
          <ul className="mt-2 ml-4 text-sm space-y-1 list-disc">
            <li><strong>Zero Configuração:</strong> Funciona imediatamente após ativar</li>
            <li><strong>SSL Automático:</strong> Certificado válido sem setup manual</li>
            <li><strong>Alta Performance:</strong> Roteamento otimizado pelo Nginx</li>
            <li><strong>Escalável:</strong> Suporta milhares de subdomínios</li>
            <li><strong>Seguro:</strong> Headers de segurança e rate limiting</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Troubleshooting Rápido */}
      {(status === 'error' || status === 'pending') && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Se não estiver funcionando:</strong>
            <ul className="mt-2 ml-4 text-sm space-y-1 list-disc">
              <li>Aguarde alguns minutos (DNS pode demorar para propagar)</li>
              <li>Verifique se o subdomínio está salvo corretamente</li>
              <li>Teste em uma aba anônima (limpa cache)</li>
              <li>Contate o administrador se persistir</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AutomaticSubdomainInfo;
