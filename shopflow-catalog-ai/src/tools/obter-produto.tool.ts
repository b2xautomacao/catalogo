import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/server";
import { CatalogService } from '../services/catalog.service.js';
import { ProductNotFoundError, StoreContextRequiredError } from '../domain/errors.js';

const ObterProdutoInputSchema = z.object({
  product_id: z.string().uuid().describe('The UUID of the product to fetch')
});

export function registerObterProdutoTool(server: McpServer, catalogService: CatalogService) {
  server.registerTool(
    "obter_produto",
    {
      description: "Fetches full details for a specific product by its UUID, including images and variations. Always returns PRODUCT_NOT_FOUND for non-existent or cross-tenant IDs.",
      inputSchema: ObterProdutoInputSchema
    },
    async (args) => {
      try {
        const product = await catalogService.getProduct(args.product_id);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(product, null, 2) }]
        };
      } catch (error: unknown) {
        if (error instanceof StoreContextRequiredError) {
          return {
            content: [{ type: "text" as const, text: "STORE_CONTEXT_REQUIRED" }]
          };
        }
        if (error instanceof ProductNotFoundError) {
          return {
            content: [{ type: "text" as const, text: "PRODUCT_NOT_FOUND" }]
          };
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error fetching product: ${message}` }]
        };
      }
    }
  );
}
