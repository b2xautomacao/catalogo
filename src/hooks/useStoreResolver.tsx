
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useStoreResolver = () => {
  const [loading, setLoading] = useState(false);

  const resolveStoreId = useCallback(async (identifier: string): Promise<string | null> => {
    try {
      setLoading(true);
      
      // Verificar se é UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(identifier)) {
        // É UUID, buscar diretamente
        const { data, error } = await supabase
          .from('stores')
          .select('id')
          .eq('id', identifier)
          .eq('is_active', true)
          .maybeSingle();
        
        if (error) throw error;
        return data?.id || null;
      } else {
        // É slug, buscar por url_slug
        const { data, error } = await supabase
          .from('stores')
          .select('id')
          .eq('url_slug', identifier)
          .eq('is_active', true)
          .maybeSingle();

        if (error) throw error;
        return data?.id || null;
      }
    } catch (error) {
      console.error('useStoreResolver: Erro ao resolver ID da loja:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    resolveStoreId,
    loading
  };
};
