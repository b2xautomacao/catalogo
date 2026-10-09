import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentSession } from '../src/auth/agent-session.js';
import { StoreService } from '../src/services/store.service.js';
import { StoreRepository } from '../src/repositories/store.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { StoreDescriptor } from '../src/domain/types.js';
import {
  StoreNotFoundError,
  NoActiveStoreError,
  ForbiddenError,
} from '../src/domain/errors.js';

describe('Store Resolution, Selection & Cross-Session Isolation', () => {
  const storeA: StoreDescriptor = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Mega Calçados — Goiânia',
    url_slug: 'mega-calcados-goiania',
    description: 'Filial Goiânia',
    address: 'Av. Goiás, 100 - Goiânia/GO',
    is_active: true,
  };

  const storeB: StoreDescriptor = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Mega Calçados — Anápolis',
    url_slug: 'mega-calcados-anapolis',
    description: 'Filial Anápolis',
    address: 'Rua Central, 50 - Anápolis/GO',
    is_active: true,
  };

  const storeC: StoreDescriptor = {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Loja Externa de Outro Tenant',
    url_slug: 'loja-externa',
    description: 'Loja Externa',
    address: 'Brasília/DF',
    is_active: true,
  };

  const allStores = [storeA, storeB, storeC];

  const mockStoreRepo = {
    async searchStores(query: string, allowedStoreIds?: string[] | null, limit = 10) {
      let results = allStores.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase())
      );
      if (allowedStoreIds) {
        results = results.filter((s) => allowedStoreIds.includes(s.id));
      }
      return results.slice(0, limit);
    },
    async getStoreById(id: string) {
      return allStores.find((s) => s.id === id) || null;
    },
  } as unknown as StoreRepository;

  const recordedAuditEvents: any[] = [];
  const mockAuditService = {
    async logStoreSearch(context: any, query: string, matchCount: number) {
      recordedAuditEvents.push({ type: 'store_search', query, matchCount });
    },
    async logStoreSelected(context: any, selectedStoreId: string) {
      recordedAuditEvents.push({ type: 'store_selected', selectedStoreId });
    },
  } as unknown as AuditService;

  it('Superadmin search: 2+ matches returns candidates and selectionRequired: true without changing activeStoreId', async () => {
    const session = new AgentSession({
      principalType: 'superadmin',
      principalId: 'admin-1',
      storeAccess: { mode: 'all' },
      activeStoreId: null,
      scopes: ['catalog:read', 'store:list', 'store:select'],
      sessionId: 'sess-sa-1',
    });

    const storeService = new StoreService(session, mockStoreRepo, mockAuditService);

    const result = await storeService.searchStores('Mega Calçados');
    assert.equal(result.count, 2);
    assert.equal(result.matches.length, 2);
    assert.equal(result.selectionRequired, true);

    // CRITICAL: Search does NOT alter activeStoreId
    assert.equal(session.getActiveStoreId(), null);
  });

  it('Superadmin search: 0 matches throws StoreNotFoundError (STORE_NOT_FOUND)', async () => {
    const session = new AgentSession({
      principalType: 'superadmin',
      principalId: 'admin-1',
      storeAccess: { mode: 'all' },
      activeStoreId: null,
      scopes: ['catalog:read', 'store:list', 'store:select'],
      sessionId: 'sess-sa-2',
    });

    const storeService = new StoreService(session, mockStoreRepo, mockAuditService);

    await assert.rejects(
      async () => await storeService.searchStores('Nome Inexistente'),
      (err: Error) => err instanceof StoreNotFoundError && err.message === 'STORE_NOT_FOUND'
    );
  });

  it('Superadmin selectStore: explicitly activates Store A, then switches A -> B', async () => {
    const session = new AgentSession({
      principalType: 'superadmin',
      principalId: 'admin-1',
      storeAccess: { mode: 'all' },
      activeStoreId: null,
      scopes: ['catalog:read', 'store:list', 'store:select'],
      sessionId: 'sess-sa-3',
    });

    const storeService = new StoreService(session, mockStoreRepo, mockAuditService);

    // Select Store A
    const selectedA = await storeService.selectStore(storeA.id);
    assert.equal(selectedA.id, storeA.id);
    assert.equal(session.getActiveStoreId(), storeA.id);

    const activeStoreAfterA = await storeService.getActiveStore();
    assert.equal(activeStoreAfterA.name, storeA.name);

    // Switch from Store A -> Store B
    const selectedB = await storeService.selectStore(storeB.id);
    assert.equal(selectedB.id, storeB.id);
    assert.equal(session.getActiveStoreId(), storeB.id);

    const activeStoreAfterB = await storeService.getActiveStore();
    assert.equal(activeStoreAfterB.name, storeB.name);
  });

  it('Tenant restricted access: tenant only searches within authorized storeIds', async () => {
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeA.id,
      storeAccess: { mode: 'restricted', storeIds: [storeA.id] },
      activeStoreId: storeA.id,
      scopes: ['catalog:read', 'store:list'],
      sessionId: 'sess-tenant-1',
    });

    const storeService = new StoreService(session, mockStoreRepo, mockAuditService);

    // Query matches Store A and Store B, but tenant is restricted to Store A
    const result = await storeService.searchStores('Mega Calçados');
    assert.equal(result.count, 1);
    assert.equal(result.matches[0].id, storeA.id);
    assert.equal(result.selectionRequired, false);
  });

  it('Tenant restricted access: selecting an unauthorized store is rejected with STORE_NOT_FOUND', async () => {
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeA.id,
      storeAccess: { mode: 'restricted', storeIds: [storeA.id] },
      activeStoreId: storeA.id,
      scopes: ['catalog:read', 'store:list', 'store:select'],
      sessionId: 'sess-tenant-2',
    });

    const storeService = new StoreService(session, mockStoreRepo, mockAuditService);

    // Try selecting Store B (which tenant is not allowed to access)
    await assert.rejects(
      async () => await storeService.selectStore(storeB.id),
      (err: Error) => err instanceof StoreNotFoundError && err.message === 'STORE_NOT_FOUND'
    );

    // Active store must remain unchanged
    assert.equal(session.getActiveStoreId(), storeA.id);
  });

  it('Scope enforcement: principal without store:select cannot call selectStore', async () => {
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeA.id,
      storeAccess: { mode: 'restricted', storeIds: [storeA.id] },
      activeStoreId: storeA.id,
      scopes: ['catalog:read', 'store:list'], // Missing store:select
      sessionId: 'sess-tenant-3',
    });

    const storeService = new StoreService(session, mockStoreRepo, mockAuditService);

    await assert.rejects(
      async () => await storeService.selectStore(storeA.id),
      (err: Error) => err instanceof ForbiddenError
    );
  });

  it('Scope enforcement: principal without store:list cannot call searchStores, but catalog:read can call getActiveStore', async () => {
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: storeA.id,
      storeAccess: { mode: 'restricted', storeIds: [storeA.id] },
      activeStoreId: storeA.id,
      scopes: ['catalog:read'], // Has catalog:read, missing store:list
      sessionId: 'sess-tenant-4',
    });

    const storeService = new StoreService(session, mockStoreRepo, mockAuditService);

    // searchStores still strictly requires store:list
    await assert.rejects(
      async () => await storeService.searchStores('Mega'),
      (err: Error) => err instanceof ForbiddenError
    );

    // getActiveStore works for catalog:read under single-store context (Fase I)
    const activeStore = await storeService.getActiveStore();
    assert.equal(activeStore.id, storeA.id);

    // Session with NO permitted scopes (e.g. only order:read) is rejected
    const restrictedSession = new AgentSession({
      principalType: 'tenant',
      principalId: storeA.id,
      storeAccess: { mode: 'restricted', storeIds: [storeA.id] },
      activeStoreId: storeA.id,
      scopes: ['order:read'],
      sessionId: 'sess-tenant-no-scope',
    });
    const restrictedStoreService = new StoreService(restrictedSession, mockStoreRepo, mockAuditService);
    await assert.rejects(
      async () => await restrictedStoreService.getActiveStore(),
      (err: Error) => err instanceof ForbiddenError
    );
  });

  it('CROSS-SESSION ISOLATION: Session A active store changes NEVER leak to Session B', async () => {
    // Session A (Superadmin)
    const sessionA = new AgentSession({
      principalType: 'superadmin',
      principalId: 'admin-1',
      storeAccess: { mode: 'all' },
      activeStoreId: null,
      scopes: ['catalog:read', 'store:list', 'store:select'],
      sessionId: 'session-A-uuid',
    });

    // Session B (Superadmin)
    const sessionB = new AgentSession({
      principalType: 'superadmin',
      principalId: 'admin-2',
      storeAccess: { mode: 'all' },
      activeStoreId: null,
      scopes: ['catalog:read', 'store:list', 'store:select'],
      sessionId: 'session-B-uuid',
    });

    const storeServiceA = new StoreService(sessionA, mockStoreRepo, mockAuditService);
    const storeServiceB = new StoreService(sessionB, mockStoreRepo, mockAuditService);

    // Initial state: Both sessions have null activeStoreId
    assert.equal(sessionA.getActiveStoreId(), null);
    assert.equal(sessionB.getActiveStoreId(), null);

    // Session A selects Store A
    await storeServiceA.selectStore(storeA.id);

    // Verify Session A is active on Store A
    assert.equal(sessionA.getActiveStoreId(), storeA.id);

    // CRITICAL: Verify Session B is STILL null and has NO active store
    assert.equal(sessionB.getActiveStoreId(), null);
    await assert.rejects(
      async () => await storeServiceB.getActiveStore(),
      (err: Error) => err instanceof NoActiveStoreError && err.message === 'NO_ACTIVE_STORE'
    );

    // Session B selects Store B
    await storeServiceB.selectStore(storeB.id);

    // Verify Session A is STILL Store A and Session B is Store B
    assert.equal(sessionA.getActiveStoreId(), storeA.id);
    assert.equal(sessionB.getActiveStoreId(), storeB.id);
  });
});
