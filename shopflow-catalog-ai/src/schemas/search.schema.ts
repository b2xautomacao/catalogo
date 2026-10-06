import { z } from 'zod';

export const BuscarCatalogoSchema = z
  .object({
    query: z.string().max(100).optional(),
    is_active: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    has_image: z.boolean().optional(),
    has_grade: z.boolean().optional(),
    has_variations: z.boolean().optional(),
    stock_status: z.enum(['all', 'in_stock', 'out_of_stock', 'low_stock']).optional().default('all'),
    category: z.string().max(50).optional(),
    product_gender: z.enum(['masculino', 'feminino', 'unissex', 'infantil']).optional(),
    material: z.string().max(50).optional(),
    min_price: z.number().min(0).optional(),
    max_price: z.number().min(0).optional(),
    grade_type: z.enum(['all', 'alta', 'baixa', 'custom', 'legacy']).optional().default('all'),
    diagnostics: z
      .array(
        z.enum([
          'sem_imagem',
          'sem_preco',
          'sem_estoque',
          'baixo_estoque',
          'sem_sku',
          'variacao_incompleta',
          'grade_sem_estoque',
        ])
      )
      .optional(),
    sort_by: z.enum(['name', 'created_at', 'updated_at', 'price', 'stock']).optional().default('name'),
    sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
    page: z.number().int().min(1).optional().default(1),
    page_size: z.number().int().min(1).max(100).optional().default(20),
  })
  .strict();

export type BuscarCatalogoInput = z.infer<typeof BuscarCatalogoSchema>;
