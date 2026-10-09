import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.NODE_ENV = 'test';
import { AddressInfo } from 'node:net';
import { AgentSession } from '../src/auth/agent-session.js';
import { AgentContext } from '../src/auth/agent-context.js';
import { ProductMediaService } from '../src/services/product-media.service.js';
import { MediaRepository } from '../src/repositories/media.repository.js';
import { ProductRepository } from '../src/repositories/product.repository.js';
import { AuditService } from '../src/audit/audit.service.js';
import {
  ProductNotFoundError,
  ImageNotFoundError,
  ImageSourceForbiddenError,
  ImageSourceInvalidError,
  ImageTooLargeError,
  ImageTypeNotSupportedError,
  IdempotencyConflictError,
  ForbiddenError,
  StoreContextRequiredError,
} from '../src/domain/errors.js';
import { isPrivateIPv4, isPrivateIPv6, validateSafeImageUrl } from '../src/security/ssrf-validator.js';
import { fetchAndValidateImage, detectImageMimeFromBuffer } from '../src/services/image-fetcher.js';
import { ProductImageRecord } from '../src/domain/types.js';

// Minimal valid 1x1 image buffers
const VALID_JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
  0xff, 0xd9,
]);

const VALID_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
]);

const VALID_WEBP_BUFFER = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  0x56, 0x50, 0x38, 0x20, 0x0e, 0x00, 0x00, 0x00,
]);

