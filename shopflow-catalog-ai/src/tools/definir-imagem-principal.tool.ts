import { McpServer } from '@modelcontextprotocol/server';
import { ProductMediaService } from '../services/product-media.service.js';
import { DefinirImagemPrincipalSchema } from '../schemas/media.schema.js';
import {
  StoreContextRequiredError,
  ProductNotFoundError,
  ImageNotFoundError,
  ForbiddenError,
} from '../domain/errors.js';

export function registerDefinirImagemPrincipalTool(
  server: McpServer,
  mediaService: ProductMediaService
) {
  server.registerTool(
    'definir_imagem_principal',
    {
      description:
        'Define uma imagem existente como a imagem principal (capa de exibição) do produto, atualizando a capa do catálogo. Requer catalog:write.',
      inputSchema: DefinirImagemPrincipalSchema,
    },
    async (args) => {
      try {
        const result = await mediaService.definirImagemPrincipal(args);
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
          content: [{ type: 'text' as const, text: `Error setting primary image: ${message}` }],
        };
      }
    }
  );
}
