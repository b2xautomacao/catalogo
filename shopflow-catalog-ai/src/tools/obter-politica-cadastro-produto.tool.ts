import { McpServer } from '@modelcontextprotocol/server';
import { CatalogService } from '../services/catalog.service.js';
import { ObterPoliticaCadastroProdutoSchema } from '../schemas/product-intake.schema.js';
import { StoreContextRequiredError, ForbiddenError } from '../domain/errors.js';

export function registerObterPoliticaCadastroProdutoTool(
  server: McpServer,
  catalogService: CatalogService
) {
  server.registerTool(
    'obter_politica_cadastro_produto',
    {
      description:
        'Consulta a Política de Cadastro de Produtos (Product Intake Policy) da loja ativa. Retorna o contrato estruturado de campos obrigatórios, condicionais, deriváveis, resolvíveis no catálogo, defaults configurados pelo tenant, regras estritas de não-invenção de atributos e diretrizes de estoque ledger e imagem. Permite que o agente saiba exatamente o que pode derivar, o que pode usar como padrão e quando deve perguntar ao usuário. Requer catalog:read.',
      inputSchema: ObterPoliticaCadastroProdutoSchema,
    },
    async () => {
      try {
        const policy = await catalogService.getIntakePolicy();
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(policy, null, 2),
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
