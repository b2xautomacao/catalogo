
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useStorageBucket = (bucketName: string) => {
  const [bucketExists, setBucketExists] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBucket = async () => {
      try {
        const { data, error } = await supabase.storage.getBucket(bucketName);
        
        if (error) {
          console.log('📦 STORAGE - Bucket não existe, criando:', bucketName);
          // Tentar criar o bucket
          const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 5 * 1024 * 1024 // 5MB
          });
          
          if (createError) {
            console.error('❌ STORAGE - Erro ao criar bucket:', createError);
            setBucketExists(false);
          } else {
            console.log('✅ STORAGE - Bucket criado:', bucketName);
            setBucketExists(true);
          }
        } else {
          console.log('✅ STORAGE - Bucket existe:', bucketName);
          setBucketExists(true);
        }
      } catch (error) {
        console.error('🚨 STORAGE - Erro inesperado:', error);
        setBucketExists(false);
      } finally {
        setLoading(false);
      }
    };

    checkBucket();
  }, [bucketName]);

  return { bucketExists, loading };
};
