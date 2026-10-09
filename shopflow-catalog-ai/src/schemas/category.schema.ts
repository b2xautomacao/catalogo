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
