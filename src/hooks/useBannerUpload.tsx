
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useBannerUpload = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadBannerImage = async (file: File): Promise<string | null> => {
    if (!profile?.store_id) {
      toast({
        title: 'Erro',
        description: 'Store ID não encontrado',
        variant: 'destructive',
      });
      return null;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione apenas imagens',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setUploading(true);
      
      // Upload para o bucket banners
      const fileName = `${profile.store_id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('banners')
        .upload(fileName, file);

      if (error) throw error;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('banners')
        .getPublicUrl(data.path);

      return urlData.publicUrl;

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível carregar a imagem',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadBannerImage,
    uploading
  };
};
