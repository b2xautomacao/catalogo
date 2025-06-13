
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building, Clock, Phone, Loader2, AlertCircle } from 'lucide-react';
import { useStores } from '@/hooks/useStores';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LogoUpload from './LogoUpload';

interface StoreInfoFormData {
  storeName: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  cnpj: string;
  businessHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
}

const StoreInfoSettings = () => {
  const { toast } = useToast();
  const { currentStore, updateCurrentStore, loading, error } = useStores();
  const [saving, setSaving] = React.useState(false);

  const form = useForm<StoreInfoFormData>({
    defaultValues: {
      storeName: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      cnpj: '',
      businessHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '14:00', closed: false },
        sunday: { open: '09:00', close: '14:00', closed: true }
      }
    }
  });

  // Carregar dados da loja quando disponível
  useEffect(() => {
    if (currentStore) {
      console.log('StoreInfoSettings: Carregando dados da loja:', currentStore);
      
      form.reset({
        storeName: currentStore.name || '',
        description: currentStore.description || '',
        address: currentStore.address || '',
        phone: currentStore.phone || '',
        email: currentStore.email || '',
        cnpj: currentStore.cnpj || '',
        businessHours: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '09:00', close: '14:00', closed: false },
          sunday: { open: '09:00', close: '14:00', closed: true }
        }
      });
    }
  }, [currentStore, form]);

  const onSubmit = async (data: StoreInfoFormData) => {
    try {
      setSaving(true);
      console.log('StoreInfoSettings: Salvando dados:', data);

      const updates = {
        name: data.storeName,
        description: data.description,
        address: data.address,
        phone: data.phone,
        email: data.email,
        cnpj: data.cnpj
      };

      const { error: updateError } = await updateCurrentStore(updates);

      if (updateError) {
        throw new Error(updateError);
      }

      toast({
        title: "Dados salvos",
        description: "As informações da loja foram atualizadas com sucesso",
      });
    } catch (error) {
      console.error('StoreInfoSettings: Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const days = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Carregando dados da loja...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados da loja: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!currentStore) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhuma loja encontrada. Verifique suas permissões.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Logo da Loja */}
          <LogoUpload />

          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Loja</FormLabel>
                    <FormControl>
                      <Input placeholder="Minha Loja Incrível" {...field} />
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
                        placeholder="Descreva sua loja e produtos..."
                        className="min-h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="contato@minhaloja.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Rua, número, bairro, cidade - UF"
                        className="min-h-20"
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

        {/* Horário de Funcionamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horário de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {days.map((day) => (
                <div key={day.key} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-32">
                    <span className="font-medium">{day.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      className="w-24"
                      {...form.register(`businessHours.${day.key}.open` as any)}
                    />
                    <span>às</span>
                    <Input
                      type="time"
                      className="w-24"
                      {...form.register(`businessHours.${day.key}.close` as any)}
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...form.register(`businessHours.${day.key}.closed` as any)}
                      />
                      <span className="text-sm">Fechado</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações da Loja
        </Button>
      </form>
    </Form>
  );
};

export default StoreInfoSettings;
