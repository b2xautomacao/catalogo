
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useLogoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para fazer upload",
        variant: "destructive",
      });
      return null;
    }

    try {
      setUploading(true);

      // Validar arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione apenas arquivos de imagem');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB');
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`;

      console.log('useLogoUpload: Iniciando upload do arquivo:', fileName);

      // Verificar se o bucket existe com retry
      let bucketExists = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!bucketExists && retryCount < maxRetries) {
        try {
          const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
          
          if (bucketsError) {
            console.error('useLogoUpload: Erro ao listar buckets:', bucketsError);
            if (retryCount === maxRetries - 1) throw bucketsError;
          } else {
            const storeLogosBucket = buckets?.find(bucket => bucket.id === 'store-logos');
            if (storeLogosBucket) {
              bucketExists = true;
              console.log('useLogoUpload: Bucket store-logos encontrado');
            } else if (retryCount === maxRetries - 1) {
              throw new Error('Bucket store-logos não encontrado. Entre em contato com o administrador.');
            }
          }
          
          if (!bucketExists) {
            retryCount++;
            console.log(`useLogoUpload: Tentativa ${retryCount}/${maxRetries} - Aguardando bucket...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          if (retryCount === maxRetries - 1) throw error;
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('store-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('useLogoUpload: Erro no upload:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Obter URL pública da imagem
      const { data: urlData } = supabase.storage
        .from('store-logos')
        .getPublicUrl(fileName);

      const logoUrl = urlData.publicUrl;
      console.log('useLogoUpload: Upload concluído, URL:', logoUrl);

      toast({
        title: "Upload concluído",
        description: "Logo da loja atualizado com sucesso",
      });

      return logoUrl;
    } catch (error) {
      console.error('useLogoUpload: Erro geral:', error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido no upload",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteLogo = async (logoUrl: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Extrair caminho do arquivo da URL
      const urlParts = logoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${fileName}`;

      console.log('useLogoUpload: Deletando arquivo:', filePath);

      const { error } = await supabase.storage
        .from('store-logos')
        .remove([filePath]);

      if (error) {
        console.error('useLogoUpload: Erro ao deletar:', error);
        throw error;
      }

      toast({
        title: "Logo removido",
        description: "Logo da loja foi removido com sucesso",
      });

      return true;
    } catch (error) {
      console.error('useLogoUpload: Erro ao deletar logo:', error);
      toast({
        title: "Erro ao remover logo",
        description: "Não foi possível remover o logo da loja",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    uploadLogo,
    deleteLogo,
    uploading
  };
};
