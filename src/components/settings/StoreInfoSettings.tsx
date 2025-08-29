
import React, { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building, Clock, Phone, Loader2, AlertCircle } from "lucide-react";
import { useStores } from "@/hooks/useStores";
import { useCatalogSettings } from "@/hooks/useCatalogSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LogoUpload from "./LogoUpload";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { cn } from "@/lib/utils";

// Dias da semana para tipagem e renderização
type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type BusinessHourValue = {
  open: string;
  close: string;
  closed: boolean;
  hasLunchBreak?: boolean;
  lunchStart?: string;
  lunchEnd?: string;
};

interface StoreInfoFormData {
  storeName: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  cnpj: string;
  businessHours: Record<WeekDay, BusinessHourValue>;
}

// Regex Brasil
const BR_PHONE_REGEX = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;
const BR_CNPJ_REGEX = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

const businessHourSchema = yup.object().shape({
  open: yup.string().required("Horário obrigatório"),
  close: yup.string().required("Horário obrigatório"),
  closed: yup.boolean().required(),
});

const storeInfoSchema = yup.object().shape({
  storeName: yup.string().required("Nome é obrigatório"),
  description: yup.string().required("Descrição é obrigatória"),
  address: yup.string().required("Endereço é obrigatório"),
  phone: yup
    .string()
    .required("Telefone é obrigatório")
    .matches(BR_PHONE_REGEX, "Formato inválido. Ex: (11) 91234-5678"),
  email: yup.string().email("E-mail inválido").required("E-mail é obrigatório"),
  cnpj: yup
    .string()
    .test(
      "is-cnpj",
      "Formato inválido (00.000.000/0000-00)",
      (v) => !v || BR_CNPJ_REGEX.test(v || "")
    )
    .required("CNPJ é obrigatório"),
  businessHours: yup
    .object()
    .shape({
      monday: businessHourSchema.required(),
      tuesday: businessHourSchema.required(),
      wednesday: businessHourSchema.required(),
      thursday: businessHourSchema.required(),
      friday: businessHourSchema.required(),
      saturday: businessHourSchema.required(),
      sunday: businessHourSchema.required(),
    })
    .required("Horários de funcionamento são obrigatórios"),
});

