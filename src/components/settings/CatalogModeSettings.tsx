import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { useStorePriceModel } from '@/hooks/useStorePriceModel';
import { PriceModelType } from '@/types/price-models';

const formSchema = z.object({
  catalog_mode: z.enum(['separated', 'hybrid', 'toggle']),
  retail_catalog_active: z.boolean().default(true),
  wholesale_catalog_active: z.boolean().default(false),
  store_id: z.string().optional(),
});

const CatalogModeSettings = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { settings, updateSettings, isLoading } = useSettings(profile?.store_id);
  const { priceModel } = useStorePriceModel(profile?.store_id);
  const [isEditing, setIsEditing] = useState(false);

  const isWholesaleOnly = settings?.catalog_mode === "wholesale_only" || 
  priceModel?.price_model === ("wholesale_only" as PriceModelType);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      catalog_mode: settings?.catalog_mode || 'separated',
      retail_catalog_active: settings?.retail_catalog_active !== false,
      wholesale_catalog_active: settings?.wholesale_catalog_active === true,
      store_id: profile?.store_id,
    },
    mode: "onChange",
  })

  useEffect(() => {
    form.reset({
      catalog_mode: settings?.catalog_mode || 'separated',
      retail_catalog_active: settings?.retail_catalog_active !== false,
      wholesale_catalog_active: settings?.wholesale_catalog_active === true,
      store_id: profile?.store_id,
    });
  }, [settings, profile?.store_id, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsEditing(false);
    try {
      await updateSettings(values);
      toast({
        title: "Configurações salvas!",
        description: "As configurações do catálogo foram atualizadas.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações.",
      })
    }
  }

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    form.reset({
      catalog_mode: settings?.catalog_mode || 'separated',
      retail_catalog_active: settings?.retail_catalog_active !== false,
      wholesale_catalog_active: settings?.wholesale_catalog_active === true,
      store_id: profile?.store_id,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modo de Catálogo</CardTitle>
        <CardDescription>
          Configure como seus produtos são exibidos para os clientes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="catalog_mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modo de Catálogo</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                      disabled={!isEditing || isLoading}
                    >
                      <option value="separated">Separado (Varejo)</option>
                      <option value="hybrid">Híbrido (Varejo/Atacado)</option>
                      <option value="toggle">Alternável (Varejo/Atacado)</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.getValues('catalog_mode') === 'toggle' && (
              <>
                <FormField
                  control={form.control}
                  name="retail_catalog_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Varejo Ativo</FormLabel>
                        <FormDescription>
                          Mostrar catálogo de varejo.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isEditing || isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wholesale_catalog_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Atacado Ativo</FormLabel>
                        <FormDescription>
                          Mostrar catálogo de atacado.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isEditing || isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleCancelClick}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    Salvar
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleEditClick}
                  disabled={isLoading}
                >
                  Editar
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CatalogModeSettings;

const FormDescription = ({ children }: { children?: React.ReactNode }) => {
  return <p className="text-sm text-muted-foreground">{children}</p>
}
