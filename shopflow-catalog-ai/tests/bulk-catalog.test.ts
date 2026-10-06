import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { BulkUpdateProductsSchema } from '../src/schemas/product.schema.js';
import { CatalogService } from '../src/services/catalog.service.js';
import { AgentSession } from '../src/auth/agent-session.js';
import { PrincipalType } from '../src/auth/agent-context.js';

describe('Sprint 12 — FASE A: Bulk Catalog Operations (MCP & Security)', () => {
  const mockSession = new AgentSession({
    principalId: 'test-user-1',
    principalType: 'user' as PrincipalType,
    scopes: ['catalog:read', 'catalog:write'],
    storeAccess: { mode: 'restricted', storeIds: ['store-a'] },
    activeStoreId: 'store-a',
    sessionId: 'session-1',
  });

  it('1. BulkUpdateProductsSchema accepts valid allowed fields and valid operation_id', () => {
    const validPayload = {
      product_ids: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'],
      updates: {
        is_active: true,
        category: 'Calçados',
        retail_price: 149.9,
        wholesale_price: 99.0,
        min_wholesale_qty: 10,
        is_featured: true,
      },
      operation_id: 'op-bulk-test-1',
    };

    const parsed = BulkUpdateProductsSchema.parse(validPayload);
    assert.equal(parsed.product_ids.length, 2);
    assert.equal(parsed.updates.category, 'Calçados');
    assert.equal(parsed.operation_id, 'op-bulk-test-1');
  });

  it('2. BulkUpdateProductsSchema rejects prohibited fields (stock, ledger, etc.) via strict schema', () => {
    const prohibitedPayload = {
      product_ids: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
      updates: {
        stock: 50, // PROIBIDO
      },
      operation_id: 'op-prohibited-1',
    };

    assert.throws(
      () => BulkUpdateProductsSchema.parse(prohibitedPayload),
      /PROHIBITED_OR_UNALLOWED_FIELD|unrecognized_keys/i
    );
  });

  it('3. BulkUpdateProductsSchema rejects missing operation_id', () => {
    const missingOp = {
      product_ids: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
      updates: { is_active: false },
    };

    assert.throws(() => BulkUpdateProductsSchema.parse(missingOp));
  });

  it('4. BulkUpdateProductsSchema rejects more than 100 products', () => {
    const tooMany = Array.from({ length: 101 }, () => 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    const payload = {
      product_ids: tooMany,
      updates: { is_active: false },
      operation_id: 'op-too-many',
    };

    assert.throws(() => BulkUpdateProductsSchema.parse(payload), /Maximum 100 products/);
  });

  it('5. Scope enforcement: Principal without catalog:write cannot call bulkUpdateProducts', async () => {
    const readOnlySession = new AgentSession({
      principalId: 'test-user-ro',
      principalType: 'user' as PrincipalType,
      scopes: ['catalog:read'], // SEM catalog:write
      storeAccess: { mode: 'restricted', storeIds: ['store-a'] },
      activeStoreId: 'store-a',
      sessionId: 'session-ro',
    });

    const mockRepo: any = {
      bulkUpdateProducts: async () => ({ success: true }),
    };

    const service = new CatalogService(readOnlySession, mockRepo);

    await assert.rejects(
      async () =>
        service.bulkUpdateProducts({
          product_ids: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
          updates: { is_active: true },
          operation_id: 'op-1',
        }),
      /ForbiddenError|Missing required scope/i
    );
  });
});
