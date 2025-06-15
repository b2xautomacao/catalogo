
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SystemBenefit {
  id: string;
  name: string;
  description: string;
  benefit_key: string;
  category: string;
  is_active: boolean;
}

export interface PlanBenefit {
  id: string;
  plan_id: string;
  benefit_id: string;
  limit_value: string | null;
  is_enabled: boolean;
  benefit: SystemBenefit;
}

export const useBenefitValidation = () => {
  const [loading, setLoading] = useState(true);
  const [benefits, setBenefits] = useState<PlanBenefit[]>([]);
  const { profile } = useAuth();

  const fetchUserBenefits = useCallback(async () => {
    if (!profile?.store_id) {
      setLoading(false);
      return;
    }

    try {
      // Buscar benefícios do plano atual da loja
      const { data: subscription, error: subError } = await supabase
        .from('store_subscriptions')
        .select(`
          plan_id,
          status,
          ends_at
        `)
        .eq('store_id', profile.store_id)
        .in('status', ['active', 'trialing'])
        .single();

      if (subError || !subscription) {
        console.error('Erro ao buscar assinatura:', subError);
        setBenefits([]);
        setLoading(false);
        return;
      }

      // Buscar benefícios do plano
      const { data: planBenefits, error: benefitsError } = await supabase
        .from('plan_benefits')
        .select(`
          *,
          benefit:system_benefits(*)
        `)
        .eq('plan_id', subscription.plan_id)
        .eq('is_enabled', true);

      if (benefitsError) {
        console.error('Erro ao buscar benefícios:', benefitsError);
        setBenefits([]);
      } else {
        setBenefits(planBenefits || []);
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      setBenefits([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.store_id]);

  const hasBenefit = useCallback((benefitKey: string): boolean => {
    return benefits.some(b => 
      b.benefit?.benefit_key === benefitKey && 
      b.benefit?.is_active && 
      b.is_enabled
    );
  }, [benefits]);

  const getBenefitLimit = useCallback((benefitKey: string): string | null => {
    const benefit = benefits.find(b => 
      b.benefit?.benefit_key === benefitKey && 
      b.benefit?.is_active && 
      b.is_enabled
    );
    return benefit?.limit_value || null;
  }, [benefits]);

  const validateBenefitAccess = useCallback(async (
    benefitKey: string, 
    showErrorMessage = true
  ): Promise<boolean> => {
    if (!profile?.store_id) {
      if (showErrorMessage) {
        toast.error('Loja não identificada');
      }
      return false;
    }

    try {
      const { data: hasAccess, error } = await supabase
        .rpc('has_benefit_access', {
          _store_id: profile.store_id,
          _benefit_key: benefitKey
        });

      if (error) {
        console.error('Erro ao validar benefício:', error);
        return false;
      }

      if (!hasAccess && showErrorMessage) {
        const benefit = benefits.find(b => b.benefit?.benefit_key === benefitKey);
        const benefitName = benefit?.benefit?.name || 'Esta funcionalidade';
        toast.error(`${benefitName} não está disponível no seu plano atual. Faça upgrade para ter acesso!`);
      }

      return hasAccess || false;
    } catch (error) {
      console.error('Erro inesperado na validação:', error);
      return false;
    }
  }, [profile?.store_id, benefits]);

  const getBenefitLimitFromDB = useCallback(async (benefitKey: string): Promise<string | null> => {
    if (!profile?.store_id) return null;

    try {
      const { data: limit, error } = await supabase
        .rpc('get_benefit_limit', {
          _store_id: profile.store_id,
          _benefit_key: benefitKey
        });

      if (error) {
        console.error('Erro ao obter limite:', error);
        return null;
      }

      return limit;
    } catch (error) {
      console.error('Erro inesperado ao obter limite:', error);
      return null;
    }
  }, [profile?.store_id]);

  const getBenefitInfo = useCallback((benefitKey: string) => {
    const benefit = benefits.find(b => b.benefit?.benefit_key === benefitKey);
    if (!benefit?.benefit) return null;

    return {
      name: benefit.benefit.name,
      description: benefit.benefit.description,
      category: benefit.benefit.category,
      limit: benefit.limit_value,
      hasAccess: hasBenefit(benefitKey)
    };
  }, [benefits, hasBenefit]);

  useEffect(() => {
    fetchUserBenefits();
  }, [fetchUserBenefits]);

  return {
    loading,
    benefits,
    hasBenefit,
    getBenefitLimit,
    validateBenefitAccess,
    getBenefitLimitFromDB,
    getBenefitInfo,
    refetch: fetchUserBenefits
  };
};
