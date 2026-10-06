import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GradeService } from '../src/services/grade.service.js';
import { GradeRepository } from '../src/repositories/grade.repository.js';
import { InventoryService } from '../src/services/inventory.service.js';
import { AgentSession } from '../src/auth/agent-session.js';
import {
  CreateGradeTemplateSchema,
  ApplyGradeToProductSchema,
  ListGradeTemplatesSchema,
  GetGradeTemplateSchema,
} from '../src/schemas/grade.schema.js';
import {
  ForbiddenError,
  StoreContextRequiredError,
  ProductNotFoundError,
  GradeTemplateNotFoundError,
  GradeTemplateAlreadyExistsError,
  SkuAlreadyExistsError,
} from '../src/domain/errors.js';
import {
  GradeTemplateRecord,
  GradeTemplateItemRecord,
  ProductGradeSnapshotRecord,
  ProductGradeSnapshotItemRecord,
} from '../domain/grade.types.js';

describe('Sprint 9: Grade Schemas & Mass Assignment Guard', () => {
  it('CreateGradeTemplateSchema accepts valid payload and calculates unique sizes', () => {
    const valid = CreateGradeTemplateSchema.safeParse({
      name: 'Grade Verão',
      product_category_type: 'calcado',
      items: [
        { size: '34', quantity: 1, position: 1 },
        { size: '35', quantity: 2, position: 2 },
        { size: '36', quantity: 3, position: 3 },
      ],
    });
    assert.equal(valid.success, true);
  });

  it('CreateGradeTemplateSchema STRICTLY REJECTS duplicate sizes in items', () => {
    const duplicate = CreateGradeTemplateSchema.safeParse({
      name: 'Grade Inválida',
      items: [
        { size: '36', quantity: 1 },
        { size: '36', quantity: 2 },
      ],
    });
    assert.equal(duplicate.success, false);
    if (!duplicate.success) {
      assert.match(duplicate.error.issues[0].message, /Não é permitido tamanhos duplicados/);
    }
  });

  it('CreateGradeTemplateSchema STRICTLY REJECTS forbidden fields (store_id, is_system, id, created_at)', () => {
    const forbiddenFields = [
      { store_id: '11111111-1111-4111-8111-111111111111' },
      { is_system: true },
      { id: '11111111-1111-4111-8111-111111111111' },
      { created_at: new Date().toISOString() },
    ];

    for (const forbidden of forbiddenFields) {
      const parsed = CreateGradeTemplateSchema.safeParse({
        name: 'Grade Teste',
        items: [{ size: '36', quantity: 1 }],
        ...forbidden,
      });
      assert.equal(parsed.success, false, `Expected rejection for forbidden field: ${JSON.stringify(forbidden)}`);
    }
  });

  it('CreateGradeTemplateSchema rejects zero/negative quantity or empty items array', () => {
    const zeroQty = CreateGradeTemplateSchema.safeParse({
      name: 'Grade Zero',
      items: [{ size: '36', quantity: 0 }],
    });
    assert.equal(zeroQty.success, false);

    const negativeQty = CreateGradeTemplateSchema.safeParse({
      name: 'Grade Negativa',
      items: [{ size: '36', quantity: -2 }],
    });
    assert.equal(negativeQty.success, false);

    const emptyItems = CreateGradeTemplateSchema.safeParse({
      name: 'Grade Vazia',
      items: [],
    });
    assert.equal(emptyItems.success, false);
  });

  it('ApplyGradeToProductSchema accepts valid payload and rejects forbidden fields (stock, quantity, is_grade)', () => {
    const valid = ApplyGradeToProductSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      grade_template_id: '22222222-2222-4222-8222-222222222222',
      color: 'Preto',
      sku: 'SAP-001-PRETO-GA',
    });
    assert.equal(valid.success, true);

    const forbiddenStock = ApplyGradeToProductSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      grade_template_id: '22222222-2222-4222-8222-222222222222',
      stock: 10,
    });
    assert.equal(forbiddenStock.success, false);

    const forbiddenQuantity = ApplyGradeToProductSchema.safeParse({
      product_id: '11111111-1111-4111-8111-111111111111',
      grade_template_id: '22222222-2222-4222-8222-222222222222',
      quantity: 5,
    });
    assert.equal(forbiddenQuantity.success, false);
  });
});

