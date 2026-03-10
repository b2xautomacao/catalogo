import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface StoreGrade {
    id: string;
    store_id: string;
    name: string;
    sizes: string[];
    default_quantities: number[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateStoreGradeData {
    store_id: string;
    name: string;
    sizes: string[];
    default_quantities: number[];
    is_active?: boolean;
}

export const useStoreGrades = (storeId?: string) => {
    const [grades, setGrades] = useState<StoreGrade[]>([]);
    const [loading, setLoading] = useState(true);
    const { profile } = useAuth();

    const fetchGrades = useCallback(async () => {
        try {
            setLoading(true);
            const targetStoreId = storeId || profile?.store_id;

            if (!targetStoreId) {
                setGrades([]);
                return;
            }

            const { data, error } = await supabase
                .from('store_grades')
                .select('*')
                .eq('store_id', targetStoreId)
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (error) throw error;

            // Parse arrays from Json if needed, although supabase-js usually returns them correctly
            const parsedData = (data || []).map(grade => ({
                ...grade,
                sizes: Array.isArray(grade.sizes) ? grade.sizes : JSON.parse(grade.sizes as string || '[]'),
                default_quantities: Array.isArray(grade.default_quantities) ? grade.default_quantities : JSON.parse(grade.default_quantities as string || '[]')
            }));

            setGrades(parsedData);
        } catch (error) {
            console.error('Erro ao buscar grades:', error);
            setGrades([]);
        } finally {
            setLoading(false);
        }
    }, [storeId, profile?.store_id]);

    const createGrade = async (gradeData: CreateStoreGradeData) => {
        try {
            // supabase-js handles array to jsonb conversion automatically
            const { data, error } = await supabase
                .from('store_grades')
                .insert([gradeData as any]) // Type casting since database types expect Json
                .select()
                .single();

            if (error) throw error;
            await fetchGrades();
            return { data, error: null };
        } catch (error) {
            console.error('Erro ao criar grade:', error);
            return { data: null, error };
        }
    };

    const updateGrade = async (id: string, updates: Partial<CreateStoreGradeData>) => {
        try {
            const { data, error } = await supabase
                .from('store_grades')
                .update(updates as any)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            await fetchGrades();
            return { data, error: null };
        } catch (error) {
            console.error('Erro ao atualizar grade:', error);
            return { data: null, error };
        }
    };

    const deleteGrade = async (id: string) => {
        try {
            const { error } = await supabase
                .from('store_grades')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchGrades();
            return { error: null };
        } catch (error) {
            console.error('Erro ao deletar grade:', error);
            return { error };
        }
    };

    useEffect(() => {
        if (profile?.store_id || storeId) {
            fetchGrades();
        }
    }, [profile?.store_id, storeId, fetchGrades]);

    return {
        grades,
        loading,
        fetchGrades,
        createGrade,
        updateGrade,
        deleteGrade,
    };
};
