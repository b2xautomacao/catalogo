import { McpServer } from '@modelcontextprotocol/server';
import { CatalogService } from '../services/catalog.service.js';
import { ListCategoriesSchema } from '../schemas/category.schema.js';
import { StoreContextRequiredError, ForbiddenError } from '../domain/errors.js';

export function registerListarCategoriasTool(
  server: McpServer,
  catalogService: CatalogService
) {
  server.registerTool(
    'listar_categorias',
    {
      description:
        'WHEN TO USE: Lista as categorias existentes no catálogo da loja ativa com paginação e filtro opcional por nome. ' +
        'REQUIRED SCOPE: catalog:read. ' +
        'WHAT IT RETURNS: Lista de categorias com id, name, description, is_active e contagem total. ' +
        'WHAT TOOL USUALLY COMES NEXT: Use os IDs ou nomes em preparar_produto ou criar_produto. ' +
        'INPUT: query (opcional), limit (opcional, padrão 50), offset (opcional, padrão 0).',
      inputSchema: ListCategoriesSchema,
    },
    async (args) => {
      try {
        const result = await catalogService.listCategories(args);
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
          content: [{ type: 'text' as const, text: `Error listing categories: ${message}` }],
        };
      }
    }
  );
}
