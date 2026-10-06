import { McpServer } from '@modelcontextprotocol/server';
import { GradeService } from '../services/grade.service.js';
import { ListGradeTemplatesSchema } from '../schemas/grade.schema.js';
import { StoreContextRequiredError, ForbiddenError } from '../domain/errors.js';

export function registerListarModelosGradeTool(server: McpServer, gradeService: GradeService) {
  server.registerTool(
    'listar_modelos_grade',
    {
      description:
        'Lista os modelos de grade disponíveis (templates canônicos do sistema + modelos customizados da loja ativa). Suporta filtros por busca textual, categoria e tipo (system/custom). Requer grade:read.',
      inputSchema: ListGradeTemplatesSchema,
    },
    async (args) => {
      try {
        const result = await gradeService.listTemplates(args);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ templates: result }, null, 2),
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
          content: [{ type: 'text' as const, text: `Erro ao listar modelos de grade: ${message}` }],
        };
      }
    }
  );
}
