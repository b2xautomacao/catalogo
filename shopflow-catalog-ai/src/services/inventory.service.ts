import { InventoryRepository, StockMovementFilter } from '../repositories/inventory.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { AgentSession } from '../auth/agent-session.js';
import { requireScope, requireActiveStore } from '../auth/agent-context.js';
import {
  ProductNotFoundError,
  VariationNotFoundError,
  StockTargetMismatchError,
  DuplicateIdempotencyKeyError,
  InsufficientStockError,
  InvalidStockOperationError,
  InventoryTargetNotFoundError,
  ForbiddenError,
} from '../domain/errors.js';
import {
  StockMovementRecord,
  CreateStockMovementRecord,
  ProductStockState,
  VariationStockState,
  StockReconciliationResult,
  StockMovementType,
  StockUnitKind,
  StockReasonCode,
  StockSourceType,
  AdjustStockResult,
  ConsultarEstoqueResult,
} from '../domain/inventory.types.js';
import { AdjustStockInput, ConsultarEstoqueInput } from '../schemas/inventory.schema.js';

export interface ApplyStockMovementInput {
  productId: string;
  variationId?: string | null;
  movementType: StockMovementType;
  unitKind?: StockUnitKind;
  quantity: number;
  physicalQuantity?: number;
  idempotencyKey?: string | null;
  reasonCode?: StockReasonCode | string | null;
  sourceType?: StockSourceType;
  sourceId?: string | null;
  parentMovementId?: string | null;
  notes?: string | null;
  expiresAt?: string | null;
}

export interface ApplyStockMovementResult {
  movement: StockMovementRecord;
  isDuplicate: boolean;
  affectedProductStock: number;
  affectedVariationStock: number | null;
}

export class InventoryService {
  constructor(
    private session: AgentSession,
    private repository: InventoryRepository = new InventoryRepository(),
    private auditService: AuditService = new AuditService()
  ) {}

  async getProductStock(productId: string): Promise<ProductStockState> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:read');
    const activeStoreId = requireActiveStore(context);

    const state = await this.repository.getProductStockState(activeStoreId, productId);
    if (!state) {
      throw new ProductNotFoundError(`Product ${productId} not found in store`);
    }

