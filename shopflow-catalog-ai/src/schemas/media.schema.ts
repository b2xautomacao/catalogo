import { z } from 'zod';

export const AdicionarImagemProdutoSchema = z.object({
  product_id: z.string().uuid({ message: 'product_id deve ser um UUID válido' }),
  source_url: z
    .string()
    .url({ message: 'source_url deve ser uma URL válida' })
    .refine((url) => url.startsWith('https://') || (process.env.NODE_ENV === 'test' && url.startsWith('http://')), {
      message: 'source_url deve utilizar o protocolo seguro HTTPS',
    }),
  alt_text: z.string().max(255).optional(),
  is_primary: z.boolean().optional(),
  position: z.number().int().min(1).max(10).optional(),
  color: z.string().max(100).optional(),
  operation_id: z.string().max(100).optional(),
});

export type AdicionarImagemProdutoInput = z.infer<typeof AdicionarImagemProdutoSchema>;

export const ListarImagensProdutoSchema = z.object({
  product_id: z.string().uuid({ message: 'product_id deve ser um UUID válido' }),
});

export type ListarImagensProdutoInput = z.infer<typeof ListarImagensProdutoSchema>;

export const DefinirImagemPrincipalSchema = z.object({
  product_id: z.string().uuid({ message: 'product_id deve ser um UUID válido' }),
  image_id: z.string().uuid({ message: 'image_id deve ser um UUID válido' }),
});

export type DefinirImagemPrincipalInput = z.infer<typeof DefinirImagemPrincipalSchema>;

export const RemoverImagemProdutoSchema = z.object({
  product_id: z.string().uuid({ message: 'product_id deve ser um UUID válido' }),
  image_id: z.string().uuid({ message: 'image_id deve ser um UUID válido' }),
});

export type RemoverImagemProdutoInput = z.infer<typeof RemoverImagemProdutoSchema>;
