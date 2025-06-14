
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
import { Switch } from '@/components/ui/switch';
import AIContentGenerator from '@/components/ai/AIContentGenerator';

interface ProductAdvancedFormProps {
  form: UseFormReturn<any>;
}

const ProductAdvancedForm = ({ form }: ProductAdvancedFormProps) => {
  const productName = form.watch('name');
  const category = form.watch('category');
  const description = form.watch('description');

  const handleSEOGenerated = (seoData: any) => {
    if (seoData.metaTitle) {
      form.setValue('meta_title', seoData.metaTitle);
    }
    if (seoData.metaDescription) {
      form.setValue('meta_description', seoData.metaDescription);
    }
    if (seoData.keywords) {
      form.setValue('keywords', seoData.keywords);
    }
    if (seoData.slug) {
      form.setValue('seo_slug', seoData.slug);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Otimização para Mecanismos de Busca (SEO)</h4>
          <AIContentGenerator
            productName={productName}
            category={category}
            description={description}
            onSEOGenerated={handleSEOGenerated}
            disabled={!productName?.trim()}
            variant="seo"
            size="sm"
          />
        </div>
        
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

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Configurações do Produto</h4>
        
        <FormField
          control={form.control}
          name="is_featured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Produto Destaque</FormLabel>
                <FormDescription>
                  Produtos em destaque aparecem com prioridade no catálogo
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
                  Apenas produtos ativos aparecem no catálogo
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
