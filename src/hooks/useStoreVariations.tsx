
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VariationGroup {
  id: string;
  store_id: string;
  name: string;
  attribute_key: string;
  display_order: number;
  description?: string;
}

export interface VariationValue {
  id: string;
  group_id: string;
  value: string;
  hex_color?: string;
  display_order: number;
}

// Alias para compatibilidade
export interface StoreVariationGroup extends VariationGroup {}

interface CreateValueData {
  store_id: string;
  group_id: string;
  master_value_id: string;
  value: string;
  hex_color?: string | null;
  is_active: boolean;
  display_order: number;
}

export const useStoreVariations = (storeId?: string) => {
  const [groups, setGroups] = useState<VariationGroup[]>([]);
  const [values, setValues] = useState<VariationValue[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadStoreVariations = useCallback(async (targetStoreId?: string) => {
    try {
      let resolvedStoreId = targetStoreId;
      
      if (!resolvedStoreId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('store_id')
          .eq('id', user.id)
          .single();

        if (!profile?.store_id) return;
        resolvedStoreId = profile.store_id;
      }

      const { data: groupsData, error: groupsError } = await supabase
        .from('store_variation_groups')
        .select('*')
        .eq('store_id', resolvedStoreId)
        .order('display_order');

      if (groupsError) throw groupsError;

      const { data: valuesData, error: valuesError } = await supabase
        .from('store_variation_values')
        .select('*')
        .eq('store_id', resolvedStoreId)
        .order('display_order');

      if (valuesError) throw valuesError;

      setGroups(groupsData || []);
      setValues(valuesData || []);
    } catch (error) {
      console.error('Erro ao carregar variações da loja:', error);
      setGroups([
        { id: 'color', store_id: '', name: 'Cor', attribute_key: 'color', display_order: 1, description: 'Cores disponíveis' },
        { id: 'size', store_id: '', name: 'Tamanho', attribute_key: 'size', display_order: 2, description: 'Tamanhos disponíveis' },
        { id: 'material', store_id: '', name: 'Material', attribute_key: 'material', display_order: 3, description: 'Materiais disponíveis' },
        { id: 'style', store_id: '', name: 'Estilo', attribute_key: 'style', display_order: 4, description: 'Estilos disponíveis' },
      ]);
      setValues([
        { id: 'color-1', group_id: 'color', value: 'Preto', hex_color: '#000000', display_order: 1 },
        { id: 'color-2', group_id: 'color', value: 'Branco', hex_color: '#FFFFFF', display_order: 2 },
        { id: 'color-3', group_id: 'color', value: 'Vermelho', hex_color: '#FF0000', display_order: 3 },
        { id: 'color-4', group_id: 'color', value: 'Azul', hex_color: '#0000FF', display_order: 4 },
        { id: 'size-1', group_id: 'size', value: 'PP', display_order: 1 },
        { id: 'size-2', group_id: 'size', value: 'P', display_order: 2 },
        { id: 'size-3', group_id: 'size', value: 'M', display_order: 3 },
        { id: 'size-4', group_id: 'size', value: 'G', display_order: 4 },
        { id: 'size-5', group_id: 'size', value: 'GG', display_order: 5 },
        { id: 'material-1', group_id: 'material', value: 'Algodão', display_order: 1 },
        { id: 'material-2', group_id: 'material', value: 'Poliéster', display_order: 2 },
        { id: 'material-3', group_id: 'material', value: 'Couro', display_order: 3 },
        { id: 'style-1', group_id: 'style', value: 'Casual', display_order: 1 },
        { id: 'style-2', group_id: 'style', value: 'Formal', display_order: 2 },
        { id: 'style-3', group_id: 'style', value: 'Esportivo', display_order: 3 },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoreVariations(storeId);
  }, [loadStoreVariations, storeId]);

  const createValue = useCallback(async (valueData: CreateValueData) => {
    try {
      const { data, error } = await supabase
        .from('store_variation_values')
        .insert({
          store_id: valueData.store_id,
          group_id: valueData.group_id,
          value: valueData.value,
          hex_color: valueData.hex_color,
          display_order: valueData.display_order,
          is_active: valueData.is_active
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar estado local
      setValues(prev => [...prev, {
        id: data.id,
        group_id: data.group_id,
        value: data.value,
        hex_color: data.hex_color,
        display_order: data.display_order
      }]);

      return data;
    } catch (error) {
      console.error('Erro ao criar valor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o valor de variação",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const refetch = useCallback(() => {
    loadStoreVariations(storeId);
  }, [loadStoreVariations, storeId]);

  return { 
    groups, 
    values, 
    loading, 
    createValue,
    refetch
  };
};
