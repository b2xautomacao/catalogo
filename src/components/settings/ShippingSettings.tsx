
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Truck, MapPin, Package, Loader2 } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';

interface ShippingFormData {
  pickup: boolean;
  delivery: boolean;
  shipping: boolean;
  delivery_fee: string;
  delivery_radius: string;
  free_delivery_amount: string;
  pickup_address: string;
}

const ShippingSettings = () => {
  const { toast } = useToast();
  const { settings, updateSettings, loading } = useStoreSettings();
  const [saving, setSaving] = useState(false);

  const form = useForm<ShippingFormData>({
    defaultValues: {
      pickup: true,
      delivery: false,
      shipping: false,
      delivery_fee: '0',
      delivery_radius: '10',
      free_delivery_amount: '0',
      pickup_address: ''
    }
  });

  // Carregar configurações existentes
  useEffect(() => {
    if (settings?.shipping_options) {
      const shippingOptions = settings.shipping_options as any;
      form.reset({
        pickup: shippingOptions.pickup || true,
        delivery: shippingOptions.delivery || false,
        shipping: shippingOptions.shipping || false,
        delivery_fee: String(shippingOptions.delivery_fee || 0),
        delivery_radius: String(shippingOptions.delivery_radius || 10),
        free_delivery_amount: String(shippingOptions.free_delivery_amount || 0),
        pickup_address: shippingOptions.pickup_address || ''
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: ShippingFormData) => {
    try {
      setSaving(true);

      const shippingOptions = {
        pickup: data.pickup,
        delivery: data.delivery,
        shipping: data.shipping,
        delivery_fee: parseFloat(data.delivery_fee),
        delivery_radius: parseFloat(data.delivery_radius),
        free_delivery_amount: parseFloat(data.free_delivery_amount),
        pickup_address: data.pickup_address
      };

      const { error } = await updateSettings({
        shipping_options: shippingOptions
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações de envio foram atualizadas com sucesso",
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
          {/* Métodos de Envio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Métodos de Envio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="pickup"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Retirada no Local</FormLabel>
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
                name="delivery"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Entrega Local</FormLabel>
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
                name="shipping"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Envio pelos Correios</FormLabel>
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

          {/* Configurações de Entrega */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Configurações de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="delivery_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de Entrega (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="10.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_radius"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raio de Entrega (km)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="free_delivery_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frete Grátis Acima de (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="100.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Endereço de Retirada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Local de Retirada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="pickup_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço para Retirada</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Rua, número, bairro, cidade - UF"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações de Envio
        </Button>
      </form>
    </Form>
  );
};

export default ShippingSettings;
