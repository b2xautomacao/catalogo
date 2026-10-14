import { z } from 'zod';

export const CreateCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Category name is required')
      .max(100, 'Category name cannot exceed 100 characters')
      .describe('Name of the category to create'),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional()
      .describe('Optional description for the category'),
  })
  .strict();

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const ListCategoriesSchema = z
  .object({
    query: z
      .string()
      .trim()
      .max(100, 'Filtro de busca não pode exceder 100 caracteres')
      .optional()
      .describe('Filtro opcional por nome da categoria'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(50)
      .optional()
      .describe('Limite de categorias retornadas (padrão: 50, máx: 100)'),
    offset: z
      .number()
      .int()
      .min(0)
      .default(0)
      .optional()
      .describe('Offset para paginação'),
  })
  .strict();

export type ListCategoriesInput = z.infer<typeof ListCategoriesSchema>;
