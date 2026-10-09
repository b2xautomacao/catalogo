import dns from 'node:dns/promises';
import { isIP } from 'node:net';
import { ImageSourceForbiddenError, ImageSourceInvalidError } from '../domain/errors.js';

/**
 * Checks whether an IPv4 address falls inside reserved/private/loopback ranges.
 */
export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IPv4 is treated as unsafe
  }

  const [b0, b1] = parts;

  // 0.0.0.0/8 (Current network)
  if (b0 === 0) return true;

  // 10.0.0.0/8 (Private)
  if (b0 === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (b0 === 127) return true;

  // 169.254.0.0/16 (Link-local / Cloud Metadata)
  if (b0 === 169 && b1 === 254) return true;

  // 172.16.0.0/12 (Private: 172.16.x.x - 172.31.x.x)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;

  // 192.168.0.0/16 (Private)
  if (b0 === 192 && b1 === 168) return true;

  // 100.64.0.0/10 (Carrier-grade NAT: 100.64.x.x - 100.127.x.x)
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

  // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (TEST-NET)
  if (b0 === 192 && b1 === 0 && parts[2] === 2) return true;
  if (b0 === 198 && b1 === 51 && parts[2] === 100) return true;
  if (b0 === 203 && b1 === 0 && parts[2] === 113) return true;

  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (b0 >= 224) return true;

  return false;
}

/**
 * Checks whether an IPv6 address falls inside reserved/private/loopback ranges.
 */
export function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
  // Unspecified
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

  // IPv4-mapped IPv6 (::ffff:192.168.1.1)
  if (normalized.startsWith('::ffff:')) {
    const v4 = normalized.substring(7);
    if (isIP(v4) === 4) {
      return isPrivateIPv4(v4);
    }
  }

  // fe80::/10 (Link-local)
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
    return true;
  }

  // fc00::/7 (Unique Local Address: fc00::/8 and fd00::/8)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true;
  }

  // ff00::/8 (Multicast)
  if (normalized.startsWith('ff')) {
    return true;
  }

  return false;
}

export function isPrivateIpAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    return isPrivateIPv4(ip);
  }
  if (version === 6) {
    return isPrivateIPv6(ip);
  }
  return true; // Unknown IP format is rejected
}

export interface ValidateUrlOptions {
  allowHttpInTest?: boolean;
}

/**
 * Validates a target URL against SSRF attack vectors.
 * Resolves DNS to ensure hostname does not point to internal/loopback/cloud-metadata IP.
 */
export async function validateSafeImageUrl(
  urlString: string,
  options: ValidateUrlOptions = {}
): Promise<URL> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlString);
  } catch {
    throw new ImageSourceInvalidError('IMAGE_SOURCE_INVALID');
  }

  // Protocol enforcement
  const isHttpAllowed = options.allowHttpInTest && (process.env.NODE_ENV === 'test');
  if (parsedUrl.protocol !== 'https:' && !(isHttpAllowed && parsedUrl.protocol === 'http:')) {
    throw new ImageSourceInvalidError('IMAGE_SOURCE_INVALID: Only HTTPS protocol is allowed');
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const isTestLoopbackAllowed = Boolean(options.allowHttpInTest && process.env.NODE_ENV === 'test');

  // Hostname string checks
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  ) {
    if (isTestLoopbackAllowed && (hostname === '127.0.0.1' || hostname === 'localhost')) {
      return parsedUrl;
    }
    throw new ImageSourceForbiddenError('IMAGE_SOURCE_FORBIDDEN: Target host is blocked');
  }

  // If hostname is directly an IP address
  if (isIP(hostname)) {
    if (isPrivateIpAddress(hostname)) {
      if (isTestLoopbackAllowed && hostname === '127.0.0.1') {
        return parsedUrl;
      }
      throw new ImageSourceForbiddenError('IMAGE_SOURCE_FORBIDDEN: Private IP address is blocked');
    }
    return parsedUrl;
  }

  // DNS resolution check to prevent DNS rebinding / host spoofing
  try {
    const lookupResults = await dns.lookup(hostname, { all: true });
    if (!lookupResults || lookupResults.length === 0) {
      throw new ImageSourceInvalidError('IMAGE_SOURCE_INVALID: Hostname could not be resolved');
    }

    for (const record of lookupResults) {
      if (isPrivateIpAddress(record.address)) {
        throw new ImageSourceForbiddenError(
          `IMAGE_SOURCE_FORBIDDEN: Hostname resolved to forbidden IP (${record.address})`
        );
      }
    }
  } catch (err: unknown) {
    if (err instanceof ImageSourceForbiddenError || err instanceof ImageSourceInvalidError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'DNS lookup failed';
    throw new ImageSourceInvalidError(`IMAGE_SOURCE_INVALID: ${message}`);
  }

  return parsedUrl;
}