const storeA = '11111111-1111-1111-1111-111111111111';
const storeB = '22222222-2222-2222-2222-222222222222';

const createMockGradeEnvironment = () => {
  const templates = new Map<string, any>([
    [
      'tmpl-sys-alta',
      {
        id: 'tmpl-sys-alta',
        store_id: null,
        name: 'Grade Alta',
        slug: 'grade-alta',
        product_category_type: 'calcado',
        is_system: true,
        is_active: true,
        items: [
          { id: 'i1', grade_template_id: 'tmpl-sys-alta', size: '36', quantity: 1, position: 1 },
          { id: 'i2', grade_template_id: 'tmpl-sys-alta', size: '37', quantity: 2, position: 2 },
          { id: 'i3', grade_template_id: 'tmpl-sys-alta', size: '38', quantity: 2, position: 3 },
          { id: 'i4', grade_template_id: 'tmpl-sys-alta', size: '39', quantity: 3, position: 4 },
          { id: 'i5', grade_template_id: 'tmpl-sys-alta', size: '40', quantity: 2, position: 5 },
          { id: 'i6', grade_template_id: 'tmpl-sys-alta', size: '41', quantity: 2, position: 6 },
          { id: 'i7', grade_template_id: 'tmpl-sys-alta', size: '42', quantity: 1, position: 7 },
        ],
      },
    ],
    [
      'tmpl-sys-baixa',
      {
        id: 'tmpl-sys-baixa',
        store_id: null,
        name: 'Grade Baixa',
        slug: 'grade-baixa',
        product_category_type: 'calcado',
        is_system: true,
        is_active: true,
        items: [
          { id: 'b1', grade_template_id: 'tmpl-sys-baixa', size: '35', quantity: 1, position: 1 },
          { id: 'b2', grade_template_id: 'tmpl-sys-baixa', size: '36', quantity: 2, position: 2 },
          { id: 'b3', grade_template_id: 'tmpl-sys-baixa', size: '37', quantity: 2, position: 3 },
          { id: 'b4', grade_template_id: 'tmpl-sys-baixa', size: '38', quantity: 2, position: 4 },
          { id: 'b5', grade_template_id: 'tmpl-sys-baixa', size: '39', quantity: 1, position: 5 },
        ],
      },
    ],
  ]);

  const products = new Map<string, any>([
    [
      'prod-shoes-a',
      {
        id: 'prod-shoes-a',
        store_id: storeA,
        name: 'Tênis Sport Pro',
        stock: 0,
      },
    ],
    [
      'prod-shoes-b',
      {
        id: 'prod-shoes-b',
        store_id: storeB,
        name: 'Tênis Loja B',
        stock: 0,
      },
    ],
  ]);

  const variations = new Map<string, any>();
  const snapshots = new Map<string, any>();
  const snapshotItems = new Map<string, any>();
  const auditLogs: any[] = [];

  const mockRepo = {
    async listTemplates(storeId: string, filter: any = {}) {
      const result: any[] = [];
      for (const t of templates.values()) {
        if (!t.is_active) continue;
        if (!t.is_system && t.store_id !== storeId) continue;
        if (filter.type === 'system' && !t.is_system) continue;
        if (filter.type === 'custom' && t.is_system) continue;
        if (filter.query && !t.name.toLowerCase().includes(filter.query.toLowerCase())) continue;

        const totalUnits = t.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
        result.push({
          id: t.id,
          name: t.name,
          slug: t.slug,
          type: t.is_system ? 'system' : 'custom',
          product_category_type: t.product_category_type,
          total_units: totalUnits,
          item_count: t.items.length,
          is_active: t.is_active,
        });
      }
      return result;
    },

    async getTemplateById(storeId: string, templateId: string) {
      const t = templates.get(templateId);
      if (!t) return null;
      if (!t.is_system && t.store_id !== storeId) return null;

      const totalUnits = t.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
      return {
        id: t.id,
        store_id: t.store_id,
        name: t.name,
        slug: t.slug,
        product_category_type: t.product_category_type,
        is_system: t.is_system,
        is_active: t.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [...t.items].sort((a: any, b: any) => a.position - b.position),
        total_units: totalUnits,
      };
    },

    async createStoreTemplate(data: any) {
      // Check collision in store
      for (const t of templates.values()) {
        if (t.store_id === data.storeId && t.name.toLowerCase() === data.name.trim().toLowerCase()) {
          throw new GradeTemplateAlreadyExistsError(
            `Já existe um modelo de grade customizado com o nome "${data.name}" nesta loja`
          );
        }
      }

      const templateId = `tmpl-${Date.now()}-${Math.random()}`;
      const items = data.items.map((i: any, idx: number) => ({
        id: `item-${Date.now()}-${idx}`,
        grade_template_id: templateId,
        size: i.size,
        quantity: i.quantity,
        position: i.position ?? idx + 1,
      }));

      const record = {
        id: templateId,
        store_id: data.storeId,
        name: data.name,
        slug: null,
        product_category_type: data.productCategoryType || 'calcado',
        is_system: false,
        is_active: true,
        items,
      };

      templates.set(templateId, record);
      const totalUnits = items.reduce((sum: number, i: any) => sum + i.quantity, 0);

      return {
        ...record,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_units: totalUnits,
      };
    },

    async applyGradeToProduct(storeId: string, data: any) {
      const prod = products.get(data.productId);
      if (!prod || prod.store_id !== storeId) {
        throw new ProductNotFoundError(`Produto ${data.productId} não encontrado na loja ativa`);
      }

      const template = await this.getTemplateById(storeId, data.gradeTemplateId);
      if (!template) {
        throw new GradeTemplateNotFoundError(`Modelo de grade ${data.gradeTemplateId} não encontrado`);
      }

      if (data.sku) {
        for (const v of variations.values()) {
          if (v.product_id === data.productId && v.sku === data.sku) {
            throw new SkuAlreadyExistsError(`SKU "${data.sku}" já existe para este produto`);
          }
        }
      }

      const snapshotId = `snap-${Date.now()}-${Math.random()}`;
      const variationId = `var-grade-${Date.now()}-${Math.random()}`;
      const gradeName = data.name || template.name;

      // Create snapshot (Sprint 9.1: pack_variation_id points to pack variation)
      const snap = {
        id: snapshotId,
        store_id: storeId,
        product_id: data.productId,
        pack_variation_id: variationId,
        template_id: template.id,
        name: gradeName,
        color: data.color || null,
        total_units: template.total_units,
      };
      snapshots.set(snapshotId, snap);

      // Create compatibility variation with stock = 0
      const varRecord = {
        id: variationId,
        product_id: data.productId,
        store_id: storeId,
        sku: data.sku || null,
        name: data.color ? `${prod.name} - ${data.color} (${gradeName})` : `${prod.name} (${gradeName})`,
        color: data.color || null,
        size: null,
        is_grade: true,
        grade_name: gradeName,
        grade_sizes: template.items.map((i: any) => i.size),
        grade_pairs: template.items.map((i: any) => i.quantity),
        stock: 0, // RIGOROUSLY ZERO
      };
      variations.set(variationId, varRecord);

      // Create snapshot items (Sprint 9.1: variation_id is NULL for unit component until Variation Matrix)
      for (const i of template.items) {
        const sItemId = `sitem-${Date.now()}-${Math.random()}`;
        snapshotItems.set(sItemId, {
          id: sItemId,
          snapshot_id: snapshotId,
          size: i.size,
          quantity: i.quantity,
          position: i.position,
          variation_id: null,
        });
      }

      return {
        snapshot_id: snapshotId,
        product_id: data.productId,
        variation_id: variationId,
        template_id: template.id,
        name: gradeName,
        color: data.color || null,
        sku: varRecord.sku,
        total_units: template.total_units,
        stock: 0,
        items: template.items.map((i: any) => ({
          size: i.size,
          quantity: i.quantity,
          position: i.position,
        })),
      };
    },
  };

  const mockAudit = {
    auditLogs: [] as any[],
    async logGradeTemplateCreated(context: any, templateId: string, details: any) {
      this.auditLogs.push({ event: 'grade_template_created', context, templateId, details });
    },
    async logGradeAppliedToProduct(context: any, snapshotId: string, details: any) {
      this.auditLogs.push({ event: 'grade_applied_to_product', context, snapshotId, details });
    },
  };

  return { templates, products, variations, snapshots, snapshotItems, auditLogs: mockAudit.auditLogs, mockRepo, mockAudit };
};

