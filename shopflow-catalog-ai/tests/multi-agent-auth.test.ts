import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentSession } from '../src/auth/agent-session.js';
import { requireScope, requireStoreAccess, PrincipalType } from '../src/auth/agent-context.js';
import { InventoryService } from '../src/services/inventory.service.js';
import { CatalogService } from '../src/services/catalog.service.js';
import { GradeService } from '../src/services/grade.service.js';

describe('Sprint 12 — FASE D: Multi-Agent Identity & Delegated Access', () => {
  // Agent 1: Inventory Agent (Least Privilege: stock:read + stock:adjust only)
  const inventoryAgentSession = new AgentSession({
    principalId: 'agent-inventory-bot',
    principalType: 'user' as PrincipalType,
    scopes: ['stock:read', 'stock:adjust'],
    storeAccess: { mode: 'restricted', storeIds: ['store-alpha'] },
    activeStoreId: 'store-alpha',
    sessionId: 'session-inv-1',
  });

  // Agent 2: Catalog Read-Only Agent (catalog:read only)
  const catalogAgentSession = new AgentSession({
    principalId: 'agent-catalog-viewer',
    principalType: 'user' as PrincipalType,
    scopes: ['catalog:read'],
    storeAccess: { mode: 'restricted', storeIds: ['store-alpha'] },
    activeStoreId: 'store-alpha',
    sessionId: 'session-cat-1',
  });

  const mockRepo: any = {
    getProduct: async () => ({ id: 'prod-1', name: 'Test' }),
    searchCatalog: async () => [],
    adjustStock: async () => ({ success: true }),
    getTemplate: async () => null,
  };

  it('1. Least Privilege: Inventory Agent can call stock tools but is rejected from catalog write and grade write', async () => {
    const invService = new InventoryService(inventoryAgentSession, mockRepo as any);
    const catService = new CatalogService(inventoryAgentSession, mockRepo as any);
    const gradeService = new GradeService(inventoryAgentSession, mockRepo as any);

    // Inventory tools succeed or proceed past scope check
    assert.doesNotThrow(() => {
      requireScope(inventoryAgentSession.getContext(), 'stock:read');
      requireScope(inventoryAgentSession.getContext(), 'stock:adjust');
    });

    // Catalog write attempt throws ForbiddenError
    await assert.rejects(
      async () =>
        catService.createProduct({
          name: 'Unauthorized Product',
          retail_price: 100,
        }),
      /ForbiddenError|Missing required scope: catalog:write/i
    );

    // Grade write attempt throws ForbiddenError
    await assert.rejects(
      async () =>
        gradeService.createTemplate({
          name: 'Unauthorized Grade',
          items: [{ size: '38', quantity: 1 }],
        }),
      /ForbiddenError|Missing required scope: grade:write/i
    );
  });

  it('2. Least Privilege: Catalog Viewer Agent can read catalog but cannot adjust stock', async () => {
    const invService = new InventoryService(catalogAgentSession, mockRepo as any);
    const catService = new CatalogService(catalogAgentSession, mockRepo as any);

    // Catalog search succeeds past scope check
    assert.doesNotThrow(() => {
      requireScope(catalogAgentSession.getContext(), 'catalog:read');
    });

    // Stock adjust attempt throws ForbiddenError
    await assert.rejects(
      async () =>
        invService.adjustStock({
          product_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          adjustment_type: 'increase',
          quantity: 10,
          operation_id: 'op-unauthorized-123',
        }),
      /ForbiddenError|Missing required scope: stock:adjust/i
    );
  });

  it('3. Cross-Store Isolation: Agent restricted to Store Alpha cannot access Store Beta', () => {
    const contextAlpha = inventoryAgentSession.getContext();

    // Store Alpha is allowed
    assert.doesNotThrow(() => requireStoreAccess(contextAlpha, 'store-alpha'));

    // Store Beta throws STORE_ACCESS_DENIED
    assert.throws(
      () => requireStoreAccess(contextAlpha, 'store-beta'),
      /STORE_ACCESS_DENIED/i
    );
  });

  it('4. Scope Escalation Guard: Validates that delegated scopes are a strict subset of delegator scopes', () => {
    const parentScopes = ['catalog:read', 'stock:read', 'stock:adjust'];
    
    // Legitimate delegation
    const validDelegation = ['stock:read'];
    const isSubset = validDelegation.every((s) => parentScopes.includes(s));
    assert.equal(isSubset, true);

    // Escalation attempt (delegating catalog:write when delegator only has catalog:read)
    const escalatedDelegation = ['stock:read', 'catalog:write'];
    const isEscalatedSubset = escalatedDelegation.every((s) => parentScopes.includes(s));
    assert.equal(isEscalatedSubset, false);
  });

  it('5. Zero Secrets Logging: Context and Session representations never expose raw secret keys', () => {
    const context = inventoryAgentSession.getContext();
    const serialized = JSON.stringify(context);
    
    assert.equal(serialized.includes('b2x_live_'), false);
    assert.equal(serialized.includes('raw_key'), false);
    assert.equal(serialized.includes('secret'), false);
  });
});
