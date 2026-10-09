import { McpServer } from '@modelcontextprotocol/server';
import { CatalogService } from '../services/catalog.service.js';
import { AtualizarDefaultsCadastroProdutoSchema } from '../schemas/product-intake.schema.js';
import { StoreContextRequiredError, ForbiddenError } from '../domain/errors.js';

export function registerAtualizarDefaultsCadastroProdutoTool(
  server: McpServer,
  catalogService: CatalogService
) {
  server.registerTool(
    'atualizar_defaults_cadastro_produto',
    {
      description:
        'Atualiza os padrões de cadastro e intake (Tenant Defaults) da loja ativa. Permite configurar quantidade mínima de atacado padrão (ex: 6 peças), ativando preenchimento automático para produtos sem MOQ informado, reduzindo perguntas repetitivas de forma segura. Também permite ajustar flags de auto SKU, auto slug, auto SEO e políticas de importação. Requer catalog:write.',
      inputSchema: AtualizarDefaultsCadastroProdutoSchema,
    },
    async (args) => {
      try {
        const updated = await catalogService.updateIntakeDefaults(args);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  status: 'updated',
                  defaults: updated,
                },
                null,
                2
              ),
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
