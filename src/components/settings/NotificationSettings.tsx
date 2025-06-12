
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';

const NotificationSettings = () => {
  const { toast } = useToast();

  const notifications = [
    {
      id: 'new_order',
      title: 'Novos Pedidos',
      description: 'Receber notificação quando houver novos pedidos',
      channels: { email: true, whatsapp: true, push: false }
    },
    {
      id: 'low_stock',
      title: 'Estoque Baixo',
      description: 'Alertas quando produtos estiverem com estoque baixo',
      channels: { email: true, whatsapp: false, push: true }
    },
    {
      id: 'payment_received',
      title: 'Pagamento Recebido',
      description: 'Confirmação quando pagamentos forem processados',
      channels: { email: false, whatsapp: true, push: true }
    },
    {
      id: 'customer_message',
      title: 'Mensagens de Clientes',
      description: 'Notificações de novas mensagens no WhatsApp',
      channels: { email: false, whatsapp: false, push: true }
    }
  ];

  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "As configurações de notificação foram atualizadas",
    });
  };

  return (
    <div className="space-y-6">
      {/* Configurações por Tipo */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card key={notification.id}>
            <CardHeader>
              <CardTitle className="text-base">{notification.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{notification.description}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">E-mail</span>
                  </div>
                  <Switch defaultChecked={notification.channels.email} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">WhatsApp</span>
                  </div>
                  <Switch defaultChecked={notification.channels.whatsapp} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm">Push</span>
                  </div>
                  <Switch defaultChecked={notification.channels.push} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configurações de Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">E-mail para Notificações:</label>
            <Input type="email" placeholder="admin@minhaloja.com" />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">WhatsApp para Notificações:</label>
            <Input placeholder="+55 11 99999-9999" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Horário de Início:</label>
              <Input type="time" defaultValue="08:00" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Horário de Fim:</label>
              <Input type="time" defaultValue="22:00" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Notificações nos Finais de Semana</span>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Frequência */}
      <Card>
        <CardHeader>
          <CardTitle>Frequência de Notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Resumo Diário:</label>
            <select className="w-full px-3 py-2 border rounded-md">
              <option value="disabled">Desabilitado</option>
              <option value="morning">Manhã (8:00)</option>
              <option value="afternoon">Tarde (14:00)</option>
              <option value="evening">Noite (18:00)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Relatório Semanal:</label>
            <select className="w-full px-3 py-2 border rounded-md">
              <option value="disabled">Desabilitado</option>
              <option value="monday">Segunda-feira</option>
              <option value="friday">Sexta-feira</option>
              <option value="sunday">Domingo</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Agrupar Notificações Similares</span>
            <Switch defaultChecked={true} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="btn-primary w-full">
        Salvar Configurações de Notificação
      </Button>
    </div>
  );
};

export default NotificationSettings;
