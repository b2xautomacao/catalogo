import { z } from 'zod';

export const STOCK_REASON_CODES = [
  'inventory_count',
  'damage',
  'loss',
  'found_stock',
  'correction',
  'initial_balance',
  'other',
] as const;

export const AdjustStockSchema = z
  .object({
    product_id: z.string().uuid('ID do produto inválido'),
    variation_id: z.string().uuid('ID da variação inválido').optional(),
    operation: z.enum(['increase', 'decrease', 'count']),
    quantity: z
      .number()
      .int('A quantidade deve ser um número inteiro')
      .positive('A quantidade deve ser estritamente positiva para increase/decrease')
      .optional(),
    counted_quantity: z
      .number()
      .int('A quantidade contada deve ser um número inteiro')
      .min(0, 'A quantidade contada não pode ser negativa')
      .optional(),
    reason: z.enum([
      'inventory_count',
      'damage',
      'loss',
      'found_stock',
      'correction',
      'initial_balance',
      'other',
    ]),
    operation_id: z
      .string()
      .min(8, 'operation_id deve ter pelo menos 8 caracteres')
      .max(128, 'operation_id não pode exceder 128 caracteres'),
    notes: z.string().max(500, 'Notas não podem exceder 500 caracteres').optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.operation === 'increase' || data.operation === 'decrease') {
        return typeof data.quantity === 'number' && data.quantity > 0;
      }
      return true;
    },
    {
      message: 'O campo "quantity" é obrigatório e deve ser positivo para increase/decrease',
      path: ['quantity'],
    }
  )
  .refine(
    (data) => {
      if (data.operation === 'count') {
        return typeof data.counted_quantity === 'number' && data.counted_quantity >= 0;
      }
      return true;
    },
    {
      message: 'O campo "counted_quantity" é obrigatório e deve ser não-negativo para a operação count',
      path: ['counted_quantity'],
    }
  );

export const ConsultarEstoqueSchema = z
  .object({
    product_id: z.string().uuid('ID do produto inválido'),
    variation_id: z.string().uuid('ID da variação inválido').optional(),
  })
  .strict();

export type AdjustStockInput = z.infer<typeof AdjustStockSchema>;
export type ConsultarEstoqueInput = z.infer<typeof ConsultarEstoqueSchema>;
