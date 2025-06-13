
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, DollarSign, Loader2, Eye, EyeOff, Info } from 'lucide-react';
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
  const [showAccessToken, setShowAccessToken] = useState(false);

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

      // Validar se pelo menos um método está ativo
      if (!data.pix && !data.credit_card && !data.bank_slip) {
        toast({
          title: "Atenção",
          description: "Selecione pelo menos um método de pagamento",
          variant: "destructive",
        });
        return;
      }

      // Validar credenciais do Mercado Pago se algum método estiver ativo
      if ((data.pix || data.credit_card || data.bank_slip)) {
        if (!data.mercadopago_access_token.trim()) {
          toast({
            title: "Access Token obrigatório",
            description: "O Access Token do Mercado Pago é obrigatório para processar pagamentos",
            variant: "destructive",
          });
          return;
        }

        if (!data.mercadopago_public_key.trim()) {
          toast({
            title: "Public Key obrigatória",
            description: "A Public Key do Mercado Pago é obrigatória para processar pagamentos",
            variant: "destructive",
          });
          return;
        }
      }

      const paymentMethods = {
        pix: data.pix,
        credit_card: data.credit_card,
        bank_slip: data.bank_slip,
        mercadopago_access_token: data.mercadopago_access_token.trim(),
        mercadopago_public_key: data.mercadopago_public_key.trim()
      };

      const { error } = await updateSettings({
        payment_methods: paymentMethods
      });

      if (error) {
        throw error;
      }

      toast({
        title: "✅ Configurações salvas",
        description: "As configurações de pagamento foram atualizadas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "❌ Erro ao salvar",
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
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Para processar pagamentos, você precisa de uma conta no Mercado Pago e suas credenciais de produção.
            <br />
            <a 
              href="https://www.mercadopago.com.br/developers/panel/app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Acesse o painel de desenvolvedores do Mercado Pago →
            </a>
          </AlertDescription>
        </Alert>

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
                    <div>
                      <FormLabel>PIX</FormLabel>
                      <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
                    </div>
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
                    <div>
                      <FormLabel>Cartão de Crédito</FormLabel>
                      <p className="text-sm text-muted-foreground">Parcelamento em até 12x</p>
                    </div>
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
                    <div>
                      <FormLabel>Boleto Bancário</FormLabel>
                      <p className="text-sm text-muted-foreground">Vencimento em 3 dias úteis</p>
                    </div>
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

          {/* Credenciais Mercado Pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Credenciais Mercado Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="mercadopago_access_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Token *</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showAccessToken ? "text" : "password"}
                          placeholder="APP_USR-..."
                          {...field} 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowAccessToken(!showAccessToken)}
                      >
                        {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mercadopago_public_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Key *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="APP_USR-..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-blue-800 mb-2">Como obter suas credenciais:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Acesse o painel do Mercado Pago</li>
                  <li>Vá em "Suas integrações"</li>
                  <li>Crie ou acesse sua aplicação</li>
                  <li>Copie o Access Token e Public Key de produção</li>
                </ol>
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
