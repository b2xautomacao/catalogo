
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
  const onBenefitsChangeRef = useRef(onBenefitsChange);
  const onPlanBenefitsChangeRef = useRef(onPlanBenefitsChange);

  // Keep refs updated without triggering resubscriptions
  useEffect(() => {
    onBenefitsChangeRef.current = onBenefitsChange;
  }, [onBenefitsChange]);

  useEffect(() => {
    onPlanBenefitsChangeRef.current = onPlanBenefitsChange;
  }, [onPlanBenefitsChange]);

  const handleSystemBenefitsChange = useCallback((payload: any) => {
    console.log('🔄 System benefits changed:', payload);
    
    if (payload.eventType === 'UPDATE') {
      const benefit = payload.new;
      toast.info(`Benefício "${benefit.name}" foi atualizado pelo administrador`);
    } else if (payload.eventType === 'INSERT') {
      const benefit = payload.new;
      toast.success(`Novo benefício "${benefit.name}" disponível no sistema`);
    }
    
    onBenefitsChangeRef.current?.();
  }, []);

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
    
    onPlanBenefitsChangeRef.current?.();
  }, []);

  useEffect(() => {
    // Only subscribe when profile id is stable
    const userId = profile?.id || 'anonymous';
    const timestamp = Date.now();

    // Criar IDs consistentes
    const systemChannelId = `system-benefits-${userId}`;
    const planChannelId = `plan-benefits-${userId}`;

    console.log(`📡 Initializing stable realtime subscriptions for ${userId}`);

    // Limpar canais existentes antes de criar novos
    if (channelsRef.current.system) supabase.removeChannel(channelsRef.current.system);
    if (channelsRef.current.plan) supabase.removeChannel(channelsRef.current.plan);

    // Subscription para mudanças em system_benefits
    const systemBenefitsChannel = supabase
      .channel(`${systemChannelId}-${timestamp}`)
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
      .channel(`${planChannelId}-${timestamp}`)
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

    return () => {
      console.log('📡 Cleaning up realtime subscriptions');
      if (channelsRef.current.system) supabase.removeChannel(channelsRef.current.system);
      if (channelsRef.current.plan) supabase.removeChannel(channelsRef.current.plan);
    };
  }, [profile?.id, handleSystemBenefitsChange, handlePlanBenefitsChange]);

  return {
    forceRefresh: useCallback(() => {
      onBenefitsChangeRef.current?.();
      onPlanBenefitsChangeRef.current?.();
    }, [])
  };
};
