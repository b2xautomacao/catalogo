import { AgentContext, canAccessStore } from './agent-context.js';
import { StoreNotFoundError } from '../domain/errors.js';

/**
 * Encapsulates the runtime session state for an authenticated agent.
 * Each connected client/session gets its own isolated AgentSession instance,
 * completely preventing cross-session active store leaks.
 */
export class AgentSession {
  private context: AgentContext;

  constructor(initialContext: AgentContext) {
    this.context = {
      ...initialContext,
      // Ensure immutability on initial arrays
      scopes: [...initialContext.scopes],
      storeAccess:
        initialContext.storeAccess.mode === 'restricted'
          ? { mode: 'restricted', storeIds: [...initialContext.storeAccess.storeIds] }
          : { mode: 'all' },
    };
  }

  getContext(): AgentContext {
    return {
      ...this.context,
      scopes: [...this.context.scopes],
      storeAccess:
        this.context.storeAccess.mode === 'restricted'
          ? { mode: 'restricted', storeIds: [...this.context.storeAccess.storeIds] }
          : { mode: 'all' },
    };
  }

  getSessionId(): string {
    return this.context.sessionId;
  }

  getActiveStoreId(): string | null {
    return this.context.activeStoreId;
  }

  setActiveStoreId(storeId: string): void {
    if (!canAccessStore(this.context, storeId)) {
      throw new StoreNotFoundError('STORE_NOT_FOUND');
    }
    this.context.activeStoreId = storeId;
  }

  clearActiveStoreId(): void {
    if (this.context.storeAccess.mode === 'all') {
      this.context.activeStoreId = null;
    }
  }
}
