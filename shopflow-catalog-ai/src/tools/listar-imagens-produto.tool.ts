import { McpServer } from '@modelcontextprotocol/server';
import { ProductMediaService } from '../services/product-media.service.js';
import { ListarImagensProdutoSchema } from '../schemas/media.schema.js';
import {
  StoreContextRequiredError,
  ProductNotFoundError,
  ForbiddenError,
} from '../domain/errors.js';

export function registerListarImagensProdutoTool(
  server: McpServer,
  mediaService: ProductMediaService
) {
  server.registerTool(
    'listar_imagens_produto',
    {
      description:
        'Lista todas as imagens cadastradas para um produto específico da loja ativa, ordenadas por prioridade/posição. Requer catalog:read.',
      inputSchema: ListarImagensProdutoSchema,
    },
    async (args) => {
      try {
        const images = await mediaService.listarImagens(args.product_id);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(images, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        if (error instanceof StoreContextRequiredError) {
          return {
            content: [{ type: 'text' as const, text: 'STORE_CONTEXT_REQUIRED' }],
          };
        }
        if (error instanceof ProductNotFoundError) {
          return {
            content: [{ type: 'text' as const, text: 'PRODUCT_NOT_FOUND' }],
          };
        }
        if (error instanceof ForbiddenError) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: 'FORBIDDEN' }],
          };
        }

        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text' as const, text: `Error listing product images: ${message}` }],
        };
      }
    }
  );
}
