import { McpServer } from '@modelcontextprotocol/server';
import { CatalogService } from '../services/catalog.service.js';
import { BulkUpdateProductsSchema } from '../schemas/product.schema.js';
import {
  StoreContextRequiredError,
  ForbiddenError,
} from '../domain/errors.js';

export function registerAtualizarProdutosEmLoteTool(
  server: McpServer,
  catalogService: CatalogService
) {
  server.registerTool(
    'atualizar_produtos_em_lote',
    {
      description:
        'Atualiza em lote campos permitidos (is_active, category, material, gender, is_featured, retail_price, wholesale_price, min_wholesale_qty) de produtos pertencentes à loja ativa. Requer catalog:write e operation_id. Limite de 100 produtos.',
      inputSchema: BulkUpdateProductsSchema,
    },
    async (args) => {
      try {
        const result = await catalogService.bulkUpdateProducts(args);
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
        if (error instanceof ForbiddenError) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: 'FORBIDDEN' }],
          };
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text' as const, text: `Error in bulk update: ${message}` }],
        };
      }
    }
  );
}
