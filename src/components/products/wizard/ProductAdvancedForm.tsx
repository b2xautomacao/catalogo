
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
import { Textarea } from '@/components/ui/textarea';

interface ProductAdvancedFormProps {
  form: UseFormReturn<any>;
}

const ProductAdvancedForm = ({ form }: ProductAdvancedFormProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Otimização para Mecanismos de Busca (SEO)</h4>
        
        <FormField
          control={form.control}
          name="meta_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título Meta</FormLabel>
              <FormControl>
                <Input placeholder="Título para resultados de busca" {...field} />
              </FormControl>
              <FormDescription>
                Título que aparece nos resultados de busca (máximo 60 caracteres)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="meta_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição Meta</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição para resultados de busca"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Descrição que aparece nos resultados de busca (máximo 160 caracteres)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Palavras-chave</FormLabel>
              <FormControl>
                <Input placeholder="palavra1, palavra2, palavra3" {...field} />
              </FormControl>
              <FormDescription>
                Palavras-chave separadas por vírgula para melhorar a busca
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          💡 <strong>Dica:</strong> Use palavras-chave relevantes que seus clientes usariam 
          para encontrar este produto. Isso ajuda na busca interna do catálogo e na otimização 
          para mecanismos de busca.
        </p>
      </div>
    </div>
  );
};

export default ProductAdvancedForm;
