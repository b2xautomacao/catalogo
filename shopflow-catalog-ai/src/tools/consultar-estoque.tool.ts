import { McpServer } from '@modelcontextprotocol/server';
import { InventoryService } from '../services/inventory.service.js';
import { ConsultarEstoqueSchema } from '../schemas/inventory.schema.js';
import {
  StoreContextRequiredError,
  InventoryTargetNotFoundError,
  ForbiddenError,
} from '../domain/errors.js';

export function registerConsultarEstoqueTool(server: McpServer, inventoryService: InventoryService) {
  server.registerTool(
    'consultar_estoque',
    {
      description:
        'Consulta o saldo de estoque atual, unidade (unit vs pack) e status de integridade de um produto ou variação na loja ativa. Requer stock:read.',
      inputSchema: ConsultarEstoqueSchema,
    },
    async (args) => {
      try {
        const result = await inventoryService.consultarEstoque(args);
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
        if (error instanceof InventoryTargetNotFoundError) {
          return {
            content: [{ type: 'text' as const, text: 'INVENTORY_TARGET_NOT_FOUND' }],
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
          content: [{ type: 'text' as const, text: `Erro ao consultar estoque: ${message}` }],
        };
      }
    }
  );
}
