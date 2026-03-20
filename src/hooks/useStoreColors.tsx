import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_STORE_COLORS } from '@/lib/colors';

export interface StoreColor {
    id: string;
    store_id: string;
    name: string;
    hex_color: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateStoreColorData {
    store_id: string;
    name: string;
    hex_color: string;
    is_active?: boolean;
}

export const useStoreColors = (storeId?: string) => {
    const [colors, setColors] = useState<StoreColor[]>([]);
    const [loading, setLoading] = useState(true);
    const { profile } = useAuth();

    const fetchColors = useCallback(async () => {
        try {
            setLoading(true);
            const targetStoreId = storeId || profile?.store_id;

            if (!targetStoreId) {
                setColors([]);
                return;
            }

            const { data, error } = await supabase
                .from('store_colors')
                .select('*')
                .eq('store_id', targetStoreId)
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (error) throw error;
            setColors(data || []);
        } catch (error) {
            console.error('Erro ao buscar cores:', error);
            setColors([]);
        } finally {
            setLoading(false);
        }
    }, [storeId, profile?.store_id]);

    const createColor = async (colorData: CreateStoreColorData) => {
        try {
            const { data, error } = await supabase
                .from('store_colors')
                .insert([colorData])
                .select()
                .single();

            if (error) throw error;
            await fetchColors();
            return { data, error: null };
        } catch (error) {
            console.error('Erro ao criar cor:', error);
            return { data: null, error };
        }
    };

    const updateColor = async (id: string, updates: Partial<StoreColor>) => {
        try {
            const { data, error } = await supabase
                .from('store_colors')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            await fetchColors();
            return { data, error: null };
        } catch (error) {
            console.error('Erro ao atualizar cor:', error);
            return { data: null, error };
        }
    };

    const deleteColor = async (id: string) => {
        try {
            const { error } = await supabase
                .from('store_colors')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchColors();
            return { error: null };
        } catch (error) {
            console.error('Erro ao deletar cor:', error);
            return { error };
        }
    };

    /**
     * Sincroniza as cores padrão com a loja, adicionando as que faltam.
     */
    const syncDefaultColors = async (defaultColors: { name: string, hex: string }[] = DEFAULT_STORE_COLORS) => {
        try {
            const targetStoreId = storeId || profile?.store_id;
            if (!targetStoreId) return { error: 'Store ID não encontrado' };

            // Filtrar cores que já existem (por nome insensível a maiúsculas)
            const existingNames = colors.map(c => c.name.toLowerCase());
            const missingColors = defaultColors.filter(
                dc => !existingNames.includes(dc.name.toLowerCase())
            );

            if (missingColors.length === 0) return { success: true, count: 0 };

            const insertData = missingColors.map(dc => ({
                store_id: targetStoreId,
                name: dc.name,
                hex_color: dc.hex,
                is_active: true
            }));

            const { error } = await supabase
                .from('store_colors')
                .insert(insertData);

            if (error) throw error;
            
            await fetchColors();
            return { success: true, count: missingColors.length };
        } catch (error) {
            console.error('Erro ao sincronizar cores padrão:', error);
            return { error };
        }
    };

    useEffect(() => {
        if (profile?.store_id || storeId) {
            fetchColors();
        }
    }, [profile?.store_id, storeId, fetchColors]);

    return {
        colors,
        loading,
        fetchColors,
        createColor,
        updateColor,
        deleteColor,
        syncDefaultColors,
    };
};
