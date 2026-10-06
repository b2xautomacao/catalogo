import { McpServer } from '@modelcontextprotocol/server';
import { GradeService } from '../services/grade.service.js';
import { GetGradeTemplateSchema } from '../schemas/grade.schema.js';
import {
  StoreContextRequiredError,
  GradeTemplateNotFoundError,
  ForbiddenError,
} from '../domain/errors.js';

export function registerObterModeloGradeTool(server: McpServer, gradeService: GradeService) {
  server.registerTool(
    'obter_modelo_grade',
    {
      description:
        'Obtém os detalhes completos e a composição de tamanhos e quantidades de um modelo de grade específico pelo seu ID. Requer grade:read.',
      inputSchema: GetGradeTemplateSchema,
    },
    async (args) => {
      try {
        const result = await gradeService.getTemplate(args);
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
        if (error instanceof GradeTemplateNotFoundError) {
          return {
            content: [{ type: 'text' as const, text: 'GRADE_TEMPLATE_NOT_FOUND' }],
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
          content: [{ type: 'text' as const, text: `Erro ao obter modelo de grade: ${message}` }],
        };
      }
    }
  );
}
