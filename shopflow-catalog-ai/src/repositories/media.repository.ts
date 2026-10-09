import { supabase } from '../lib/supabase.js';
import { ProductImageRecord } from '../domain/types.js';
import { ImageNotFoundError, ImageUploadFailedError } from '../domain/errors.js';

export interface CreateProductImageDbInput {
  productId: string;
  imageUrl: string;
  imageOrder: number;
  altText?: string | null;
  isPrimary: boolean;
  colorAssociation?: string | null;
}

export class MediaRepository {
  private bucketName = 'product-images';

  /**
   * Lists all canonical image records for a given product, ordered by position.
   */
  async listByProductId(productId: string): Promise<ProductImageRecord[]> {
    const { data, error } = await supabase
      .from('product_images')
      .select('id, product_id, variation_id, image_url, image_order, alt_text, is_primary, color_association, created_at')
      .eq('product_id', productId)
      .order('image_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error listing product images: ${error.message}`);
    }

    return (data as ProductImageRecord[]) || [];
  }

  /**
   * Fetches an image record by ID, verifying product ownership.
   */
  async getImageById(productId: string, imageId: string): Promise<ProductImageRecord | null> {
    const { data, error } = await supabase
      .from('product_images')
      .select('id, product_id, variation_id, image_url, image_order, alt_text, is_primary, color_association, created_at')
      .eq('product_id', productId)
      .eq('id', imageId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as ProductImageRecord;
  }

  /**
   * Creates a product image record and syncs product cover if primary.
   */
  async create(input: CreateProductImageDbInput): Promise<ProductImageRecord> {
    // If setting as primary, demote any existing primary images
    if (input.isPrimary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', input.productId);
    }

    const { data, error } = await supabase
      .from('product_images')
      .insert({
        product_id: input.productId,
        image_url: input.imageUrl,
        image_order: input.imageOrder,
        alt_text: input.altText ?? null,
        is_primary: input.isPrimary,
        color_association: input.colorAssociation ?? null,
      })
      .select('id, product_id, variation_id, image_url, image_order, alt_text, is_primary, color_association, created_at')
      .single();

    if (error || !data) {
      throw new Error(`Error inserting product image: ${error?.message}`);
    }

    const created = data as ProductImageRecord;

    // Synchronize products.image_url if primary
    if (input.isPrimary) {
      await this.syncProductCover(input.productId, created.image_url);
    }

    return created;
  }

  /**
   * Sets an image as the primary cover, demotes others, and syncs products.image_url.
   */
  async setPrimary(productId: string, imageId: string): Promise<ProductImageRecord> {
    const image = await this.getImageById(productId, imageId);
    if (!image) {
      throw new ImageNotFoundError('IMAGE_NOT_FOUND');
    }

    // Demote all images of this product
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId);

    // Promote target image and set image_order = 1
    const { data, error } = await supabase
      .from('product_images')
      .update({ is_primary: true, image_order: 1 })
      .eq('id', imageId)
      .select('id, product_id, variation_id, image_url, image_order, alt_text, is_primary, color_association, created_at')
      .single();

    if (error || !data) {
      throw new Error(`Error updating primary image: ${error?.message}`);
    }

    const updated = data as ProductImageRecord;
    await this.syncProductCover(productId, updated.image_url);

    return updated;
  }

  /**
   * Deletes an image record from DB. If it was primary, promotes next available image
   * or resets products.image_url to null.
   */
  async delete(
    productId: string,
    imageId: string
  ): Promise<{ deleted: ProductImageRecord; newPrimary: ProductImageRecord | null }> {
    const image = await this.getImageById(productId, imageId);
    if (!image) {
      throw new ImageNotFoundError('IMAGE_NOT_FOUND');
    }

    const { error: deleteError } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      throw new Error(`Error deleting product image: ${deleteError.message}`);
    }

    let newPrimary: ProductImageRecord | null = null;

    if (image.is_primary) {
      const remaining = await this.listByProductId(productId);
      if (remaining.length > 0) {
        // Promote first remaining image to primary
        newPrimary = await this.setPrimary(productId, remaining[0].id);
      } else {
        // No images left, clear cover
        await this.syncProductCover(productId, null);
      }
    }

    return { deleted: image, newPrimary };
  }

  /**
   * Synchronizes the canonical products.image_url cover column.
   */
  async syncProductCover(productId: string, imageUrl: string | null): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId);

    if (error) {
      console.warn(`[MediaRepository] Warning syncing products.image_url: ${error.message}`);
    }
  }

  /**
   * Uploads an image binary buffer to Supabase Storage and returns its public URL.
   */
  async uploadToStorage(storagePath: string, buffer: Buffer, contentType: string): Promise<string> {
    const { error } = await supabase.storage
      .from(this.bucketName)
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new ImageUploadFailedError(`IMAGE_UPLOAD_FAILED: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  }

  /**
   * Compensating action: deletes uploaded file from storage if DB transaction fails.
   */
  async deleteFromStorage(storagePath: string): Promise<void> {
    try {
      await supabase.storage.from(this.bucketName).remove([storagePath]);
    } catch (err) {
      console.warn(`[MediaRepository] Compensation warning deleting ${storagePath}:`, err);
    }
  }
}
