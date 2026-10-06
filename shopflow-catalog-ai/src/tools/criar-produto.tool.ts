import { McpServer } from '@modelcontextprotocol/server';
import { CatalogService } from '../services/catalog.service.js';
import { CreateProductSchema } from '../schemas/product.schema.js';
import {
  StoreContextRequiredError,
  CategoryNotFoundError,
  SkuAlreadyExistsError,
  ForbiddenError,
} from '../domain/errors.js';

export function registerCriarProdutoTool(server: McpServer, catalogService: CatalogService) {
  server.registerTool(
    'criar_produto',
    {
      description:
        'Cria persistentemente um novo produto na loja ativa da sessão. Requer catalog:write. Não altera estoque.',
      inputSchema: CreateProductSchema,
    },
    async (args) => {
      try {
        const product = await catalogService.createProduct(args);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  created: true,
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
        if (error instanceof ForbiddenError) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: 'FORBIDDEN' }],
          };
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text' as const, text: `Error creating product: ${message}` }],
        };
      }
    }
  );
}
