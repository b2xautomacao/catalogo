import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';

export const ALLOWED_BULK_FIELDS = [
  'is_active',
  'category',
  'material',
  'gender',
  'is_featured',
  'featured',
  'retail_price',
  'wholesale_price',
  'min_wholesale_qty',
] as const;

export const PROHIBITED_BULK_FIELDS = [
  'stock',
  'reserved_stock',
  'grade_composition',
  'snapshots',
  'variations',
  'ledger',
  'api_credentials',
  'store_id',
] as const;

export type AllowedBulkField = typeof ALLOWED_BULK_FIELDS[number];

export interface BulkValidationResult {
  valid: boolean;
  allowedUpdates: Record<string, any>;
  errors: string[];
}

export interface BulkPreviewResult {
  totalSelected: number;
  fieldsToUpdate: string[];
  summary: Array<{
    field: string;
    newValue: any;
    label: string;
  }>;
}

export interface BulkExecutionResult {
  success: boolean;
  duplicate?: boolean;
  operationId: string;
  updatedCount: number;
  failedCount: number;
  details?: Array<{
    productId: string;
    status: 'UPDATED' | 'FAILED';
    error?: string;
  }>;
  error?: string | null;
}

/**
 * Valida o payload de atualização em massa contra a allowlist estrita.
 */
export function validateBulkUpdates(updates: Record<string, any>): BulkValidationResult {
  const errors: string[] = [];
  const allowedUpdates: Record<string, any> = {};

  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    return {
      valid: false,
      allowedUpdates: {},
      errors: ['Nenhum campo para atualização foi fornecido.'],
    };
  }

  for (const [key, value] of Object.entries(updates)) {
    // Rejeitar campos proibidos
    if (PROHIBITED_BULK_FIELDS.includes(key as any)) {
      errors.push(`O campo "${key}" é estritamente proibido em operações em lote de catálogo.`);
      continue;
    }

    // Rejeitar campos fora da allowlist
    if (!ALLOWED_BULK_FIELDS.includes(key as any)) {
      errors.push(`O campo "${key}" não é permitido para alteração em lote.`);
      continue;
    }

    // Validações de tipo
    if (key === 'retail_price' || key === 'wholesale_price') {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        errors.push(`O valor do preço em "${key}" deve ser um número maior ou igual a zero.`);
        continue;
      }
      allowedUpdates[key] = num;
      continue;
    }

    if (key === 'min_wholesale_qty') {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 1) {
        errors.push('A quantidade mínima de atacado deve ser um número inteiro maior ou igual a 1.');
        continue;
      }
      allowedUpdates[key] = num;
      continue;
    }

    if (key === 'is_active' || key === 'is_featured' || key === 'featured') {
      allowedUpdates[key] = Boolean(value);
      continue;
    }

    if (typeof value === 'string') {
      allowedUpdates[key] = value.trim();
      continue;
    }

    allowedUpdates[key] = value;
  }

  return {
    valid: errors.length === 0 && Object.keys(allowedUpdates).length > 0,
    allowedUpdates,
    errors,
  };
}

/**
 * Gera um preview das alterações em lote antes da confirmação.
 */
export function previewBulkUpdate(
  selectedProducts: Partial<Product>[],
  updates: Record<string, any>
): BulkPreviewResult {
  const validation = validateBulkUpdates(updates);
  const fields = Object.keys(validation.allowedUpdates);

  const fieldLabels: Record<string, string> = {
    is_active: 'Status do Produto',
    category: 'Categoria',
    material: 'Material',
    gender: 'Gênero',
    is_featured: 'Destaque na Vitrine',
    featured: 'Destaque na Vitrine',
    retail_price: 'Preço de Varejo (R$)',
    wholesale_price: 'Preço de Atacado (R$)',
    min_wholesale_qty: 'Qtd Mínima Atacado',
  };

  const summary = fields.map((field) => ({
    field,
    newValue: validation.allowedUpdates[field],
    label: fieldLabels[field] || field,
  }));

  return {
    totalSelected: selectedProducts.length,
    fieldsToUpdate: fields,
    summary,
  };
}

/**
 * Executa a operação em lote via RPC atômica no banco de dados.
 */
export async function executeBulkUpdate(params: {
  storeId: string;
  productIds: string[];
  updates: Record<string, any>;
  operationId?: string;
}): Promise<BulkExecutionResult> {
  const { storeId, productIds, updates } = params;
  const operationId = params.operationId || `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  if (!storeId) {
    return {
      success: false,
      operationId,
      updatedCount: 0,
      failedCount: productIds.length,
      error: 'ID da loja (store_id) é obrigatório.',
    };
  }

  if (!productIds || productIds.length === 0) {
    return {
      success: false,
      operationId,
      updatedCount: 0,
      failedCount: 0,
      error: 'Nenhum produto selecionado para atualização.',
    };
  }

  if (productIds.length > 100) {
    return {
      success: false,
      operationId,
      updatedCount: 0,
      failedCount: productIds.length,
      error: 'Limite operacional excedido: máximo de 100 produtos por operação em lote.',
    };
  }

  const validation = validateBulkUpdates(updates);
  if (!validation.valid) {
    return {
      success: false,
      operationId,
      updatedCount: 0,
      failedCount: productIds.length,
      error: validation.errors.join(' | '),
    };
  }

  try {
    const { data, error } = await (supabase.rpc as any)('bulk_update_products', {
      p_store_id: storeId,
      p_product_ids: productIds,
      p_updates: validation.allowedUpdates,
      p_operation_id: operationId,
    });

    if (error) {
      throw new Error(`Erro na RPC de lote: ${error.message}`);
    }

    return {
      success: true,
      duplicate: data?.duplicate || false,
      operationId,
      updatedCount: data?.updated_count || 0,
      failedCount: data?.failed_count || 0,
      details: data?.details || [],
      error: null,
    };
  } catch (err: any) {
    console.error('Erro ao executar bulk update:', err);
    return {
      success: false,
      operationId,
      updatedCount: 0,
      failedCount: productIds.length,
      error: err.message || 'Erro inesperado ao executar atualização em lote.',
    };
  }
}
