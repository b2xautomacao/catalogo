import { McpServer } from "@modelcontextprotocol/server";
import { CatalogService } from '../services/catalog.service.js';

export function registerCatalogHealthTool(server: McpServer, catalogService: CatalogService) {
  server.registerTool(
    "catalog_health",
    {
      description: "Checks the health of the MCP server and its connection to the tenant's catalog in the database. Returns connectivity status."
    },
    async () => {
      try {
        const health = await catalogService.checkHealth();
        return {
          content: [{ type: "text" as const, text: JSON.stringify(health, null, 2) }]
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Health check failed: ${message}` }]
        };
      }
    }
  );
}
