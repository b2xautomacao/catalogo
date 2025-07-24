import React, { useState, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import { createProductSchema } from "@/lib/validations/product";
import ProductImageManager from "./ProductImageManager";
import ProductPriceTiersManager from "./ProductPriceTiersManager";
import { useAuth } from "@/hooks/useAuth";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProductFormProps {
  onSubmit: (data: any) => Promise<any>;
  initialValues?: Product;
  onSuccess?: () => void;
}

const ProductFormComplete: React.FC<ProductFormProps> = ({
  onSubmit,
  initialValues,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { priceModel } = useStorePriceModel(profile?.store_id);
  const [priceTiers, setPriceTiers] = useState([]);

  const form = useForm<Product>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      store_id: profile?.store_id || "",
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      retail_price: initialValues?.retail_price || 0,
      wholesale_price: initialValues?.wholesale_price || 0,
      category: initialValues?.category || "",
      stock: initialValues?.stock || 0,
      min_wholesale_qty: initialValues?.min_wholesale_qty || 1,
      meta_title: initialValues?.meta_title || "",
      meta_description: initialValues?.meta_description || "",
      keywords: initialValues?.keywords || "",
      seo_slug: initialValues?.seo_slug || "",
      is_featured: initialValues?.is_featured || false,
      allow_negative_stock: initialValues?.allow_negative_stock || false,
      stock_alert_threshold: initialValues?.stock_alert_threshold || 5,
      is_active: initialValues?.is_active ?? true,
      enable_gradual_wholesale: initialValues?.enable_gradual_wholesale || false,
      price_model: initialValues?.price_model || priceModel?.price_model || "retail_only",
    },
    mode: "onChange",
  });

  const handleSubmit = async (data: any) => {
    try {
      console.log('📤 PRODUTO - Enviando dados:', data);
    
      const result = await onSubmit(data);
      console.log('✅ PRODUTO - Salvo com sucesso:', result);
    
      // Verificar se result tem id antes de tentar acessá-lo
      if (result && typeof result === 'object' && 'id' in result) {
        console.log('🆔 PRODUTO - ID gerado:', result.id);
      }
    
      toast({
        title: "Produto salvo!",
        description: "O produto foi salvo com sucesso.",
      });
    
      onSuccess?.();
    } catch (error) {
      console.error('❌ PRODUTO - Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar produto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleTiersChange = (tiers: any[]) => {
    setPriceTiers(tiers);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialValues ? "Editar Produto" : "Novo Produto"}
        </CardTitle>
        <CardDescription>
          Preencha os campos abaixo para {initialValues ? "editar" : "criar"} um
          produto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Camiseta Algodão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Vestuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição detalhada do produto"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="retail_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Varejo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wholesale_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Atacado</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_wholesale_qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qtd. Mínima Atacado</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock_alert_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alerta de Estoque Mínimo</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Ativar Produto</FormLabel>
                      <FormDescription>
                        Produto ativo no catálogo
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

              <FormField
                control={form.control}
                name="allow_negative_stock"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Permitir Estoque Negativo</FormLabel>
                      <FormDescription>
                        Permitir vendas mesmo sem estoque
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
            </div>

            <FormField
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Produto em Destaque</FormLabel>
                    <FormDescription>
                      Exibir este produto na página inicial
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

            <Separator />

            <FormField
              control={form.control}
              name="enable_gradual_wholesale"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Atacado Gradual</FormLabel>
                    <FormDescription>
                      Múltiplos níveis de preço com descontos progressivos
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

            <FormField
              control={form.control}
              name="price_model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo de Preço</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um modelo de preço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="retail_only">Apenas Varejo</SelectItem>
                      <SelectItem value="simple_wholesale">Varejo + Atacado</SelectItem>
                      <SelectItem value="gradual_wholesale">Atacado Gradual</SelectItem>
                      <SelectItem value="wholesale_only">Apenas Atacado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <ProductPriceTiersManager
              productId={initialValues?.id}
              retailPrice={form.getValues("retail_price")}
              onTiersChange={handleTiersChange}
            />

            <Separator />

            <ProductImageManager productId={initialValues?.id} />

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="meta_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título para SEO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meta_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Descrição</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Descrição para SEO"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Palavras-chave</FormLabel>
                  <FormControl>
                    <Input placeholder="Palavras-chave para SEO" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seo_slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug SEO</FormLabel>
                  <FormControl>
                    <Input placeholder="Slug para SEO" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter>
              <Button type="submit">Salvar Produto</Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProductFormComplete;

interface FormDescriptionProps {
  children?: React.ReactNode;
}

function FormDescription({ children, ...props }: FormDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", props.className)}
      {...props}
    >
      {children}
    </p>
  )
}
