import { z } from 'zod';

export const ListProductsSchema = z.object({
  nome: z.string().optional().describe('Filter products by name (partial match)'),
  sku: z.string().optional().describe('Filter products by exact SKU'),
  ativo: z.boolean().optional().describe('Filter by active/inactive status'),
  page: z.number().int().min(1).default(1).describe('Page number (1-indexed)'),
  limit: z.number().int().min(1).max(50).default(20).describe('Items per page (max 50)'),
});

export const GetProductSchema = z.object({
  product_id: z.string().uuid().describe('The UUID of the product to fetch'),
});

export const CreateProductSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(255).describe('Product name'),
    description: z.string().trim().max(2000).optional().describe('Product description text'),
    sku: z.string().trim().min(1).max(100).optional().describe('Optional SKU code (must be unique in store)'),
    retail_price: z.number().min(0, 'Retail price must be non-negative').describe('Retail selling price (numeric)'),
    wholesale_price: z.number().min(0, 'Wholesale price must be non-negative').optional().describe('Optional wholesale price'),
    min_wholesale_qty: z.number().int().min(1).optional().describe('Minimum quantity for wholesale price'),
    category: z.string().trim().min(1).max(100).optional().describe('Category name'),
    category_id: z.string().uuid().optional().describe('Optional Category UUID (validated against active store)'),
    material: z.string().trim().max(100).optional().describe('Material composition'),
    product_gender: z.enum(['masculino', 'feminino', 'unissex', 'infantil']).optional().describe('Gender target'),
    product_category_type: z.enum(['calcado', 'roupa_superior', 'roupa_inferior', 'acessorio']).optional().describe('Category classification type'),
  })
  .strict();

export const UpdateProductSchema = z
  .object({
    product_id: z.string().uuid('product_id must be a valid UUID').describe('UUID of the product to update'),
    name: z.string().trim().min(1, 'Name cannot be empty').max(255).optional().describe('Updated product name'),
    description: z.string().trim().max(2000).optional().describe('Updated description'),
    sku: z.string().trim().min(1).max(100).optional().describe('Updated SKU code'),
    retail_price: z.number().min(0, 'Retail price must be non-negative').optional().describe('Updated retail price'),
    wholesale_price: z.number().min(0, 'Wholesale price must be non-negative').nullable().optional().describe('Updated wholesale price (or null)'),
    min_wholesale_qty: z.number().int().min(1).optional().describe('Updated minimum wholesale quantity'),
    category: z.string().trim().min(1).max(100).nullable().optional().describe('Updated category name (or null)'),
    category_id: z.string().uuid().nullable().optional().describe('Updated Category UUID (or null)'),
    material: z.string().trim().max(100).nullable().optional().describe('Updated material'),
    product_gender: z.enum(['masculino', 'feminino', 'unissex', 'infantil']).nullable().optional().describe('Updated gender target'),
    product_category_type: z.enum(['calcado', 'roupa_superior', 'roupa_inferior', 'acessorio']).nullable().optional().describe('Updated category type'),
  })
  .strict()
  .refine(
    (data) => {
      const keys = Object.keys(data).filter((k) => k !== 'product_id');
      return keys.length > 0;
    },
    {
      message: 'NO_CHANGES_PROVIDED',
      path: ['product_id'],
    }
  );

export const DeactivateProductSchema = z
  .object({
    product_id: z.string().uuid('product_id must be a valid UUID').describe('UUID of the product to deactivate (soft delete)'),
  })
  .strict();

export const BulkUpdateProductsSchema = z
  .object({
    product_ids: z
      .array(z.string().uuid('Each item must be a valid product UUID'))
      .min(1, 'product_ids cannot be empty')
      .max(100, 'Maximum 100 products per bulk operation')
      .describe('List of product UUIDs to update'),
    updates: z
      .object({
        is_active: z.boolean().optional().describe('Set active status for selected products'),
        category: z.string().trim().max(100).nullable().optional().describe('Update category name'),
        material: z.string().trim().max(100).nullable().optional().describe('Update material composition'),
        gender: z.enum(['masculino', 'feminino', 'unissex', 'infantil']).nullable().optional().describe('Update target gender'),
        is_featured: z.boolean().optional().describe('Set featured status'),
        retail_price: z.number().min(0, 'Price must be non-negative').optional().describe('Update retail price'),
        wholesale_price: z.number().min(0, 'Price must be non-negative').nullable().optional().describe('Update wholesale price'),
        min_wholesale_qty: z.number().int().min(1).optional().describe('Update minimum wholesale quantity'),
      })
      .strict()
      .refine((data) => Object.keys(data).length > 0, {
        message: 'NO_CHANGES_PROVIDED',
      })
      .describe('Allowed field updates to apply'),
    operation_id: z
      .string()
      .trim()
      .min(1, 'operation_id is required for idempotency')
      .describe('Unique idempotency key for this bulk write operation'),
  })
  .strict();

