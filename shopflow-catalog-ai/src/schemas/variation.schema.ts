import { z } from 'zod';

export const VariationItemInputSchema = z
  .object({
    id: z.string().uuid('ID da variação deve ser um UUID válido').optional(),
    sku: z.string().trim().max(100, 'SKU não pode exceder 100 caracteres').optional(),
    color: z.string().trim().max(50, 'Cor não pode exceder 50 caracteres').nullable().optional(),
    size: z.string().trim().max(20, 'Tamanho não pode exceder 20 caracteres').nullable().optional(),
    price_adjustment: z.number().default(0).optional(),
    is_active: z.boolean().default(true).optional(),
    hex_color: z.string().trim().max(10).nullable().optional(),
    display_order: z.number().int().min(0).optional(),
    image_url: z.string().url('URL de imagem inválida').nullable().optional(),
  })
  .strict();

export const ReconciliarVariacoesSchema = z
  .object({
    product_id: z.string().uuid('ID do produto inválido'),
    variation_mode: z
      .enum(['none', 'size_only', 'color_only', 'color_size'])
      .default('size_only')
      .optional()
      .describe('Modo estrutural das variações do produto'),
    variations: z
      .array(VariationItemInputSchema)
      .min(1, 'A lista de variações deve conter pelo menos 1 item')
      .max(100, 'Não é permitido mais de 100 variações por operação')
      .describe('Lista desejada de variações a reconciliar'),
    operation_id: z
      .string()
      .min(1, 'operation_id é obrigatório para idempotência')
      .max(100)
      .describe('Chave única de idempotência da reconciliação'),
  })
  .strict();

export type VariationItemInput = z.infer<typeof VariationItemInputSchema>;
export type ReconciliarVariacoesInput = z.infer<typeof ReconciliarVariacoesSchema>;
