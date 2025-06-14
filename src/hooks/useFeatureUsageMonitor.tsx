
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

export interface FeatureUsageData {
  featureType: string;
  currentUsage: number;
  limit: number;
  percentage: number;
  canUse: boolean;
}

export const useFeatureUsageMonitor = () => {
  const [usageData, setUsageData] = useState<Record<string, FeatureUsageData>>({});
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { subscription, getFeatureLimit, hasFeature } = useSubscription();

  const fetchUsageData = useCallback(async () => {
    if (!profile?.store_id || !subscription) return;

    try {
      // Buscar uso atual de features
      const { data: usage, error } = await supabase
        .from('feature_usage')
        .select('*')
        .eq('store_id', profile.store_id);

      if (error) throw error;

      const usageMap: Record<string, FeatureUsageData> = {};

      // Features principais para monitorar
      const featuresToMonitor = [
        'max_images_per_product',
        'max_team_members',
        'ai_agent',
        'payment_credit_card',
        'whatsapp_integration'
      ];

      featuresToMonitor.forEach(featureType => {
        const currentUsage = usage?.find(u => u.feature_type === featureType)?.current_usage || 0;
        const limit = getFeatureLimit(featureType);
        const canUse = hasFeature(featureType) && (limit === 0 || currentUsage < limit);
        const percentage = limit > 0 ? (currentUsage / limit) * 100 : 0;

        usageMap[featureType] = {
          featureType,
          currentUsage,
          limit,
          percentage: Math.min(percentage, 100),
          canUse
        };
      });

      setUsageData(usageMap);
    } catch (error) {
      console.error('Erro ao buscar dados de uso:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.store_id, subscription, getFeatureLimit, hasFeature]);

  const incrementUsage = async (featureType: string, increment: number = 1) => {
    if (!profile?.store_id) return { success: false, error: 'Store ID não encontrado' };

    const currentData = usageData[featureType];
    if (!currentData?.canUse) {
      toast.error('Limite da funcionalidade atingido. Faça upgrade para aumentar o limite!');
      return { success: false, error: 'Limite atingido' };
    }

    try {
      const { error } = await supabase
        .from('feature_usage')
        .upsert({
          store_id: profile.store_id,
          feature_type: featureType as any,
          current_usage: currentData.currentUsage + increment,
          period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString()
        }, {
          onConflict: 'store_id,feature_type'
        });

      if (error) throw error;

      // Atualizar dados locais
      await fetchUsageData();
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao incrementar uso:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  const checkFeatureUsage = (featureType: string): boolean => {
    const data = usageData[featureType];
    if (!data) return false;

    if (!data.canUse) {
      const percentage = Math.round(data.percentage);
      toast.error(`Limite atingido (${data.currentUsage}/${data.limit} - ${percentage}%). Faça upgrade!`);
      return false;
    }

    // Avisar quando próximo do limite
    if (data.percentage >= 80 && data.limit > 0) {
      toast.warning(`Atenção: ${Math.round(data.percentage)}% do limite usado para esta funcionalidade.`);
    }

    return true;
  };

  const getUsageInfo = (featureType: string) => {
    return usageData[featureType] || {
      featureType,
      currentUsage: 0,
      limit: 0,
      percentage: 0,
      canUse: false
    };
  };

  useEffect(() => {
    fetchUsageData();
    
    // Atualizar a cada minuto
    const interval = setInterval(fetchUsageData, 60000);
    
    return () => clearInterval(interval);
  }, [fetchUsageData]);

  return {
    usageData,
    loading,
    incrementUsage,
    checkFeatureUsage,
    getUsageInfo,
    refetch: fetchUsageData
  };
};