const StoreInfoSettings: React.FC = () => {
  const { toast } = useToast();
  const { currentStore, updateCurrentStore, loading, error } = useStores();
  const { settings: catalogSettings, updateSettings: updateCatalogSettings } =
    useCatalogSettings();
  const [saving, setSaving] = React.useState(false);

  const defaultBusinessHours: Record<WeekDay, BusinessHourValue> = {
    monday: {
      open: "09:00",
      close: "18:00",
      closed: false,
      hasLunchBreak: true,
      lunchStart: "12:00",
      lunchEnd: "13:00",
    },
    tuesday: {
      open: "09:00",
      close: "18:00",
      closed: false,
      hasLunchBreak: true,
      lunchStart: "12:00",
      lunchEnd: "13:00",
    },
    wednesday: {
      open: "09:00",
      close: "18:00",
      closed: false,
      hasLunchBreak: true,
      lunchStart: "12:00",
      lunchEnd: "13:00",
    },
    thursday: {
      open: "09:00",
      close: "18:00",
      closed: false,
      hasLunchBreak: true,
      lunchStart: "12:00",
      lunchEnd: "13:00",
    },
    friday: {
      open: "09:00",
      close: "18:00",
      closed: false,
      hasLunchBreak: true,
      lunchStart: "12:00",
      lunchEnd: "13:00",
    },
    saturday: {
      open: "09:00",
      close: "14:00",
      closed: false,
      hasLunchBreak: false,
    },
    sunday: {
      open: "09:00",
      close: "14:00",
      closed: true,
      hasLunchBreak: false,
    },
  };

  // Função para normalizar e validar os dados de horário vindos do banco
  const normalizeBusinessHours = (savedHours: any): Record<WeekDay, BusinessHourValue> => {
    if (!savedHours || typeof savedHours !== 'object') {
      return defaultBusinessHours;
    }

    const normalizedHours: Record<WeekDay, BusinessHourValue> = { ...defaultBusinessHours };
    const days: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    days.forEach((day) => {
      if (savedHours[day] && typeof savedHours[day] === 'object') {
        normalizedHours[day] = {
          open: savedHours[day].open || defaultBusinessHours[day].open,
          close: savedHours[day].close || defaultBusinessHours[day].close,
          closed: Boolean(savedHours[day].closed),
          hasLunchBreak: Boolean(savedHours[day].hasLunchBreak),
          lunchStart: savedHours[day].lunchStart || defaultBusinessHours[day].lunchStart,
          lunchEnd: savedHours[day].lunchEnd || defaultBusinessHours[day].lunchEnd,
        };
      }
    });

    return normalizedHours;
  };

  const form = useForm<StoreInfoFormData>({
    resolver: yupResolver(storeInfoSchema) as any,
    defaultValues: {
      storeName: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      cnpj: "",
      businessHours: defaultBusinessHours,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (currentStore && catalogSettings) {
      console.log('Carregando dados do banco:', { catalogSettings, currentStore });
      
      // Carregar horários salvos do banco de dados se existirem, com validação
      const savedBusinessHours = normalizeBusinessHours(catalogSettings.business_hours);
      
      form.reset({
        storeName: currentStore.name || "",
        description: currentStore.description || "",
        address: currentStore.address || "",
        phone: currentStore.phone || "",
        email: currentStore.email || "",
        cnpj: currentStore.cnpj || "",
        businessHours: savedBusinessHours,
      });
    }
  }, [currentStore, catalogSettings, form]);

  const onSubmit = async (data: StoreInfoFormData) => {
    try {
      setSaving(true);
      
      console.log('Enviando dados para salvar:', data);
      
      // Atualização dos dados da loja
      const storeUpdates = {
        name: data.storeName,
        description: data.description,
        address: data.address,
        phone: data.phone,
        email: data.email,
        cnpj: data.cnpj,
      };
      
      const { error: updateError } = await updateCurrentStore(storeUpdates);
      if (updateError) throw new Error(updateError);

      // NOVO: Salvar horários de funcionamento nas configurações do catálogo
      if (catalogSettings) {
        const catalogUpdates = {
          business_hours: data.businessHours,
          // Manter outras configurações existentes
          facebook_url: catalogSettings.facebook_url || null,
          instagram_url: catalogSettings.instagram_url || null,
          twitter_url: catalogSettings.twitter_url || null,
        };
        
        console.log('Salvando horários no catálogo:', catalogUpdates);
        
        const { error: catalogError } = await updateCatalogSettings(catalogUpdates);
        if (catalogError) {
          console.error("Erro ao salvar horários:", catalogError);
          throw new Error("Erro ao salvar horários de funcionamento");
        }
      }

      toast({
        title: "✅ Dados salvos!",
        description: "As informações da loja e horários de funcionamento foram atualizados com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro ao salvar",
        description:
          error?.message || "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const days: { key: WeekDay; label: string }[] = [
    { key: "monday", label: "Segunda-feira" },
    { key: "tuesday", label: "Terça-feira" },
    { key: "wednesday", label: "Quarta-feira" },
    { key: "thursday", label: "Quinta-feira" },
    { key: "friday", label: "Sexta-feira" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
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
                    <FormLabel>
                      Nome da Loja <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Minha Loja Incrível"
                        {...field}
                        className="border-blue-300 focus:ring-2 focus:ring-blue-400"
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
                        {...field}
                        className="min-h-20 border-blue-200"
                        placeholder="Descreva sua loja e produtos..."
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
                      <Input
                        {...field}
                        className="border-blue-200"
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        onChange={(e) => {
                          // auto-máscara
                          let v = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 14);
                          if (v.length > 12) {
                            v = v.replace(
                              /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/,
                              "$1.$2.$3/$4-$5"
                            );
                          } else if (v.length > 8) {
                            v = v.replace(
                              /^(\d{2})(\d{3})(\d{3})(\d{0,4})/,
                              "$1.$2.$3/$4"
                            );
                          } else if (v.length > 5) {
                            v = v.replace(
                              /^(\d{2})(\d{3})(\d{0,3})/,
                              "$1.$2.$3"
                            );
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
                Telefone de contato{" "}
                <span className="text-xs font-normal text-gray-500">
                  (usado para WhatsApp no plano básico)
                </span>
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
                      <span className="ml-2 text-xs text-gray-600">
                        (ex: (11) 91234-5678)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-green-300"
                        placeholder="(11) 91234-5678"
                        maxLength={15}
                        onChange={(e) => {
                          let v = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 11);
                          if (v.length > 10) {
                            v = v.replace(
                              /^(\d{2})(\d{5})(\d{4}).*/,
                              "($1) $2-$3"
                            );
                          } else if (v.length > 6) {
                            v = v.replace(
                              /^(\d{2})(\d{4})(\d{0,4})/,
                              "($1) $2-$3"
                            );
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
                      <Input
                        placeholder="contato@minhaloja.com"
                        type="email"
                        {...field}
                        className="border-green-200"
                      />
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
                        className="min-h-20 border-green-200"
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

        {/* Horário de Funcionamento - Layout Melhorado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horário de Funcionamento
            </CardTitle>
            <CardDescription>
              Configure os horários de funcionamento para cada dia da semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {days.map((day) => (
                <FormField
                  key={day.key}
                  control={form.control}
                  name={`businessHours.${day.key}` as const}
                  render={({ field }) => {
                    // Garantir que field.value sempre tenha um valor válido
                    const dayValue = field.value || defaultBusinessHours[day.key];
                    
                    return (
                      <div className="p-6 border-2 border-gray-100 rounded-xl bg-gradient-to-r from-gray-50 to-white">
                        {/* Header do Dia */}
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-800">
                            {day.label}
                          </h4>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={dayValue.closed}
                              onChange={(e) =>
                                field.onChange({
                                  ...dayValue,
                                  closed: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-600">
                              Fechado
                            </span>
                          </label>
                        </div>

                        {!dayValue.closed && (
                          <div className="space-y-4">
                            {/* Horário Principal */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <h5 className="text-sm font-medium text-gray-700 mb-3">
                                Horário de Funcionamento
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">
                                    Abertura
                                  </label>
                                  <Input
                                    type="time"
                                    value={dayValue.open}
                                    onChange={(e) =>
                                      field.onChange({
                                        ...dayValue,
                                        open: e.target.value,
                                      })
                                    }
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">
                                    Fechamento
                                  </label>
                                  <Input
                                    type="time"
                                    value={dayValue.close}
                                    onChange={(e) =>
                                      field.onChange({
                                        ...dayValue,
                                        close: e.target.value,
                                      })
                                    }
                                    className="w-full"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Horário de Almoço */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-medium text-gray-700">
                                  Horário de Almoço
                                </h5>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={dayValue.hasLunchBreak}
                                    onChange={(e) =>
                                      field.onChange({
                                        ...dayValue,
                                        hasLunchBreak: e.target.checked,
                                      })
                                    }
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-gray-600">
                                    Tem horário de almoço
                                  </span>
                                </label>
                              </div>

                              {dayValue.hasLunchBreak && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                      Início do Almoço
                                    </label>
                                    <Input
                                      type="time"
                                      value={dayValue.lunchStart || "12:00"}
                                      onChange={(e) =>
                                        field.onChange({
                                          ...dayValue,
                                          lunchStart: e.target.value,
                                        })
                                      }
                                      className="w-full"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                      Fim do Almoço
                                    </label>
                                    <Input
                                      type="time"
                                      value={dayValue.lunchEnd || "13:00"}
                                      onChange={(e) =>
                                        field.onChange({
                                          ...dayValue,
                                          lunchEnd: e.target.value,
                                        })
                                      }
                                      className="w-full"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Preview do Horário */}
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <p className="text-xs text-blue-800 font-medium mb-1">
                                Como aparecerá no catálogo:
                              </p>
                              <p className="text-sm text-blue-700">
                                {dayValue.open} - {dayValue.close}
                                {dayValue.hasLunchBreak &&
                                  dayValue.lunchStart &&
                                  dayValue.lunchEnd && (
                                    <span className="text-blue-600">
                                      {" "}
                                      (Almoço: {dayValue.lunchStart} -{" "}
                                      {dayValue.lunchEnd})
                                    </span>
                                  )}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className={cn(
            "w-full py-3 text-sm font-semibold rounded-xl shadow-lg transition-all",
            saving
              ? "opacity-70 pointer-events-none"
              : "bg-primary text-white hover:bg-primary/90"
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
