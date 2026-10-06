import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AgentContext } from './agent-context.js';
import { AuthenticatedContextProvider } from './authenticated-context-provider.js';

export interface ContextProvider {
  getContext(): Promise<AgentContext>;
}

export class SingleTenantContextProvider implements ContextProvider {
  async getContext(): Promise<AgentContext> {
    const storeId = env.MCP_STORE_ID;
    if (!storeId) {
      throw new Error('MCP_STORE_ID must be configured in single_tenant mode');
    }

    return {
      principalType: 'tenant',
      principalId: storeId,
      storeAccess: {
        mode: 'restricted',
        storeIds: [storeId],
      },
      activeStoreId: storeId,
      scopes: ['catalog:read', 'store:list'],
      sessionId: crypto.randomUUID(),
    };
  }
}

export class ContextProviderFactory {
  static create(mode: 'single_tenant' | 'authenticated' = env.MCP_AUTH_MODE): ContextProvider {
    if (mode === 'authenticated') {
      return new AuthenticatedContextProvider();
    }
    return new SingleTenantContextProvider();
  }
}

export { AuthenticatedContextProvider };
