import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentContext, requireScope, requireActiveStore, canAccessStore } from '../src/auth/agent-context.js';
import { AgentSession } from '../src/auth/agent-session.js';
import { CatalogService } from '../src/services/catalog.service.js';
import { ProductRepository } from '../src/repositories/product.repository.js';
import { ForbiddenError, StoreContextRequiredError, ProductNotFoundError } from '../src/domain/errors.js';

describe('Guards: requireScope, canAccessStore & requireActiveStore', () => {
  const tenantContext: AgentContext = {
    principalType: 'tenant',
    principalId: 'store-123',
    storeAccess: { mode: 'restricted', storeIds: ['store-123'] },
    activeStoreId: 'store-123',
    scopes: ['catalog:read', 'store:list'],
    sessionId: 'session-t-1',
  };

  const superadminContext: AgentContext = {
    principalType: 'superadmin',
    principalId: 'admin-1',
    storeAccess: { mode: 'all' },
    activeStoreId: null,
    scopes: ['catalog:read', 'store:list', 'store:select'],
    sessionId: 'session-sa-1',
  };

  it('requireScope allows granted scopes and rejects ungranted scopes', () => {
    assert.doesNotThrow(() => requireScope(tenantContext, 'catalog:read'));
    assert.throws(
      () => requireScope(tenantContext, 'catalog:write'),
      (err: Error) => err instanceof ForbiddenError
    );
  });

  it('canAccessStore correctly authorizes store based on StoreAccess mode', () => {
    assert.equal(canAccessStore(tenantContext, 'store-123'), true);
    assert.equal(canAccessStore(tenantContext, 'other-store-456'), false);
    assert.equal(canAccessStore(superadminContext, 'any-store-999'), true);
  });

  it('requireActiveStore returns storeId for tenant context', () => {
    const storeId = requireActiveStore(tenantContext);
    assert.equal(storeId, 'store-123');
  });

  it('requireActiveStore throws StoreContextRequiredError for superadmin context without activeStoreId', () => {
    assert.throws(
      () => requireActiveStore(superadminContext),
      (err: Error) => err instanceof StoreContextRequiredError
    );
  });
});

describe('CatalogService Multi-Tenant & Superadmin Behavior', () => {
  const storeId = 'store-uuid-999';

  const mockRepo = {
    async checkHealth(activeStoreId?: string | null) {
      return true;
    },
    async listProducts(queryStoreId: string, filters: any) {
      if (queryStoreId !== storeId) return [];
      return [
        {
          id: 'prod-1',
          name: 'Camisa Polo',
          sku: 'POLO-01',
          retail_price: 99.9,
          wholesale_price: null,
          stock: 10,
          is_active: true,
        },
      ];
    },
    async getProductById(queryStoreId: string, id: string) {
      if (queryStoreId === storeId && id === 'prod-1') {
        return {
          id: 'prod-1',
          name: 'Camisa Polo',
          sku: 'POLO-01',
          retail_price: 99.9,
          wholesale_price: null,
          stock: 10,
          is_active: true,
          images: [],
          variations: [],
        };
      }
      return null;
    },
  } as unknown as ProductRepository;

  it('tenant context: checkHealth returns storeContext true and lists products', async () => {
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeId,
      storeAccess: { mode: 'restricted', storeIds: [storeId] },
      activeStoreId: storeId,
      scopes: ['catalog:read', 'store:list'],
      sessionId: 'sess-1',
    });

    const service = new CatalogService(session, mockRepo);

    const health = await service.checkHealth();
    assert.equal(health.ok, true);
    assert.equal(health.database, 'reachable');
    assert.equal(health.authenticated, true);
    assert.equal(health.principalType, 'tenant');
    assert.equal(health.storeContext, true);

    const products = await service.listProducts({ offset: 0, limit: 10 });
    assert.equal(products.length, 1);
    assert.equal(products[0].name, 'Camisa Polo');

    const product = await service.getProduct('prod-1');
    assert.equal(product.name, 'Camisa Polo');
  });

  it('superadmin context: checkHealth succeeds with storeContext false before store selection', async () => {
    const session = new AgentSession({
      principalType: 'superadmin',
      principalId: 'admin-id',
      storeAccess: { mode: 'all' },
      activeStoreId: null,
      scopes: ['catalog:read', 'store:list', 'store:select'],
      sessionId: 'sess-2',
    });

    const service = new CatalogService(session, mockRepo);

    const health = await service.checkHealth();
    assert.equal(health.ok, true);
    assert.equal(health.authenticated, true);
    assert.equal(health.principalType, 'superadmin');
    assert.equal(health.storeContext, false);
  });

  it('superadmin context: listProducts and getProduct throw StoreContextRequiredError before store selection', async () => {
    const session = new AgentSession({
      principalType: 'superadmin',
      principalId: 'admin-id',
      storeAccess: { mode: 'all' },
      activeStoreId: null,
      scopes: ['catalog:read', 'store:list', 'store:select'],
      sessionId: 'sess-3',
    });

    const service = new CatalogService(session, mockRepo);

    await assert.rejects(
      async () => await service.listProducts({ offset: 0, limit: 10 }),
      (err: Error) => err instanceof StoreContextRequiredError && err.message === 'STORE_CONTEXT_REQUIRED'
    );

    await assert.rejects(
      async () => await service.getProduct('prod-1'),
      (err: Error) => err instanceof StoreContextRequiredError && err.message === 'STORE_CONTEXT_REQUIRED'
    );
  });

  it('superadmin context: after store selection, listProducts successfully accesses selected store', async () => {
    const session = new AgentSession({
      principalType: 'superadmin',
      principalId: 'admin-id',
      storeAccess: { mode: 'all' },
      activeStoreId: null,
      scopes: ['catalog:read', 'store:list', 'store:select'],
      sessionId: 'sess-4',
    });

    const service = new CatalogService(session, mockRepo);

    // Activate store in session
    session.setActiveStoreId(storeId);

    const products = await service.listProducts({ offset: 0, limit: 10 });
    assert.equal(products.length, 1);
    assert.equal(products[0].name, 'Camisa Polo');
  });
});
