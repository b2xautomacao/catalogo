import { McpServer } from '@modelcontextprotocol/server';
import { CatalogService } from '../services/catalog.service.js';
import { CreateCategorySchema } from '../schemas/category.schema.js';
import { StoreContextRequiredError, ForbiddenError } from '../domain/errors.js';

export function registerCriarCategoriaTool(
  server: McpServer,
  catalogService: CatalogService
) {
  server.registerTool(
    'criar_categoria',
    {
      description:
        'WHEN TO USE: Cria uma nova categoria no catálogo da loja ativa de forma segura e idempotente, ou retorna a existente se o nome já estiver cadastrado. ' +
        'REQUIRED SCOPE: catalog:write. ' +
        'WHAT IT RETURNS: Objeto com id, name, store_id, is_active e flags created/already_exists. ' +
        'WHAT TOOL USUALLY COMES NEXT: Use o category_id retornado em preparar_produto ou criar_produto. ' +
        'IMPORTANT FIELD NAMES: name (obrigatório, string), description (opcional).',
      inputSchema: CreateCategorySchema,
    },
    async (args) => {
      try {
        const result = await catalogService.createCategory(args);
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
          content: [{ type: 'text' as const, text: `Error creating category: ${message}` }],
        };
      }
    }
  );
}
