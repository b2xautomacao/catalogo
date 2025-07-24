
import { z } from 'zod';

export const productValidationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  description: z.string().optional(),
  retail_price: z.number().min(0, 'Preço deve ser positivo'),
  wholesale_price: z.number().min(0, 'Preço de atacado deve ser positivo').optional(),
  category: z.string().optional(),
  stock: z.number().min(0, 'Estoque deve ser positivo'),
  min_wholesale_qty: z.number().min(1, 'Quantidade mínima deve ser positiva').optional(),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  allow_negative_stock: z.boolean().optional(),
  stock_alert_threshold: z.number().min(0).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  keywords: z.string().optional(),
  seo_slug: z.string().optional()
});

export type ProductValidationData = z.infer<typeof productValidationSchema>;

export const validateProduct = (data: any): ProductValidationData => {
  return productValidationSchema.parse(data);
};
