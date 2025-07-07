
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProductPriceTier {
  id: string;
  product_id: string;
  tier_name: string;
  tier_type: string;
  min_quantity: number;
  price: number;
  tier_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useProductPriceTiers = (productId?: string) => {
  const [tiers, setTiers] = useState<ProductPriceTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTiers = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('product_price_tiers')
        .select('*')
        .eq('product_id', productId)
        .order('tier_order');

      if (error) throw error;
      setTiers(data || []);
    } catch (err: any) {
      console.error('Error fetching price tiers:', err);
      setError(err.message);
      toast({
        title: "Erro",
        description: "Falha ao carregar níveis de preço",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  const createTier = useCallback(async (newTier: Omit<ProductPriceTier, 'id' | 'created_at' | 'updated_at'>) => {
    if (!productId) return;

    try {
      const { data, error } = await supabase
        .from('product_price_tiers')
        .insert({
          ...newTier,
          product_id: productId
        })
        .select()
        .single();

      if (error) throw error;

      setTiers(prev => [...prev, data].sort((a, b) => a.tier_order - b.tier_order));
      
      toast({
        title: "Sucesso",
        description: "Nível de preço criado com sucesso",
      });

      return data;
    } catch (err: any) {
      console.error('Error creating tier:', err);
      toast({
        title: "Erro",
        description: "Falha ao criar nível de preço",
        variant: "destructive",
      });
      throw err;
    }
  }, [productId, toast]);

  const updateTier = useCallback(async (tierId: string, updates: Partial<ProductPriceTier>) => {
    try {
      const { data, error } = await supabase
        .from('product_price_tiers')
        .update(updates)
        .eq('id', tierId)
        .select()
        .single();

      if (error) throw error;

      setTiers(prev => prev.map(tier => 
        tier.id === tierId ? { ...tier, ...data } : tier
      ).sort((a, b) => a.tier_order - b.tier_order));

      toast({
        title: "Sucesso",
        description: "Nível de preço atualizado com sucesso",
      });

      return data;
    } catch (err: any) {
      console.error('Error updating tier:', err);
      toast({
        title: "Erro",
        description: "Falha ao atualizar nível de preço",
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const deleteTier = useCallback(async (tierId: string) => {
    try {
      const { error } = await supabase
        .from('product_price_tiers')
        .delete()
        .eq('id', tierId);

      if (error) throw error;

      setTiers(prev => prev.filter(tier => tier.id !== tierId));

      toast({
        title: "Sucesso",
        description: "Nível de preço removido com sucesso",
      });
    } catch (err: any) {
      console.error('Error deleting tier:', err);
      toast({
        title: "Erro",
        description: "Falha ao remover nível de preço",
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  return {
    tiers,
    loading,
    error,
    fetchTiers,
    createTier,
    updateTier,
    deleteTier,
  };
};
