
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Truck, MapPin, Clock, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DeliveryFormData {
  pickupEnabled: boolean;
  pickupInstructions: string;
  deliveryEnabled: boolean;
  deliveryZones: string;
  deliveryFee: string;
  freeDeliveryMinimum: string;
  deliveryTime: string;
  shippingEnabled: boolean;
  shippingInstructions: string;
}

const DeliverySettings = () => {
  const { toast } = useToast();
  const { settings, updateSettings, loading } = useCatalogSettings();
  const [saving, setSaving] = React.useState(false);

  const form = useForm<DeliveryFormData>({
    defaultValues: {
      pickupEnabled: true,
      pickupInstructions: '',
      deliveryEnabled: false,
      deliveryZones: '',
      deliveryFee: '0',
      freeDeliveryMinimum: '0',
      deliveryTime: '1-2 horas',
      shippingEnabled: false,
      shippingInstructions: '',
    }
  });

  // Carregar configurações quando disponíveis
  useEffect(() => {
    if (settings) {
      console.log('DeliverySettings: Carregando configurações:', settings);
      
      form.reset({
        pickupEnabled: settings.shipping_options?.pickup || false,
        pickupInstructions: 'Retirada disponível no endereço da loja durante o horário comercial.',
        deliveryEnabled: settings.shipping_options?.delivery || false,
        deliveryZones: 'Centro, Zona Norte, Zona Sul',
        deliveryFee: '10.00',
        freeDeliveryMinimum: '100.00',
        deliveryTime: '1-2 horas',
        shippingEnabled: settings.shipping_options?.shipping || false,
        shippingInstructions: 'Enviamos via Correios. Prazo de 3-7 dias úteis.',
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: DeliveryFormData) => {
    try {
      setSaving(true);
      console.log('DeliverySettings: Salvando configurações:', data);

      if (!settings) {
        throw new Error('Configurações não encontradas');
      }

      // Atualizar opções de entrega
      const updates = {
        shipping_options: {
          pickup: data.pickupEnabled,
          delivery: data.deliveryEnabled,
          shipping: data.shippingEnabled,
        },
      };

      console.log('DeliverySettings: Atualizações a serem enviadas:', updates);

      const { error } = await updateSettings(updates);

      if (error) {
        console.error('DeliverySettings: Erro na atualização:', error);
        throw error;
      }

      console.log('DeliverySettings: Configurações salvas com sucesso');

      toast({
        title: "Configurações salvas",
        description: "As opções de entrega foram atualizadas com sucesso",
      });
    } catch (error) {
      console.error('DeliverySettings: Erro ao salvar:', error);
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Configurações não encontradas. Verifique suas permissões.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Retirada na Loja */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Retirada na Loja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="pickupEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Permitir retirada na loja</FormLabel>
                    <FormDescription>
                      Clientes podem retirar pedidos diretamente na sua loja
                    </FormDescription>
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

            {form.watch('pickupEnabled') && (
              <FormField
                control={form.control}
                name="pickupInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instruções para retirada</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informe horários, localização específica, documentos necessários..."
                        className="min-h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Entrega Local */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Entrega Local
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="deliveryEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Oferecer entrega local</FormLabel>
                    <FormDescription>
                      Entrega própria em regiões específicas da sua cidade
                    </FormDescription>
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

            {form.watch('deliveryEnabled') && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryZones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zonas de entrega</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ex: Centro, Zona Norte, Bairro X..."
                            className="min-h-20"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="deliveryFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taxa de entrega (R$)</FormLabel>
                          <FormControl>
                            <Input placeholder="10.00" type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="freeDeliveryMinimum"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor mínimo para frete grátis (R$)</FormLabel>
                          <FormControl>
                            <Input placeholder="100.00" type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deliveryTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tempo de entrega</FormLabel>
                          <FormControl>
                            <Input placeholder="1-2 horas" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Envio pelos Correios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Envio pelos Correios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="shippingEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Permitir envio pelos Correios</FormLabel>
                    <FormDescription>
                      Calcular frete automaticamente via CEP
                    </FormDescription>
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

            {form.watch('shippingEnabled') && (
              <FormField
                control={form.control}
                name="shippingInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Informações sobre envio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Prazos, modalidades disponíveis, instruções especiais..."
                        className="min-h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações de Entrega
        </Button>
      </form>
    </Form>
  );
};

export default DeliverySettings;
