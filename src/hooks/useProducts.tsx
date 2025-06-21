import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStockMovements } from '@/hooks/useStockMovements';

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  category: string | null;
  retail_price: number;
  wholesale_price: number | null;
  stock: number;
  reserved_stock: number;
  min_wholesale_qty: number | null;
  image_url: string | null;
  is_active: boolean;
  allow_negative_stock: boolean;
  stock_alert_threshold: number | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  seo_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  store_id: string;
  name: string;
  description?: string;
  category?: string;
  retail_price: number;
  wholesale_price?: number;
  stock: number;
  min_wholesale_qty?: number;
  image_url?: string;
  is_active?: boolean;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  seo_slug?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

export const useProducts = (storeId?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { createStockMovement } = useStockMovements();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // SEGURANÇA CRÍTICA: Determinar store_id válido
      const targetStoreId = storeId || profile?.store_id;
      
      // BLOQUEAR COMPLETAMENTE se não há store_id
      if (!targetStoreId) {
        console.log('🚨 [SECURITY] Tentativa de buscar produtos sem store_id válido - BLOQUEADO');
        setProducts([]);
        setLoading(false);
        return;
      }

      console.log('🔒 [SECURITY] Buscando produtos para store_id:', targetStoreId);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', targetStoreId) // SEMPRE filtrar por store_id
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🚨 [SECURITY] Erro ao buscar produtos:', error);
        throw error;
      }

      console.log('✅ [SECURITY] Produtos carregados com segurança:', data?.length || 0);
      setProducts(data || []);
    } catch (error) {
      console.error('🚨 [SECURITY] Erro crítico ao buscar produtos:', error);
      setProducts([]); // Limpar produtos em caso de erro
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular estoque disponível
  const getAvailableStock = (product: Product): number => {
    return product.stock - (product.reserved_stock || 0);
  };

  // Função para verificar se estoque está baixo
  const isLowStock = (product: Product): boolean => {
    const threshold = product.stock_alert_threshold || 5;
    const availableStock = product.stock - (product.reserved_stock || 0);
    return availableStock <= threshold;
  };

  // Função para atualizar estoque com movimentação
  const updateStock = async (productId: string, newStock: number, notes?: string) => {
    try {
      console.log('Atualizando estoque do produto:', productId, 'para:', newStock);

      createStockMovement({
        product_id: productId,
        movement_type: 'adjustment',
        quantity: newStock,
        notes: notes || 'Ajuste manual de estoque'
      });

      await fetchProducts();
      return { data: true, error: null };
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      return { data: null, error };
    }
  };

  // Função para reservar estoque
  const reserveStock = async (productId: string, quantity: number, orderId?: string, expiresInHours: number = 24) => {
    try {
      console.log('Reservando estoque:', productId, quantity);

      const product = products.find(p => p.id === productId);
      if (!product) {
        throw new Error('Produto não encontrado');
      }

      const availableStock = getAvailableStock(product);
      if (availableStock < quantity && !product.allow_negative_stock) {
        throw new Error(`Estoque insuficiente. Disponível: ${availableStock}`);
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      createStockMovement({
        product_id: productId,
        order_id: orderId,
        movement_type: 'reservation',
        quantity: quantity,
        expires_at: expiresAt.toISOString(),
        notes: `Reserva para pedido ${orderId || 'manual'}`
      });

      return { data: true, error: null };
    } catch (error) {
      console.error('Erro ao reservar estoque:', error);
      return { data: null, error };
    }
  };

  // Função para confirmar venda (baixa definitiva)
  const confirmSale = async (productId: string, quantity: number, orderId?: string) => {
    try {
      console.log('Confirmando venda:', productId, quantity);

      createStockMovement({
        product_id: productId,
        order_id: orderId,
        movement_type: 'sale',
        quantity: quantity,
        notes: `Venda confirmada para pedido ${orderId || 'manual'}`
      });

      return { data: true, error: null };
    } catch (error) {
      console.error('Erro ao confirmar venda:', error);
      return { data: null, error };
    }
  };

  // Função para retornar produto ao estoque
  const returnStock = async (productId: string, quantity: number, orderId?: string, notes?: string) => {
    try {
      console.log('Retornando produto ao estoque:', productId, quantity);

      createStockMovement({
        product_id: productId,
        order_id: orderId,
        movement_type: 'return',
        quantity: quantity,
        notes: notes || `Devolução do pedido ${orderId || 'manual'}`
      });

      return { data: true, error: null };
    } catch (error) {
      console.error('Erro ao retornar produto:', error);
      return { data: null, error };
    }
  };

  const uploadProductImages = async (files: File[], productId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `products/${productId}/${Date.now()}-${i}.${fileExt}`;
        
        console.log('📤 Fazendo upload da imagem:', fileName);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Erro no upload:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        console.log('✅ Upload concluído:', publicUrl);
        uploadedUrls.push(publicUrl);

        // Salvar imagem no banco
        const { error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: publicUrl,
            image_order: i + 1,
            is_primary: i === 0,
            alt_text: `Imagem ${i + 1} do produto`
          });

        if (dbError) {
          console.error('❌ Erro ao salvar imagem no banco:', dbError);
        }
      }

      return uploadedUrls;
    } catch (error) {
      console.error('🚨 Erro no upload das imagens:', error);
      return [];
    }
  };

  const createProduct = async (productData: CreateProductData & { variations?: any[], image_files?: File[] }) => {
    try {
      // VALIDAÇÃO CRÍTICA: Verificar store_id
      const targetStoreId = profile?.store_id || productData.store_id;
      
      if (!targetStoreId) {
        console.log('🚨 [SECURITY] Tentativa de criar produto sem store_id - BLOQUEADO');
        return { data: null, error: 'Store ID é obrigatório' };
      }

      // Separar dados do produto das variações e arquivos
      const { variations, image_files, ...productOnlyData } = productData;

      console.log('➕ Criando produto com dados:', productOnlyData);

      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productOnlyData,
          store_id: targetStoreId // SEMPRE usar store_id validado
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar produto:', error);
        throw error;
      }

      console.log('✅ Produto criado com sucesso:', data);

      // Upload de imagens se houver
      if (image_files && image_files.length > 0 && data.id) {
        console.log('📤 Fazendo upload de imagens...');
        const imageUrls = await uploadProductImages(image_files, data.id);
        
        if (imageUrls.length > 0) {
          // Atualizar produto com a primeira imagem como principal
          await supabase
            .from('products')
            .update({ image_url: imageUrls[0] })
            .eq('id', data.id);
        }
      }

      // Se há variações, criar separadamente
      if (variations && variations.length > 0 && data.id) {
        console.log('➕ Criando variações para produto:', data.id);
        
        for (const variation of variations) {
          const { image_file, ...variationData } = variation;
          let imageUrl = variation.image_url;

          // Criar variação no banco
          const { data: variationRecord, error: variationError } = await supabase
            .from('product_variations')
            .insert({
              ...variationData,
              product_id: data.id,
              color: variationData.color || null,
              size: variationData.size || null,
              sku: variationData.sku || null,
              stock: Number(variationData.stock) || 0,
              price_adjustment: Number(variationData.price_adjustment) || 0,
              is_active: variationData.is_active ?? true,
            })
            .select()
            .single();

          if (variationError) {
            console.error('❌ Erro ao criar variação:', variationError);
            continue;
          }

          // Se há arquivo de imagem, fazer upload
          if (image_file && variationRecord.id) {
            console.log('📤 Fazendo upload da imagem da variação...');
            const fileExt = image_file.name.split('.').pop()?.toLowerCase();
            const fileName = `variations/${variationRecord.id}/${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('product-images')
              .upload(fileName, image_file, {
                cacheControl: '3600',
                upsert: false
              });

            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

              // Atualizar variação com URL da imagem
              await supabase
                .from('product_variations')
                .update({ image_url: publicUrl })
                .eq('id', variationRecord.id);

              console.log('✅ Imagem da variação salva:', publicUrl);
            }
          }
        }
      }

      await fetchProducts();
      return { data, error: null };
    } catch (error) {
      console.error('🚨 [SECURITY] Erro ao criar produto:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  const updateProduct = async (productData: UpdateProductData & { variations?: any[], image_files?: File[] }) => {
    try {
      // VALIDAÇÃO: Verificar se o produto pertence à loja do usuário
      if (!profile?.store_id) {
        console.log('🚨 [SECURITY] Tentativa de atualizar produto sem store_id - BLOQUEADO');
        return { data: null, error: 'Store ID é obrigatório' };
      }

      const { id, variations, image_files, ...updates } = productData;
      
      console.log('✏️ Atualizando produto:', id, 'com dados:', updates);

      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .eq('store_id', profile.store_id) // VALIDAR ownership
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar produto:', error);
        throw error;
      }

      // Upload de novas imagens se houver
      if (image_files && image_files.length > 0) {
        console.log('📤 Fazendo upload de novas imagens...');
        const imageUrls = await uploadProductImages(image_files, id);
        
        if (imageUrls.length > 0 && !data.image_url) {
          // Se produto não tem imagem principal, definir a primeira como principal
          await supabase
            .from('products')
            .update({ image_url: imageUrls[0] })
            .eq('id', id);
        }
      }

      // Gerenciar variações se fornecidas
      if (variations) {
        console.log('🔄 Atualizando variações para produto:', id);
        
        // Buscar variações existentes
        const { data: existingVariations } = await supabase
          .from('product_variations')
          .select('*')
          .eq('product_id', id);

        const existingIds = new Set(existingVariations?.map(v => v.id) || []);
        const providedIds = new Set(variations.filter(v => v.id && !v.id.startsWith('temp_')).map(v => v.id));

        // Deletar variações removidas
        const idsToDelete = Array.from(existingIds).filter(id => !providedIds.has(id));
        if (idsToDelete.length > 0) {
          console.log('🗑️ Deletando variações removidas:', idsToDelete);
          await supabase
            .from('product_variations')
            .delete()
            .in('id', idsToDelete);
        }

        // Processar cada variação
        for (const variation of variations) {
          const { image_file, ...variationData } = variation;
          const isTemporary = variation.id?.startsWith('temp_');
          const isNew = !variation.id || isTemporary;

          if (isNew) {
            // Criar nova variação
            console.log('➕ Criando nova variação:', variationData);
            
            const { data: newVariation, error: createError } = await supabase
              .from('product_variations')
              .insert({
                ...variationData,
                product_id: id,
                color: variationData.color || null,
                size: variationData.size || null,
                sku: variationData.sku || null,
                stock: Number(variationData.stock) || 0,
                price_adjustment: Number(variationData.price_adjustment) || 0,
                is_active: variationData.is_active ?? true,
              })
              .select()
              .single();

            if (createError) {
              console.error('❌ Erro ao criar nova variação:', createError);
              continue;
            }

            // Upload da imagem se houver
            if (image_file && newVariation.id) {
              console.log('📤 Fazendo upload da imagem da nova variação...');
              const fileExt = image_file.name.split('.').pop()?.toLowerCase();
              const fileName = `variations/${newVariation.id}/${Date.now()}.${fileExt}`;
              
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, image_file, {
                  cacheControl: '3600',
                  upsert: false
                });

              if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                  .from('product-images')
                  .getPublicUrl(fileName);

                await supabase
                  .from('product_variations')
                  .update({ image_url: publicUrl })
                  .eq('id', newVariation.id);
              }
            }
          } else {
            // Atualizar variação existente
            console.log('✏️ Atualizando variação existente:', variation.id);
            
            let imageUrl = variationData.image_url;

            // Upload da nova imagem se houver
            if (image_file) {
              console.log('📤 Fazendo upload da nova imagem da variação...');
              const fileExt = image_file.name.split('.').pop()?.toLowerCase();
              const fileName = `variations/${variation.id}/${Date.now()}.${fileExt}`;
              
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, image_file, {
                  cacheControl: '3600',
                  upsert: false
                });

              if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                  .from('product-images')
                  .getPublicUrl(fileName);

                imageUrl = publicUrl;
              }
            }

            const { error: updateError } = await supabase
              .from('product_variations')
              .update({
                ...variationData,
                image_url: imageUrl,
                color: variationData.color || null,
                size: variationData.size || null,
                sku: variationData.sku || null,
                stock: Number(variationData.stock) || 0,
                price_adjustment: Number(variationData.price_adjustment) || 0,
                is_active: variationData.is_active ?? true,
              })
              .eq('id', variation.id);

            if (updateError) {
              console.error('❌ Erro ao atualizar variação:', updateError);
            }
          }
        }
      }

      await fetchProducts();
      console.log('✅ Produto atualizado com sucesso:', id);
      return { data, error: null };
    } catch (error) {
      console.error('🚨 [SECURITY] Erro ao atualizar produto:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      if (!profile?.store_id) {
        console.log('🚨 [SECURITY] Tentativa de deletar produto sem store_id - BLOQUEADO');
        return { error: 'Store ID é obrigatório' };
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('store_id', profile.store_id); // VALIDAR ownership

      if (error) throw error;
      await fetchProducts();
      return { error: null };
    } catch (error) {
      console.error('🚨 [SECURITY] Erro ao deletar produto:', error);
      return { error };
    }
  };

  const getProduct = async (id: string) => {
    try {
      if (!profile?.store_id) {
        console.log('🚨 [SECURITY] Tentativa de buscar produto sem store_id - BLOQUEADO');
        return { data: null, error: 'Store ID é obrigatório' };
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('store_id', profile.store_id) // VALIDAR ownership
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('🚨 [SECURITY] Erro ao buscar produto:', error);
      return { data: null, error };
    }
  };

  useEffect(() => {
    // SEMPRE verificar se há profile antes de buscar
    if (profile?.store_id || storeId) {
      fetchProducts();
    } else {
      console.log('🔒 [SECURITY] Aguardando store_id válido...');
      setLoading(false);
    }
  }, [profile?.store_id, storeId]);

  // Produtos com estoque baixo
  const lowStockProducts = products.filter(product => {
    const threshold = product.stock_alert_threshold || 5;
    const availableStock = product.stock - (product.reserved_stock || 0);
    return availableStock <= threshold;
  });

  return {
    products,
    loading,
    lowStockProducts,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct: async (id: string) => {
      try {
        if (!profile?.store_id) {
          console.log('🚨 [SECURITY] Tentativa de deletar produto sem store_id - BLOQUEADO');
          return { error: 'Store ID é obrigatório' };
        }

        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)
          .eq('store_id', profile.store_id);

        if (error) throw error;
        await fetchProducts();
        return { error: null };
      } catch (error) {
        console.error('🚨 [SECURITY] Erro ao deletar produto:', error);
        return { error: error instanceof Error ? error.message : 'Erro desconhecido' };
      }
    },
    getProduct: async (id: string) => {
      try {
        if (!profile?.store_id) {
          console.log('🚨 [SECURITY] Tentativa de buscar produto sem store_id - BLOQUEADO');
          return { data: null, error: 'Store ID é obrigatório' };
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .eq('store_id', profile.store_id)
          .single();

        if (error) throw error;
        return { data, error: null };
      } catch (error) {
        console.error('🚨 [SECURITY] Erro ao buscar produto:', error);
        return { data: null, error: error instanceof Error ? error.message : 'Erro desconhecido' };
      }
    },
    
    // Funções de estoque
    getAvailableStock,
    isLowStock,
    updateStock,
    reserveStock,
    confirmSale,
    returnStock
  };
};