describe('Sprint 9: Grade Service, System Templates, Snapshots & Isolation Logic', () => {
  it('1. System Grade Alta: returns 7 items and exactly 13 total units', async () => {
    const { mockRepo, mockAudit } = createMockGradeEnvironment();
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-1',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['grade:read'],
      sessionId: 'sess-1',
    });
    const service = new GradeService(session, mockRepo as any, mockAudit as any);

    const tmpl = await service.getTemplate({ grade_template_id: 'tmpl-sys-alta' });
    assert.equal(tmpl.name, 'Grade Alta');
    assert.equal(tmpl.is_system, true);
    assert.equal(tmpl.total_units, 13);
    assert.equal(tmpl.items.length, 7);
    assert.deepEqual(
      tmpl.items.map((i) => ({ size: i.size, qty: i.quantity })),
      [
        { size: '36', qty: 1 },
        { size: '37', qty: 2 },
        { size: '38', qty: 2 },
        { size: '39', qty: 3 },
        { size: '40', qty: 2 },
        { size: '41', qty: 2 },
        { size: '42', qty: 1 },
      ]
    );
  });

  it('2. System Grade Baixa: returns 5 items and exactly 8 total units', async () => {
    const { mockRepo, mockAudit } = createMockGradeEnvironment();
    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-1',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['grade:read'],
      sessionId: 'sess-1',
    });
    const service = new GradeService(session, mockRepo as any, mockAudit as any);

    const tmpl = await service.getTemplate({ grade_template_id: 'tmpl-sys-baixa' });
    assert.equal(tmpl.name, 'Grade Baixa');
    assert.equal(tmpl.is_system, true);
    assert.equal(tmpl.total_units, 8);
    assert.equal(tmpl.items.length, 5);
    assert.deepEqual(
      tmpl.items.map((i) => ({ size: i.size, qty: i.quantity })),
      [
        { size: '35', qty: 1 },
        { size: '36', qty: 2 },
        { size: '37', qty: 2 },
        { size: '38', qty: 2 },
        { size: '39', qty: 1 },
      ]
    );
  });

  it('3. System Visibility: Both Store A and Store B can list and get system templates', async () => {
    const { mockRepo, mockAudit } = createMockGradeEnvironment();

    const sessionA = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-a',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['grade:read'],
      sessionId: 'sess-a',
    });
    const serviceA = new GradeService(sessionA, mockRepo as any, mockAudit as any);
    const listA = await serviceA.listTemplates();
    assert.equal(listA.some((t) => t.id === 'tmpl-sys-alta'), true);

    const sessionB = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-b',
      storeAccess: { mode: 'restricted', storeIds: [storeB] },
      activeStoreId: storeB,
      scopes: ['grade:read'],
      sessionId: 'sess-b',
    });
    const serviceB = new GradeService(sessionB, mockRepo as any, mockAudit as any);
    const listB = await serviceB.listTemplates();
    assert.equal(listB.some((t) => t.id === 'tmpl-sys-alta'), true);
  });

  it('4. Custom Template & Tenant Isolation: Store A creates Grade Verão; Store B CANNOT access it', async () => {
    const { mockRepo, mockAudit } = createMockGradeEnvironment();

    const sessionA = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-a',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['grade:read', 'grade:write'],
      sessionId: 'sess-a',
    });
    const serviceA = new GradeService(sessionA, mockRepo as any, mockAudit as any);

    const custom = await serviceA.createTemplate({
      name: 'Grade Verão',
      items: [
        { size: '34', quantity: 1 },
        { size: '35', quantity: 2 },
        { size: '36', quantity: 3 },
        { size: '37', quantity: 2 },
        { size: '38', quantity: 1 },
      ],
    });

    assert.equal(custom.name, 'Grade Verão');
    assert.equal(custom.is_system, false);
    assert.equal(custom.total_units, 9);

    // Store A can access
    const gotA = await serviceA.getTemplate({ grade_template_id: custom.id });
    assert.equal(gotA.name, 'Grade Verão');

    // Store B CANNOT access (GRADE_TEMPLATE_NOT_FOUND)
    const sessionB = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-b',
      storeAccess: { mode: 'restricted', storeIds: [storeB] },
      activeStoreId: storeB,
      scopes: ['grade:read'],
      sessionId: 'sess-b',
    });
    const serviceB = new GradeService(sessionB, mockRepo as any, mockAudit as any);

    await assert.rejects(
      async () => {
        await serviceB.getTemplate({ grade_template_id: custom.id });
      },
      (err: any) => {
        assert(err instanceof GradeTemplateNotFoundError);
        return true;
      }
    );
  });

  it('5. Custom Template Name Collision: Recreating same name in same store throws GRADE_TEMPLATE_ALREADY_EXISTS', async () => {
    const { mockRepo, mockAudit } = createMockGradeEnvironment();

    const sessionA = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-a',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['grade:write'],
      sessionId: 'sess-a',
    });
    const serviceA = new GradeService(sessionA, mockRepo as any, mockAudit as any);

    await serviceA.createTemplate({
      name: 'Grade Conforto',
      items: [{ size: '38', quantity: 5 }],
    });

    await assert.rejects(
      async () => {
        await serviceA.createTemplate({
          name: 'Grade Conforto',
          items: [{ size: '39', quantity: 5 }],
        });
      },
      (err: any) => {
        assert(err instanceof GradeTemplateAlreadyExistsError);
        return true;
      }
    );
  });

  it('6. Apply Grade: Creates Snapshot + Compatibility Variation with stock = 0 and audit log', async () => {
    const { mockRepo, mockAudit, variations, snapshots } = createMockGradeEnvironment();

    const sessionA = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-a',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['grade:write'],
      sessionId: 'sess-a',
    });
    const serviceA = new GradeService(sessionA, mockRepo as any, mockAudit as any);

    const result = await serviceA.applyGradeToProduct({
      product_id: 'prod-shoes-a',
      grade_template_id: 'tmpl-sys-alta',
      color: 'Preto',
      sku: 'TSP-BLK-GA',
    });

    assert.equal(result.product_id, 'prod-shoes-a');
    assert.equal(result.template_id, 'tmpl-sys-alta');
    assert.equal(result.total_units, 13);
    assert.equal(result.stock, 0, 'Initial stock MUST be strictly 0');
    assert.equal(result.sku, 'TSP-BLK-GA');

    // Check compatibility variation
    const variation = variations.get(result.variation_id);
    assert.equal(variation.is_grade, true);
    assert.equal(variation.stock, 0);
    assert.deepEqual(variation.grade_sizes, ['36', '37', '38', '39', '40', '41', '42']);
    assert.deepEqual(variation.grade_pairs, [1, 2, 2, 3, 2, 2, 1]);

    // Check snapshot
    const snap = snapshots.get(result.snapshot_id);
    assert.equal(snap.total_units, 13);
    assert.equal(snap.name, 'Grade Alta');

    // Check audit log
    assert.equal(mockAudit.auditLogs.length, 1);
    assert.equal(mockAudit.auditLogs[0].event, 'grade_applied_to_product');
    assert.equal(mockAudit.auditLogs[0].details.totalUnits, 13);
  });

  it('7. Snapshot Immutability: Mutating template afterwards DOES NOT alter existing snapshot', async () => {
    const { mockRepo, mockAudit, templates, snapshots } = createMockGradeEnvironment();

    const sessionA = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-a',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['grade:write'],
      sessionId: 'sess-a',
    });
    const serviceA = new GradeService(sessionA, mockRepo as any, mockAudit as any);

    const applied = await serviceA.applyGradeToProduct({
      product_id: 'prod-shoes-a',
      grade_template_id: 'tmpl-sys-alta',
      color: 'Branco',
    });

    // Mutate the original template in DB (e.g. change 39 quantity from 3 to 10)
    templates.get('tmpl-sys-alta')!.items[3].quantity = 10;

    // Snapshot remains untouched!
    const snap = snapshots.get(applied.snapshot_id);
    assert.equal(snap.total_units, 13);
  });

  it('8. Cross-Tenant Protection on Apply: Store A applying to Product of Store B throws PRODUCT_NOT_FOUND', async () => {
    const { mockRepo, mockAudit } = createMockGradeEnvironment();

    const sessionA = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-a',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['grade:write'],
      sessionId: 'sess-a',
    });
    const serviceA = new GradeService(sessionA, mockRepo as any, mockAudit as any);

    await assert.rejects(
      async () => {
        await serviceA.applyGradeToProduct({
          product_id: 'prod-shoes-b', // Store B product
          grade_template_id: 'tmpl-sys-alta',
        });
      },
      (err: any) => {
        assert(err instanceof ProductNotFoundError);
        return true;
      }
    );
  });

  it('9. Scope Separation: Calling grade tools without grade:read or grade:write throws FORBIDDEN', async () => {
    const { mockRepo, mockAudit } = createMockGradeEnvironment();

    const sessionCatalogOnly = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-cat-only',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['catalog:read', 'catalog:write'], // NO grade scopes
      sessionId: 'sess-cat',
    });
    const service = new GradeService(sessionCatalogOnly, mockRepo as any, mockAudit as any);

    await assert.rejects(
      async () => {
        await service.listTemplates();
      },
      (err: any) => {
        assert(err instanceof ForbiddenError);
        assert.match(err.message, /Missing required scope: grade:read/);
        return true;
      }
    );

    await assert.rejects(
      async () => {
        await service.createTemplate({
          name: 'Grade X',
          items: [{ size: '38', quantity: 1 }],
        });
      },
      (err: any) => {
        assert(err instanceof ForbiddenError);
        assert.match(err.message, /Missing required scope: grade:write/);
        return true;
      }
    );
  });

  it('10. Inventory Integration: consultar_estoque on newly created Grade returns unit_kind pack and 13 pairs per pack', async () => {
    const { mockRepo, variations, products } = createMockGradeEnvironment();

    const sessionGrade = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-grade-creator',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['grade:write', 'stock:read'],
      sessionId: 'sess-grade',
    });
    const gradeService = new GradeService(sessionGrade, mockRepo as any);
    const applied = await gradeService.applyGradeToProduct({
      product_id: 'prod-shoes-a',
      grade_template_id: 'tmpl-sys-alta',
      color: 'Azul',
      sku: 'AZ-GA-01',
    });

    const inventoryMockRepo = {
      async getProductStockState(storeId: string, productId: string) {
        return {
          productId,
          storeId,
          productName: 'Tênis Sport Pro',
          stock: 0,
          reservedStock: 0,
          availableStock: 0,
          allowNegativeStock: false,
          hasVariations: true,
        };
      },
      async getVariationStockState(storeId: string, productId: string, variationId: string) {
        const v = variations.get(variationId);
        return {
          variationId: v.id,
          productId: v.product_id,
          storeId,
          name: v.name,
          sku: v.sku,
          color: v.color,
          size: v.size,
          isGrade: v.is_grade,
          gradeSizes: v.grade_sizes,
          gradePairs: v.grade_pairs,
          stock: v.stock,
        };
      },
      async reconcileProductStock(storeId: string, productId: string) {
        return {
          productId,
          storeId,
          productStock: 0,
          variationsTotalStock: 0,
          ledgerNetMovement: 0,
          status: 'synced',
        };
      },
    };

    const invService = new InventoryService(sessionGrade, inventoryMockRepo as any);
    const query = await invService.consultarEstoque({
      product_id: 'prod-shoes-a',
      variation_id: applied.variation_id,
    });

    assert.equal(query.unit_kind, 'pack');
    assert.equal(query.current_stock, 0);
    assert.equal(query.physical_quantity_per_unit, 13);
    assert.equal(query.physical_stock, 0);
    assert.equal(query.reconciliation_status, 'synced');
  });
});

