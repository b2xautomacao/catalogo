
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Store, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2
} from 'lucide-react';

interface OnboardingData {
  // Informações da loja
  store_name: string;
  store_description: string;
  store_phone: string;
  store_email: string;
  store_address: string;
  
  // Configurações do catálogo
  retail_catalog_active: boolean;
  wholesale_catalog_active: boolean;
  template_name: string;
  
  // Métodos de pagamento
  pix: boolean;
  credit_card: boolean;
  bank_slip: boolean;
  
  // Opções de entrega
  pickup: boolean;
  delivery: boolean;
  shipping: boolean;
}

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ open, onComplete }) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const totalSteps = 4;

  const form = useForm<OnboardingData>({
    defaultValues: {
      store_name: '',
      store_description: '',
      store_phone: '',
      store_email: '',
      store_address: '',
      retail_catalog_active: true,
      wholesale_catalog_active: false,
      template_name: 'modern',
      pix: false,
      credit_card: false,
      bank_slip: false,
      pickup: true,
      delivery: false,
      shipping: false
    }
  });

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onSubmit = async (data: OnboardingData) => {
    try {
      setSaving(true);

      if (!profile?.store_id) {
        throw new Error('Store ID não encontrado');
      }

      console.log('🚀 Configurando loja via onboarding:', data);

      // Atualizar informações da loja
      const { error: storeError } = await supabase
        .from('stores')
        .update({
          name: data.store_name,
          description: data.store_description,
          phone: data.store_phone,
          email: data.store_email,
          address: data.store_address,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.store_id);

      if (storeError) throw storeError;

      // Atualizar configurações da loja
      const storeSettings = {
        retail_catalog_active: data.retail_catalog_active,
        wholesale_catalog_active: data.wholesale_catalog_active,
        template_name: data.template_name,
        payment_methods: {
          pix: data.pix,
          credit_card: data.credit_card,
          bank_slip: data.bank_slip
        },
        shipping_options: {
          pickup: data.pickup,
          delivery: data.delivery,
          shipping: data.shipping
        }
      };

      const { error: settingsError } = await supabase
        .from('store_settings')
        .upsert({
          store_id: profile.store_id,
          ...storeSettings,
          updated_at: new Date().toISOString()
        });

      if (settingsError) throw settingsError;

      console.log('✅ Onboarding concluído com sucesso');

      toast({
        title: "🎉 Configuração concluída!",
        description: "Sua loja foi configurada com sucesso. Bem-vindo ao sistema!",
        duration: 5000,
      });

      onComplete();

    } catch (error) {
      console.error('❌ Erro no onboarding:', error);
      toast({
        title: "Erro na configuração",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-6 w-6 text-blue-600" />
                Informações da Loja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="store_name"
                rules={{ required: 'Nome da loja é obrigatório' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Loja *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Minha Loja Incrível" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="store_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva sua loja em poucas palavras..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="store_phone"
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
                  name="store_email"
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
              </div>

              <FormField
                control={form.control}
                name="store_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, cidade - UF" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-6 w-6 text-purple-600" />
                Configuração dos Catálogos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="retail_catalog_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Catálogo de Varejo</FormLabel>
                        <p className="text-sm text-muted-foreground">Vendas para consumidor final</p>
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
                  name="wholesale_catalog_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Catálogo de Atacado</FormLabel>
                        <p className="text-sm text-muted-foreground">Vendas em grandes quantidades</p>
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

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Dica Importante</h4>
                <p className="text-sm text-blue-800">
                  Você pode ativar ambos os catálogos e configurar preços diferentes para varejo e atacado.
                  Recomendamos começar com o catálogo de varejo ativo.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-green-600" />
                Métodos de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="pix"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>PIX</FormLabel>
                      <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
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
                name="credit_card"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Cartão de Crédito</FormLabel>
                      <p className="text-sm text-muted-foreground">Parcelamento em até 12x</p>
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
                name="bank_slip"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Boleto Bancário</FormLabel>
                      <p className="text-sm text-muted-foreground">Vencimento em 3 dias úteis</p>
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

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Atenção:</strong> Para processar pagamentos, você precisará configurar suas credenciais do Mercado Pago nas configurações após concluir este assistente.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-6 w-6 text-orange-600" />
                Opções de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="pickup"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Retirada na Loja</FormLabel>
                      <p className="text-sm text-muted-foreground">Cliente retira no local</p>
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
                name="delivery"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Entrega Local</FormLabel>
                      <p className="text-sm text-muted-foreground">Entrega na região</p>
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
                name="shipping"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Envio Nacional</FormLabel>
                      <p className="text-sm text-muted-foreground">Correios e transportadoras</p>
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

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Quase pronto!
                </h4>
                <p className="text-sm text-green-800">
                  Após concluir, você poderá adicionar produtos, configurar preços e personalizar ainda mais sua loja.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Configure sua Loja
          </DialogTitle>
          <div className="space-y-2">
            <Progress value={(step / totalSteps) * 100} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              Passo {step} de {totalSteps}
            </p>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderStep()}

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>

              <div className="flex gap-2">
                {step < totalSteps ? (
                  <Button type="button" onClick={nextStep}>
                    Próximo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" className="btn-primary" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {saving ? 'Configurando...' : 'Concluir Configuração'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
