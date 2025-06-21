
import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCategories } from '@/hooks/useCategories';
import CategoryFormDialog from '../CategoryFormDialog';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductBasicInfoFormProps {
  form: UseFormReturn<any>;
}

const ProductBasicInfoForm: React.FC<ProductBasicInfoFormProps> = ({ form }) => {
  const { categories, loading: categoriesLoading, fetchCategories } = useCategories();

  // Forçar refresh das categorias quando o componente for montado
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCategoryCreated = async (newCategory: any) => {
    console.log('📂 Nova categoria criada:', newCategory);
    await fetchCategories(); // Recarregar categorias
    form.setValue('category', newCategory.name); // Selecionar automaticamente
    form.trigger('category'); // Validar campo
  };

  const handleRefreshCategories = async () => {
    console.log('🔄 Atualizando lista de categorias...');
    await fetchCategories();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Informações Básicas</h3>
        <p className="text-sm text-muted-foreground">
          Preencha as informações essenciais do seu produto.
        </p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Produto *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Digite o nome do produto" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva o produto (opcional)"
                  rows={4}
                  {...field} 
                />
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
              <FormLabel>Categoria *</FormLabel>
              <div className="flex gap-2">
                <div className="flex-1">
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      disabled={categoriesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRefreshCategories}
                  disabled={categoriesLoading}
                  title="Atualizar categorias"
                >
                  <RefreshCw className={`h-4 w-4 ${categoriesLoading ? 'animate-spin' : ''}`} />
                </Button>
                <CategoryFormDialog onCategoryCreated={handleCategoryCreated} />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Produto Ativo
                  </FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Produto visível no catálogo
                  </div>
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
            name="is_featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Produto Destaque
                  </FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Destacar no catálogo
                  </div>
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
      </div>
    </div>
  );
};

export default ProductBasicInfoForm;