    return state;
  }

  async getVariationStock(productId: string, variationId: string): Promise<VariationStockState> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:read');
    const activeStoreId = requireActiveStore(context);

    // Validar produto
    const prodState = await this.repository.getProductStockState(activeStoreId, productId);
    if (!prodState) {
      throw new ProductNotFoundError(`Product ${productId} not found in store`);
    }

    const varState = await this.repository.getVariationStockState(
      activeStoreId,
      productId,
      variationId
    );
    if (!varState) {
      throw new VariationNotFoundError(`Variation ${variationId} not found for product ${productId}`);
    }

    return varState;
  }

  async listMovements(filter: StockMovementFilter = {}): Promise<StockMovementRecord[]> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:read');
    const activeStoreId = requireActiveStore(context);

    return this.repository.listMovements(activeStoreId, filter);
  }

  async reconcileStock(productId: string): Promise<StockReconciliationResult> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:read');
    const activeStoreId = requireActiveStore(context);

    const prod = await this.repository.getProductStockState(activeStoreId, productId);
    if (!prod) {
      throw new ProductNotFoundError(`Product ${productId} not found in store`);
    }

    return this.repository.reconcileProductStock(activeStoreId, productId);
  }

  async recordSafeMovement(input: ApplyStockMovementInput): Promise<ApplyStockMovementResult> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:write');
    const activeStoreId = requireActiveStore(context);

    if (input.quantity === 0) {
      throw new InvalidStockOperationError('QUANTITY_CANNOT_BE_ZERO');
    }

    // 1. Verificar idempotência se chave fornecida
    if (input.idempotencyKey) {
      const existing = await this.repository.getMovementByIdempotencyKey(
        activeStoreId,
        input.idempotencyKey
      );
      if (existing) {
        return {
          movement: existing,
          isDuplicate: true,
          affectedProductStock: existing.new_stock,
          affectedVariationStock: null,
        };
      }
    }

    // 2. Validar produto
    const productState = await this.repository.getProductStockState(activeStoreId, input.productId);
    if (!productState) {
      throw new ProductNotFoundError(`Product ${input.productId} not found in store`);
    }

    // 3. Validar variação se informada
    let variationState: VariationStockState | null = null;
    let computedPhysicalQty = input.quantity;

    if (input.variationId) {
      variationState = await this.repository.getVariationStockState(
        activeStoreId,
        input.productId,
        input.variationId
      );

      if (!variationState) {
        throw new StockTargetMismatchError(
          `Variation ${input.variationId} does not belong to product ${input.productId}`
        );
      }

      // Calcular equivalência de unidades físicas se for grade fechada / pack
      if (input.unitKind === 'pack' || variationState.isGrade) {
        if (Array.isArray(variationState.gradePairs) && variationState.gradePairs.length > 0) {
          const pairsPerPack = variationState.gradePairs.reduce((sum, n) => sum + (Number(n) || 0), 0);
          computedPhysicalQty = input.quantity * (pairsPerPack > 0 ? pairsPerPack : 1);
        } else if (input.physicalQuantity) {
          computedPhysicalQty = input.physicalQuantity;
        }
      }
    }

    // 4. Calcular novos saldos conceituais
    const prevStock = variationState ? variationState.stock : productState.stock;
    let newStock = prevStock;

    if (input.movementType === 'sale') {
      newStock = prevStock - Math.abs(input.quantity);
    } else if (input.movementType === 'return') {
      newStock = prevStock + Math.abs(input.quantity);
    } else if (input.movementType === 'adjustment') {
      newStock = prevStock + input.quantity; // delta adjustment
    }

    // Validação de estoque negativo se não permitido
    if (newStock < 0 && !productState.allowNegativeStock && input.movementType === 'sale') {
      throw new InsufficientStockError(
        `Insufficient stock for product ${input.productId}. Available: ${prevStock}, Requested: ${Math.abs(input.quantity)}`
      );
    }

    // 5. Gravar movimentação no ledger
    const createRecord: CreateStockMovementRecord = {
      store_id: activeStoreId,
      product_id: input.productId,
      variation_id: input.variationId || null,
      movement_type: input.movementType,
      unit_kind: input.unitKind || (variationState?.isGrade ? 'pack' : 'unit'),
      quantity: input.quantity,
      physical_quantity: computedPhysicalQty,
      previous_stock: prevStock,
      new_stock: newStock,
      idempotency_key: input.idempotencyKey || null,
      reason_code: input.reasonCode || null,
      source_type: input.sourceType || 'system',
      source_id: input.sourceId || null,
      parent_movement_id: input.parentMovementId || null,
      notes: input.notes || null,
      expires_at: input.expiresAt || null,
    };

    const savedMovement = await this.repository.recordMovement(createRecord);

    // 6. Log de auditoria
    await this.auditService.logStockMovement(context, savedMovement.id, {
      productId: input.productId,
      variationId: input.variationId,
      movementType: input.movementType,
      quantity: input.quantity,
      physicalQuantity: computedPhysicalQty,
      idempotencyKey: input.idempotencyKey,
    });

    return {
      movement: savedMovement,
      isDuplicate: false,
      affectedProductStock: productState.stock,
      affectedVariationStock: variationState ? newStock : null,
    };
  }

  async adjustStock(input: AdjustStockInput): Promise<AdjustStockResult> {
    const context = this.session.getContext();
    requireScope(context, 'stock:adjust');
    const activeStoreId = requireActiveStore(context);

    const result = await this.repository.applyStockAdjustmentRpc(activeStoreId, {
      productId: input.product_id,
      variationId: input.variation_id || null,
      operation: input.operation,
      quantity: input.quantity,
      countedQuantity: input.counted_quantity,
      reasonCode: input.reason,
      idempotencyKey: input.operation_id || null,
      notes: input.notes || null,
    });

    if (result.applied) {
      await this.auditService.logStockAdjusted(context, result.movement_id, {
        productId: input.product_id,
        variationId: input.variation_id || null,
        operation: input.operation,
        reason: input.reason,
        delta: result.delta,
        unitKind: result.unit_kind,
      });
    }

    return result;
  }

  async consultarEstoque(input: ConsultarEstoqueInput): Promise<ConsultarEstoqueResult> {
    const context = this.session.getContext();
    requireScope(context, 'stock:read');
    const activeStoreId = requireActiveStore(context);

    const prodState = await this.repository.getProductStockState(activeStoreId, input.product_id);
    if (!prodState) {
      throw new InventoryTargetNotFoundError(`Product ${input.product_id} not found in active store`);
    }

    const rec = await this.repository.reconcileProductStock(activeStoreId, input.product_id);

    if (input.variation_id) {
      const varState = await this.repository.getVariationStockState(
        activeStoreId,
        input.product_id,
        input.variation_id
      );
      if (!varState) {
        throw new InventoryTargetNotFoundError(
          `Variation ${input.variation_id} not found for product ${input.product_id}`
        );
      }

      let pairsPerPack = 1;
      if (varState.isGrade && Array.isArray(varState.gradePairs) && varState.gradePairs.length > 0) {
        pairsPerPack = varState.gradePairs.reduce((acc, n) => acc + (Number(n) || 0), 0);
        if (pairsPerPack <= 0) pairsPerPack = 1;
      }
      const physicalQty = varState.stock * (varState.isGrade ? pairsPerPack : 1);

      return {
        product_id: input.product_id,
        variation_id: input.variation_id,
        target_name: varState.name || `${prodState.productName} (${varState.color || ''} ${varState.size || ''})`.trim(),
        sku: varState.sku,
        unit_kind: varState.isGrade ? 'pack' : 'unit',
        current_stock: varState.stock,
        reserved_stock: 0,
        available_stock: varState.stock,
        physical_quantity_per_unit: varState.isGrade ? pairsPerPack : 1,
        physical_stock: physicalQty,
        product_stock: prodState.stock,
        reconciliation_status: rec.status,
        stock: {
          commercial_quantity: varState.stock,
          unit_kind: varState.isGrade ? 'pack' : 'unit',
          physical_quantity: physicalQty,
        },
      };
    }

    return {
      product_id: input.product_id,
      variation_id: null,
      target_name: prodState.productName,
      sku: null,
      unit_kind: 'unit',
      current_stock: prodState.stock,
      reserved_stock: prodState.reservedStock,
      available_stock: prodState.availableStock,
      physical_stock: prodState.stock,
      product_stock: prodState.stock,
      reconciliation_status: rec.status,
      stock: {
        commercial_quantity: prodState.stock,
        unit_kind: 'unit',
        physical_quantity: prodState.stock,
      },
    };
  }
}