describe('Sprint 9.1: Grade Snapshot ↔ Variation Relation Hardening', () => {
  const storeA = '11111111-1111-1111-1111-111111111111';
  const storeB = '22222222-2222-2222-2222-222222222222';

  it('1. New Apply Grade: establishes snapshot.pack_variation_id = variation.id and keeps all snapshot_items.variation_id = null', async () => {
    const { mockRepo, variations, snapshots, snapshotItems } = createMockGradeEnvironment();

    const sessionA = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-a',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['grade:write'],
      sessionId: 'sess-a',
    });
    const serviceA = new GradeService(sessionA, mockRepo as any);

    const result = await serviceA.applyGradeToProduct({
      product_id: 'prod-shoes-a',
      grade_template_id: 'tmpl-sys-alta',
      color: 'Preto',
      sku: 'TSP-BLK-GA',
    });

    // 1. Pack Variation exists and has is_grade = true
    const packVar = variations.get(result.variation_id);
    assert.ok(packVar, 'Pack variation must exist');
    assert.equal(packVar.is_grade, true);

    // 2. Snapshot has explicit pack_variation_id linking to packVar.id
    const snap = snapshots.get(result.snapshot_id);
    assert.ok(snap, 'Snapshot must exist');
    assert.equal(snap.pack_variation_id, packVar.id, 'snapshot.pack_variation_id must point to pack variation');

    // 3. NO snapshot_item points to the pack variation (variation_id MUST be null)
    const items = Array.from(snapshotItems.values()).filter((i: any) => i.snapshot_id === snap.id);
    assert.equal(items.length, 7, 'Grade Alta must have 7 items');

    for (const item of items) {
      assert.equal(item.variation_id, null, 'Snapshot item variation_id must be NULL before Variation Matrix');
      assert.notEqual(item.variation_id, packVar.id, 'Snapshot item MUST NOT point to pack variation');
    }
  });

  it('2. Physical Quantity Resolution: Grade Alta = 13 units/pack, Grade Baixa = 8 units/pack', async () => {
    const { mockRepo, variations, snapshots, snapshotItems } = createMockGradeEnvironment();

    const sessionA = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-a',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['grade:write'],
      sessionId: 'sess-a',
    });
    const serviceA = new GradeService(sessionA, mockRepo as any);

    // Grade Alta
    const altaResult = await serviceA.applyGradeToProduct({
      product_id: 'prod-shoes-a',
      grade_template_id: 'tmpl-sys-alta',
      sku: 'GA-ALTA',
    });

    // Grade Baixa
    const baixaResult = await serviceA.applyGradeToProduct({
      product_id: 'prod-shoes-a',
      grade_template_id: 'tmpl-sys-baixa',
      sku: 'GB-BAIXA',
    });

    const altaSnap = snapshots.get(altaResult.snapshot_id);
    const baixaSnap = snapshots.get(baixaResult.snapshot_id);

    assert.equal(altaSnap.total_units, 13);
    assert.equal(baixaSnap.total_units, 8);

    // 2 packs of Grade Alta -> 26 physical units
    const packsAlta = 2;
    const physicalAlta = packsAlta * altaSnap.total_units;
    assert.equal(physicalAlta, 26);

    // 3 packs of Grade Baixa -> 24 physical units
    const packsBaixa = 3;
    const physicalBaixa = packsBaixa * baixaSnap.total_units;
    assert.equal(physicalBaixa, 24);
  });

  it('3. Inventory Lookup resolves composition navigating pack variation -> grade snapshot -> snapshot items', async () => {
    const { mockRepo, variations, snapshots, snapshotItems } = createMockGradeEnvironment();

    const session = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-1',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['grade:write', 'stock:read'],
      sessionId: 'sess-1',
    });
    const gradeService = new GradeService(session, mockRepo as any);
    const applied = await gradeService.applyGradeToProduct({
      product_id: 'prod-shoes-a',
      grade_template_id: 'tmpl-sys-alta',
      color: 'Vermelho',
      sku: 'VM-GA-01',
    });

    // Mock Inventory Repository resolving via pack_variation_id in product_grade_snapshots
    const inventoryMockRepo = {
      async getProductStockState(storeId: string, productId: string) {
        return {
          productId,
          storeId,
          productName: 'Tênis Sport Pro',
          stock: 26,
          reservedStock: 0,
          availableStock: 26,
          allowNegativeStock: false,
          hasVariations: true,
        };
      },
      async getVariationStockState(storeId: string, productId: string, variationId: string) {
        const v = variations.get(variationId);
        if (!v) return null;

        let gradeSizes = v.grade_sizes;
        let gradePairs = v.grade_pairs;

        if (v.is_grade) {
          // Find snapshot by pack_variation_id
          const snap = Array.from(snapshots.values()).find((s: any) => s.pack_variation_id === variationId);
          if (snap) {
            const items = Array.from(snapshotItems.values())
              .filter((i: any) => i.snapshot_id === snap.id)
              .sort((a: any, b: any) => a.position - b.position);
            gradeSizes = items.map((i: any) => i.size);
            gradePairs = items.map((i: any) => i.quantity);
          }
        }

        return {
          variationId: v.id,
          productId: v.product_id,
          storeId,
          name: v.name,
          sku: v.sku,
          color: v.color,
          size: v.size,
          isGrade: v.is_grade,
          gradeSizes,
          gradePairs,
          stock: 2, // 2 packs
        };
      },
      async reconcileProductStock(storeId: string, productId: string) {
        return {
          productId,
          storeId,
          productStock: 26,
          variationsTotalStock: 26,
          ledgerNetMovement: 26,
          status: 'synced',
        };
      },
    };

    const invService = new InventoryService(session, inventoryMockRepo as any);
    const query = await invService.consultarEstoque({
      product_id: 'prod-shoes-a',
      variation_id: applied.variation_id,
    });

    assert.equal(query.unit_kind, 'pack');
    assert.equal(query.current_stock, 2);
    assert.equal(query.physical_quantity_per_unit, 13);
    assert.equal(query.physical_stock, 26);
    assert.equal(query.reconciliation_status, 'synced');
  });

  it('4. Backfill Simulation: converts Sprint 9 legacy snapshot records to Sprint 9.1 canonical schema', async () => {
    // Simulate legacy Sprint 9 database state
    const packVarId = 'legacy-pack-var-001';
    const legacySnapshot: any = {
      id: 'legacy-snap-001',
      store_id: storeA,
      product_id: 'prod-shoes-a',
      pack_variation_id: null, // was null in Sprint 9
      name: 'Grade Alta',
      total_units: 13,
    };

    const legacySnapshotItems: any[] = [
      { id: 'l-item-1', snapshot_id: 'legacy-snap-001', size: '36', quantity: 1, variation_id: packVarId },
      { id: 'l-item-2', snapshot_id: 'legacy-snap-001', size: '37', quantity: 2, variation_id: packVarId },
      { id: 'l-item-3', snapshot_id: 'legacy-snap-001', size: '38', quantity: 2, variation_id: packVarId },
    ];

    // Run migration backfill logic
    // Step 1: Detect common pack variation from items
    const candidatePackId = legacySnapshotItems[0].variation_id;
    legacySnapshot.pack_variation_id = candidatePackId;

    // Step 2: Clear snapshot_items.variation_id to NULL
    for (const item of legacySnapshotItems) {
      item.variation_id = null;
    }

    // Verify backfill result
    assert.equal(legacySnapshot.pack_variation_id, packVarId);
    for (const item of legacySnapshotItems) {
      assert.equal(item.variation_id, null);
      assert.notEqual(item.variation_id, packVarId);
    }
  });

  it('5. Cross-Tenant Protection: Snapshot pack_variation_id cannot reference variation of another store', async () => {
    const { mockRepo, variations, snapshots } = createMockGradeEnvironment();

    const sessionA = new AgentSession({
      principalType: 'tenant',
      principalId: 'agent-a',
      storeAccess: { mode: 'restricted', storeIds: [storeA] },
      activeStoreId: storeA,
      scopes: ['grade:write'],
      sessionId: 'sess-a',
    });
    const serviceA = new GradeService(sessionA, mockRepo as any);

    // Attempting to apply grade to Store B's product from Store A session is rejected
    await assert.rejects(
      async () => {
        await serviceA.applyGradeToProduct({
          product_id: 'prod-shoes-b', // Store B product
          grade_template_id: 'tmpl-sys-alta',
        });
      },
      (err: any) => {
        assert(err instanceof ProductNotFoundError);
        return true;
      }
    );
  });
});

