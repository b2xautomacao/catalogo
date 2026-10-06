import { AgentSession } from '../auth/agent-session.js';
import { requireScope, canAccessStore } from '../auth/agent-context.js';
import { StoreRepository } from '../repositories/store.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { StoreDescriptor, StoreSearchResponse } from '../domain/types.js';
import { StoreNotFoundError, NoActiveStoreError } from '../domain/errors.js';

export class StoreService {
  constructor(
    private session: AgentSession,
    private storeRepo: StoreRepository = new StoreRepository(),
    private auditService: AuditService = new AuditService()
  ) {}

  async searchStores(query: string, limit = 10): Promise<StoreSearchResponse> {
    const context = this.session.getContext();
    requireScope(context, 'store:list');

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    const allowedStoreIds =
      context.storeAccess.mode === 'restricted' ? context.storeAccess.storeIds : null;

    const matches = await this.storeRepo.searchStores(trimmed, allowedStoreIds, limit);

    // Record audit event
    await this.auditService.logStoreSearch(context, trimmed, matches.length);

    if (matches.length === 0) {
      throw new StoreNotFoundError('STORE_NOT_FOUND');
    }

    return {
      matches,
      count: matches.length,
      selectionRequired: matches.length > 1,
    };
  }

  async selectStore(storeId: string): Promise<StoreDescriptor> {
    const context = this.session.getContext();
    requireScope(context, 'store:select');

    if (!storeId || typeof storeId !== 'string') {
      throw new StoreNotFoundError('STORE_NOT_FOUND');
    }

    const trimmedId = storeId.trim();

    // Check store existence
    const store = await this.storeRepo.getStoreById(trimmedId);
    if (!store) {
      throw new StoreNotFoundError('STORE_NOT_FOUND');
    }

    // Check authorization: if principal cannot access store, reject with STORE_NOT_FOUND to prevent enumeration
    if (!canAccessStore(context, store.id)) {
      throw new StoreNotFoundError('STORE_NOT_FOUND');
    }

    // Set active store in the isolated session context
    this.session.setActiveStoreId(store.id);

    // Record audit event
    await this.auditService.logStoreSelected(context, store.id);

    return store;
  }

  async getActiveStore(): Promise<StoreDescriptor> {
    const context = this.session.getContext();
    requireScope(context, 'store:list');

    const activeStoreId = this.session.getActiveStoreId();
    if (!activeStoreId) {
      throw new NoActiveStoreError('NO_ACTIVE_STORE');
    }

    const store = await this.storeRepo.getStoreById(activeStoreId);
    if (!store) {
      throw new StoreNotFoundError('STORE_NOT_FOUND');
    }

    return store;
  }
}
