import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BuscarCatalogoSchema } from '../src/schemas/search.schema.js';
import { CatalogService } from '../src/services/catalog.service.js';
import { AgentSession } from '../src/auth/agent-session.js';
import { PrincipalType } from '../src/auth/agent-context.js';

describe('Sprint 12 — FASE B: Advanced Catalog Search & Intelligence (MCP)', () => {
  const session = new AgentSession({
    principalId: 'test-user-search',
    principalType: 'user' as PrincipalType,
    scopes: ['catalog:read'],
    storeAccess: { mode: 'restricted', storeIds: ['store-a'] },
    activeStoreId: 'store-a',
    sessionId: 'session-search-1',
  });

  const mockProducts = [
    {
      id: 'p1',
      name: 'Tênis Esportivo Ultra',
      sku: 'TEN-001',
      category: 'Calçados',
      material: 'Couro',
      retail_price: 150.0,
      stock: 30,
      is_active: true,
      is_featured: true,
      product_images: [{ id: 'img1', image_url: 'https://img.com/1.jpg' }],
      product_variations: [
        { id: 'v1', name: 'Preto 40', color: 'Preto', size: '40', stock: 30, is_grade: false },
      ],
      product_grade_snapshots: [
        { id: 'gs1', template_name: 'Grade Alta Clássica', product_grade_snapshot_items: [{ size: '40', quantity: 13 }] },
      ],
    },
    {
      id: 'p2',
      name: 'Chinelo Básico',
      sku: null,
      category: 'Calçados',
      material: 'Borracha',
      retail_price: 29.9,
      stock: 2, // low stock <= 5
      is_active: true,
      is_featured: false,
      product_images: [],
      product_variations: [],
      product_grade_snapshots: [],
    },
  ];

  const mockRepo: any = {
    searchCatalog: async (_storeId: string, _input: any) => mockProducts,
  };

  it('1. BuscarCatalogoSchema validates and defaults sorting/pagination parameters', () => {
    const parsed = BuscarCatalogoSchema.parse({
      query: 'Tênis',
      is_active: true,
    });

    assert.equal(parsed.query, 'Tênis');
    assert.equal(parsed.is_active, true);
    assert.equal(parsed.sort_by, 'name');
    assert.equal(parsed.page, 1);
    assert.equal(parsed.page_size, 20);
    assert.equal(parsed.stock_status, 'all');
  });

  it('2. BuscarCatalogoSchema rejects unrecognized fields (SQL injection guard)', () => {
    const badPayload = {
      query: 'Tênis',
      sql_filter: 'DROP TABLE products;',
    };

    assert.throws(() => BuscarCatalogoSchema.parse(badPayload));
  });

  it('3. CatalogService.searchCatalog performs text search across name, sku, variation color/size, and grade', async () => {
    const service = new CatalogService(session, mockRepo);

    // Search by variation color
    const resColor = await service.searchCatalog({ query: 'Preto' });
    assert.equal(resColor.total_count, 1);
    assert.equal(resColor.items[0].id, 'p1');

    // Search by Grade name
    const resGrade = await service.searchCatalog({ query: 'Grade Alta' });
    assert.equal(resGrade.total_count, 1);
    assert.equal(resGrade.items[0].id, 'p1');
  });

  it('4. CatalogService.searchCatalog filters by stock status (in_stock vs low_stock)', async () => {
    const service = new CatalogService(session, mockRepo);

    const resLow = await service.searchCatalog({ stock_status: 'low_stock' });
    assert.equal(resLow.total_count, 1);
    assert.equal(resLow.items[0].id, 'p2');
  });

  it('5. Scope enforcement: Principal without catalog:read cannot search catalog', async () => {
    const noCatalogSession = new AgentSession({
      principalId: 'test-no-scope',
      principalType: 'user' as PrincipalType,
      scopes: ['stock:read'], // SEM catalog:read
      storeAccess: { mode: 'restricted', storeIds: ['store-a'] },
      activeStoreId: 'store-a',
      sessionId: 'session-no-scope',
    });

    const service = new CatalogService(noCatalogSession, mockRepo);

    await assert.rejects(
      async () => service.searchCatalog({ query: 'Tênis' }),
      /ForbiddenError|Missing required scope/i
    );
  });
});
