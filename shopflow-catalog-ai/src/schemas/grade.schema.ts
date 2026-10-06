import { z } from 'zod';

export const ListGradeTemplatesSchema = z
  .object({
    query: z.string().max(100, 'Busca não pode exceder 100 caracteres').optional(),
    product_category_type: z.string().max(50).optional(),
    type: z.enum(['system', 'custom']).optional(),
    limit: z.number().int().min(1).max(50).default(20).optional(),
    offset: z.number().int().min(0).default(0).optional(),
  })
  .strict();

export const GetGradeTemplateSchema = z
  .object({
    grade_template_id: z.string().uuid('ID do modelo de grade inválido'),
  })
  .strict();

export const GradeTemplateItemInputSchema = z
  .object({
    size: z.string().min(1, 'O tamanho não pode ser vazio').max(10, 'Tamanho inválido'),
    quantity: z.number().int('A quantidade deve ser um número inteiro').positive('A quantidade deve ser estritamente positiva (> 0)'),
    position: z.number().int().min(0).optional(),
  })
  .strict();

export const CreateGradeTemplateSchema = z
  .object({
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres').max(100, 'O nome não pode exceder 100 caracteres'),
    product_category_type: z.string().max(50).default('calcado').optional(),
    items: z
      .array(GradeTemplateItemInputSchema)
      .min(1, 'A grade deve possuir pelo menos 1 tamanho')
      .max(30, 'A grade não pode possuir mais de 30 tamanhos'),
  })
  .strict()
  .refine(
    (data) => {
      const sizes = data.items.map((i) => i.size.trim().toLowerCase());
      const uniqueSizes = new Set(sizes);
      return uniqueSizes.size === sizes.length;
    },
    {
      message: 'Não é permitido tamanhos duplicados na mesma grade',
      path: ['items'],
    }
  );

export const ApplyGradeToProductSchema = z
  .object({
    product_id: z.string().uuid('ID do produto inválido'),
    grade_template_id: z.string().uuid('ID do modelo de grade inválido'),
    color: z.string().max(50, 'Nome da cor inválido').optional(),
    sku: z.string().max(100, 'SKU inválido').optional(),
    name: z.string().max(150, 'Nome da grade no produto inválido').optional(),
  })
  .strict();

export type ListGradeTemplatesInput = z.infer<typeof ListGradeTemplatesSchema>;
export type GetGradeTemplateInput = z.infer<typeof GetGradeTemplateSchema>;
export type CreateGradeTemplateInput = z.infer<typeof CreateGradeTemplateSchema>;
export type ApplyGradeToProductInput = z.infer<typeof ApplyGradeToProductSchema>;
