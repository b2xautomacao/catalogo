import { McpServer } from '@modelcontextprotocol/server';
import { ProductMediaService } from '../services/product-media.service.js';
import { RemoverImagemProdutoSchema } from '../schemas/media.schema.js';
import {
  StoreContextRequiredError,
  ProductNotFoundError,
  ImageNotFoundError,
  ForbiddenError,
} from '../domain/errors.js';

export function registerRemoverImagemProdutoTool(
  server: McpServer,
  mediaService: ProductMediaService
) {
  server.registerTool(
    'remover_imagem_produto',
    {
      description:
        'Remove persistentemente uma imagem do produto e do Object Storage canônico. Se a imagem removida for a principal, promove automaticamente a próxima imagem remanescente. Requer catalog:write.',
      inputSchema: RemoverImagemProdutoSchema,
    },
    async (args) => {
      try {
        const result = await mediaService.removerImagem(args);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
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
        if (error instanceof ImageNotFoundError) {
          return {
            content: [{ type: 'text' as const, text: 'IMAGE_NOT_FOUND' }],
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
          content: [{ type: 'text' as const, text: `Error removing product image: ${message}` }],
        };
      }
    }
  );
}
