import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRICE_MODEL_CONFIGS,
  PriceModelType,
  StorePriceModel,
  DEFAULT_TIER_CONFIGS,
  TierConfig,
} from "@/types/price-models";
import { useToast } from "@/hooks/use-toast";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { useAuth } from "@/hooks/useAuth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

interface IntelligentProductPricingFormProps {
  storeId: string;
  productId?: string;
  onSettingsChange: (settings: StorePriceModel) => void;
}

const formSchema = z.object({
  price_model: z.enum([
    "retail_only",
    "simple_wholesale",
    "gradual_wholesale",
    "wholesale_only",
  ]),
  simple_wholesale_enabled: z.boolean().default(false),
  simple_wholesale_name: z.string().default("Atacado"),
  simple_wholesale_min_qty: z.number().min(1).default(5),
  gradual_wholesale_enabled: z.boolean().default(false),
  gradual_tiers_count: z.number().min(2).max(4).default(3),
  tier_1_name: z.string().default("Varejo"),
  tier_2_name: z.string().default("Atacado 1"),
  tier_3_name: z.string().default("Atacado 2"),
  tier_4_name: z.string().default("Atacado 3"),
  tier_1_enabled: z.boolean().default(true),
  tier_2_enabled: z.boolean().default(true),
  tier_3_enabled: z.boolean().default(false),
  tier_4_enabled: z.boolean().default(false),
  show_price_tiers: z.boolean().default(true),
  show_savings_indicators: z.boolean().default(true),
  show_next_tier_hint: z.boolean().default(true),
});

const IntelligentProductPricingForm: React.FC<
  IntelligentProductPricingFormProps
