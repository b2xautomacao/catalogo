
import React from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, DollarSign, Smartphone } from 'lucide-react';

const PaymentSettings = () => {
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      pix: { enabled: true, key: '' },
      creditCard: { enabled: true, mercadoPago: '', stripe: '' },
      bankSlip: { enabled: false },
      cash: { enabled: true },
      installments: { max: 12, minAmount: 100 }
    }
  });

  const onSubmit = (data: any) => {
    console.log('Payment settings:', data);
    toast({
      title: "Configurações salvas",
      description: "As configurações de pagamento foram atualizadas",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PIX */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                PIX
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="pix.enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Aceitar PIX</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pix.key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave PIX</FormLabel>
                    <FormControl>
                      <Input placeholder="Email, telefone ou chave aleatória" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Cartão de Crédito */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Cartão de Crédito
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="creditCard.enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Aceitar Cartão</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creditCard.mercadoPago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token MercadoPago</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu token do MercadoPago" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creditCard.stripe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave Stripe</FormLabel>
                    <FormControl>
                      <Input placeholder="Sua chave do Stripe" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Boleto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Boleto Bancário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="bankSlip.enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Aceitar Boleto</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Dinheiro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Dinheiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="cash.enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Aceitar Dinheiro</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Parcelamento */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Parcelamento</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="installments.max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máximo de Parcelas</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="installments.minAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Mínimo para Parcelamento (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" min="50" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="btn-primary w-full">
          Salvar Configurações de Pagamento
        </Button>
      </form>
    </Form>
  );
};

export default PaymentSettings;
