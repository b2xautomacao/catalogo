import { McpServer } from '@modelcontextprotocol/server';
import { GradeService } from '../services/grade.service.js';
import { ApplyGradeToProductSchema } from '../schemas/grade.schema.js';
import {
  StoreContextRequiredError,
  ProductNotFoundError,
  GradeTemplateNotFoundError,
  SkuAlreadyExistsError,
  ForbiddenError,
} from '../domain/errors.js';

export function registerAplicarGradeProdutoTool(server: McpServer, gradeService: GradeService) {
  server.registerTool(
    'aplicar_grade_produto',
    {
      description:
        'Aplica um modelo de grade a um produto na loja ativa, criando um snapshot imutável da composição e uma variação de grade com estoque inicial zero. Requer grade:write.',
      inputSchema: ApplyGradeToProductSchema,
    },
    async (args) => {
      try {
        const result = await gradeService.applyGradeToProduct(args);
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
        if (error instanceof ProductNotFoundError) {
          return {
            content: [{ type: 'text' as const, text: 'PRODUCT_NOT_FOUND' }],
          };
        }
        if (error instanceof GradeTemplateNotFoundError) {
          return {
            content: [{ type: 'text' as const, text: 'GRADE_TEMPLATE_NOT_FOUND' }],
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
          content: [{ type: 'text' as const, text: `Erro ao aplicar grade ao produto: ${message}` }],
        };
      }
    }
  );
}
