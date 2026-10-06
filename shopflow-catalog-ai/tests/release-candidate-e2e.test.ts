import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentSession } from '../src/auth/agent-session.js';
import { requireScope, requireStoreAccess, requireActiveStore, PrincipalType } from '../src/auth/agent-context.js';
import { CatalogService } from '../src/services/catalog.service.js';
import { StoreService } from '../src/services/store.service.js';
import { InventoryService } from '../src/services/inventory.service.js';
import { GradeService } from '../src/services/grade.service.js';

describe('Sprint 13 — FASE D: Release Candidate End-to-End Validation & Attack Scenarios', () => {
  // Session A: Tenant Store A (Full access to Store A with store:select)
  const sessionStoreA = new AgentSession({
    principalId: 'admin-store-a',
    principalType: 'user' as PrincipalType,
    scopes: ['catalog:read', 'catalog:write', 'stock:read', 'stock:adjust', 'grade:read', 'grade:write', 'store:list', 'store:select'],
    storeAccess: { mode: 'restricted', storeIds: ['store-a'] },
    activeStoreId: 'store-a',
    sessionId: 'session-store-a',
  });

  // Session B: Tenant Store B (Full access to Store B with store:select)
  const sessionStoreB = new AgentSession({
    principalId: 'admin-store-b',
    principalType: 'user' as PrincipalType,
    scopes: ['catalog:read', 'catalog:write', 'stock:read', 'stock:adjust', 'grade:read', 'grade:write', 'store:list', 'store:select'],
    storeAccess: { mode: 'restricted', storeIds: ['store-b'] },
    activeStoreId: 'store-b',
    sessionId: 'session-store-b',
  });

  // Session C: Superadmin (Global access, requires explicit store selection)
  const sessionSuperadmin = new AgentSession({
    principalId: 'superadmin-global',
    principalType: 'superadmin' as PrincipalType,
    scopes: ['catalog:read', 'catalog:write', 'stock:read', 'stock:adjust', 'grade:read', 'grade:write', 'store:list', 'store:select'],
    storeAccess: { mode: 'all' },
    activeStoreId: null,
    sessionId: 'session-superadmin',
  });

  const mockRepo: any = {
    searchStores: async (query?: string) => [
      { id: 'store-a', name: 'Loja Alpha', is_active: true },
      { id: 'store-b', name: 'Loja Beta', is_active: true },
    ],
    getStoreById: async (id: string) => ({ id, name: id === 'store-a' ? 'Loja Alpha' : 'Loja Beta', is_active: true }),
    getProductById: async (storeId: string, id: string) => {
      if (storeId === 'store-a' && id === 'prod-a1') return { id: 'prod-a1', store_id: 'store-a', name: 'Prod A1' };
      return null;
    },
    listProducts: async (storeId: string, filters: any) => [
      { id: 'prod-a1', store_id: storeId, name: 'Prod A1' },
    ],
    searchCatalog: async (storeId: string) => (storeId === 'store-a' ? [{ id: 'prod-a1', store_id: 'store-a', name: 'Prod A1' }] : []),
    createProduct: async (storeId: string, input: any) => ({ id: 'prod-new', store_id: storeId, ...input }),
    adjustStock: async () => ({ success: true }),
    getTemplate: async () => null,
  };

  it('1. MULTI-TENANT ATTACK TEST: Store A credential attempting to read Store B product is rejected with NOT_FOUND', async () => {
    const serviceA = new CatalogService(sessionStoreA, mockRepo as any);
    await assert.rejects(
      async () => serviceA.getProduct('prod-b1'),
      /PRODUCT_NOT_FOUND/i
    );
  });

  it('2. MULTI-TENANT ATTACK TEST: Store A credential selecting Store B throws STORE_NOT_FOUND', async () => {
    const storeServiceA = new StoreService(sessionStoreA, mockRepo as any);
    await assert.rejects(
      async () => storeServiceA.selectStore('store-b'),
      /STORE_NOT_FOUND|STORE_ACCESS_DENIED|ForbiddenError/i
    );
  });

  it('3. SUPERADMIN CONTEXT GUARD: Superadmin cannot execute tenant operations without activeStoreId', async () => {
    const catalogServiceSuper = new CatalogService(sessionSuperadmin, mockRepo as any);
    await assert.rejects(
      async () => catalogServiceSuper.listProducts({ limit: 10, offset: 0 }),
      /STORE_CONTEXT_REQUIRED/i
    );

    // After explicit store selection, operations succeed in selected store
    sessionSuperadmin.setActiveStoreId('store-a');
    const products = await catalogServiceSuper.listProducts({ limit: 10, offset: 0 });
    assert.ok(Array.isArray(products));
  });

  it('4. DUAL SESSION CONCURRENCY ISOLATION: Simultaneous mutations across Store A and Store B do not contaminate context', async () => {
    const serviceA = new CatalogService(sessionStoreA, mockRepo as any);
    const serviceB = new CatalogService(sessionStoreB, mockRepo as any);

    const [prodA, prodB] = await Promise.all([
      serviceA.createProduct({ name: 'Sapato A', retail_price: 100 }),
      serviceB.createProduct({ name: 'Sapato B', retail_price: 200 }),
    ]);

    assert.equal(prodA.store_id, 'store-a');
    assert.equal(prodB.store_id, 'store-b');
    assert.equal(sessionStoreA.getContext().activeStoreId, 'store-a');
    assert.equal(sessionStoreB.getContext().activeStoreId, 'store-b');
  });

  it('5. PRIVILEGE ESCALATION GUARD: Restricted agent cannot bypass scope boundaries or store limits', () => {
    const inventoryOnlyAgent = new AgentSession({
      principalId: 'agent-inv',
      principalType: 'user' as PrincipalType,
      scopes: ['stock:read', 'stock:adjust'],
      storeAccess: { mode: 'restricted', storeIds: ['store-a'] },
      activeStoreId: 'store-a',
      sessionId: 'session-inv-esc',
    });

    const context = inventoryOnlyAgent.getContext();
    assert.throws(() => requireScope(context, 'catalog:write'), /ForbiddenError|Missing required scope/i);
    assert.throws(() => requireScope(context, 'grade:write'), /ForbiddenError|Missing required scope/i);
    assert.throws(() => requireStoreAccess(context, 'store-b'), /STORE_ACCESS_DENIED/i);
  });
});
