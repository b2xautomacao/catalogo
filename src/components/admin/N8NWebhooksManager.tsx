
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Webhook, 
  Save, 
  TestTube, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface N8NWebhook {
  id: string;
  webhook_type: string;
  webhook_url: string;
  is_active: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

const webhookTypes = [
  {
    type: 'whatsapp_integration',
    label: 'Integração WhatsApp',
    description: 'Webhook para gerenciar conexões e instâncias WhatsApp via Evolution API'
  },
  {
    type: 'order_notifications',
    label: 'Notificações de Pedidos',
    description: 'Webhook para envio automático de notificações de pedidos via WhatsApp'
  },
  {
    type: 'system_notifications',
    label: 'Notificações do Sistema',
    description: 'Webhook para notificações gerais do sistema aos lojistas'
  }
];

export const N8NWebhooksManager = () => {
  const [webhooks, setWebhooks] = useState<N8NWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('n8n_webhooks')
        .select('*')
        .order('webhook_type');

      if (error) throw error;

      setWebhooks(data || []);
    } catch (error) {
      console.error('❌ Error fetching N8N webhooks:', error);
      toast.error('Erro ao carregar webhooks N8N');
    } finally {
      setLoading(false);
    }
  };

  const updateWebhook = async (webhookType: string, updates: Partial<N8NWebhook>) => {
    setSaving(webhookType);
    
    try {
      const { data, error } = await supabase
        .from('n8n_webhooks')
        .update(updates)
        .eq('webhook_type', webhookType)
        .select()
        .single();

      if (error) throw error;

      setWebhooks(prev => 
        prev.map(w => w.webhook_type === webhookType ? { ...w, ...data } : w)
      );

      toast.success('Webhook atualizado com sucesso');
    } catch (error) {
      console.error('❌ Error updating webhook:', error);
      toast.error('Erro ao atualizar webhook');
    } finally {
      setSaving(null);
    }
  };

  const testWebhook = async (webhook: N8NWebhook) => {
    setTesting(webhook.webhook_type);

    try {
      const testPayload = {
        test: true,
        webhook_type: webhook.webhook_type,
        timestamp: new Date().toISOString(),
        message: 'Test payload from CatalogoAI admin panel'
      };

      const response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        toast.success(`Webhook ${webhook.webhook_type} testado com sucesso`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error testing webhook:', error);
      toast.error(`Erro ao testar webhook: ${error.message}`);
    } finally {
      setTesting(null);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando webhooks N8N...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Configuração de Webhooks N8N
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Configure os webhooks N8N para automatização das integrações WhatsApp e notificações do sistema.
              Estes webhooks são usados globalmente por todas as lojas do sistema.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {webhookTypes.map(({ type, label, description }) => {
              const webhook = webhooks.find(w => w.webhook_type === type);
              
              return (
                <Card key={type} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{label}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{description}</p>
                      </div>
                      <Badge variant={webhook?.is_active ? "default" : "secondary"}>
                        {webhook?.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${type}-url`}>URL do Webhook</Label>
                      <Input
                        id={`${type}-url`}
                        value={webhook?.webhook_url || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setWebhooks(prev =>
                            prev.map(w => 
                              w.webhook_type === type 
                                ? { ...w, webhook_url: value }
                                : w
                            )
                          );
                        }}
                        placeholder="https://seu-n8n.domain.com/webhook/..."
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Webhook Ativo</Label>
                        <p className="text-sm text-muted-foreground">
                          Ativar este webhook para uso no sistema
                        </p>
                      </div>
                      <Switch
                        checked={webhook?.is_active || false}
                        onCheckedChange={(checked) => {
                          setWebhooks(prev =>
                            prev.map(w => 
                              w.webhook_type === type 
                                ? { ...w, is_active: checked }
                                : w
                            )
                          );
                        }}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => updateWebhook(type, {
                          webhook_url: webhook?.webhook_url || '',
                          is_active: webhook?.is_active || false
                        })}
                        disabled={saving === type || !webhook?.webhook_url}
                        size="sm"
                      >
                        {saving === type ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar
                          </>
                        )}
                      </Button>

                      {webhook?.webhook_url && webhook.is_active && (
                        <Button
                          onClick={() => testWebhook(webhook)}
                          disabled={testing === type}
                          variant="outline"
                          size="sm"
                        >
                          {testing === type ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Testando...
                            </>
                          ) : (
                            <>
                              <TestTube className="h-4 w-4 mr-2" />
                              Testar
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {webhook?.updated_at && (
                      <p className="text-xs text-gray-500">
                        Última atualização: {new Date(webhook.updated_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentação dos Webhooks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">🔗 Webhook de Integração WhatsApp</h4>
              <p className="text-gray-600 mb-2">
                Recebe ações de gerenciamento de instâncias WhatsApp via Evolution API.
              </p>
              <code className="text-xs bg-gray-100 p-2 rounded block">
                {`{
  "action": "create|connect|verify|restart|disconnect|delete",
  "store_id": "uuid",
  "store_name": "string",
  "store_slug": "string",
  "instance_name": "string",
  "user_id": "uuid",
  "timestamp": "iso-date"
}`}
              </code>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">📨 Webhook de Notificações de Pedidos</h4>
              <p className="text-gray-600 mb-2">
                Recebe dados de pedidos para envio de notificações via WhatsApp.
              </p>
              <code className="text-xs bg-gray-100 p-2 rounded block">
                {`{
  "webhook_type": "order_notifications",
  "order": { "id": "uuid", "status": "string", ... },
  "store": { "id": "uuid", "name": "string", "slug": "string" },
  "whatsapp": { "instance_name": "string", "status": "string" },
  "timestamp": "iso-date"
}`}
              </code>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">🔔 Webhook de Notificações do Sistema</h4>
              <p className="text-gray-600 mb-2">
                Recebe notificações gerais do sistema para comunicação com lojistas.
              </p>
              <code className="text-xs bg-gray-100 p-2 rounded block">
                {`{
  "webhook_type": "system_notifications",
  "notification_type": "string",
  "message": "string",
  "store_id": "uuid",
  "timestamp": "iso-date"
}`}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
