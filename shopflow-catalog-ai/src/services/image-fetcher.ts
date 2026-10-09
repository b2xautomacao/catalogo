import {
  ImageDownloadFailedError,
  ImageInvalidError,
  ImageSourceForbiddenError,
  ImageSourceInvalidError,
  ImageTooLargeError,
  ImageTypeNotSupportedError,
} from '../domain/errors.js';
import { validateSafeImageUrl, ValidateUrlOptions } from '../security/ssrf-validator.js';

export interface FetchedImageResult {
  buffer: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
  sizeBytes: number;
}

export interface FetchImageOptions extends ValidateUrlOptions {
  maxSizeBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_TIMEOUT_MS = 10000; // 10s
const DEFAULT_MAX_REDIRECTS = 3;

/**
 * Sniffs buffer magic bytes to verify canonical image type.
 * Blocks SVGs, HTML payloads and unsupported binaries.
 */
export function detectImageMimeFromBuffer(buffer: Buffer): {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
} {
  if (buffer.length < 12) {
    throw new ImageInvalidError('IMAGE_INVALID: File too small or empty');
  }

  // Check for SVG / HTML text attack
  const headAscii = buffer.subarray(0, 100).toString('utf8').trim().toLowerCase();
  if (
    headAscii.startsWith('<svg') ||
    headAscii.startsWith('<?xml') ||
    headAscii.startsWith('<!doctype') ||
    headAscii.startsWith('<html')
  ) {
    throw new ImageTypeNotSupportedError('IMAGE_TYPE_NOT_SUPPORTED: SVG and HTML are strictly prohibited');
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: 'image/png', extension: 'png' };
  }

  // WebP: RIFF ... WEBP
  // 'RIFF' at 0..3 (0x52 0x49 0x46 0x46) and 'WEBP' at 8..11 (0x57 0x45 0x42 0x50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mimeType: 'image/webp', extension: 'webp' };
  }

  throw new ImageTypeNotSupportedError(
    'IMAGE_TYPE_NOT_SUPPORTED: Only JPEG, PNG, and WebP formats are supported'
  );
}

/**
 * Safely fetches an image from an external URL with strict SSRF defense,
 * streaming size limits, redirect protection, and magic byte validation.
 */
export async function fetchAndValidateImage(
  sourceUrl: string,
  options: FetchImageOptions = {}
): Promise<FetchedImageResult> {
  const maxBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;

  let currentUrl = sourceUrl;
  let redirectsCount = 0;

  while (true) {
    // 1. SSRF & Host Validation on every hop
    await validateSafeImageUrl(currentUrl, options);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'B2X-Catalog-MediaService/1.0',
          Accept: 'image/webp,image/png,image/jpeg;q=0.9,*/*;q=0.1',
        },
        redirect: 'manual', // Manual handling to validate each redirect hop against SSRF
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof ImageSourceForbiddenError || err instanceof ImageSourceInvalidError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ImageDownloadFailedError('IMAGE_DOWNLOAD_FAILED: Request timed out');
      }
      const message = err instanceof Error ? err.message : 'Fetch failed';
      throw new ImageDownloadFailedError(`IMAGE_DOWNLOAD_FAILED: ${message}`);
    } finally {
      clearTimeout(timeoutId);
    }

    // 2. Handle HTTP Redirects (301, 302, 303, 307, 308)
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      redirectsCount++;
      if (redirectsCount > maxRedirects) {
        throw new ImageDownloadFailedError('IMAGE_DOWNLOAD_FAILED: Too many redirects');
      }
      const location = response.headers.get('location');
      if (!location) {
        throw new ImageDownloadFailedError('IMAGE_DOWNLOAD_FAILED: Redirect without Location header');
      }
      try {
        currentUrl = new URL(location, currentUrl).toString();
      } catch {
        throw new ImageSourceInvalidError('IMAGE_SOURCE_INVALID: Invalid redirect URL');
      }
      continue;
    }

    if (!response.ok) {
      throw new ImageDownloadFailedError(
        `IMAGE_DOWNLOAD_FAILED: Remote server responded with status ${response.status}`
      );
    }

    // 3. Early Content-Length check
    const contentLengthHeader = response.headers.get('content-length');
    if (contentLengthHeader) {
      const declaredSize = parseInt(contentLengthHeader, 10);
      if (!isNaN(declaredSize) && declaredSize > maxBytes) {
        throw new ImageTooLargeError(`IMAGE_TOO_LARGE: Declared size ${declaredSize} exceeds limit of ${maxBytes} bytes`);
      }
    }

    // 4. Stream and buffer with strict size ceiling
    const reader = response.body?.getReader();
    if (!reader) {
      throw new ImageDownloadFailedError('IMAGE_DOWNLOAD_FAILED: Readable stream unavailable');
    }

    const chunks: Uint8Array[] = [];
    let totalBytesReceived = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytesReceived += value.length;
          if (totalBytesReceived > maxBytes) {
            reader.cancel();
            throw new ImageTooLargeError(
              `IMAGE_TOO_LARGE: Download exceeded limit of ${maxBytes} bytes`
            );
          }
          chunks.push(value);
        }
      }
    } catch (err) {
      if (err instanceof ImageTooLargeError) throw err;
      throw new ImageDownloadFailedError('IMAGE_DOWNLOAD_FAILED: Error reading stream');
    }

    const fullBuffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));

    // 5. Detect and validate format from actual payload bytes
    const detected = detectImageMimeFromBuffer(fullBuffer);

    return {
      buffer: fullBuffer,
      mimeType: detected.mimeType,
      extension: detected.extension,
      sizeBytes: fullBuffer.length,
    };
  }
}
