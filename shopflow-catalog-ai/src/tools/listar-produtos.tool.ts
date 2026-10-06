import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/server";
import { CatalogService } from '../services/catalog.service.js';
import { StoreContextRequiredError } from '../domain/errors.js';

const ListarProdutosInputSchema = z.object({
  nome: z.string().optional().describe('Filter products by name (partial, case-insensitive match)'),
  sku: z.string().optional().describe('Filter by exact SKU code'),
  ativo: z.boolean().optional().describe('Filter by active/inactive status'),
  page: z.number().int().min(1).default(1).describe('Page number, 1-indexed'),
  limit: z.number().int().min(1).max(50).default(20).describe('Items per page (max 50)'),
});

export function registerListarProdutosTool(server: McpServer, catalogService: CatalogService) {
  server.registerTool(
    "listar_produtos",
    {
      description: "Lists products in the catalog with optional filters (name, SKU, active status) and pagination. Returns a paginated list of products.",
      inputSchema: ListarProdutosInputSchema
    },
    async (args) => {
      try {
        const offset = (args.page - 1) * args.limit;
        const products = await catalogService.listProducts({
          nome: args.nome,
          sku: args.sku,
          ativo: args.ativo,
          limit: args.limit,
          offset
        });
        return {
          content: [{ type: "text" as const, text: JSON.stringify(products, null, 2) }]
        };
      } catch (error: unknown) {
        if (error instanceof StoreContextRequiredError) {
          return {
            content: [{ type: "text" as const, text: "STORE_CONTEXT_REQUIRED" }]
          };
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error listing products: ${message}` }]
        };
      }
    }
  );
}
