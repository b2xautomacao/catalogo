import { McpServer } from '@modelcontextprotocol/server';
import { CatalogService } from '../services/catalog.service.js';
import { AnalisarImportacaoProdutosSchema } from '../schemas/product-intake.schema.js';
import {
  StoreContextRequiredError,
  ForbiddenError,
  ImportBatchTooLargeError,
} from '../domain/errors.js';

export function registerAnalisarImportacaoProdutosTool(
  server: McpServer,
  catalogService: CatalogService
) {
  server.registerTool(
    'analisar_importacao_produtos',
    {
      description:
        'Analisa e prepara um lote de produtos (extraído de CSV, planilha ou ERP, máximo 100 itens) SEM PERSISTIR no banco. Normaliza aliases de colunas, resolve categorias em lote contra o catálogo da loja ativa, aplica defaults do tenant (como quantidade mínima de atacado padrão), deriva SKU, slug e SEO factual, e agrupa decisões coletivas (evitando centenas de perguntas repetidas). Retorna resumo (ready, needs_input, invalid), decisões agrupadas e produtos prontos para execução. Requer catalog:read.',
      inputSchema: AnalisarImportacaoProdutosSchema,
    },
    async (args) => {
      try {
        const result = await catalogService.analyzeImport(args);
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
        if (error instanceof ImportBatchTooLargeError) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    error: 'IMPORT_BATCH_TOO_LARGE',
                    message: error.message,
                    max_items: error.maxItems,
                  },
                  null,
                  2
                ),
              },
            ],
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
