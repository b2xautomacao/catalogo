
import React from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Zap, Phone } from 'lucide-react';

const WhatsAppSettings = () => {
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      enabled: true,
      phoneNumber: '',
      welcomeMessage: 'Olá! 👋 Bem-vindo à nossa loja. Como posso ajudá-lo?',
      evolutionApi: { url: '', token: '' },
      n8nWebhook: '',
      businessHours: true,
      autoReply: true
    }
  });

  const onSubmit = (data: any) => {
    console.log('WhatsApp settings:', data);
    toast({
      title: "Configurações salvas",
      description: "As configurações do WhatsApp foram atualizadas",
    });
  };

  const testConnection = () => {
    toast({
      title: "Testando conexão",
      description: "Enviando mensagem de teste...",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configurações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Configurações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Ativar WhatsApp</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="5511999999999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="welcomeMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem de Boas-vindas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Mensagem automática para novos clientes"
                        className="min-h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Evolution API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Evolution API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="evolutionApi.url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da API</FormLabel>
                    <FormControl>
                      <Input placeholder="https://api.evolution.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evolutionApi.token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token de Acesso</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu token da Evolution API" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="button" onClick={testConnection} variant="outline" className="w-full">
                Testar Conexão
              </Button>
            </CardContent>
          </Card>

          {/* N8N Webhook */}
          <Card>
            <CardHeader>
              <CardTitle>Webhook N8N</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="n8nWebhook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Webhook</FormLabel>
                    <FormControl>
                      <Input placeholder="https://n8n.exemplo.com/webhook/whatsapp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Automações */}
          <Card>
            <CardHeader>
              <CardTitle>Automações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="autoReply"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Resposta Automática</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessHours"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Respeitar Horário Comercial</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <Button type="submit" className="btn-primary w-full">
          Salvar Configurações do WhatsApp
        </Button>
      </form>
    </Form>
  );
};

export default WhatsAppSettings;
