import { randomUUID } from 'node:crypto';
import { AgentSession } from '../auth/agent-session.js';
import { requireActiveStore, requireScope } from '../auth/agent-context.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { MediaRepository } from '../repositories/media.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { fetchAndValidateImage } from './image-fetcher.js';
import {
  ProductNotFoundError,
  ImageNotFoundError,
  IdempotencyConflictError,
} from '../domain/errors.js';
import { ProductImageDto, ProductImageRecord } from '../domain/types.js';
import {
  AdicionarImagemProdutoInput,
  DefinirImagemPrincipalInput,
  RemoverImagemProdutoInput,
} from '../schemas/media.schema.js';

interface CachedMediaOperation {
  productId: string;
  sourceUrl: string;
  image: ProductImageDto;
}

export class ProductMediaService {
  // Process-level idempotency store for media imports
  private static idempotencyStore = new Map<string, CachedMediaOperation>();

  constructor(
    private session: AgentSession,
    private mediaRepo: MediaRepository = new MediaRepository(),
    private productRepo: ProductRepository = new ProductRepository(),
    private auditService: AuditService = new AuditService()
  ) {}

  /**
   * Helper to verify that a product exists and belongs to the currently active tenant.
   * Throws ProductNotFoundError if product belongs to another tenant or does not exist.
   */
  private async assertProductOwnership(productId: string): Promise<string> {
    const context = this.session.getContext();
    const activeStoreId = requireActiveStore(context);

    const product = await this.productRepo.getProductById(activeStoreId, productId);
    if (!product) {
      throw new ProductNotFoundError('PRODUCT_NOT_FOUND');
    }

    return activeStoreId;
  }

  /**
   * Maps an internal database record to a sanitized public DTO.
   */
  private toDto(record: ProductImageRecord): ProductImageDto {
    return {
      id: record.id,
      product_id: record.product_id,
      image_url: record.image_url,
      alt_text: record.alt_text ?? null,
      is_primary: record.is_primary,
      image_order: record.image_order,
      color_association: record.color_association ?? null,
    };
  }

  /**
   * Safe server-side image ingestion:
   * 1. Tenant ownership verification.
   * 2. Idempotency validation.
   * 3. SSRF safe fetch & magic byte inspection.
   * 4. Upload to canonical Supabase Storage.
   * 5. Database insert with compensation rollback.
   * 6. Automatic primary promotion if first image.
   * 7. Audit log.
   */
  async adicionarImagem(
    input: AdicionarImagemProdutoInput
  ): Promise<{ image: ProductImageDto; duplicate: boolean }> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:write');
    await this.assertProductOwnership(input.product_id);

    // 1. Idempotency check
    if (input.operation_id) {
      const cached = ProductMediaService.idempotencyStore.get(input.operation_id);
      if (cached) {
        if (cached.productId === input.product_id && cached.sourceUrl === input.source_url) {
          await this.auditService.logProductImageAdded(context, cached.image.id, {
            productId: input.product_id,
            isPrimary: cached.image.is_primary,
            imageOrder: cached.image.image_order,
            duplicate: true,
          });
          return { image: cached.image, duplicate: true };
        }
        throw new IdempotencyConflictError(
          'IDEMPOTENCY_CONFLICT: Operation ID was already used with different parameters'
        );
      }
    }

    // 2. Query existing images to compute order and primary status
    const existingImages = await this.mediaRepo.listByProductId(input.product_id);

    // Hard Rule: If product has 0 images, automatically make it primary
    let isPrimary = false;
    let order = 1;

    if (existingImages.length === 0) {
      isPrimary = true;
      order = 1;
    } else if (input.is_primary === true) {
      isPrimary = true;
      order = 1;
    } else {
      isPrimary = false;
      const targetPos = input.position ?? existingImages.length + 1;
      order = Math.min(Math.max(targetPos, 1), 10);
    }

    // 3. Safe download server-side with SSRF protection & MIME verification
    const fetched = await fetchAndValidateImage(input.source_url, {
      allowHttpInTest: true,
    });

    // 4. Generate deterministic storage path
    const fileId = randomUUID();
    const storagePath = `products/${input.product_id}/${fileId}.${fetched.extension}`;

    // 5. Upload to Object Storage
    const publicUrl = await this.mediaRepo.uploadToStorage(
      storagePath,
      fetched.buffer,
      fetched.mimeType
    );

    // 6. DB persistence with atomic compensation rollback
    let record: ProductImageRecord;
    try {
      record = await this.mediaRepo.create({
        productId: input.product_id,
        imageUrl: publicUrl,
        imageOrder: order,
        altText: input.alt_text,
        isPrimary,
        colorAssociation: input.color,
      });
    } catch (dbError) {
      // Compensating action: remove orphaned file from storage
      await this.mediaRepo.deleteFromStorage(storagePath);
      throw dbError;
    }

    const dto = this.toDto(record);

    // Save idempotency record if operation_id provided
    if (input.operation_id) {
      ProductMediaService.idempotencyStore.set(input.operation_id, {
        productId: input.product_id,
        sourceUrl: input.source_url,
        image: dto,
      });
    }

    // 7. Audit log
    await this.auditService.logProductImageAdded(context, dto.id, {
      productId: input.product_id,
      isPrimary: dto.is_primary,
      imageOrder: dto.image_order,
      duplicate: false,
    });

    return { image: dto, duplicate: false };
  }

  /**
   * Lists all images of a product. Strictly scoped to active tenant.
   */
  async listarImagens(productId: string): Promise<ProductImageDto[]> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:read');
    await this.assertProductOwnership(productId);

    const images = await this.mediaRepo.listByProductId(productId);
    return images.map((img) => this.toDto(img));
  }

  /**
   * Sets an existing image as primary cover for the product.
   */
  async definirImagemPrincipal(
    input: DefinirImagemPrincipalInput
  ): Promise<{ success: boolean; image: ProductImageDto }> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:write');
    await this.assertProductOwnership(input.product_id);

    const targetImage = await this.mediaRepo.getImageById(input.product_id, input.image_id);
    if (!targetImage) {
      throw new ImageNotFoundError('IMAGE_NOT_FOUND');
    }

    const updated = await this.mediaRepo.setPrimary(input.product_id, input.image_id);
    const dto = this.toDto(updated);

    await this.auditService.logProductImagePrimaryChanged(context, dto.id, input.product_id);

    return { success: true, image: dto };
  }

  /**
   * Removes an image from DB and Object Storage. Promotes next image if primary was removed.
   */
  async removerImagem(
    input: RemoverImagemProdutoInput
  ): Promise<{ removed: boolean; image_id: string; new_primary_id: string | null }> {
    const context = this.session.getContext();
    requireScope(context, 'catalog:write');
    await this.assertProductOwnership(input.product_id);

    const targetImage = await this.mediaRepo.getImageById(input.product_id, input.image_id);
    if (!targetImage) {
      throw new ImageNotFoundError('IMAGE_NOT_FOUND');
    }

    const result = await this.mediaRepo.delete(input.product_id, input.image_id);

    // Extract path from storage URL and delete from bucket if applicable
    if (targetImage.image_url.includes('product-images/')) {
      const parts = targetImage.image_url.split('product-images/');
      if (parts.length > 1) {
        const storagePath = parts[1].split('?')[0];
        await this.mediaRepo.deleteFromStorage(storagePath);
      }
    }

    await this.auditService.logProductImageRemoved(
      context,
      input.image_id,
      input.product_id,
      result.newPrimary?.id
    );

    return {
      removed: true,
      image_id: input.image_id,
      new_primary_id: result.newPrimary ? result.newPrimary.id : null,
    };
  }
}
