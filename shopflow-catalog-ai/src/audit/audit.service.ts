import { AuditRepository, CreateAuditLogEntry } from './audit.repository.js';
import { AgentContext } from '../auth/agent-context.js';

export class AuditService {
  constructor(private repository: AuditRepository = new AuditRepository()) {}

  async logStoreSearch(context: AgentContext, query: string, matchCount: number): Promise<void> {
    const entry: CreateAuditLogEntry = {
      session_id: context.sessionId,
      principal_type: context.principalType,
      principal_id: context.principalId,
      store_id: context.activeStoreId,
      event_type: 'store_search',
      tool_name: 'buscar_lojas',
      entity_type: 'store',
      metadata: {
        query: query.slice(0, 100),
        matchCount,
      },
    };

    this.repository.recordEvent(entry).catch((err) => {
      console.error('[AuditService] Failed to record store search event:', err);
    });
  }

  async logStoreSelected(context: AgentContext, selectedStoreId: string): Promise<void> {
    const entry: CreateAuditLogEntry = {
      session_id: context.sessionId,
      principal_type: context.principalType,
      principal_id: context.principalId,
      store_id: selectedStoreId,
      event_type: 'store_selected',
      tool_name: 'selecionar_loja',
      entity_type: 'store',
      entity_id: selectedStoreId,
      metadata: {
        previousStoreId: context.activeStoreId,
      },
    };

    this.repository.recordEvent(entry).catch((err) => {
      console.error('[AuditService] Failed to record store selection event:', err);
    });
  }

  async logStoreContextCleared(context: AgentContext): Promise<void> {
    const entry: CreateAuditLogEntry = {
      session_id: context.sessionId,
      principal_type: context.principalType,
      principal_id: context.principalId,
      store_id: null,
      event_type: 'store_context_cleared',
      tool_name: null,
      entity_type: 'store',
      metadata: {
        clearedStoreId: context.activeStoreId,
      },
    };

    this.repository.recordEvent(entry).catch((err) => {
      console.error('[AuditService] Failed to record store context cleared event:', err);
    });
  }

  async logProductCreated(
    context: AgentContext,
    productId: string,
    fields: string[]
  ): Promise<void> {
    const entry: CreateAuditLogEntry = {
      session_id: context.sessionId,
      principal_type: context.principalType,
      principal_id: context.principalId,
      store_id: context.activeStoreId,
      event_type: 'product_created',
      tool_name: 'criar_produto',
      entity_type: 'product',
      entity_id: productId,
      metadata: {
        fields,
      },
    };

    this.repository.recordEvent(entry).catch((err) => {
      console.error('[AuditService] Failed to record product created event:', err);
    });
  }

  async logProductUpdated(
    context: AgentContext,
    productId: string,
    changedFields: string[]
  ): Promise<void> {
    const entry: CreateAuditLogEntry = {
      session_id: context.sessionId,
      principal_type: context.principalType,
      principal_id: context.principalId,
      store_id: context.activeStoreId,
      event_type: 'product_updated',
      tool_name: 'atualizar_produto',
      entity_type: 'product',
      entity_id: productId,
      metadata: {
        changedFields,
      },
    };

    this.repository.recordEvent(entry).catch((err) => {
      console.error('[AuditService] Failed to record product updated event:', err);
    });
  }

  async logProductDeactivated(
    context: AgentContext,
    productId: string,
    alreadyInactive: boolean
  ): Promise<void> {
    const entry: CreateAuditLogEntry = {
      session_id: context.sessionId,
      principal_type: context.principalType,
      principal_id: context.principalId,
      store_id: context.activeStoreId,
      event_type: 'product_deactivated',
      tool_name: 'desativar_produto',
      entity_type: 'product',
      entity_id: productId,
      metadata: {
        alreadyInactive,
      },
    };

    this.repository.recordEvent(entry).catch((err) => {
      console.error('[AuditService] Failed to record product deactivated event:', err);
    });
  }

  async logStockMovement(
    context: AgentContext,
    movementId: string,
    details: Record<string, any>
  ): Promise<void> {
    const entry: CreateAuditLogEntry = {
      session_id: context.sessionId,
      principal_type: context.principalType,
      principal_id: context.principalId,
      store_id: context.activeStoreId,
      event_type: 'stock_movement_recorded',
      tool_name: 'stock_movement',
      entity_type: 'stock_movement',
      entity_id: movementId,
      metadata: details,
    };

    this.repository.recordEvent(entry).catch((err) => {
      console.error('[AuditService] Failed to record stock movement event:', err);
    });
  }