describe('Sprint IA — MCP Product Media & Security Architecture Tests', () => {
  const storeAId = 'store-uuid-aaaa-1111';
  const storeBId = 'store-uuid-bbbb-2222';
  const productA1Id = 'prod-uuid-a111-1111';
  const productB1Id = 'prod-uuid-b111-2222';

  // In-memory mock storage and DB tables
  let inMemoryDbImages: ProductImageRecord[] = [];
  let inMemoryStorageFiles = new Map<string, Buffer>();
  let productCovers = new Map<string, string | null>();

  // Mock server for HTTP fetch testing
  let mockHttpServer: http.Server;
  let mockServerPort: number;

  before(async () => {
    mockHttpServer = http.createServer((req, res) => {
      const url = req.url || '/';

      if (url === '/valid.jpg') {
        res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': VALID_JPEG_BUFFER.length.toString() });
        res.end(VALID_JPEG_BUFFER);
        return;
      }

      if (url === '/valid.png') {
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(VALID_PNG_BUFFER);
        return;
      }

      if (url === '/valid.webp') {
        res.writeHead(200, { 'Content-Type': 'image/webp' });
        res.end(VALID_WEBP_BUFFER);
        return;
      }

      if (url === '/fake.svg') {
        res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
        res.end('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');
        return;
      }

      if (url === '/html-masquerade') {
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end('<!DOCTYPE html><html><body>Login to AWS</body></html>');
        return;
      }

      if (url === '/oversized') {
        // Declared Content-Length > 10MB
        res.writeHead(200, { 'Content-Length': (15 * 1024 * 1024).toString() });
        res.end('oversized data');
        return;
      }

      if (url === '/redirect-to-private') {
        res.writeHead(302, { Location: 'http://127.0.0.1:8080/internal' });
        res.end();
        return;
      }

      if (url === '/redirect-valid') {
        res.writeHead(302, { Location: '/valid.jpg' });
        res.end();
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    });

    await new Promise<void>((resolve) => {
      mockHttpServer.listen(0, '127.0.0.1', () => {
        mockServerPort = (mockHttpServer.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  after(() => {
    mockHttpServer.close();
  });

  // Helper mock MediaRepository
  function createMockMediaRepo(failDbInsert = false) {
    const repo = new MediaRepository();

    repo.listByProductId = async (pId: string) => {
      return inMemoryDbImages
        .filter((img) => img.product_id === pId)
        .sort((a, b) => a.image_order - b.image_order);
    };

    repo.getImageById = async (pId: string, imgId: string) => {
      return inMemoryDbImages.find((img) => img.product_id === pId && img.id === imgId) || null;
    };

    repo.create = async (input) => {
      if (failDbInsert) {
        throw new Error('Database simulation failure: constraint violation');
      }

      if (input.isPrimary) {
        inMemoryDbImages.forEach((img) => {
          if (img.product_id === input.productId) img.is_primary = false;
        });
      }

      const newRecord: ProductImageRecord = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        product_id: input.productId,
        image_url: input.imageUrl,
        image_order: input.imageOrder,
        alt_text: input.altText ?? null,
        is_primary: input.isPrimary,
        color_association: input.colorAssociation ?? null,
        created_at: new Date().toISOString(),
      };

      inMemoryDbImages.push(newRecord);
      if (input.isPrimary) {
        productCovers.set(input.productId, newRecord.image_url);
      }
      return newRecord;
    };

    repo.setPrimary = async (pId: string, imgId: string) => {
      const target = inMemoryDbImages.find((img) => img.product_id === pId && img.id === imgId);
      if (!target) throw new ImageNotFoundError('IMAGE_NOT_FOUND');

      inMemoryDbImages.forEach((img) => {
        if (img.product_id === pId) img.is_primary = false;
      });

      target.is_primary = true;
      target.image_order = 1;
      productCovers.set(pId, target.image_url);
      return target;
    };

    repo.delete = async (pId: string, imgId: string) => {
      const target = inMemoryDbImages.find((img) => img.product_id === pId && img.id === imgId);
      if (!target) throw new ImageNotFoundError('IMAGE_NOT_FOUND');

      inMemoryDbImages = inMemoryDbImages.filter((img) => img.id !== imgId);
      let newPrimary: ProductImageRecord | null = null;

      if (target.is_primary) {
        const remaining = inMemoryDbImages.filter((img) => img.product_id === pId);
        if (remaining.length > 0) {
          remaining[0].is_primary = true;
          remaining[0].image_order = 1;
          newPrimary = remaining[0];
          productCovers.set(pId, newPrimary.image_url);
        } else {
          productCovers.set(pId, null);
        }
      }

      return { deleted: target, newPrimary };
    };

    repo.uploadToStorage = async (path: string, buffer: Buffer) => {
      inMemoryStorageFiles.set(path, buffer);
      return `https://storage.b2x.com.br/product-images/${path}`;
    };

    repo.deleteFromStorage = async (path: string) => {
      inMemoryStorageFiles.delete(path);
    };

    repo.syncProductCover = async (pId: string, url: string | null) => {
      productCovers.set(pId, url);
    };

    return repo;
  }

  // Helper mock ProductRepository for tenant isolation
  function createMockProductRepo() {
    const repo = new ProductRepository();
    repo.getProductById = async (storeId: string, id: string) => {
      if (storeId === storeAId && id === productA1Id) {
        return {
          id: productA1Id,
          name: 'Perfume Rose Noir',
          sku: 'RN-001',
          retail_price: 259,
          wholesale_price: 189,
          stock: 0,
          is_active: true,
          images: [],
          variations: [],
        };
      }
      if (storeId === storeBId && id === productB1Id) {
        return {
          id: productB1Id,
          name: 'Perfume Outra Loja',
          sku: 'OL-001',
          retail_price: 99,
          wholesale_price: 79,
          stock: 5,
          is_active: true,
          images: [],
          variations: [],
        };
      }
      return null;
    };
    return repo;
  }

  // Create mock AgentSession
  function createSession(storeId: string | null, scopes: string[] = ['catalog:read', 'catalog:write']) {
    const context: AgentContext = {
      sessionId: 'session-media-test',
      credentialPrefix: 'b2x_live_test_prefix',
      principalType: 'tenant',
      principalId: 'tenant-test',
      activeStoreId: storeId,
      storeAccess: storeId
        ? { mode: 'restricted', storeIds: [storeId] }
        : { mode: 'restricted', storeIds: [] },
      scopes,
    };
    return new AgentSession(context);
  }

  // ==========================================
  // 1. SSRF & IP BLOCKING UNIT TESTS
  // ==========================================
  describe('1. SSRF Guard & IP Range Protection', () => {
    it('Blocks IPv4 private ranges (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x)', () => {
      assert.equal(isPrivateIPv4('127.0.0.1'), true);
      assert.equal(isPrivateIPv4('10.0.0.1'), true);
      assert.equal(isPrivateIPv4('172.16.0.1'), true);
      assert.equal(isPrivateIPv4('172.31.255.255'), true);
      assert.equal(isPrivateIPv4('192.168.1.100'), true);
      assert.equal(isPrivateIPv4('169.254.169.254'), true); // AWS/GCP Metadata
      assert.equal(isPrivateIPv4('100.64.0.1'), true); // Carrier-grade NAT
      assert.equal(isPrivateIPv4('0.0.0.0'), true);
      assert.equal(isPrivateIPv4('224.0.0.1'), true); // Multicast

      // Public IPs allowed
      assert.equal(isPrivateIPv4('8.8.8.8'), false);
      assert.equal(isPrivateIPv4('1.1.1.1'), false);
      assert.equal(isPrivateIPv4('151.101.1.140'), false);
    });

    it('Blocks IPv6 loopback, link-local, and unique local addresses', () => {
      assert.equal(isPrivateIPv6('::1'), true);
      assert.equal(isPrivateIPv6('fe80::1'), true);
      assert.equal(isPrivateIPv6('fc00::1'), true);
      assert.equal(isPrivateIPv6('::ffff:127.0.0.1'), true);
      assert.equal(isPrivateIPv6('::ffff:192.168.0.1'), true);

      // Public IPv6
      assert.equal(isPrivateIPv6('2001:4860:4860::8888'), false);
    });

    it('Rejects non-HTTPS protocol outside test mode', async () => {
      await assert.rejects(
        async () => {
          await validateSafeImageUrl('ftp://example.com/photo.jpg', { allowHttpInTest: false });
        },
        ImageSourceInvalidError
      );
    });

    it('Rejects localhost and loopback targets directly', async () => {
      await assert.rejects(
        async () => {
          await validateSafeImageUrl('https://localhost/secret.jpg');
        },
        ImageSourceForbiddenError
      );

      await assert.rejects(
        async () => {
          await validateSafeImageUrl('https://127.0.0.1/admin.png');
        },
        ImageSourceForbiddenError
      );
    });
  });

  // ==========================================
  // 2. MIME & MAGIC BYTE VALIDATION
  // ==========================================
  describe('2. MIME & Magic Byte Validation', () => {
    it('Accurately detects valid JPEG, PNG and WebP buffers', () => {
      assert.deepEqual(detectImageMimeFromBuffer(VALID_JPEG_BUFFER), {
        mimeType: 'image/jpeg',
        extension: 'jpg',
      });
      assert.deepEqual(detectImageMimeFromBuffer(VALID_PNG_BUFFER), {
        mimeType: 'image/png',
        extension: 'png',
      });
      assert.deepEqual(detectImageMimeFromBuffer(VALID_WEBP_BUFFER), {
        mimeType: 'image/webp',
        extension: 'webp',
      });
    });

    it('Strictly rejects SVG and XML payloads', () => {
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');
      assert.throws(() => detectImageMimeFromBuffer(svgBuffer), ImageTypeNotSupportedError);
    });

    it('Strictly rejects HTML masquerading as image', () => {
      const htmlBuffer = Buffer.from('<!DOCTYPE html><html><body>Hacked</body></html>');
      assert.throws(() => detectImageMimeFromBuffer(htmlBuffer), ImageTypeNotSupportedError);
    });

    it('Rejects random corrupt binary files', () => {
      const corrupt = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c]);
      assert.throws(() => detectImageMimeFromBuffer(corrupt), ImageTypeNotSupportedError);
    });
  });

  // ==========================================
  // 3. MEDIA SERVICE CORE WORKFLOW
  // ==========================================
  describe('3. Media Service Operations & Auto-Primary Rules', () => {
    beforeEach(() => {
      inMemoryDbImages = [];
      inMemoryStorageFiles.clear();
      productCovers.clear();
    });

    it('Adds first image to product: automatically assigned as primary cover and syncs products.image_url', async () => {
      const session = createSession(storeAId);
      const mediaRepo = createMockMediaRepo();
      const productRepo = createMockProductRepo();
      const service = new ProductMediaService(session, mediaRepo, productRepo);

      const url = `http://127.0.0.1:${mockServerPort}/valid.jpg`;
      const result = await service.adicionarImagem({
        product_id: productA1Id,
        source_url: url,
        alt_text: 'Frasco Rose Noir 100ml',
      });

      assert.equal(result.duplicate, false);
      assert.equal(result.image.product_id, productA1Id);
      assert.equal(result.image.is_primary, true, 'First image must automatically become is_primary = true');
      assert.equal(result.image.image_order, 1);
      assert.equal(result.image.alt_text, 'Frasco Rose Noir 100ml');

      // Check product cover sync
      assert.equal(productCovers.get(productA1Id), result.image.image_url);
      // Check storage uploaded
      assert.equal(inMemoryStorageFiles.size, 1);
    });

    it('Adds second image with is_primary = false: joins queue at position 2 without demoting cover', async () => {
      const session = createSession(storeAId);
      const mediaRepo = createMockMediaRepo();
      const productRepo = createMockProductRepo();
      const service = new ProductMediaService(session, mediaRepo, productRepo);

      const url1 = `http://127.0.0.1:${mockServerPort}/valid.jpg`;
      const url2 = `http://127.0.0.1:${mockServerPort}/valid.png`;

      const first = await service.adicionarImagem({
        product_id: productA1Id,
        source_url: url1,
      });

      const second = await service.adicionarImagem({
        product_id: productA1Id,
        source_url: url2,
        is_primary: false,
      });

      assert.equal(first.image.is_primary, true);
      assert.equal(second.image.is_primary, false);
      assert.equal(second.image.image_order, 2);
      assert.equal(productCovers.get(productA1Id), first.image.image_url);
    });

    it('Sets primary image: demotes old primary, sets new image_order = 1 and updates product cover', async () => {
      const session = createSession(storeAId);
      const mediaRepo = createMockMediaRepo();
      const productRepo = createMockProductRepo();
      const service = new ProductMediaService(session, mediaRepo, productRepo);

      const url1 = `http://127.0.0.1:${mockServerPort}/valid.jpg`;
      const url2 = `http://127.0.0.1:${mockServerPort}/valid.png`;

      const first = await service.adicionarImagem({ product_id: productA1Id, source_url: url1 });
      const second = await service.adicionarImagem({ product_id: productA1Id, source_url: url2 });

      // Change primary to second image
      const setPrimaryResult = await service.definirImagemPrincipal({
        product_id: productA1Id,
        image_id: second.image.id,
      });

      assert.equal(setPrimaryResult.success, true);
      assert.equal(setPrimaryResult.image.is_primary, true);
      assert.equal(setPrimaryResult.image.image_order, 1);
      assert.equal(productCovers.get(productA1Id), second.image.image_url);

      // Verify first was demoted
      const allImages = await service.listarImagens(productA1Id);
      const originalFirst = allImages.find((img) => img.id === first.image.id);
      assert.equal(originalFirst?.is_primary, false);
    });

    it('Removes primary image: promotes next remaining image to primary', async () => {
      const session = createSession(storeAId);
      const mediaRepo = createMockMediaRepo();
      const productRepo = createMockProductRepo();
      const service = new ProductMediaService(session, mediaRepo, productRepo);

      const url1 = `http://127.0.0.1:${mockServerPort}/valid.jpg`;
      const url2 = `http://127.0.0.1:${mockServerPort}/valid.webp`;

      const img1 = await service.adicionarImagem({ product_id: productA1Id, source_url: url1 });
      const img2 = await service.adicionarImagem({ product_id: productA1Id, source_url: url2 });

      // Remove img1 (currently primary)
      const removeResult = await service.removerImagem({
        product_id: productA1Id,
        image_id: img1.image.id,
      });

      assert.equal(removeResult.removed, true);
      assert.equal(removeResult.new_primary_id, img2.image.id);
      assert.equal(productCovers.get(productA1Id), img2.image.image_url);

      const remaining = await service.listarImagens(productA1Id);
      assert.equal(remaining.length, 1);
      assert.equal(remaining[0].is_primary, true);
    });

    it('Removes the only image: sets products.image_url to null', async () => {
      const session = createSession(storeAId);
      const mediaRepo = createMockMediaRepo();
      const productRepo = createMockProductRepo();
      const service = new ProductMediaService(session, mediaRepo, productRepo);

      const img = await service.adicionarImagem({
        product_id: productA1Id,
        source_url: `http://127.0.0.1:${mockServerPort}/valid.jpg`,
      });

      const removeResult = await service.removerImagem({
        product_id: productA1Id,
        image_id: img.image.id,
      });

      assert.equal(removeResult.removed, true);
      assert.equal(removeResult.new_primary_id, null);
      assert.equal(productCovers.get(productA1Id), null);
    });
  });

  // ==========================================
  // 4. IDEMPOTENCY & SAFE RETRIES
  // ==========================================
  describe('4. Media Idempotency Handling', () => {
    it('Same operation_id + same payload returns existing image with duplicate: true without re-downloading', async () => {
      const session = createSession(storeAId);
      const mediaRepo = createMockMediaRepo();
      const productRepo = createMockProductRepo();
      const service = new ProductMediaService(session, mediaRepo, productRepo);

      const opId = 'idempotent-rose-noir-001';
      const url = `http://127.0.0.1:${mockServerPort}/valid.jpg`;

      const firstCall = await service.adicionarImagem({
        product_id: productA1Id,
        source_url: url,
        operation_id: opId,
      });
      assert.equal(firstCall.duplicate, false);

      const secondCall = await service.adicionarImagem({
        product_id: productA1Id,
        source_url: url,
        operation_id: opId,
      });
      assert.equal(secondCall.duplicate, true);
      assert.equal(secondCall.image.id, firstCall.image.id);
      assert.equal(inMemoryDbImages.length, 1, 'No duplicate DB row must be created');
    });

    it('Same operation_id with conflicting parameters throws IDEMPOTENCY_CONFLICT', async () => {
      const session = createSession(storeAId);
      const mediaRepo = createMockMediaRepo();
      const productRepo = createMockProductRepo();
      const service = new ProductMediaService(session, mediaRepo, productRepo);

      const opId = 'idempotent-conflict-002';
      await service.adicionarImagem({
        product_id: productA1Id,
        source_url: `http://127.0.0.1:${mockServerPort}/valid.jpg`,
        operation_id: opId,
      });

      await assert.rejects(
        async () => {
          await service.adicionarImagem({
            product_id: productA1Id,
            source_url: `http://127.0.0.1:${mockServerPort}/valid.png`, // Different source
            operation_id: opId,
          });
        },
        IdempotencyConflictError
      );
    });
  });

  // ==========================================
  // 5. ATOMICITY & COMPENSATION ROLLBACK
  // ==========================================
  describe('5. Storage Compensation & Rollback', () => {
    it('When DB insert fails after storage upload, uploaded storage file is immediately cleaned up', async () => {
      const session = createSession(storeAId);
      const mediaRepo = createMockMediaRepo(true); // Simulates DB failure
      const productRepo = createMockProductRepo();
      const service = new ProductMediaService(session, mediaRepo, productRepo);

      inMemoryStorageFiles.clear();

      await assert.rejects(
        async () => {
          await service.adicionarImagem({
            product_id: productA1Id,
            source_url: `http://127.0.0.1:${mockServerPort}/valid.jpg`,
          });
        },
        /Database simulation failure/
      );

      // Verify that compensation deleted the orphaned file from storage
      assert.equal(inMemoryStorageFiles.size, 0, 'Orphaned storage file must be rolled back');
    });
  });

  // ==========================================
  // 6. MULTI-TENANT ISOLATION
  // ==========================================
  describe('6. Multi-Tenant Isolation (Store A vs Store B)', () => {
    it('Store A credential attempting to add image to Store B product returns PRODUCT_NOT_FOUND', async () => {
      const sessionA = createSession(storeAId);
      const mediaRepo = createMockMediaRepo();
      const productRepo = createMockProductRepo();
      const service = new ProductMediaService(sessionA, mediaRepo, productRepo);

      await assert.rejects(
        async () => {
          await service.adicionarImagem({
            product_id: productB1Id, // Product of Store B!
            source_url: `http://127.0.0.1:${mockServerPort}/valid.jpg`,
          });
        },
        ProductNotFoundError
      );
    });

    it('Store A credential attempting to list images of Store B product returns PRODUCT_NOT_FOUND', async () => {
      const sessionA = createSession(storeAId);
      const mediaRepo = createMockMediaRepo();
      const productRepo = createMockProductRepo();
      const service = new ProductMediaService(sessionA, mediaRepo, productRepo);

      await assert.rejects(
        async () => {
          await service.listarImagens(productB1Id);
        },
        ProductNotFoundError
      );
    });

    it('Operation without active store context throws STORE_CONTEXT_REQUIRED', async () => {
      const sessionNoStore = createSession(null);
      const mediaRepo = createMockMediaRepo();
      const productRepo = createMockProductRepo();
      const service = new ProductMediaService(sessionNoStore, mediaRepo, productRepo);

      await assert.rejects(
        async () => {
          await service.listarImagens(productA1Id);
        },
        StoreContextRequiredError
      );
    });

    it('Read-only credential without catalog:write cannot add images (throws FORBIDDEN)', async () => {
      const sessionReadOnly = createSession(storeAId, ['catalog:read']);
      const mediaRepo = createMockMediaRepo();
      const productRepo = createMockProductRepo();
      const service = new ProductMediaService(sessionReadOnly, mediaRepo, productRepo);

      await assert.rejects(
        async () => {
          await service.adicionarImagem({
            product_id: productA1Id,
            source_url: `http://127.0.0.1:${mockServerPort}/valid.jpg`,
          });
        },
        ForbiddenError
      );
    });
  });
});
