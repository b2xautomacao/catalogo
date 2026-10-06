import { McpServer } from '@modelcontextprotocol/server';
import { CatalogService } from '../services/catalog.service.js';
import { DeactivateProductSchema } from '../schemas/product.schema.js';
import {
  StoreContextRequiredError,
  ProductNotFoundError,
  ForbiddenError,
} from '../domain/errors.js';

export function registerDesativarProdutoTool(server: McpServer, catalogService: CatalogService) {
  server.registerTool(
    'desativar_produto',
    {
      description:
        'Desativa logicamente um produto da loja ativa sem excluí-lo fisicamente. Requer catalog:write. Não altera estoque.',
      inputSchema: DeactivateProductSchema,
    },
    async (args) => {
      try {
        const result = await catalogService.deactivateProduct(args);
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
        if (error instanceof ForbiddenError) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: 'FORBIDDEN' }],
          };
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text' as const, text: `Error deactivating product: ${message}` }],
        };
      }
    }
  );
}
