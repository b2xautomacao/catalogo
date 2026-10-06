import { McpServer } from '@modelcontextprotocol/server';
import { InventoryService } from '../services/inventory.service.js';
import { AdjustStockSchema } from '../schemas/inventory.schema.js';
import {
  StoreContextRequiredError,
  InventoryTargetNotFoundError,
  InsufficientStockError,
  InvalidStockOperationError,
  IdempotencyConflictError,
  InvalidArgumentError,
  ForbiddenError,
} from '../domain/errors.js';

export function registerAjustarEstoqueTool(server: McpServer, inventoryService: InventoryService) {
  server.registerTool(
    'ajustar_estoque',
    {
      description:
        'Ajusta o estoque de um produto simples ou variação na loja ativa da sessão. Suporta increase, decrease e count físico. Registra movimentação no ledger e atualiza o saldo operacional atomicamente. Requer stock:adjust.',
      inputSchema: AdjustStockSchema,
    },
    async (args) => {
      try {
        const result = await inventoryService.adjustStock(args);
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
        if (error instanceof InsufficientStockError) {
          return {
            content: [{ type: 'text' as const, text: 'INSUFFICIENT_STOCK' }],
          };
        }
        if (error instanceof InvalidStockOperationError) {
          return {
            content: [{ type: 'text' as const, text: error.message }],
          };
        }
        if (error instanceof IdempotencyConflictError) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: 'IDEMPOTENCY_CONFLICT' }],
          };
        }
        if (error instanceof InvalidArgumentError) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: 'INVALID_ARGUMENT' }],
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
          content: [{ type: 'text' as const, text: `Erro ao ajustar estoque: ${message}` }],
        };
      }
    }
  );
}