> = ({ storeId, productId, onSettingsChange }) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { priceModel, loading, error, updatePriceModel } =
    useStorePriceModel(storeId);
  const [isEditingTiers, setIsEditingTiers] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price_model: "retail_only",
      simple_wholesale_enabled: false,
      simple_wholesale_name: "Atacado",
      simple_wholesale_min_qty: 5,
      gradual_wholesale_enabled: false,
      gradual_tiers_count: 3,
      tier_1_name: "Varejo",
      tier_2_name: "Atacado 1",
      tier_3_name: "Atacado 2",
      tier_4_name: "Atacado 3",
      tier_1_enabled: true,
      tier_2_enabled: true,
      tier_3_enabled: false,
      tier_4_enabled: false,
      show_price_tiers: true,
      show_savings_indicators: true,
      show_next_tier_hint: true,
    },
  });

  useEffect(() => {
    if (priceModel) {
      form.reset(priceModel);
    }
  }, [priceModel, form]);

  const isRetailOnly = useMemo(() => {
    return priceModel?.price_model === "retail_only";
  }, [priceModel]);

  const isSimpleWholesale = useMemo(() => {
    return priceModel?.price_model === "simple_wholesale";
  }, [priceModel]);

  const isGradualWholesale = useMemo(() => {
    return priceModel?.price_model === "gradual_wholesale";
  }, [priceModel]);

  const isWholesaleOnly = useMemo(() => {
    return priceModel?.price_model === "wholesale_only" as PriceModelType;
  }, [priceModel]);

  const handlePriceModelChange = (model: PriceModelType) => {
    if (model === "wholesale_only" as PriceModelType) {
      // Lógica para wholesale_only
    }
    form.setValue("price_model", model);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("💾 Salvando modelo de preços:", values);

      if (!profile?.store_id) {
        toast({
          title: "Erro",
          description: "ID da loja não encontrado.",
          variant: "destructive",
        });
        return;
      }

      await updatePriceModel(profile.store_id, values);

      toast({
        title: "Sucesso",
        description: "Modelo de preços atualizado com sucesso.",
      });

      onSettingsChange(values as StorePriceModel);
    } catch (error) {
      console.error("❌ Erro ao salvar modelo de preços:", error);
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar modelo de preços.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Carregando configurações de preço...</div>;
  }

  if (error) {
    return <div>Erro ao carregar configurações de preço: {error}</div>;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 max-w-3xl mx-auto"
      >
        <Card>
          <CardHeader>
            <CardTitle>Modelo de Preços</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="price_model"
              render={({ field }) => (
                <FormItem>
                  <Label>Modelo de Preços</Label>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um modelo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PRICE_MODEL_CONFIGS).map(
                        ([key, model]) => (
                          <SelectItem key={key} value={key}>
                            {model.displayName}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Configurações de Atacado Simples */}
        {form.watch("price_model") === "simple_wholesale" && (
          <Card>
            <CardHeader>
              <CardTitle>Atacado Simples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="simple_wholesale_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="simple_wholesale_enabled">
                        Ativar Atacado Simples
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Ofereça um preço especial para compras em quantidade.
                      </p>
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
                name="simple_wholesale_name"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="simple_wholesale_name">
                      Nome do Nível de Atacado
                    </Label>
                    <FormControl>
                      <Input
                        id="simple_wholesale_name"
                        placeholder="Ex: Atacado"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="simple_wholesale_min_qty"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="simple_wholesale_min_qty">
                      Quantidade Mínima para Atacado
                    </Label>
                    <FormControl>
                      <Input
                        id="simple_wholesale_min_qty"
                        type="number"
                        placeholder="Ex: 10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Configurações de Atacado Gradual */}
        {form.watch("price_model") === "gradual_wholesale" && (
          <Card>
            <CardHeader>
              <CardTitle>Atacado Gradual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="gradual_wholesale_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="gradual_wholesale_enabled">
                        Ativar Atacado Gradual
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Ofereça descontos progressivos por quantidade.
                      </p>
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
                name="gradual_tiers_count"
                render={({ field }) => (
                  <FormItem>
                    <Label>Número de Níveis de Atacado</Label>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a quantidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[2, 3, 4].map((count) => (
                          <SelectItem key={count} value={count.toString()}>
                            {count} níveis
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {[...Array(form.watch("gradual_tiers_count"))].map((_, i) => {
                const tierNumber = i + 1;
                return (
                  <div key={tierNumber} className="space-y-2">
                    <h4 className="text-sm font-medium">
                      Nível {tierNumber}
                    </h4>
                    <FormField
                      control={form.control}
                      name={`tier_${tierNumber}_name`}
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor={`tier_${tierNumber}_name`}>
                            Nome do Nível {tierNumber}
                          </Label>
                          <FormControl>
                            <Input
                              id={`tier_${tierNumber}_name`}
                              placeholder={`Ex: Atacado ${tierNumber}`}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`tier_${tierNumber}_enabled`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <Label htmlFor={`tier_${tierNumber}_enabled`}>
                              Ativar Nível {tierNumber}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Permitir descontos neste nível.
                            </p>
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
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Configurações de Exibição */}
        <Card>
          <CardHeader>
            <CardTitle>Exibição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="show_price_tiers"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="show_price_tiers">
                      Mostrar Níveis de Preço
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Exibir os níveis de preço na página do produto.
                    </p>
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
              name="show_savings_indicators"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="show_savings_indicators">
                      Mostrar Indicadores de Economia
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Destacar a economia ao comprar em maior quantidade.
                    </p>
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
              name="show_next_tier_hint"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="show_next_tier_hint">
                      Mostrar Dica do Próximo Nível
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Incentivar o cliente a adicionar mais itens para obter um
                      desconto maior.
                    </p>
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

        {priceModel?.price_model === ("wholesale_only" as PriceModelType) && (
          <div>
            <Badge variant="destructive">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-alert-triangle mr-2 h-4 w-4"
              >
                <path d="M8.76 3.5c1.58-2.28 4.42-2.28 6 0" />
                <line x1="12" x2="12" y1="9" y2="17" />
                <line x1="12" y1="21" x2="12.01" y2="21" />
                <path d="M21.73 20.49c-1.58 2.28-4.42 2.28-6 0l-5.46-7.84c-1.58-2.28-4.42-2.28-6 0L2.27 20.49c-1.58 2.28-4.42 2.28-6 0" />
              </svg>
              Atenção: Este produto está configurado para ser vendido apenas no
              atacado.
            </Badge>
          </div>
        )}

        <Button type="submit">Salvar Configurações</Button>
      </form>
    </Form>
  );
};

export default IntelligentProductPricingForm;
