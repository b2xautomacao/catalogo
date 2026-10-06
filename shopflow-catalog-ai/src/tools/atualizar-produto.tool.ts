import { McpServer } from '@modelcontextprotocol/server';
import { CatalogService } from '../services/catalog.service.js';
import { UpdateProductSchema } from '../schemas/product.schema.js';
import {
  StoreContextRequiredError,
  ProductNotFoundError,
  CategoryNotFoundError,
  SkuAlreadyExistsError,
  NoChangesProvidedError,
  ForbiddenError,
} from '../domain/errors.js';

export function registerAtualizarProdutoTool(server: McpServer, catalogService: CatalogService) {
  server.registerTool(
    'atualizar_produto',
    {
      description:
        'Atualiza somente campos permitidos de um produto pertencente à loja ativa. Requer catalog:write. Não altera estoque.',
      inputSchema: UpdateProductSchema,
    },
    async (args) => {
      try {
        const product = await catalogService.updateProduct(args);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  updated: true,
                  product,
                },
                null,
                2
              ),
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
        if (error instanceof CategoryNotFoundError) {
          return {
            content: [{ type: 'text' as const, text: 'CATEGORY_NOT_FOUND' }],
          };
        }
        if (error instanceof SkuAlreadyExistsError) {
          return {
            content: [{ type: 'text' as const, text: 'SKU_ALREADY_EXISTS' }],
          };
        }
        if (error instanceof NoChangesProvidedError) {
          return {
            content: [{ type: 'text' as const, text: 'NO_CHANGES_PROVIDED' }],
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
          content: [{ type: 'text' as const, text: `Error updating product: ${message}` }],
        };
      }
    }
  );
}
