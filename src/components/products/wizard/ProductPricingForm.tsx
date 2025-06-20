
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Switch } from '@/components/ui/switch';

interface ProductPricingFormProps {
  form: UseFormReturn<any>;
}

const ProductPricingForm = ({ form }: ProductPricingFormProps) => {
  const watchWholesalePrice = form.watch('wholesale_price');
  const hasWholesalePrice = watchWholesalePrice && watchWholesalePrice > 0;

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
            <FormDescription>
              Deixe vazio se não vender no atacado
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="stock"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Estoque Atual *</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                step="1"
                value={field.value || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === '' ? 0 : parseInt(value) || 0);
                }}
                placeholder="0"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {hasWholesalePrice && (
        <FormField
          control={form.control}
          name="min_wholesale_qty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade Mínima (Atacado)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={field.value || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? 1 : parseInt(value) || 1);
                  }}
                  placeholder="1"
                />
              </FormControl>
              <FormDescription>
                Quantidade mínima para venda no atacado
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="is_featured"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Produto em Destaque</FormLabel>
              <FormDescription>
                Destacar este produto no catálogo
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
        name="is_active"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Produto Ativo</FormLabel>
              <FormDescription>
                Produto visível no catálogo
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
