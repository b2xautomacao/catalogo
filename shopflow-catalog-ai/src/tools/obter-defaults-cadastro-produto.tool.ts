import { McpServer } from '@modelcontextprotocol/server';
import { CatalogService } from '../services/catalog.service.js';
import { ObterDefaultsCadastroProdutoSchema } from '../schemas/product-intake.schema.js';
import { StoreContextRequiredError, ForbiddenError } from '../domain/errors.js';

export function registerObterDefaultsCadastroProdutoTool(
  server: McpServer,
  catalogService: CatalogService
) {
  server.registerTool(
    'obter_defaults_cadastro_produto',
    {
      description:
        'Consulta os padrões configurados pelo lojista (Tenant Defaults) para cadastro de produtos na loja ativa. Retorna a quantidade mínima de atacado padrão (se configurada), flags de geração automática de SKU, slug e SEO, comportamento da primeira imagem e modo de estoque na importação. Requer catalog:read.',
      inputSchema: ObterDefaultsCadastroProdutoSchema,
    },
    async () => {
      try {
        const defaults = await catalogService.getIntakeDefaults();
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(defaults, null, 2),
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
