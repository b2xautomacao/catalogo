import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/server';
import { StoreService } from '../services/store.service.js';
import { StoreNotFoundError, ForbiddenError } from '../domain/errors.js';

const BuscarLojasInputSchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters').max(100).describe('Search term (store name or slug) to discover accessible stores'),
  limit: z.number().int().min(1).max(20).default(10).describe('Maximum number of store candidates to return (max 20)'),
});

export function registerBuscarLojasTool(server: McpServer, storeService: StoreService) {
  server.registerTool(
    'buscar_lojas',
    {
      description: 'Searches and discovers stores matching a query within the authenticated principal authorized scope. Returns candidates for explicit selection. Does NOT automatically change the active store.',
      inputSchema: BuscarLojasInputSchema,
    },
    async (args) => {
      try {
        const result = await storeService.searchStores(args.query, args.limit);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error: unknown) {
        if (error instanceof StoreNotFoundError) {
          return {
            content: [{ type: 'text' as const, text: 'STORE_NOT_FOUND' }],
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
          content: [{ type: 'text' as const, text: `Error searching stores: ${message}` }],
        };
      }
    }
  );
}
