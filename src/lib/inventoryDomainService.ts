/**
 * Inventory Domain Service — Sprint 10.4
 * 
 * Camada canônica de inventário no frontend:
 * - Operações de Estoque: increase, decrease, count
 * - Execução atômica via RPC apply_stock_adjustment
 * - Eliminação total de mutations diretas (UPDATE stock = X)
 * - Resolução de unit_kind (unit vs pack) e pares físicos equivalentes
 */

export type StockOperation = 'increase' | 'decrease' | 'count';

export type StockReasonCode =
  | 'inventory_count'
  | 'damage'
  | 'loss'
  | 'found_stock'
  | 'correction'
  | 'initial_balance'
  | 'other';

export type StockSourceType = 'manual_adjustment' | 'agent' | 'order' | 'system' | 'return';

export interface StockAdjustmentInput {
  store_id: string;
  product_id: string;
  variation_id?: string | null;
  operation: StockOperation;
  quantity?: number;
  counted_quantity?: number;
  reason_code: StockReasonCode;
  operation_id: string; // Idempotency key (UUID)
  source_type?: StockSourceType;
  notes?: string;
}

export interface StockAdjustmentResult {
  applied: boolean;
  duplicate?: boolean;
  movement_id: string;
  product_id: string;
  variation_id: string | null;
  unit_kind: 'unit' | 'pack';
  operation: StockOperation;
  delta: number;
  quantity: number;
  physical_quantity: number;
  previous_stock: number;
  current_stock: number;
  product_stock: number;
}

export const STOCK_REASON_LABELS: Record<StockReasonCode, string> = {
  inventory_count: "Contagem física",
  damage: "Avaria / Danificado",
  loss: "Perda / Extravio",
  found_stock: "Estoque encontrado",
  correction: "Correção operacional",
  initial_balance: "Saldo inicial",
  other: "Outro motivo",
};

/**
 * Calcula a quantidade de pares ou unidades físicas equivalentes
 */
export function calculatePairsPerPack(isGrade?: boolean, gradePairs?: any): number {
  if (!isGrade) return 1;

  if (Array.isArray(gradePairs)) {
    const sum = gradePairs.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    return sum > 0 ? sum : 1;
  }

  return 1;
}

/**
 * Calcula o equivalente físico total a partir do saldo comercial
 */
export function calculateEquivalentUnits(stock: number, isGrade?: boolean, gradePairs?: any): number {
  const pairsPerPack = calculatePairsPerPack(isGrade, gradePairs);
  return (stock || 0) * pairsPerPack;
}

/**
 * Gera um identificador único de operação estável para idempotência
 */
export function generateOperationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'op_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
}

/**
 * Mapeia erros técnicos da RPC em mensagens amigáveis em Português
 */
export function mapInventoryError(error: any): string {
  const msg = error?.message || String(error);

  if (msg.includes('INSUFFICIENT_STOCK')) {
    return 'Saldo insuficiente para realizar esta retirada de estoque.';
  }
  if (msg.includes('INVENTORY_TARGET_NOT_FOUND')) {
    return 'Produto ou variação não encontrado para esta loja.';
  }
  if (msg.includes('IDEMPOTENCY_CONFLICT')) {
    return 'Conflito de operação: Esta ação já foi executada com parâmetros diferentes.';
  }
  if (msg.includes('INVALID_STOCK_OPERATION')) {
    return 'Operação de estoque inválida ou quantidade não permitida.';
  }
  if (msg.includes('STORE_CONTEXT_REQUIRED')) {
    return 'Contexto de loja não identificado para registrar o ajuste.';
  }

  return msg || 'Ocorreu um erro ao processar o ajuste de estoque.';
}

/**
 * Executa um ajuste de estoque no domínio canônico através da RPC apply_stock_adjustment
 */
export async function applyStockAdjustment(
  supabaseClient: any,
  input: StockAdjustmentInput
): Promise<StockAdjustmentResult> {
  if (!input.store_id) {
    throw new Error('STORE_CONTEXT_REQUIRED: store_id é obrigatório.');
  }
  if (!input.product_id) {
    throw new Error('INVENTORY_TARGET_NOT_FOUND: product_id é obrigatório.');
  }
  if (!input.operation_id) {
    throw new Error('INVALID_ARGUMENT: operation_id é obrigatório.');
  }

  // Validação de inputs por tipo de operação
  if (input.operation === 'increase' || input.operation === 'decrease') {
    if (input.quantity === undefined || input.quantity === null || input.quantity <= 0) {
      throw new Error('INVALID_STOCK_OPERATION: Quantidade deve ser maior que zero.');
    }
  } else if (input.operation === 'count') {
    if (input.counted_quantity === undefined || input.counted_quantity === null || input.counted_quantity < 0) {
      throw new Error('INVALID_STOCK_OPERATION: Quantidade contada não pode ser negativa.');
    }
  }

  const { data, error } = await supabaseClient.rpc('apply_stock_adjustment', {
    p_store_id: input.store_id,
    p_product_id: input.product_id,
    p_variation_id: input.variation_id || null,
    p_operation: input.operation,
    p_quantity: input.quantity || null,
    p_counted_quantity: input.counted_quantity !== undefined ? input.counted_quantity : null,
    p_reason_code: input.reason_code || 'inventory_count',
    p_idempotency_key: input.operation_id,
    p_source_type: input.source_type || 'manual_adjustment',
    p_notes: input.notes || null,
  });

  if (error) {
    console.error('Erro na RPC apply_stock_adjustment:', error);
    throw new Error(mapInventoryError(error));
  }

  return data as StockAdjustmentResult;
}
