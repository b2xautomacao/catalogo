
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, DollarSign, Loader2 } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';

interface PaymentFormData {
  pix: boolean;
  credit_card: boolean;
  bank_slip: boolean;
  mercadopago_access_token: string;
  mercadopago_public_key: string;
}

const PaymentSettings = () => {
  const { toast } = useToast();
  const { settings, updateSettings, loading } = useStoreSettings();
  const [saving, setSaving] = useState(false);

  const form = useForm<PaymentFormData>({
    defaultValues: {
      pix: false,
      credit_card: false,
      bank_slip: false,
      mercadopago_access_token: '',
      mercadopago_public_key: ''
    }
  });

  // Carregar configurações existentes
  useEffect(() => {
    if (settings?.payment_methods) {
      const paymentMethods = settings.payment_methods as any;
      form.reset({
        pix: paymentMethods.pix || false,
        credit_card: paymentMethods.credit_card || false,
        bank_slip: paymentMethods.bank_slip || false,
        mercadopago_access_token: paymentMethods.mercadopago_access_token || '',
        mercadopago_public_key: paymentMethods.mercadopago_public_key || ''
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setSaving(true);

      const paymentMethods = {
        pix: data.pix,
        credit_card: data.credit_card,
        bank_slip: data.bank_slip,
        mercadopago_access_token: data.mercadopago_access_token,
        mercadopago_public_key: data.mercadopago_public_key
      };

      const { error } = await updateSettings({
        payment_methods: paymentMethods
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações de pagamento foram atualizadas com sucesso",
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Métodos de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Métodos de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="pix"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>PIX</FormLabel>
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
                name="credit_card"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Cartão de Crédito</FormLabel>
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
                name="bank_slip"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Boleto Bancário</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Integração Mercado Pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Mercado Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="mercadopago_access_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Token</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Seu access token do Mercado Pago"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mercadopago_public_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Key</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Sua public key do Mercado Pago"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-sm text-muted-foreground">
                <p>Para integrar com o Mercado Pago, você precisa:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Criar uma conta no Mercado Pago</li>
                  <li>Obter suas credenciais de produção</li>
                  <li>Configurar os webhooks</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações de Pagamento
        </Button>
      </form>
    </Form>
  );
};

export default PaymentSettings;
