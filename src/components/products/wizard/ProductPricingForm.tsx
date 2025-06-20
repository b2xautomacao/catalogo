
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CurrencyInput } from '@/components/ui/currency-input';

interface ProductPricingFormProps {
  form: UseFormReturn<any>;
}

const ProductPricingForm = ({ form }: ProductPricingFormProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="retail_price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preço de Varejo *</FormLabel>
            <FormControl>
              <CurrencyInput
                value={field.value || 0}
                onChange={field.onChange}
                placeholder="0,00"
              />
            </FormControl>
            <FormDescription>Preço para venda no varejo</FormDescription>
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
              <CurrencyInput
                value={field.value || 0}
                onChange={field.onChange}
                placeholder="0,00"
              />
            </FormControl>
            <FormDescription>Preço para venda no atacado (opcional)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="stock"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Estoque Inicial</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="0"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <FormDescription>Quantidade em estoque</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="min_wholesale_qty"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Quantidade Mínima Atacado</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="1"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
              />
            </FormControl>
            <FormDescription>Quantidade mínima para preço de atacado</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="is_active"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Produto Ativo</FormLabel>
              <FormDescription>
                Produtos ativos são exibidos no catálogo
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
  );
};

export default ProductPricingForm;
