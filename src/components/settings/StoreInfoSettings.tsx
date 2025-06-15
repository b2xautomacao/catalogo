
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building, Clock, Phone, Loader2, AlertCircle, Facebook, Instagram, Twitter } from 'lucide-react';
import { useStores } from '@/hooks/useStores';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LogoUpload from './LogoUpload';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { cn } from '@/lib/utils'; // para classes condicionais

// Definição tipada usada para validação e formulário
interface StoreInfoFormData {
  storeName: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  cnpj: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
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

// Regex Brasil
const BR_PHONE_REGEX = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;
const BR_CNPJ_REGEX = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

const storeInfoSchema = yup.object({
  storeName: yup.string().required('Nome é obrigatório'),
  description: yup.string().nullable().default(''),
  address: yup.string().nullable().default(''),
  phone: yup
    .string()
    .required('Telefone é obrigatório')
    .matches(BR_PHONE_REGEX, 'Formato inválido. Ex: (11) 91234-5678'),
  email: yup
    .string()
    .nullable()
    .email('E-mail inválido')
    .default(''),
  cnpj: yup
    .string()
    .nullable()
    .test('is-cnpj', 'Formato inválido (00.000.000/0000-00)', v => !v || BR_CNPJ_REGEX.test(v || ''))
    .default(''),
  facebookUrl: yup.string().nullable().default(''),
  instagramUrl: yup.string().nullable().default(''),
  twitterUrl: yup.string().nullable().default(''),
  businessHours: yup.object({
    monday: yup.object({
      open: yup.string().required(),
      close: yup.string().required(),
      closed: yup.boolean().required(),
    }),
    tuesday: yup.object({
      open: yup.string().required(),
      close: yup.string().required(),
      closed: yup.boolean().required(),
    }),
    wednesday: yup.object({
      open: yup.string().required(),
      close: yup.string().required(),
      closed: yup.boolean().required(),
    }),
    thursday: yup.object({
      open: yup.string().required(),
      close: yup.string().required(),
      closed: yup.boolean().required(),
    }),
    friday: yup.object({
      open: yup.string().required(),
      close: yup.string().required(),
      closed: yup.boolean().required(),
    }),
    saturday: yup.object({
      open: yup.string().required(),
      close: yup.string().required(),
      closed: yup.boolean().required(),
    }),
    sunday: yup.object({
      open: yup.string().required(),
      close: yup.string().required(),
      closed: yup.boolean().required(),
    }),
  })
}).required();

const StoreInfoSettings: React.FC = () => {
  const { toast } = useToast();
  const { currentStore, updateCurrentStore, loading, error } = useStores();
  const { settings: catalogSettings, updateSettings: updateCatalogSettings } = useCatalogSettings();
  const [saving, setSaving] = React.useState(false);

  const form = useForm<StoreInfoFormData>({
    resolver: yupResolver(storeInfoSchema),
    defaultValues: {
      storeName: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      cnpj: '',
      facebookUrl: '',
      instagramUrl: '',
      twitterUrl: '',
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

  useEffect(() => {
    if (currentStore && catalogSettings) {
      form.reset({
        storeName: currentStore.name || '',
        description: currentStore.description || '',
        address: currentStore.address || '',
        phone: currentStore.phone || '',
        email: currentStore.email || '',
        cnpj: currentStore.cnpj || '',
        facebookUrl: catalogSettings.facebook_url || '',
        instagramUrl: catalogSettings.instagram_url || '',
        twitterUrl: catalogSettings.twitter_url || '',
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
  }, [currentStore, catalogSettings, form]);

  const onSubmit = async (data: StoreInfoFormData) => {
    try {
      setSaving(true);
      // Atualização dos dados da loja
      const storeUpdates = {
        name: data.storeName,
        description: data.description,
        address: data.address,
        phone: data.phone,
        email: data.email,
        cnpj: data.cnpj
      };
      const { error: updateError } = await updateCurrentStore(storeUpdates);
      if (updateError) throw new Error(updateError);

      // Atualização das redes sociais
      if (catalogSettings) {
        const catalogUpdates = {
          facebook_url: data.facebookUrl || null,
          instagram_url: data.instagramUrl || null,
          twitter_url: data.twitterUrl || null
        };
        const { error: catalogError } = await updateCatalogSettings(catalogUpdates);
        if (catalogError) throw new Error('Erro ao atualizar redes sociais');
      }

      toast({
        title: "✅ Dados salvos!",
        description: "As informações da loja foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Não foi possível salvar as configurações.",
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <LogoUpload />

          {/* Informações Básicas */}
          <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-b from-blue-50 to-white p-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
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
                    <FormLabel>Nome da Loja <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Minha Loja Incrível" {...field} className="border-blue-300 focus:ring-2 focus:ring-blue-400"/>
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
                      <Textarea {...field} className="min-h-20 border-blue-200" placeholder="Descreva sua loja e produtos..." />
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
                      <Input {...field}
                        className="border-blue-200"
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        onChange={e => {
                          // auto-máscara
                          let v = e.target.value.replace(/\D/g, '').slice(0,14);
                          if (v.length > 12) {
                            v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, "$1.$2.$3/$4-$5");
                          } else if (v.length > 8) {
                            v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, "$1.$2.$3/$4");
                          } else if (v.length > 5) {
                            v = v.replace(/^(\d{2})(\d{3})(\d{0,3})/, "$1.$2.$3");
                          } else if (v.length > 2) {
                            v = v.replace(/^(\d{2})(\d{0,3})/, "$1.$2");
                          }
                          field.onChange(v);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contato */}
          <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-tr from-green-50 to-white p-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Phone className="h-5 w-5" />
                Telefone de contato <span className="text-xs font-normal text-gray-500">(usado para WhatsApp no plano básico)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Telefone / WhatsApp&nbsp;
                      <span className="text-red-500">*</span>
                      <span className="ml-2 text-xs text-gray-600">(ex: (11) 91234-5678)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-green-300"
                        placeholder="(11) 91234-5678"
                        maxLength={15}
                        onChange={e => {
                          let v = e.target.value.replace(/\D/g, '').slice(0,11);
                          if (v.length > 10) {
                            v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
                          } else if (v.length > 6) {
                            v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
                          } else if (v.length > 2) {
                            v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
                          }
                          field.onChange(v);
                        }}
                      />
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
                      <Input placeholder="contato@minhaloja.com" type="email" {...field} className="border-green-200"/>
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
                      <Textarea placeholder="Rua, número, bairro, cidade - UF" className="min-h-20 border-green-200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
        {/* Redes Sociais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Facebook className="h-5 w-5" />
              Redes Sociais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="facebookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://facebook.com/minhaloja" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instagramUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://instagram.com/minhaloja" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="twitterUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      Twitter
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://twitter.com/minhaloja" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
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
                      {...form.register(`businessHours.${day.key}.open` as const)}
                    />
                    <span>às</span>
                    <Input
                      type="time"
                      className="w-24"
                      {...form.register(`businessHours.${day.key}.close` as const)}
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...form.register(`businessHours.${day.key}.closed` as const)}
                      />
                      <span className="text-sm">Fechado</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Button
          type="submit"
          className={cn(
            "w-full py-3 text-base font-semibold rounded-xl shadow-lg transition-all",
            saving ? "opacity-70 pointer-events-none" : "bg-primary text-white hover:bg-primary/90"
          )}
          disabled={saving}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Salvando..." : "Salvar Configurações da Loja"}
        </Button>
      </form>
    </Form>
  );
};

export default StoreInfoSettings;
