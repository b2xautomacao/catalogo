import { McpServer } from '@modelcontextprotocol/server';
import { CatalogService } from '../services/catalog.service.js';
import { PrepararProdutoSchema } from '../schemas/product-intake.schema.js';
import { StoreContextRequiredError, ForbiddenError } from '../domain/errors.js';

export function registerPrepararProdutoTool(server: McpServer, catalogService: CatalogService) {
  server.registerTool(
    'preparar_produto',
    {
      description:
        'Executa o preflight e preparação de um produto individual a partir de dados básicos, texto livre ou aliases de planilha, SEM PERSISTIR no banco. Normaliza colunas, resolve categoria no catálogo da loja ativa, infere tipo de categoria, aplica padrões da loja (Tenant Defaults, como MOQ de atacado), deriva SKU, slug único e SEO factual, e classifica o intake em AUTO, ASK ou BLOCK. Retorna o status ("ready", "needs_input" ou "blocked"), dados resolvidos prontos para criação e intenção de estoque para ledger posterior. Requer catalog:read.',
      inputSchema: PrepararProdutoSchema,
    },
    async (args) => {
      try {
        const result = await catalogService.prepareProduct(args);
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
