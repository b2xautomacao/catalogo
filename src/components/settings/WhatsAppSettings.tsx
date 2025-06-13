
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Phone, Loader2 } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';

interface WhatsAppFormData {
  whatsapp_integration_active: boolean;
  whatsapp_number: string;
}

const WhatsAppSettings = () => {
  const { toast } = useToast();
  const { settings, updateSettings, loading } = useStoreSettings();
  const [saving, setSaving] = useState(false);

  const form = useForm<WhatsAppFormData>({
    defaultValues: {
      whatsapp_integration_active: false,
      whatsapp_number: ''
    }
  });

  // Carregar configurações existentes
  useEffect(() => {
    if (settings) {
      form.reset({
        whatsapp_integration_active: settings.whatsapp_integration_active || false,
        whatsapp_number: settings.whatsapp_number || ''
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: WhatsAppFormData) => {
    try {
      setSaving(true);

      const { error } = await updateSettings({
        whatsapp_integration_active: data.whatsapp_integration_active,
        whatsapp_number: data.whatsapp_number
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações do WhatsApp foram atualizadas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Integração WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="whatsapp_integration_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Ativar Integração WhatsApp</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do WhatsApp</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="5511999999999"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    Insira o número no formato internacional, sem espaços ou símbolos (Ex: 5511999999999)
                  </p>
                </FormItem>
              )}
            />

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Como configurar:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ative a integração usando o switch acima</li>
                <li>• Insira seu número do WhatsApp Business</li>
                <li>• Configure as mensagens automáticas</li>
                <li>• Teste o envio de notificações</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações do WhatsApp
        </Button>
      </form>
    </Form>
  );
};

export default WhatsAppSettings;
