
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useStoreResolver = () => {
  const [loading, setLoading] = useState(false);

  const resolveStoreId = useCallback(async (identifier: string): Promise<string | null> => {
    try {
      setLoading(true);
      
      console.log('useStoreResolver: Resolvendo identificador:', identifier);
      
      // Verificar se é UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(identifier)) {
        // É UUID, buscar diretamente
        console.log('useStoreResolver: Identificador é UUID, buscando diretamente');
        const { data, error } = await supabase
          .from('stores')
          .select('id')
          .eq('id', identifier)
          .eq('is_active', true)
          .maybeSingle();
        
        if (error) {
          console.error('useStoreResolver: Erro ao buscar por UUID:', error);
          throw error;
        }
        
        const result = data?.id || null;
        console.log('useStoreResolver: Resultado UUID:', result);
        return result;
      } else {
        // É slug, buscar por url_slug
        console.log('useStoreResolver: Identificador é slug, buscando por url_slug');
        const { data, error } = await supabase
          .from('stores')
          .select('id')
          .eq('url_slug', identifier)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('useStoreResolver: Erro ao buscar por slug:', error);
          throw error;
        }
        
        const result = data?.id || null;
        console.log('useStoreResolver: Resultado slug:', result);
        return result;
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
