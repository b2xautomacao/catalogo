
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface StoreWizardData {
  // Etapa 1: Informações Básicas
  store_name: string;
  store_description: string;
  business_type: string;
  
  // Etapa 2: Identidade Visual
  logo_file: File | null;
  logo_url: string;
  
  // Etapa 3: Contato e WhatsApp
  store_phone: string;
  store_email: string;
  whatsapp_number: string;
  
  // Etapa 4: Como Você Vende
  accepts_pix: boolean;
  accepts_credit_card: boolean;
  accepts_cash: boolean;
  
  // Etapa 5: Como Entrega
  offers_pickup: boolean;
  offers_delivery: boolean;
  offers_shipping: boolean;
  delivery_fee: number;
}

const BUSINESS_TYPES = [
  { value: 'fashion', label: 'Moda e Roupas', emoji: '👗' },
  { value: 'electronics', label: 'Eletrônicos', emoji: '📱' },
  { value: 'food', label: 'Alimentação', emoji: '🍕' },
  { value: 'beauty', label: 'Beleza e Cosméticos', emoji: '💄' },
  { value: 'home', label: 'Casa e Decoração', emoji: '🏠' },
  { value: 'sports', label: 'Esportes e Fitness', emoji: '⚽' },
  { value: 'books', label: 'Livros e Educação', emoji: '📚' },
  { value: 'health', label: 'Saúde e Bem-estar', emoji: '💊' },
  { value: 'automotive', label: 'Automotivo', emoji: '🚗' },
  { value: 'other', label: 'Outros', emoji: '🏪' }
];

export const useStoreWizard = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
  const [data, setData] = useState<StoreWizardData>({
    store_name: '',
    store_description: '',
    business_type: '',
    logo_file: null,
    logo_url: '',
    store_phone: '',
    store_email: '',
    whatsapp_number: '',
    accepts_pix: true,
    accepts_credit_card: false,
    accepts_cash: true,
    offers_pickup: true,
    offers_delivery: false,
    offers_shipping: false,
    delivery_fee: 0
  });

  const updateData = useCallback((updates: Partial<StoreWizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('store-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('store-logos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      return null;
    }
  };

  const completeWizard = async (): Promise<boolean> => {
    if (!profile?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    
    try {
      console.log('🚀 Iniciando criação da loja completa:', data);

      // 1. Upload do logo se necessário
      let logoUrl = data.logo_url;
      if (data.logo_file && !logoUrl) {
        logoUrl = await uploadLogo(data.logo_file) || '';
      }

      // 2. Criar a loja
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .insert([{
          name: data.store_name,
          description: data.store_description,
          owner_id: profile.id,
          logo_url: logoUrl,
          phone: data.store_phone,
          email: data.store_email,
          is_active: true
        }])
        .select()
        .single();

      if (storeError) throw storeError;

      console.log('✅ Loja criada:', storeData);

      // 3. Atualizar perfil com store_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ store_id: storeData.id })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // 4. Criar configurações da loja
      const storeSettings = {
        store_id: storeData.id,
        retail_catalog_active: true,
        wholesale_catalog_active: false,
        whatsapp_number: data.whatsapp_number,
        whatsapp_integration_active: !!data.whatsapp_number,
        payment_methods: {
          pix: data.accepts_pix,
          credit_card: data.accepts_credit_card,
          cash: data.accepts_cash
        },
        shipping_options: {
          pickup: data.offers_pickup,
          delivery: data.offers_delivery,
          shipping: data.offers_shipping,
          delivery_fee: data.delivery_fee
        },
        business_type: data.business_type
      };

      const { error: settingsError } = await supabase
        .from('store_settings')
        .insert([storeSettings]);

      if (settingsError) throw settingsError;

      console.log('✅ Configurações da loja criadas');

      // 5. Recarregar perfil
      await refreshProfile();

      toast({
        title: "🎉 Parabéns!",
        description: "Sua loja foi criada com sucesso e está pronta para receber produtos!",
        duration: 5000,
      });

      return true;

    } catch (error) {
      console.error('❌ Erro ao criar loja:', error);
      toast({
        title: "Erro na configuração",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getBusinessTypeConfig = (type: string) => {
    return BUSINESS_TYPES.find(bt => bt.value === type);
  };

  const canProceedToNext = useCallback(() => {
    switch (currentStep) {
      case 1:
        return data.store_name.trim().length >= 3 && data.business_type;
      case 2:
        return true; // Logo é opcional
      case 3:
        return data.store_phone.trim().length >= 10;
      case 4:
        return data.accepts_pix || data.accepts_credit_card || data.accepts_cash;
      case 5:
        return data.offers_pickup || data.offers_delivery || data.offers_shipping;
      default:
        return true;
    }
  }, [currentStep, data]);

  const getProgress = useCallback(() => {
    return (currentStep / totalSteps) * 100;
  }, [currentStep, totalSteps]);

  return {
    // Estado
    currentStep,
    totalSteps,
    data,
    loading,
    
    // Ações
    updateData,
    nextStep,
    prevStep,
    goToStep,
    completeWizard,
    
    // Helpers
    canProceedToNext,
    getProgress,
    getBusinessTypeConfig,
    businessTypes: BUSINESS_TYPES
  };
};
