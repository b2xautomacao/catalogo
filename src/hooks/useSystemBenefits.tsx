
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBenefitsCache } from '@/hooks/useBenefitsCache';
import { useRealtimeBenefits } from '@/hooks/useRealtimeBenefits';

export interface SystemBenefit {
  id: string;
  name: string;
  description: string | null;
  benefit_key: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSystemBenefitData {
  name: string;
  description?: string;
  benefit_key: string;
  category: string;
  is_active?: boolean;
}

export interface UpdateSystemBenefitData {
  name?: string;
  description?: string;
  benefit_key?: string;
  category?: string;
  is_active?: boolean;
}

export const useSystemBenefits = () => {
  const [benefits, setBenefits] = useState<SystemBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const { 
    getSystemBenefits, 
    setSystemBenefits,
    invalidateAll 
  } = useBenefitsCache();

  const fetchBenefits = useCallback(async (useCache = true) => {
    console.log('🔄 Fetching system benefits...');
    
    // Tentar usar cache primeiro
    if (useCache) {
      const cachedBenefits = getSystemBenefits();
      if (cachedBenefits) {
        setBenefits(cachedBenefits);
        setLoading(false);
        return;
      }
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('system_benefits')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching system benefits:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} system benefits`);
      
      const benefitsData = data || [];
      setBenefits(benefitsData);
      
      // Atualizar cache
      setSystemBenefits(benefitsData);
      
    } catch (error) {
      console.error('💥 Error in fetchBenefits:', error);
      toast.error('Erro ao carregar benefícios do sistema');
    } finally {
      setLoading(false);
    }
  }, [getSystemBenefits, setSystemBenefits]);

  // Setup realtime updates
  useRealtimeBenefits(
    useCallback(() => {
      console.log('🔄 Realtime trigger: refreshing system benefits');
      invalidateAll();
      fetchBenefits(false); // Force fresh fetch
    }, [fetchBenefits, invalidateAll])
  );

  const createBenefit = useCallback(async (data: CreateSystemBenefitData) => {
    console.log('➕ Creating system benefit:', data);
    
    try {
      const { data: newBenefit, error } = await supabase
        .from('system_benefits')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating system benefit:', error);
        throw error;
      }

      console.log('✅ System benefit created successfully:', newBenefit);
      
      // Invalidar cache e recarregar
      invalidateAll();
      await fetchBenefits(false);
      
      return { data: newBenefit, error: null };
    } catch (error) {
      console.error('💥 Error in createBenefit:', error);
      return { data: null, error };
    }
  }, [fetchBenefits, invalidateAll]);

  const updateBenefit = useCallback(async (id: string, data: UpdateSystemBenefitData) => {
    console.log(`🔄 Updating system benefit ${id}:`, data);
    
    try {
      const { data: updatedBenefit, error } = await supabase
        .from('system_benefits')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating system benefit:', error);
        throw error;
      }

      console.log('✅ System benefit updated successfully:', updatedBenefit);
      
      // Invalidar cache e recarregar
      invalidateAll();
      await fetchBenefits(false);
      
      return { data: updatedBenefit, error: null };
    } catch (error) {
      console.error('💥 Error in updateBenefit:', error);
      return { data: null, error };
    }
  }, [fetchBenefits, invalidateAll]);

  const deleteBenefit = useCallback(async (id: string) => {
    console.log(`🗑️ Deleting system benefit: ${id}`);
    
    try {
      const { error } = await supabase
        .from('system_benefits')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting system benefit:', error);
        throw error;
      }

      console.log('✅ System benefit deleted successfully');
      
      // Invalidar cache e recarregar
      invalidateAll();
      await fetchBenefits(false);
      
      return { error: null };
    } catch (error) {
      console.error('💥 Error in deleteBenefit:', error);
      return { error };
    }
  }, [fetchBenefits, invalidateAll]);

  const getBenefitsByCategory = useCallback(() => {
    const categorizedBenefits: Record<string, SystemBenefit[]> = {};
    
    benefits.forEach(benefit => {
      if (!categorizedBenefits[benefit.category]) {
        categorizedBenefits[benefit.category] = [];
      }
      categorizedBenefits[benefit.category].push(benefit);
    });
    
    return categorizedBenefits;
  }, [benefits]);

  useEffect(() => {
    fetchBenefits();
  }, [fetchBenefits]);

  return {
    benefits,
    loading,
    createBenefit,
    updateBenefit,
    deleteBenefit,
    getBenefitsByCategory,
    refetch: useCallback(() => fetchBenefits(false), [fetchBenefits])
  };
};
