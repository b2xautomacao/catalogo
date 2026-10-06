import { McpServer } from '@modelcontextprotocol/server';
import { StoreService } from '../services/store.service.js';
import { NoActiveStoreError, StoreNotFoundError, ForbiddenError } from '../domain/errors.js';

export function registerObterLojaAtivaTool(server: McpServer, storeService: StoreService) {
  server.registerTool(
    'obter_loja_ativa',
    {
      description: 'Returns safe information about the currently active store in this session. Returns NO_ACTIVE_STORE if no store is active.',
    },
    async () => {
      try {
        const store = await storeService.getActiveStore();
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(store, null, 2) }],
        };
      } catch (error: unknown) {
        if (error instanceof NoActiveStoreError) {
          return {
            content: [{ type: 'text' as const, text: 'NO_ACTIVE_STORE' }],
          };
        }
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
          content: [{ type: 'text' as const, text: `Error retrieving active store: ${message}` }],
        };
      }
    }
  );
}
