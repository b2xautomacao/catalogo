import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GradeTemplate, GradeTemplateItem, CreateCustomTemplateInput } from '@/types/grade';
import { wizardGradeToTemplateItems } from '@/lib/gradeDomainAdapter';

export interface UseGradeTemplatesOptions {
  storeId?: string;
  productCategoryType?: string;
}

export interface UseGradeTemplatesResult {
  templates: GradeTemplate[];
  systemTemplates: GradeTemplate[];
  customTemplates: GradeTemplate[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCustomTemplate: (input: CreateCustomTemplateInput) => Promise<{
    data: GradeTemplate | null;
    error: string | null;
  }>;
}

interface RawGradeTemplateItem {
  id: string;
  grade_template_id: string;
  size: string;
  quantity: number;
  position: number;
  created_at?: string;
}

interface RawGradeTemplate {
  id: string;
  store_id: string | null;
  name: string;
  slug?: string | null;
  product_category_type?: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  grade_template_items?: RawGradeTemplateItem[];
}

export const useGradeTemplates = (options?: UseGradeTemplatesOptions | string): UseGradeTemplatesResult => {
  const [templates, setTemplates] = useState<GradeTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const storeId = typeof options === 'string' ? options : options?.storeId;
  const productCategoryType = typeof options === 'object' ? options?.productCategoryType : undefined;
  const targetStoreId = storeId || profile?.store_id;

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('grade_templates')
        .select(`
          id,
          store_id,
          name,
          slug,
          product_category_type,
          is_system,
          is_active,
          created_at,
          updated_at,
          grade_template_items (
            id,
            grade_template_id,
            size,
            quantity,
            position,
            created_at
          )
        `)
        .eq('is_active', true);

      if (targetStoreId) {
        query = query.or(`is_system.eq.true,store_id.eq.${targetStoreId}`);
      } else {
        query = query.eq('is_system', true);
      }

      if (productCategoryType) {
        query = query.or(`product_category_type.eq.${productCategoryType},product_category_type.is.null`);
      }

      query = query
        .order('is_system', { ascending: false })
        .order('name', { ascending: true });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Erro ao buscar modelos de grade:', fetchError);
        setError('Não foi possível carregar os modelos de grade. Tente novamente.');
        setTemplates([]);
        return;
      }

      const rawTemplates = (data || []) as unknown as RawGradeTemplate[];

      const normalized: GradeTemplate[] = rawTemplates.map((item) => {
        const rawItems = item.grade_template_items || [];
        const sortedItems: GradeTemplateItem[] = [...rawItems].sort(
          (a, b) => (a.position ?? 0) - (b.position ?? 0)
        );
        const totalUnits = sortedItems.reduce(
          (sum, i) => sum + (Number(i.quantity) || 0),
          0
        );

        return {
          id: item.id,
          store_id: item.store_id,
          name: item.name,
          slug: item.slug,
          product_category_type: item.product_category_type,
          is_system: Boolean(item.is_system),
          is_active: Boolean(item.is_active),
          created_at: item.created_at,
          updated_at: item.updated_at,
          items: sortedItems,
          total_units: totalUnits,
        };
      });

      setTemplates(normalized);
    } catch (err) {
      console.error('Erro inesperado ao carregar templates de grade:', err);
      setError('Não foi possível carregar os modelos de grade. Tente novamente.');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [targetStoreId, productCategoryType]);

  const createCustomTemplate = async (
    input: CreateCustomTemplateInput
  ): Promise<{ data: GradeTemplate | null; error: string | null }> => {
    try {
      if (!targetStoreId) {
        return {
          data: null,
          error: 'Loja não identificada para salvar modelo de grade.',
        };
      }

      const trimmedName = input.name?.trim();
      if (!trimmedName) {
        return {
          data: null,
          error: 'Informe um nome válido para o modelo de grade.',
        };
      }

      const templateItems = wizardGradeToTemplateItems(input.items);
      if (templateItems.length === 0) {
        return {
          data: null,
          error: 'Adicione pelo menos um tamanho com quantidade na grade.',
        };
      }

      // 1. Tentar executar via RPC Atômica (PostgreSQL Transactional)
      try {
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
          'create_custom_grade_template',
          {
            p_store_id: targetStoreId,
            p_name: trimmedName,
            p_product_category_type: input.productCategoryType || 'calcado',
            p_items: templateItems,
          }
        );

        if (!rpcError && rpcData) {
          await fetchTemplates();
          return { data: rpcData as GradeTemplate, error: null };
        }

        if (rpcError && rpcError.message && rpcError.message.includes('GRADE_TEMPLATE_ALREADY_EXISTS')) {
          return {
            data: null,
            error: `Já existe um modelo de grade com o nome "${trimmedName}" nesta loja.`,
          };
        }
      } catch (rpcCallErr) {
        // Fallback transacional no client caso a RPC não esteja ativa
      }

      // 2. Fallback com verificação de duplicidade e rollback de segurança
      const { data: existing } = await supabase
        .from('grade_templates')
        .select('id')
        .eq('store_id', targetStoreId)
        .eq('is_system', false)
        .ilike('name', trimmedName)
        .maybeSingle();

      if (existing) {
        return {
          data: null,
          error: `Já existe um modelo de grade com o nome "${trimmedName}" nesta loja.`,
        };
      }

      // Inserir cabeçalho do template
      const { data: templateData, error: tmplError } = await supabase
        .from('grade_templates')
        .insert({
          store_id: targetStoreId,
          name: trimmedName,
          product_category_type: input.productCategoryType || 'calcado',
          is_system: false,
          is_active: true,
        })
        .select('*')
        .single();

      if (tmplError || !templateData) {
        console.error('Erro ao criar grade_template:', tmplError);
        return {
          data: null,
          error: 'Não foi possível salvar o modelo de grade. Tente novamente.',
        };
      }

      // Inserir itens vinculados
      const itemsToInsert = templateItems.map((item) => ({
        grade_template_id: templateData.id,
        size: item.size,
        quantity: item.quantity,
        position: item.position,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('grade_template_items')
        .insert(itemsToInsert)
        .select('*');

      if (itemsError || !insertedItems) {
        console.error('Erro ao inserir grade_template_items:', itemsError);
        // Rollback do template em caso de falha nos itens para evitar modelos órfãos/parciais
        await supabase.from('grade_templates').delete().eq('id', templateData.id);
        return {
          data: null,
          error: 'Não foi possível salvar os itens do modelo. Tente novamente.',
        };
      }

      const sortedItems = (insertedItems as GradeTemplateItem[]).sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      );
      const totalUnits = sortedItems.reduce(
        (sum, i) => sum + (Number(i.quantity) || 0),
        0
      );

      const created: GradeTemplate = {
        id: templateData.id,
        store_id: templateData.store_id,
        name: templateData.name,
        slug: templateData.slug,
        product_category_type: templateData.product_category_type,
        is_system: false,
        is_active: true,
        created_at: templateData.created_at,
        updated_at: templateData.updated_at,
        items: sortedItems,
        total_units: totalUnits,
      };

      // Atualizar lista de templates em memória imediatamente
      await fetchTemplates();

      return { data: created, error: null };
    } catch (err: unknown) {
      console.error('Erro ao criar template de grade:', err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido ao salvar modelo.';
      return { data: null, error: message };
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const systemTemplates = templates.filter((t) => t.is_system);
  const customTemplates = templates.filter((t) => !t.is_system);

  return {
    templates,
    systemTemplates,
    customTemplates,
    loading,
    error,
    refetch: fetchTemplates,
    createCustomTemplate,
  };
};
