import { AuthorizationError, ForbiddenError, StoreContextRequiredError } from '../domain/errors.js';

export type PrincipalType = 'tenant' | 'user' | 'superadmin';

export type StoreAccess =
  | { mode: 'all' }
  | { mode: 'restricted'; storeIds: string[] };

export interface AgentContext {
  principalType: PrincipalType;
  principalId: string;
  storeAccess: StoreAccess;
  activeStoreId: string | null;
  scopes: string[];
  sessionId: string;
}

export function requireScope(context: AgentContext, scope: string): void {
  if (!context.scopes.includes(scope)) {
    throw new ForbiddenError(`Missing required scope: ${scope}`);
  }
}

export function requireAnyScope(context: AgentContext, scopes: string[]): void {
  if (!scopes.some((s) => context.scopes.includes(s))) {
    throw new ForbiddenError(`Missing required scope. Required one of: ${scopes.join(', ')}`);
  }
}

export function canAccessStore(context: AgentContext, storeId: string): boolean {
  if (!storeId) return false;
  if (context.storeAccess.mode === 'all') {
    return true;
  }
  return context.storeAccess.storeIds.includes(storeId);
}

export function requireStoreAccess(context: AgentContext, storeId: string): void {
  if (!canAccessStore(context, storeId)) {
    throw new ForbiddenError('STORE_ACCESS_DENIED');
  }
}

export function requireActiveStore(context: AgentContext): string {
  if (!context.activeStoreId) {
    throw new StoreContextRequiredError('STORE_CONTEXT_REQUIRED');
  }
  return context.activeStoreId;
}

export { AuthorizationError, ForbiddenError, StoreContextRequiredError };
