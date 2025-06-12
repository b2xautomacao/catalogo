
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bot, Zap, MessageSquare, ShoppingCart } from 'lucide-react';

const AutomationSettings = () => {
  const { toast } = useToast();

  const automations = [
    {
      id: 'welcome',
      title: 'Mensagem de Boas-vindas',
      description: 'Enviar mensagem automática para novos clientes',
      icon: MessageSquare,
      enabled: true,
      trigger: 'Novo cliente no WhatsApp'
    },
    {
      id: 'order_confirmation',
      title: 'Confirmação de Pedido',
      description: 'Confirmar pedidos automaticamente via WhatsApp',
      icon: ShoppingCart,
      enabled: true,
      trigger: 'Novo pedido criado'
    },
    {
      id: 'payment_reminder',
      title: 'Lembrete de Pagamento',
      description: 'Lembrar clientes sobre pagamentos pendentes',
      icon: Bot,
      enabled: false,
      trigger: 'Pagamento pendente há 1 hora'
    },
    {
      id: 'stock_alert',
      title: 'Alerta de Estoque',
      description: 'Notificar quando estoque estiver baixo',
      icon: Zap,
      enabled: true,
      trigger: 'Estoque menor que 5 unidades'
    }
  ];

  const handleToggle = (automationId: string) => {
    toast({
      title: "Automação atualizada",
      description: `Automação ${automationId} foi ${Math.random() > 0.5 ? 'ativada' : 'desativada'}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Lista de Automações */}
      <div className="grid grid-cols-1 gap-4">
        {automations.map((automation) => {
          const Icon = automation.icon;
          return (
            <Card key={automation.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{automation.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{automation.description}</p>
                    </div>
                  </div>
                  <Switch 
                    defaultChecked={automation.enabled}
                    onCheckedChange={() => handleToggle(automation.id)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Gatilho:</label>
                    <p className="text-sm text-muted-foreground">{automation.trigger}</p>
                  </div>
                  
                  {automation.id === 'welcome' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Mensagem:</label>
                      <Textarea 
                        placeholder="Digite a mensagem de boas-vindas..."
                        defaultValue="Olá! 👋 Bem-vindo à nossa loja. Como posso ajudá-lo?"
                        className="min-h-16"
                      />
                    </div>
                  )}

                  {automation.id === 'payment_reminder' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Delay (horas):</label>
                        <Input type="number" defaultValue="1" min="1" max="24" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Repetir a cada:</label>
                        <Input type="number" defaultValue="24" min="1" placeholder="horas" />
                      </div>
                    </div>
                  )}

                  {automation.id === 'stock_alert' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Limite mínimo:</label>
                      <Input type="number" defaultValue="5" min="1" max="50" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configurações N8N */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Configurações N8N
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">URL do N8N:</label>
            <Input placeholder="https://n8n.exemplo.com" />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Token de Acesso:</label>
            <Input type="password" placeholder="Seu token do N8N" />
          </div>

          <Button variant="outline" className="w-full">
            Testar Conexão N8N
          </Button>
        </CardContent>
      </Card>

      <Button className="btn-primary w-full">
        Salvar Configurações de Automação
      </Button>
    </div>
  );
};

export default AutomationSettings;
