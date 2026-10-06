import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/server';
import { StoreService } from '../services/store.service.js';
import { StoreNotFoundError, ForbiddenError } from '../domain/errors.js';

const SelecionarLojaInputSchema = z.object({
  store_id: z.string().uuid('store_id must be a valid UUID').describe('The unique UUID identifier of the store to activate for subsequent operations in this session'),
});

export function registerSelecionarLojaTool(server: McpServer, storeService: StoreService) {
  server.registerTool(
    'selecionar_loja',
    {
      description: 'Explicitly selects and activates a store for the current session. Validates that the store exists and that the principal is authorized to access it. Unlocks tenant-scoped catalog tools.',
      inputSchema: SelecionarLojaInputSchema,
    },
    async (args) => {
      try {
        const store = await storeService.selectStore(args.store_id);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  status: 'STORE_ACTIVATED',
                  activeStore: store,
                },
                null,
                2
              ),
            },
          ],
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
          content: [{ type: 'text' as const, text: `Error selecting store: ${message}` }],
        };
      }
    }
  );
}
