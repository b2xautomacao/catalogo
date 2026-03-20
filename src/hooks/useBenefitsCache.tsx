
import { useCallback, useRef, useMemo } from 'react';
import { SystemBenefit } from '@/hooks/useSystemBenefits';
import { PlanBenefit } from '@/hooks/usePlanBenefits';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface BenefitsCache {
  systemBenefits: CacheEntry<SystemBenefit[]> | null;
  planBenefits: Record<string, CacheEntry<PlanBenefit[]>>;
  benefitValidation: Record<string, CacheEntry<boolean>>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const VALIDATION_CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

// 🔥 CACHE GLOBAL Compartilhado entre todas as instâncias do hook
let globalCache: BenefitsCache = {
  systemBenefits: null,
  planBenefits: {},
  benefitValidation: {}
};

export const useBenefitsCache = () => {

  const isExpired = useCallback((entry: CacheEntry<any>) => {
    return Date.now() > entry.expiresAt;
  }, []);

  const setSystemBenefits = useCallback((benefits: SystemBenefit[]) => {
    const now = Date.now();
    globalCache.systemBenefits = {
      data: benefits,
      timestamp: now,
      expiresAt: now + CACHE_DURATION
    };
    console.log('💾 Cached system benefits:', benefits.length);
  }, []);

  const getSystemBenefits = useCallback((): SystemBenefit[] | null => {
    const cached = globalCache.systemBenefits;
    if (!cached || isExpired(cached)) {
      console.log('💾 System benefits cache miss or expired');
      return null;
    }
    console.log('💾 System benefits cache hit');
    return cached.data;
  }, [isExpired]);

  const setPlanBenefits = useCallback((planId: string, benefits: PlanBenefit[]) => {
    const now = Date.now();
    globalCache.planBenefits[planId] = {
      data: benefits,
      timestamp: now,
      expiresAt: now + CACHE_DURATION
    };
    console.log(`💾 Cached plan benefits for ${planId}:`, benefits.length);
  }, []);

  const getPlanBenefits = useCallback((planId: string): PlanBenefit[] | null => {
    const cached = globalCache.planBenefits[planId];
    if (!cached || isExpired(cached)) {
      console.log(`💾 Plan benefits cache miss or expired for ${planId}`);
      return null;
    }
    console.log(`💾 Plan benefits cache hit for ${planId}`);
    return cached.data;
  }, [isExpired]);

  const setBenefitValidation = useCallback((key: string, isValid: boolean) => {
    const now = Date.now();
    globalCache.benefitValidation[key] = {
      data: isValid,
      timestamp: now,
      expiresAt: now + VALIDATION_CACHE_DURATION
    };
  }, []);

  const getBenefitValidation = useCallback((key: string): boolean | null => {
    const cached = globalCache.benefitValidation[key];
    if (!cached || isExpired(cached)) {
      return null;
    }
    return cached.data;
  }, [isExpired]);

  const invalidateAll = useCallback(() => {
    console.log('💾 Invalidating all benefits cache');
    globalCache = {
      systemBenefits: null,
      planBenefits: {},
      benefitValidation: {}
    };
  }, []);

  const invalidatePlan = useCallback((planId: string) => {
    console.log(`💾 Invalidating cache for plan ${planId}`);
    delete globalCache.planBenefits[planId];
  }, []);

  const getCacheStats = useCallback(() => {
    const now = Date.now();
    return {
      systemBenefits: {
        cached: !!globalCache.systemBenefits,
        expired: globalCache.systemBenefits ? isExpired(globalCache.systemBenefits) : true,
        age: globalCache.systemBenefits ? now - globalCache.systemBenefits.timestamp : 0
      },
      planBenefits: Object.keys(globalCache.planBenefits).length,
      validationCache: Object.keys(globalCache.benefitValidation).length
    };
  }, [isExpired]);

  return useMemo(() => ({
    setSystemBenefits,
    getSystemBenefits,
    setPlanBenefits,
    getPlanBenefits,
    setBenefitValidation,
    getBenefitValidation,
    invalidateAll,
    invalidatePlan,
    getCacheStats
  }), [
    setSystemBenefits,
    getSystemBenefits,
    setPlanBenefits,
    getPlanBenefits,
    setBenefitValidation,
    getBenefitValidation,
    invalidateAll,
    invalidatePlan,
    getCacheStats
  ]);
};
