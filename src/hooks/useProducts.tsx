
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
  is_featured: boolean | null;
  allow_negative_stock: boolean;
  stock_alert_threshold: number | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  seo_slug: string | null;
  created_at: string;
  updated_at: string;
  variations?: ProductVariation[];
}

export interface ProductVariation {
  id: string;
  product_id: string;
  color: string | null;
  size: string | null;
  sku: string | null;
  stock: number;
  price_adjustment: number;
  is_active: boolean;
  image_url: string | null;
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

      console.log('🔒 [SECURITY] Buscando produtos com variações para store_id:', targetStoreId);
      
      // Buscar produtos com suas variações em uma única query
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_variations (
            id,
            color,
            size,
            sku,
            stock,
            price_adjustment,
            is_active,
            image_url,
            created_at,
            updated_at
          )
        `)
        .eq('store_id', targetStoreId)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('🚨 [SECURITY] Erro ao buscar produtos:', productsError);
        throw productsError;
      }

      // Transformar dados para incluir variações
      const productsWithVariations = productsData?.map(product => ({
        ...product,
        variations: product.product_variations || []
      })) || [];

      console.log('✅ [SECURITY] Produtos carregados com variações:', {
        total: productsWithVariations.length,
        withVariations: productsWithVariations.filter(p => p.variations?.length > 0).length
      });

      setProducts(productsWithVariations);
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

      console.log('➕ Criando produto:', {
        name: productOnlyData.name,
        variations_count: variations?.length || 0
      });

      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productOnlyData,
          store_id: targetStoreId
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar produto:', error);
        throw error;
      }

      console.log('✅ Produto criado com sucesso:', data.id);

      // Upload de imagens se houver
      if (image_files && image_files.length > 0 && data.id) {
        console.log('📤 Fazendo upload de imagens...');
        const imageUrls = await uploadProductImages(image_files, data.id);
        
        if (imageUrls.length > 0) {
          await supabase
            .from('products')
            .update({ image_url: imageUrls[0] })
            .eq('id', data.id);
        }
      }

      // Processar variações se houver
      if (variations && variations.length > 0 && data.id) {
        console.log('🎨 Criando variações:', variations.length);
        await createProductVariations(data.id, variations);
      }

      await fetchProducts();
      return { data, error: null };
    } catch (error) {
      console.error('🚨 Erro ao criar produto:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  const createProductVariations = async (productId: string, variations: any[]) => {
    console.log('🎨 CRIANDO VARIAÇÕES - Início:', {
      productId,
      totalVariations: variations.length,
      variations: variations.map(v => ({ 
        color: v.color, 
        size: v.size, 
        stock: v.stock, 
        hasImage: !!v.image_url 
      }))
    });

    for (const [index, variation] of variations.entries()) {
      try {
        const { image_file, ...variationData } = variation;
        
        console.log(`🎨 Criando variação ${index + 1}/${variations.length}:`, {
          color: variationData.color,
          size: variationData.size,
          stock: variationData.stock,
          price_adjustment: variationData.price_adjustment,
          hasImageUrl: !!variationData.image_url
        });

        // Preparar dados da variação com validação
        const variationPayload = {
          product_id: productId,
          color: variationData.color || null,
          size: variationData.size || null,
          sku: variationData.sku || null,
          stock: Number(variationData.stock) || 0,
          price_adjustment: Number(variationData.price_adjustment) || 0,
          is_active: variationData.is_active ?? true,
          image_url: variationData.image_url || null,
        };

        console.log(`📋 Payload variação ${index + 1}:`, variationPayload);

        const { data: newVariation, error: createError } = await supabase
          .from('product_variations')
          .insert(variationPayload)
          .select()
          .single();

        if (createError) {
          console.error(`❌ Erro ao criar variação ${index + 1}:`, createError);
          continue;
        }

        console.log(`✅ Variação ${index + 1} criada com sucesso:`, {
          id: newVariation.id,
          color: newVariation.color,
          size: newVariation.size,
          stock: newVariation.stock
        });

        // Upload da imagem se houver arquivo (legacy - deve vir processado agora)
        if (image_file && newVariation.id) {
          console.log(`📤 Upload imagem variação ${index + 1} (legacy)...`);
          
          try {
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

              // Atualizar variação com URL da imagem
              await supabase
                .from('product_variations')
                .update({ image_url: publicUrl })
                .eq('id', newVariation.id);

              console.log(`✅ Imagem variação ${index + 1} salva:`, publicUrl);
            } else {
              console.error(`❌ Erro upload imagem variação ${index + 1}:`, uploadError);
            }
          } catch (uploadError) {
            console.error(`🚨 Erro inesperado upload variação ${index + 1}:`, uploadError);
          }
        }
      } catch (error) {
        console.error(`🚨 Erro inesperado na variação ${index + 1}:`, error);
      }
    }

    console.log('🎨 CRIANDO VARIAÇÕES - Finalizado para produto:', productId);
  };

  const updateProduct = async (productData: UpdateProductData & { variations?: any[], image_files?: File[] }) => {
    try {
      if (!profile?.store_id) {
        console.log('🚨 [SECURITY] Tentativa de atualizar produto sem store_id - BLOQUEADO');
        return { data: null, error: 'Store ID é obrigatório' };
      }

      const { id, variations, image_files, ...updates } = productData;
      
      console.log('✏️ ATUALIZANDO PRODUTO:', {
        id,
        variations_count: variations?.length || 0,
        has_image_files: !!image_files?.length,
        variationsDetailed: variations?.map(v => ({ 
          id: v.id, 
          color: v.color, 
          size: v.size, 
          stock: v.stock 
        })) || []
      });

      // Atualizar dados básicos do produto
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .eq('store_id', profile.store_id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar dados básicos do produto:', error);
        throw error;
      }

      console.log('✅ Dados básicos do produto atualizados');

      // Upload de novas imagens se houver
      if (image_files && image_files.length > 0) {
        console.log('📤 Fazendo upload de novas imagens...');
        const imageUrls = await uploadProductImages(image_files, id);
        
        if (imageUrls.length > 0 && !data.image_url) {
          await supabase
            .from('products')
            .update({ image_url: imageUrls[0] })
            .eq('id', id);
        }
      }

      // Gerenciar variações - SEMPRE processar, mesmo se vazio
      console.log('🔄 PROCESSANDO VARIAÇÕES:', {
        variationsUndefined: variations === undefined,
        variationsNull: variations === null,
        variationsLength: variations?.length || 0,
        variationsType: typeof variations
      });

      if (variations !== undefined) {
        console.log('🔄 Atualizando variações do produto:', id);
        
        // 1. Deletar todas as variações existentes
        const { error: deleteError } = await supabase
          .from('product_variations')
          .delete()
          .eq('product_id', id);

        if (deleteError) {
          console.error('❌ Erro ao deletar variações existentes:', deleteError);
          throw new Error(`Erro ao deletar variações: ${deleteError.message}`);
        } else {
          console.log('🗑️ Variações existentes deletadas com sucesso');
        }

        // 2. Criar novas variações se houver
        if (variations.length > 0) {
          console.log('➕ Criando novas variações:', variations.length);
          await createProductVariations(id, variations);
          console.log('✅ Novas variações criadas com sucesso');
        } else {
          console.log('ℹ️ Nenhuma nova variação para criar');
        }
      } else {
        console.log('⚠️ Variações não definidas - pulando atualização de variações');
      }

      await fetchProducts();
      console.log('✅ Produto atualizado com sucesso:', id);
      return { data, error: null };
    } catch (error) {
      console.error('🚨 Erro ao atualizar produto:', error);
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
        .eq('store_id', profile.store_id);

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

      console.log('🔍 Buscando produto com variações:', id);

      // Buscar produto com variações em uma única query
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          product_variations (
            id,
            color,
            size,
            sku,
            stock,
            price_adjustment,
            is_active,
            image_url,
            created_at,
            updated_at
          )
        `)
        .eq('id', id)
        .eq('store_id', profile.store_id)
        .single();

      if (productError) {
        console.error('❌ Erro ao buscar produto:', productError);
        throw productError;
      }

      const productWithVariations = {
        ...product,
        variations: product.product_variations || []
      };

      console.log('✅ Produto carregado com variações:', {
        id: product.id,
        name: product.name,
        variations_count: product.product_variations?.length || 0,
        variationsPreview: product.product_variations?.slice(0, 2).map(v => ({
          color: v.color,
          size: v.size,
          stock: v.stock
        })) || []
      });

      return { data: productWithVariations, error: null };
    } catch (error) {
      console.error('🚨 [SECURITY] Erro ao buscar produto:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Erro desconhecido' };
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

        console.log('🔍 Buscando produto com variações:', id);

        // Buscar produto
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .eq('store_id', profile.store_id)
          .single();

        if (productError) {
          console.error('❌ Erro ao buscar produto:', productError);
          throw productError;
        }

        // Buscar variações do produto
        const { data: variations, error: variationsError } = await supabase
          .from('product_variations')
          .select('*')
          .eq('product_id', id)
          .order('created_at', { ascending: true });

        if (variationsError) {
          console.error('❌ Erro ao buscar variações:', variationsError);
        }

        const productWithVariations = {
          ...product,
          variations: variations || []
        };

        console.log('✅ Produto carregado:', {
          id: product.id,
          name: product.name,
          variations_count: variations?.length || 0
        });

        return { data: productWithVariations, error: null };
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
