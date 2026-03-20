import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

export interface FeatureUsageData {
  featureType: string;
  currentUsage: number;
  limit: number;
  percentage: number;
  canUse: boolean;
}

// Cache global para evitar chamadas duplicadas entre diferentes instâncias do hook
let globalUsageCache: Record<string, FeatureUsageData> | null = null;
let lastUsageFetchTime = 0;
const USAGE_CACHE_DURATION = 30000; // 30 segundos

export const useFeatureUsageMonitor = () => {
  const [usageData, setUsageData] = useState<Record<string, FeatureUsageData>>(globalUsageCache || {});
  const [loading, setLoading] = useState(!globalUsageCache);
  const { profile } = useAuth();
  const { subscription, getFeatureLimit, hasFeature } = useSubscription();

  const fetchUsageData = useCallback(async (force = false) => {
    if (!profile?.store_id || !subscription) return;

    // Verificar se o cache ainda é válido (30 segundos)
    const now = Date.now();
    if (!force && globalUsageCache && (now - lastUsageFetchTime < USAGE_CACHE_DURATION)) {
      console.log("🛡️ MONITOR - Usando cache GLOBAL de uso de features");
      setUsageData(globalUsageCache);
      setLoading(false);
      return;
    }

    try {
      console.log("🔍 MONITOR - Buscando dados de uso:", profile.store_id);
      const { data: usage, error } = await supabase
        .from("feature_usage")
        .select("*")
        .eq("store_id", profile.store_id);

      if (error) throw error;

      const usageMap: Record<string, FeatureUsageData> = {};
      const featuresToMonitor = [
        "max_images_per_product",
        "max_team_members",
        "ai_agent",
        "payment_credit_card",
        "whatsapp_integration",
      ];

      featuresToMonitor.forEach((featureType) => {
        const currentUsage = usage?.find((u) => u.feature_type === featureType)?.current_usage || 0;
        const limit = getFeatureLimit(featureType);
        const canUse = hasFeature(featureType) && (limit === 0 || currentUsage < limit);
        const percentage = limit > 0 ? (currentUsage / limit) * 100 : 0;

        usageMap[featureType] = {
          featureType,
          currentUsage,
          limit,
          percentage: Math.min(percentage, 100),
          canUse,
        };
      });

      globalUsageCache = usageMap;
      lastUsageFetchTime = now;
      setUsageData(usageMap);
    } catch (error) {
      console.error("Erro ao buscar dados de uso:", error);
    } finally {
      setLoading(false);
    }
  }, [profile?.store_id, subscription, getFeatureLimit, hasFeature]);

  const incrementUsage = useCallback(async (featureType: string, increment: number = 1) => {
    if (featureType === "max_images_per_product") return { success: true };
    if (!profile?.store_id) return { success: false, error: "Store ID não encontrado" };

    const currentData = usageData[featureType];
    if (!currentData?.canUse) {
      toast.error("Limite da funcionalidade atingido. Faça upgrade para aumentar o limite!");
      return { success: false, error: "Limite atingido" };
    }

    try {
      const { error } = await supabase.from("feature_usage").upsert(
        {
          store_id: profile.store_id,
          feature_type: featureType as any,
          current_usage: currentData.currentUsage + increment,
          period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
        },
        { onConflict: "store_id,feature_type" }
      );

      if (error) throw error;
      await fetchUsageData(true);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro desconhecido" };
    }
  }, [profile?.store_id, usageData, fetchUsageData]);

  const checkFeatureUsage = useCallback((featureType: string): boolean => {
    if (featureType === "max_images_per_product") return true;
    const data = usageData[featureType];
    if (!data) return false;

    if (!data.canUse) {
      toast.error(`Limite atingido (${data.currentUsage}/${data.limit}). Faça upgrade!`);
      return false;
    }
    return true;
  }, [usageData]);

  const getUsageInfo = useCallback((featureType: string) => {
    return usageData[featureType] || {
      featureType,
      currentUsage: 0,
      limit: 0,
      percentage: 0,
      canUse: false,
    };
  }, [usageData]);

  useEffect(() => {
    fetchUsageData();
    const interval = setInterval(fetchUsageData, 60000);
    return () => clearInterval(interval);
  }, [fetchUsageData]);

  return useMemo(() => ({
    usageData,
    loading,
    incrementUsage,
    checkFeatureUsage,
    getUsageInfo,
    refetch: fetchUsageData,
  }), [usageData, loading, incrementUsage, checkFeatureUsage, getUsageInfo, fetchUsageData]);
};
