
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProductVariation {
  id?: string;
  product_id: string;
  color: string | null;
  size: string | null;
  sku: string | null;
  stock: number;
  price_adjustment: number;
  is_active: boolean;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export const useProductVariations = (productId?: string) => {
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchVariations = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🎨 VARIAÇÕES - Carregando para produto:', id);

      const { data, error: fetchError } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('❌ Erro ao buscar variações:', fetchError);
        setError(fetchError.message);
        setVariations([]);
        return;
      }

      console.log('✅ VARIAÇÕES - Carregadas com sucesso:', data?.length || 0);
      setVariations(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('🚨 Erro inesperado ao carregar variações:', err);
      setError(errorMessage);
      setVariations([]);
    } finally {
      setLoading(false);
    }
  };

  const saveVariations = async (productId: string, variations: Omit<ProductVariation, 'id' | 'product_id' | 'created_at' | 'updated_at'>[]) => {
    try {
      console.log('💾 VARIAÇÕES - Salvando variações:', variations.length);

      // 1. Remover variações existentes
      const { error: deleteError } = await supabase
        .from('product_variations')
        .delete()
        .eq('product_id', productId);

      if (deleteError) {
        console.error('❌ Erro ao remover variações antigas:', deleteError);
        throw deleteError;
      }

      // 2. Inserir novas variações se houver
      if (variations.length > 0) {
        const variationsToInsert = variations.map(variation => ({
          product_id: productId,
          color: variation.color,
          size: variation.size,
          sku: variation.sku,
          stock: variation.stock,
          price_adjustment: variation.price_adjustment,
          is_active: variation.is_active,
          image_url: variation.image_url
        }));

        const { data, error: insertError } = await supabase
          .from('product_variations')
          .insert(variationsToInsert)
          .select();

        if (insertError) {
          console.error('❌ Erro ao inserir variações:', insertError);
          throw insertError;
        }

        console.log('✅ VARIAÇÕES - Salvas com sucesso:', data?.length || 0);
        setVariations(data || []);
      } else {
        setVariations([]);
      }

      toast({
        title: 'Variações salvas!',
        description: `${variations.length} variação(ões) salva(s) com sucesso.`
      });

      return { success: true, error: null };
    } catch (error) {
      console.error('💥 VARIAÇÕES - Erro no salvamento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar variações';
      
      toast({
        title: 'Erro ao salvar variações',
        description: errorMessage,
        variant: 'destructive'
      });

      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    if (productId) {
      fetchVariations(productId);
    } else {
      setVariations([]);
      setLoading(false);
      setError(null);
    }
  }, [productId]);

  return {
    variations,
    loading,
    error,
    saveVariations,
    refetch: () => productId && fetchVariations(productId)
  };
};
