import { McpServer } from "@modelcontextprotocol/server";
import { CatalogService } from '../services/catalog.service.js';
import { GetProductSchema } from '../schemas/product.schema.js';
import { ProductNotFoundError, StoreContextRequiredError } from '../domain/errors.js';

export function registerObterProdutoTool(server: McpServer, catalogService: CatalogService) {
  server.registerTool(
    "obter_produto",
    {
      description:
        "WHEN TO USE: Obtém os detalhes completos de um produto específico (preços, estoque, imagens, variações) por UUID. " +
        "REQUIRED SCOPE: catalog:read. " +
        "INPUT: Aceita 'product_id' ou 'id' como UUID. " +
        "WHAT IT RETURNS: Objeto de produto sanitizado com imagens e variações. Retorna PRODUCT_NOT_FOUND para IDs inexistentes ou de outra loja.",
      inputSchema: GetProductSchema
    },
    async (args) => {
      try {
        const productId = (args.product_id || (args as any).id)!;
        const product = await catalogService.getProduct(productId);
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
