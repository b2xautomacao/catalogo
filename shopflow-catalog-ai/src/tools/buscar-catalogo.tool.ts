import { McpServer } from '@modelcontextprotocol/server';
import { CatalogService } from '../services/catalog.service.js';
import { BuscarCatalogoSchema } from '../schemas/search.schema.js';
import {
  StoreContextRequiredError,
  ForbiddenError,
} from '../domain/errors.js';

export function registerBuscarCatalogoTool(
  server: McpServer,
  catalogService: CatalogService
) {
  server.registerTool(
    'buscar_catalogo',
    {
      description:
        'Busca inteligente e diagnóstico operacional do catálogo de produtos com suporte a múltiplos filtros, grade, status de estoque e paginação.',
      inputSchema: BuscarCatalogoSchema,
    },
    async (args) => {
      try {
        const result = await catalogService.searchCatalog(args);
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
          content: [{ type: 'text' as const, text: `Error in search: ${message}` }],
        };
      }
    }
  );
}
