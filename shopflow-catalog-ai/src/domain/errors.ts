export class CatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CatalogError';
  }
}

export class ProductNotFoundError extends CatalogError {
  constructor(message = 'PRODUCT_NOT_FOUND') {
    super(message);
    this.name = 'ProductNotFoundError';
  }
}

export class CategoryNotFoundError extends CatalogError {
  constructor(message = 'CATEGORY_NOT_FOUND') {
    super(message);
    this.name = 'CategoryNotFoundError';
  }
}

export class SkuAlreadyExistsError extends CatalogError {
  constructor(message = 'SKU_ALREADY_EXISTS') {
    super(message);
    this.name = 'SkuAlreadyExistsError';
  }
}

export class NoChangesProvidedError extends CatalogError {
  constructor(message = 'NO_CHANGES_PROVIDED') {
    super(message);
    this.name = 'NoChangesProvidedError';
  }
}

export class InvalidArgumentError extends CatalogError {
  constructor(message = 'INVALID_ARGUMENT') {
    super(message);
    this.name = 'InvalidArgumentError';
  }
}

export class AuthorizationError extends CatalogError {
  constructor(message = 'UNAUTHORIZED') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ForbiddenError extends CatalogError {
  constructor(message = 'FORBIDDEN') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class StoreContextRequiredError extends CatalogError {
  constructor(message = 'STORE_CONTEXT_REQUIRED') {
    super(message);
    this.name = 'StoreContextRequiredError';
  }
}

export class StoreNotFoundError extends CatalogError {
  constructor(message = 'STORE_NOT_FOUND') {
    super(message);
    this.name = 'StoreNotFoundError';
  }
}

export class StoreSelectionRequiredError extends CatalogError {
  constructor(message = 'STORE_SELECTION_REQUIRED') {
    super(message);
    this.name = 'StoreSelectionRequiredError';
  }
}

export class NoActiveStoreError extends CatalogError {
  constructor(message = 'NO_ACTIVE_STORE') {
    super(message);
    this.name = 'NoActiveStoreError';
  }
}

export class InvalidCredentialError extends CatalogError {
  constructor(message = 'INVALID_CREDENTIAL') {
    super(message);
    this.name = 'InvalidCredentialError';
  }
}

export class VariationNotFoundError extends CatalogError {
  constructor(message = 'VARIATION_NOT_FOUND') {
    super(message);
    this.name = 'VariationNotFoundError';
  }
}

export class StockTargetMismatchError extends CatalogError {
  constructor(message = 'VARIATION_PRODUCT_MISMATCH') {
    super(message);
    this.name = 'StockTargetMismatchError';
  }
}

export class DuplicateIdempotencyKeyError extends CatalogError {
  constructor(message = 'DUPLICATE_IDEMPOTENCY_KEY') {
    super(message);
    this.name = 'DuplicateIdempotencyKeyError';
  }
}

export class InsufficientStockError extends CatalogError {
  constructor(message = 'INSUFFICIENT_STOCK') {
    super(message);
    this.name = 'InsufficientStockError';
  }
}

export class InvalidStockOperationError extends CatalogError {
  constructor(message = 'INVALID_STOCK_OPERATION') {
    super(message);
    this.name = 'InvalidStockOperationError';
  }
}

export class InventoryTargetNotFoundError extends CatalogError {
  constructor(message = 'INVENTORY_TARGET_NOT_FOUND') {
    super(message);
    this.name = 'InventoryTargetNotFoundError';
  }
}

export class IdempotencyConflictError extends CatalogError {
  constructor(message = 'IDEMPOTENCY_CONFLICT') {
    super(message);
    this.name = 'IdempotencyConflictError';
  }
}

export class GradeTemplateNotFoundError extends CatalogError {
  constructor(message = 'GRADE_TEMPLATE_NOT_FOUND') {
    super(message);
    this.name = 'GradeTemplateNotFoundError';
  }
}

export class GradeTemplateAlreadyExistsError extends CatalogError {
  constructor(message = 'GRADE_TEMPLATE_ALREADY_EXISTS') {
    super(message);
    this.name = 'GradeTemplateAlreadyExistsError';
  }
}
