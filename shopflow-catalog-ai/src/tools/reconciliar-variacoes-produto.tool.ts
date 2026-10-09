import { McpServer } from '@modelcontextprotocol/server';
import { CatalogService } from '../services/catalog.service.js';
import { ReconciliarVariacoesSchema } from '../schemas/variation.schema.js';
import { StoreContextRequiredError, ForbiddenError, ProductNotFoundError } from '../domain/errors.js';

export function registerReconciliarVariacoesProdutoTool(
  server: McpServer,
  catalogService: CatalogService
) {
  server.registerTool(
    'reconciliar_variacoes_produto',
    {
      description:
        'Reconcilia as variações unitárias de um produto (ex: tamanhos 37..42, cores Preto/Branco, matriz cor+tamanho) de forma segura, não-destrutiva e idempotente. Preserva rigorosamente os IDs de variações já existentes, mantém saldos de estoque intactos, insere novas variações com estoque inicial zero e desativa com segurança (is_active = false) variações que não constam mais na matriz desejada (sem delete/reinsert destrutivo). Sincroniza vínculos de componentes com snapshots de grade ativos. Requer catalog:write.',
      inputSchema: ReconciliarVariacoesSchema,
    },
    async (args) => {
      try {
        const result = await catalogService.reconcileVariations(args);
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
            content: [{ type: 'text' as const, text: 'FORBIDDEN' }],
          };
        }
        if (error instanceof ProductNotFoundError) {
          return {
            content: [{ type: 'text' as const, text: 'PRODUCT_NOT_FOUND' }],
          };
        }
        return {
          content: [
            {
              type: 'text' as const,
              text: `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );
}
