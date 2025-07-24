import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type PriceModelType = 'retail_only' | 'wholesale_only' | 'simple_wholesale' | 'gradual_wholesale';

export interface StorePriceModel {
  id: string;
  store_id: string;
  price_model: PriceModelType;
  tier_1_enabled: boolean;
  tier_1_name: string;
  tier_2_enabled: boolean;
  tier_2_name: string;
  tier_3_enabled: boolean;
  tier_3_name: string;
  tier_4_enabled: boolean;
  tier_4_name: string;
  simple_wholesale_enabled: boolean;
  simple_wholesale_name: string;
  simple_wholesale_min_qty: number;
  gradual_wholesale_enabled: boolean;
  gradual_tiers_count: number;
  show_price_tiers: boolean;
  show_savings_indicators: boolean;
  show_next_tier_hint: boolean;
  created_at: string;
  updated_at: string;
}

export const useStorePriceModel = (storeId?: string) => {
  const [priceModel, setPriceModel] = useState<StorePriceModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPriceModel = async () => {
    if (!storeId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('store_price_models')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPriceModel({
          ...data,
          price_model: data.price_model as PriceModelType
        });
      }
    } catch (err: any) {
      console.error('Error fetching price model:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePriceModel = async (updates: Partial<StorePriceModel>) => {
    if (!storeId) return;

    try {
      const { data, error } = await supabase
        .from('store_price_models')
        .upsert({ 
          store_id: storeId, 
          ...updates 
        })
        .select()
        .single();

      if (error) throw error;

      setPriceModel({
        ...data,
        price_model: data.price_model as PriceModelType
      });
      toast({
        title: 'Modelo de preço atualizado',
        description: 'As configurações foram salvas com sucesso.',
      });
    } catch (error: any) {
      console.error('Error updating price model:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const createDefaultPriceModel = async () => {
    if (!storeId) return;

    const defaultModel = {
      store_id: storeId,
      price_model: 'retail_only' as PriceModelType,
      tier_1_enabled: true,
      tier_1_name: 'Varejo',
      tier_2_enabled: false,
      tier_2_name: 'Atacarejo',
      tier_3_enabled: false,
      tier_3_name: 'Atacado Pequeno',
      tier_4_enabled: false,
      tier_4_name: 'Atacado Grande',
      simple_wholesale_enabled: false,
      simple_wholesale_name: 'Atacado',
      simple_wholesale_min_qty: 10,
      gradual_wholesale_enabled: false,
      gradual_tiers_count: 2,
      show_price_tiers: true,
      show_savings_indicators: true,
      show_next_tier_hint: true
    };

    await updatePriceModel(defaultModel);
  };

  const isModelActive = (modelType: string) => {
    if (!priceModel) return false;
    
    switch (modelType) {
      case 'retail_only':
        return priceModel.price_model === 'retail_only';
      case 'wholesale_only':
        return priceModel.price_model === 'wholesale_only';
      case 'simple_wholesale':
        return priceModel.simple_wholesale_enabled;
      case 'gradual_wholesale':
        return priceModel.gradual_wholesale_enabled;
      default:
        return false;
    }
  };

  const changePriceModel = async (newModel: PriceModelType) => {
    await updatePriceModel({ price_model: newModel });
  };

  const getSettings = () => {
    return priceModel;
  };

  useEffect(() => {
    fetchPriceModel();
  }, [storeId]);

  return {
    priceModel: priceModel || {
      id: '',
      store_id: storeId || '',
      price_model: 'retail_only' as PriceModelType,
      tier_1_enabled: true,
      tier_1_name: 'Varejo',
      tier_2_enabled: false,
      tier_2_name: 'Atacarejo',
      tier_3_enabled: false,
      tier_3_name: 'Atacado Pequeno',
      tier_4_enabled: false,
      tier_4_name: 'Atacado Grande',
      simple_wholesale_enabled: false,
      simple_wholesale_name: 'Atacado',
      simple_wholesale_min_qty: 10,
      gradual_wholesale_enabled: false,
      gradual_tiers_count: 2,
      show_price_tiers: true,
      show_savings_indicators: true,
      show_next_tier_hint: true,
      created_at: '',
      updated_at: ''
    },
    loading,
    error,
    updatePriceModel,
    createDefaultPriceModel,
    refetch: fetchPriceModel,
    isModelActive,
    changePriceModel,
    getSettings
  };
};
