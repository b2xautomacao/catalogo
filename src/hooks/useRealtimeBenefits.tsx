
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useRealtimeBenefits = (
  onBenefitsChange?: () => void,
  onPlanBenefitsChange?: () => void
) => {
  const { profile } = useAuth();
  const channelsRef = useRef<{ system: any; plan: any }>({ system: null, plan: null });

  const handleSystemBenefitsChange = useCallback((payload: any) => {
    console.log('🔄 System benefits changed:', payload);
    
    if (payload.eventType === 'UPDATE') {
      const benefit = payload.new;
      toast.info(`Benefício "${benefit.name}" foi atualizado pelo administrador`);
    } else if (payload.eventType === 'INSERT') {
      const benefit = payload.new;
      toast.success(`Novo benefício "${benefit.name}" disponível no sistema`);
    }
    
    onBenefitsChange?.();
  }, [onBenefitsChange]);

  const handlePlanBenefitsChange = useCallback((payload: any) => {
    console.log('🔄 Plan benefits changed:', payload);
    
    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
      const planBenefit = payload.new;
      if (planBenefit.is_enabled) {
        toast.info('Novo benefício ativado no seu plano!');
      } else {
        toast.warning('Um benefício foi desativado no seu plano');
      }
    }
    
    onPlanBenefitsChange?.();
  }, [onPlanBenefitsChange]);

  useEffect(() => {
    // Limpar canais existentes se houver
    if (channelsRef.current.system) {
      supabase.removeChannel(channelsRef.current.system);
      channelsRef.current.system = null;
    }
    if (channelsRef.current.plan) {
      supabase.removeChannel(channelsRef.current.plan);
      channelsRef.current.plan = null;
    }

    // Criar novos canais com IDs únicos
    const systemChannelId = `system-benefits-${Date.now()}-${Math.random()}`;
    const planChannelId = `plan-benefits-${Date.now()}-${Math.random()}`;

    // Subscription para mudanças em system_benefits
    const systemBenefitsChannel = supabase
      .channel(systemChannelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_benefits'
        },
        handleSystemBenefitsChange
      )
      .subscribe();

    // Subscription para mudanças em plan_benefits
    const planBenefitsChannel = supabase
      .channel(planChannelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plan_benefits'
        },
        handlePlanBenefitsChange
      )
      .subscribe();

    channelsRef.current.system = systemBenefitsChannel;
    channelsRef.current.plan = planBenefitsChannel;

    console.log('📡 Realtime subscriptions initialized with unique IDs');

    return () => {
      console.log('📡 Cleaning up realtime subscriptions');
      if (channelsRef.current.system) {
        supabase.removeChannel(channelsRef.current.system);
      }
      if (channelsRef.current.plan) {
        supabase.removeChannel(channelsRef.current.plan);
      }
    };
  }, [handleSystemBenefitsChange, handlePlanBenefitsChange]);

  return {
    // Método para forçar atualização manual se necessário
    forceRefresh: useCallback(() => {
      onBenefitsChange?.();
      onPlanBenefitsChange?.();
    }, [onBenefitsChange, onPlanBenefitsChange])
  };
};
