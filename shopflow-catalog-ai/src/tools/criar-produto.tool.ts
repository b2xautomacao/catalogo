import { McpServer } from '@modelcontextprotocol/server';
import { CatalogService } from '../services/catalog.service.js';
import { CreateProductSchema } from '../schemas/product.schema.js';
import {
  StoreContextRequiredError,
  CategoryNotFoundError,
  CategoryAmbiguousError,
  SkuAlreadyExistsError,
  ForbiddenError,
} from '../domain/errors.js';

export function registerCriarProdutoTool(server: McpServer, catalogService: CatalogService) {
  server.registerTool(
    'criar_produto',
    {
      description:
        'Cria um novo produto comercialmente completo na loja ativa. Executa preflight de completude: resolve categoria no catálogo, infere com segurança o tipo de produto, valida a quantidade mínima de atacado (se houver preço de atacado), deriva slug único e metadados de SEO factual. Se faltarem decisões comerciais obrigatórias (como gênero ou MOQ de atacado), retorna status "needs_input" com as perguntas necessárias antes de persistir. Não altera estoque diretamente (use ajustar_estoque para saldo inicial). Requer catalog:write.',
      inputSchema: CreateProductSchema,
    },
    async (args) => {
      try {
        const result = await catalogService.createProduct(args);
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
        if (error instanceof CategoryNotFoundError) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    status: 'needs_input',
                    code: 'CATEGORY_NOT_FOUND',
                    requested: error.requested || (args as any).category,
                    message: `Categoria "${error.requested || (args as any).category}" não encontrada na loja ativa.`,
                    suggestions: error.suggestions || [],
                    existing_categories: error.existingCategories || [],
                    actions: [
                      {
                        tool: 'criar_categoria',
                        allowed: true,
                        suggested_payload: {
                          name: error.requested || (args as any).category,
                        },
                      },
                      {
                        tool: 'listar_categorias',
                        allowed: true,
                      },
                    ],
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
        if (error instanceof CategoryAmbiguousError) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    status: 'needs_input',
                    error: 'CATEGORY_AMBIGUOUS',
                    message: error.message,
                    candidates: error.candidates,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
        if (error instanceof SkuAlreadyExistsError) {
          return {
            content: [{ type: 'text' as const, text: 'SKU_ALREADY_EXISTS' }],
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
          content: [{ type: 'text' as const, text: `Error creating product: ${message}` }],
        };
      }
    }
  );
}
