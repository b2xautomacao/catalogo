import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Info,
  Zap,
  Globe,
  Shield,
  Server
} from 'lucide-react';
import { toast } from 'sonner';

interface EasypanelSetupGuideProps {
  subdomain: string;
  isVisible: boolean;
}

const EasypanelSetupGuide: React.FC<EasypanelSetupGuideProps> = ({
  subdomain,
  isVisible
}) => {
  const [dnsStatus, setDnsStatus] = useState<'checking' | 'success' | 'error' | 'unknown'>('unknown');
  const [sslStatus, setSslStatus] = useState<'checking' | 'success' | 'error' | 'unknown'>('unknown');

  const subdomainUrl = `https://${subdomain}.aoseudispor.com.br`;
  
  // Detectar se estamos no Easypanel
  const isEasypanel = window.location.hostname.includes('easypanel') || 
                     window.location.hostname.includes('panel') ||
                     process.env.EASYPANEL === 'true';

  // Verificar status do subdomínio
  const checkSubdomainStatus = async () => {
    if (!subdomain) return;

    setDnsStatus('checking');
    setSslStatus('checking');

    try {
      // Tentar acessar o subdomínio
      const response = await fetch(`https://${subdomain}.aoseudispor.com.br`, {
        method: 'HEAD',
        mode: 'no-cors'
      });

      // Se chegou até aqui, DNS está ok
      setDnsStatus('success');
      setSslStatus('success');
    } catch (error) {
      // Erro pode ser DNS ou SSL
      setDnsStatus('error');
      setSslStatus('error');
    }
  };

  useEffect(() => {
    if (isVisible && subdomain) {
      checkSubdomainStatus();
    }
  }, [isVisible, subdomain]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência!');
  };

  const steps = [
    {
      id: 'dns',
      title: 'Configurar DNS',
      description: 'Apontar subdomínio para Easypanel',
      status: dnsStatus,
      required: true
    },
    {
      id: 'easypanel',
      title: 'Adicionar no Easypanel',
      description: 'Registrar domínio no painel',
      status: 'unknown',
      required: true
    },
    {
      id: 'ssl',
      title: 'SSL Automático',
      description: 'Certificado será gerado automaticamente',
      status: sslStatus,
      required: true
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Header de Alerta */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Subdomínio configurado na aplicação!</strong> Agora você precisa configurar no Easypanel para funcionar.
        </AlertDescription>
      </Alert>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {step.id === 'dns' && <Globe className="h-4 w-4" />}
                  {step.id === 'easypanel' && <Server className="h-4 w-4" />}
                  {step.id === 'ssl' && <Shield className="h-4 w-4" />}
                  <CardTitle className="text-sm">{step.title}</CardTitle>
                </div>
                
                {step.status === 'checking' && (
                  <Badge variant="secondary">Verificando...</Badge>
                )}
                {step.status === 'success' && (
                  <Badge className="bg-green-100 text-green-800">✅ OK</Badge>
                )}
                {step.status === 'error' && (
                  <Badge variant="destructive">❌ Erro</Badge>
                )}
                {step.status === 'unknown' && (
                  <Badge variant="outline">Pendente</Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                {step.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Instruções Detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Configuração no Easypanel - Passo a Passo
          </CardTitle>
          <CardDescription>
            Siga estas instruções para seu subdomínio <code>{subdomain}.aoseudispor.com.br</code> funcionar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Passo 1: DNS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <h3 className="font-semibold">Configurar DNS</h3>
              {dnsStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>⚠️ Importante:</strong> Você precisa de acesso ao DNS de <code>aoseudispor.com.br</code> para isso funcionar.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <p className="text-sm font-medium">Adicione este registro DNS:</p>
              <div className="font-mono text-sm bg-white p-3 rounded border">
                <div>Tipo: <strong>CNAME</strong></div>
                <div>Nome: <strong>{subdomain}</strong></div>
                <div>Valor: <strong>[IP_DO_EASYPANEL]</strong></div>
                <div>TTL: <strong>300</strong></div>
              </div>
              <p className="text-xs text-gray-600">
                * Substitua [IP_DO_EASYPANEL] pelo IP do seu servidor Easypanel
              </p>
            </div>
          </div>

          {/* Passo 2: Easypanel */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <h3 className="font-semibold">Adicionar Domínio no Easypanel</h3>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md space-y-3">
              <p className="text-sm">No painel do Easypanel:</p>
              <ol className="text-sm space-y-1 ml-4 list-decimal">
                <li>Acesse <strong>Domains</strong> ou <strong>Domínios</strong></li>
                <li>Clique em <strong>Add Domain</strong></li>
                <li>Digite: <code className="bg-white px-1">{subdomain}.aoseudispor.com.br</code></li>
                <li>Target: Selecione seu projeto <strong>VendeMais</strong></li>
                <li>Port: <strong>80</strong> (ou porta da sua aplicação)</li>
                <li>Clique em <strong>Add</strong></li>
              </ol>
            </div>
          </div>

          {/* Passo 3: SSL */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <h3 className="font-semibold">SSL Automático</h3>
              {sslStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </div>
            
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-sm text-green-800">
                ✅ O Easypanel gerará o certificado SSL automaticamente após adicionar o domínio.
                Aguarde 5-10 minutos após a configuração.
              </p>
            </div>
          </div>

          {/* Teste */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <h3 className="font-semibold">Testar Configuração</h3>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(subdomainUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir {subdomain}.aoseudispor.com.br
              </Button>
              
              <Button
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(subdomainUrl)}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copiar URL
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={checkSubdomainStatus}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Verificar Status
              </Button>
            </div>
          </div>

          {/* Problemas Comuns */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Problemas comuns:</strong>
              <ul className="mt-2 ml-4 text-sm space-y-1 list-disc">
                <li><strong>DNS_PROBE_FINISHED_NXDOMAIN:</strong> DNS não configurado ou não propagou</li>
                <li><strong>SSL_ERROR_BAD_CERT_DOMAIN:</strong> Aguarde SSL ser gerado (até 10 min)</li>
                <li><strong>404 Not Found:</strong> Domínio não adicionado no Easypanel</li>
                <li><strong>Connection Refused:</strong> Aplicação não está rodando</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Link para Documentação */}
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/EASYPANEL_SUBDOMAIN_SETUP.md', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Ver documentação completa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EasypanelSetupGuide;