  async logStockAdjusted(
    context: AgentContext,
    movementId: string,
    details: {
      productId: string;
      variationId?: string | null;
      operation: string;
      reason: string;
      delta: number;
      unitKind: string;
    }
  ): Promise<void> {
    const entry: CreateAuditLogEntry = {
      session_id: context.sessionId,
      principal_type: context.principalType,
      principal_id: context.principalId,
      store_id: context.activeStoreId,
      event_type: 'stock_adjusted',
      tool_name: 'ajustar_estoque',
      entity_type: 'stock_movement',
      entity_id: movementId,
      metadata: {
        operation: details.operation,
        reason: details.reason,
        variationId: details.variationId || null,
        delta: details.delta,
        unitKind: details.unitKind,
      },
    };

    this.repository.recordEvent(entry).catch((err) => {
      console.error('[AuditService] Failed to record stock adjusted event:', err);
    });
  }

  async logGradeTemplateCreated(
    context: AgentContext,
    templateId: string,
    details: {
      name: string;
      itemCount: number;
      totalUnits: number;
    }
  ): Promise<void> {
    const entry: CreateAuditLogEntry = {
      session_id: context.sessionId,
      principal_type: context.principalType,
      principal_id: context.principalId,
      store_id: context.activeStoreId,
      event_type: 'grade_template_created',
      tool_name: 'criar_modelo_grade',
      entity_type: 'grade_template',
      entity_id: templateId,
      metadata: details,
    };

    this.repository.recordEvent(entry).catch((err) => {
      console.error('[AuditService] Failed to record grade template created event:', err);
    });
  }

  async logGradeAppliedToProduct(
    context: AgentContext,
    snapshotId: string,
    details: {
      productId: string;
      templateId: string;
      variationId: string;
      color: string | null;
      totalUnits: number;
    }
  ): Promise<void> {
    const entry: CreateAuditLogEntry = {
      session_id: context.sessionId,
      principal_type: context.principalType,
      principal_id: context.principalId,
      store_id: context.activeStoreId,
      event_type: 'grade_applied_to_product',
      tool_name: 'aplicar_grade_produto',
      entity_type: 'product_grade_snapshot',
      entity_id: snapshotId,
      metadata: details,
    };

    this.repository.recordEvent(entry).catch((err) => {
      console.error('[AuditService] Failed to record grade applied to product event:', err);
    });
  }

  async logProductImageAdded(
    context: AgentContext,
    imageId: string,
    details: {
      productId: string;
      isPrimary: boolean;
      imageOrder: number;
      duplicate?: boolean;
    }
  ): Promise<void> {
    const entry: CreateAuditLogEntry = {
      session_id: context.sessionId,
      principal_type: context.principalType,
      principal_id: context.principalId,
      store_id: context.activeStoreId,
      event_type: 'product_image_added',
      tool_name: 'adicionar_imagem_produto',
      entity_type: 'product_image',
      entity_id: imageId,
      metadata: details,
    };

    this.repository.recordEvent(entry).catch((err) => {
      console.error('[AuditService] Failed to record product image added event:', err);
    });
  }

  async logProductImagePrimaryChanged(
    context: AgentContext,
    imageId: string,
    productId: string
  ): Promise<void> {
    const entry: CreateAuditLogEntry = {
      session_id: context.sessionId,
      principal_type: context.principalType,
      principal_id: context.principalId,
      store_id: context.activeStoreId,
      event_type: 'product_image_primary_changed',
      tool_name: 'definir_imagem_principal',
      entity_type: 'product_image',
      entity_id: imageId,
      metadata: { productId },
    };

    this.repository.recordEvent(entry).catch((err) => {
      console.error('[AuditService] Failed to record product image primary changed event:', err);
    });
  }

  async logProductImageRemoved(
    context: AgentContext,
    imageId: string,
    productId: string,
    newPrimaryId?: string | null
  ): Promise<void> {
    const entry: CreateAuditLogEntry = {
      session_id: context.sessionId,
      principal_type: context.principalType,
      principal_id: context.principalId,
      store_id: context.activeStoreId,
      event_type: 'product_image_removed',
      tool_name: 'remover_imagem_produto',
      entity_type: 'product_image',
      entity_id: imageId,
      metadata: { productId, hadNewPrimary: !!newPrimaryId },
    };

    this.repository.recordEvent(entry).catch((err) => {
      console.error('[AuditService] Failed to record product image removed event:', err);
    });
  }

  async logTenantDefaultsUpdated(
    context: AgentContext,
    storeId: string,
    updatedFields: string[]
  ): Promise<void> {
    const entry: CreateAuditLogEntry = {
      session_id: context.sessionId,
      principal_type: context.principalType,
      principal_id: context.principalId,
      store_id: storeId,
      event_type: 'tenant_intake_defaults_updated',
      tool_name: 'atualizar_defaults_cadastro_produto',
      entity_type: 'store_settings',
      entity_id: storeId,
      metadata: { updatedFields },
    };

    this.repository.recordEvent(entry).catch((err) => {
      console.error('[AuditService] Failed to record tenant defaults updated event:', err);
    });
  }
}

