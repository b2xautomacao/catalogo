import { GradeRepository, ListGradeTemplatesFilter } from '../repositories/grade.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { AgentSession } from '../auth/agent-session.js';
import { requireScope, requireActiveStore } from '../auth/agent-context.js';
import {
  GradeTemplateWithItems,
  GradeTemplateListItem,
  ApplyGradeToProductResult,
} from '../domain/grade.types.js';
import {
  ListGradeTemplatesInput,
  GetGradeTemplateInput,
  CreateGradeTemplateInput,
  ApplyGradeToProductInput,
} from '../schemas/grade.schema.js';
import { GradeTemplateNotFoundError } from '../domain/errors.js';

export class GradeService {
  constructor(
    private session: AgentSession,
    private repository: GradeRepository = new GradeRepository(),
    private auditService: AuditService = new AuditService()
  ) {}

  async listTemplates(input: ListGradeTemplatesInput = {}): Promise<GradeTemplateListItem[]> {
    const context = this.session.getContext();
    requireScope(context, 'grade:read');
    const activeStoreId = requireActiveStore(context);

    const filter: ListGradeTemplatesFilter = {
      query: input.query,
      productCategoryType: input.product_category_type,
      type: input.type,
      limit: input.limit,
      offset: input.offset,
    };

    return this.repository.listTemplates(activeStoreId, filter);
  }

  async getTemplate(input: GetGradeTemplateInput): Promise<GradeTemplateWithItems> {
    const context = this.session.getContext();
    requireScope(context, 'grade:read');
    const activeStoreId = requireActiveStore(context);

    const template = await this.repository.getTemplateById(
      activeStoreId,
      input.grade_template_id
    );

    if (!template) {
      throw new GradeTemplateNotFoundError(
        `Modelo de grade "${input.grade_template_id}" não encontrado na loja ativa`
      );
    }

    return template;
  }

  async createTemplate(input: CreateGradeTemplateInput): Promise<GradeTemplateWithItems> {
    const context = this.session.getContext();
    requireScope(context, 'grade:write');
    const activeStoreId = requireActiveStore(context);

    const template = await this.repository.createStoreTemplate({
      storeId: activeStoreId,
      name: input.name,
      productCategoryType: input.product_category_type,
      items: input.items,
    });

    await this.auditService.logGradeTemplateCreated(context, template.id, {
      name: template.name,
      itemCount: template.items.length,
      totalUnits: template.total_units,
    });

    return template;
  }

  async applyGradeToProduct(input: ApplyGradeToProductInput): Promise<ApplyGradeToProductResult> {
    const context = this.session.getContext();
    requireScope(context, 'grade:write');
    const activeStoreId = requireActiveStore(context);

    const result = await this.repository.applyGradeToProduct(activeStoreId, {
      productId: input.product_id,
      gradeTemplateId: input.grade_template_id,
      color: input.color,
      sku: input.sku,
      name: input.name,
    });

    await this.auditService.logGradeAppliedToProduct(context, result.snapshot_id, {
      productId: input.product_id,
      templateId: input.grade_template_id,
      variationId: result.variation_id,
      color: result.color,
      totalUnits: result.total_units,
    });

    return result;
  }
}
