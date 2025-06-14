
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useOnboarding = () => {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const checkOnboardingStatus = async () => {
    try {
      if (!profile?.store_id) {
        setLoading(false);
        return;
      }

      console.log('🔍 Verificando status do onboarding para store:', profile.store_id);

      // Verificar se a loja tem configurações básicas
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('name, description')
        .eq('id', profile.store_id)
        .single();

      if (storeError) {
        console.error('Erro ao buscar loja:', storeError);
        setLoading(false);
        return;
      }

      // Verificar se tem configurações do catálogo
      const { data: settings, error: settingsError } = await supabase
        .from('store_settings')
        .select('retail_catalog_active, payment_methods, shipping_options')
        .eq('store_id', profile.store_id)
        .single();

      // Se não tem nome da loja ou configurações básicas, precisa de onboarding
      const hasBasicInfo = store?.name && store.name.trim() !== '';
      const hasSettings = settings && (
        settings.retail_catalog_active !== null ||
        settings.payment_methods ||
        settings.shipping_options
      );

      const shouldShowOnboarding = !hasBasicInfo || !hasSettings;

      console.log('📋 Status do onboarding:', {
        hasBasicInfo,
        hasSettings,
        shouldShowOnboarding,
        storeName: store?.name
      });

      setNeedsOnboarding(shouldShowOnboarding);
      
    } catch (error) {
      console.error('Erro na verificação do onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = () => {
    setNeedsOnboarding(false);
  };

  useEffect(() => {
    if (profile?.store_id) {
      checkOnboardingStatus();
    } else {
      setLoading(false);
    }
  }, [profile?.store_id]);

  return {
    needsOnboarding,
    loading,
    completeOnboarding,
    recheckOnboarding: checkOnboardingStatus
  };
};
