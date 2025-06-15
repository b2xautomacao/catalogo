
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Power,
  Trash2,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useWhatsAppIntegration } from '@/hooks/useWhatsAppIntegration';
import { useAuth } from '@/hooks/useAuth';

export const WhatsAppIntegration = () => {
  const { profile } = useAuth();
  const {
    integration,
    qrCode,
    loading,
    connecting,
    createIntegration,
    connectWhatsApp,
    verifyConnection,
    restartIntegration,
    disconnectWhatsApp,
    deleteIntegration
  } = useWhatsAppIntegration();

  const [qrTimeLeft, setQrTimeLeft] = useState(0);

  // Countdown para QR code
  React.useEffect(() => {
    if (!qrCode) return;

    const interval = setInterval(() => {
      const timeLeft = Math.max(0, qrCode.expires_at - Date.now());
      setQrTimeLeft(Math.ceil(timeLeft / 1000));
      
      if (timeLeft <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [qrCode]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando';
      case 'error': return 'Erro';
      default: return 'Desconectado';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (!profile?.store_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Integração WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro: Store não identificado. Faça login novamente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status da Integração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Status da Integração WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {integration ? (
            <div className="space-y-4">
              {/* Status atual */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(integration.status)}`} />
                  <span className="font-medium">{getStatusText(integration.status)}</span>
                  {integration.status === 'connected' && (
                    <Wifi className="h-4 w-4 text-green-600" />
                  )}
                  {integration.status === 'disconnected' && (
                    <WifiOff className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <Badge variant="outline">
                  {integration.instance_name}
                </Badge>
              </div>

              {/* Informações da instância */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Informações da Instância</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Nome da Instância:</span>
                    <span className="ml-2 font-mono">{integration.instance_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status da Conexão:</span>
                    <span className="ml-2">{integration.connection_status}</span>
                  </div>
                  {integration.last_connected_at && (
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Última Conexão:</span>
                      <span className="ml-2">{formatDate(integration.last_connected_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ações disponíveis */}
              <div className="flex flex-wrap gap-2">
                {integration.status === 'disconnected' && (
                  <Button 
                    onClick={connectWhatsApp} 
                    disabled={loading || connecting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {connecting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Conectar WhatsApp
                      </>
                    )}
                  </Button>
                )}

                {integration.status === 'connected' && (
                  <>
                    <Button 
                      onClick={verifyConnection} 
                      disabled={loading}
                      variant="outline"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verificar Conexão
                    </Button>
                    <Button 
                      onClick={restartIntegration} 
                      disabled={loading}
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reiniciar
                    </Button>
                    <Button 
                      onClick={disconnectWhatsApp} 
                      disabled={loading}
                      variant="destructive"
                    >
                      <Power className="h-4 w-4 mr-2" />
                      Desconectar
                    </Button>
                  </>
                )}

                <Button 
                  onClick={deleteIntegration} 
                  disabled={loading}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover Integração
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma integração WhatsApp configurada</p>
              </div>
              <Button 
                onClick={createIntegration} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Configurar WhatsApp
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code para conexão */}
      {qrCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Conectar WhatsApp
              <Badge variant="outline" className="ml-auto">
                <Clock className="h-3 w-3 mr-1" />
                {qrTimeLeft}s
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertDescription>
                Escaneie o QR Code abaixo com seu WhatsApp para conectar a integração.
                O código expira em {qrTimeLeft} segundos.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <img 
                  src={qrCode.qr_code} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64"
                />
              </div>
            </div>

            <div className="text-center text-sm text-gray-600 space-y-2">
              <p><strong>Como conectar:</strong></p>
              <ol className="text-left max-w-md mx-auto space-y-1">
                <li>1. Abra o WhatsApp no seu celular</li>
                <li>2. Vá em Configurações → Aparelhos conectados</li>
                <li>3. Toque em "Conectar um aparelho"</li>
                <li>4. Escaneie o QR Code acima</li>
              </ol>
            </div>

            {qrTimeLeft < 10 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  O QR Code está prestes a expirar! Se não conseguir escanear a tempo, 
                  clique em "Conectar WhatsApp" novamente para gerar um novo código.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações sobre a integração */}
      <Card>
        <CardHeader>
          <CardTitle>Como funciona a integração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="space-y-2">
            <p><strong>📱 Notificações automáticas:</strong></p>
            <p>Quando um pedido é criado ou atualizado, uma notificação será enviada automaticamente via WhatsApp para o cliente.</p>
          </div>
          
          <div className="space-y-2">
            <p><strong>🔗 Checkout via WhatsApp:</strong></p>
            <p>Seus clientes poderão finalizar pedidos diretamente pelo WhatsApp, com todas as informações organizadas.</p>
          </div>

          <div className="space-y-2">
            <p><strong>🔒 Segurança:</strong></p>
            <p>A integração usa Evolution API e N8N para garantir segurança e confiabilidade nas comunicações.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
