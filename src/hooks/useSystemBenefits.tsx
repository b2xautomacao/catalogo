
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

export interface UpdateSystemBenefitData {
  name?: string;
  description?: string;
  category?: string;
  is_active?: boolean;
}

export const useSystemBenefits = () => {
  const [benefits, setBenefits] = useState<SystemBenefit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBenefits = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_benefits')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setBenefits(data || []);
    } catch (error) {
      console.error('Erro ao buscar benefícios:', error);
      toast.error('Erro ao carregar benefícios do sistema');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBenefit = useCallback(async (data: CreateSystemBenefitData) => {
    try {
      const { data: newBenefit, error } = await supabase
        .from('system_benefits')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      setBenefits(prev => [...prev, newBenefit]);
      toast.success('Benefício criado com sucesso');
      return { data: newBenefit, error: null };
    } catch (error) {
      console.error('Erro ao criar benefício:', error);
      toast.error('Erro ao criar benefício');
      return { data: null, error };
    }
  }, []);

  const updateBenefit = useCallback(async (id: string, data: UpdateSystemBenefitData) => {
    try {
      const { data: updatedBenefit, error } = await supabase
        .from('system_benefits')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBenefits(prev => prev.map(b => b.id === id ? updatedBenefit : b));
      toast.success('Benefício atualizado com sucesso');
      return { data: updatedBenefit, error: null };
    } catch (error) {
      console.error('Erro ao atualizar benefício:', error);
      toast.error('Erro ao atualizar benefício');
      return { data: null, error };
    }
  }, []);

  const deleteBenefit = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('system_benefits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBenefits(prev => prev.filter(b => b.id !== id));
      toast.success('Benefício removido com sucesso');
      return { error: null };
    } catch (error) {
      console.error('Erro ao remover benefício:', error);
      toast.error('Erro ao remover benefício');
      return { error };
    }
  }, []);

  const getBenefitsByCategory = useCallback(() => {
    return benefits.reduce((acc, benefit) => {
      if (!acc[benefit.category]) {
        acc[benefit.category] = [];
      }
      acc[benefit.category].push(benefit);
      return acc;
    }, {} as Record<string, SystemBenefit[]>);
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
    refetch: fetchBenefits
  };
};
