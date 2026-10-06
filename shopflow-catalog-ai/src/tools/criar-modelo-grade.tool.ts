import { McpServer } from '@modelcontextprotocol/server';
import { GradeService } from '../services/grade.service.js';
import { CreateGradeTemplateSchema } from '../schemas/grade.schema.js';
import {
  StoreContextRequiredError,
  GradeTemplateAlreadyExistsError,
  ForbiddenError,
} from '../domain/errors.js';

export function registerCriarModeloGradeTool(server: McpServer, gradeService: GradeService) {
  server.registerTool(
    'criar_modelo_grade',
    {
      description:
        'Cria um novo modelo de grade customizado para a loja ativa com sua composição de tamanhos e quantidades por caixa. Requer grade:write.',
      inputSchema: CreateGradeTemplateSchema,
    },
    async (args) => {
      try {
        const result = await gradeService.createTemplate(args);
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
        if (error instanceof GradeTemplateAlreadyExistsError) {
          return {
            content: [{ type: 'text' as const, text: 'GRADE_TEMPLATE_ALREADY_EXISTS' }],
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
          content: [{ type: 'text' as const, text: `Erro ao criar modelo de grade: ${message}` }],
        };
      }
    }
  );
}
