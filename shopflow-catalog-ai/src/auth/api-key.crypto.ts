import crypto from 'node:crypto';

export interface GeneratedApiKey {
  rawKey: string;
  keyPrefix: string;
  secret: string;
  keyHash: string;
}

export interface ParsedApiKey {
  keyPrefix: string;
  secret: string;
}

const API_KEY_REGEX = /^(b2x_(?:live|test)_[a-f0-9]{16})_([a-f0-9]{64})$/i;

/**
 * Generates a cryptographically strong API Key with high entropy.
 * Format: b2x_live_<16-hex-prefix>_<64-hex-secret>
 */
export function generateApiKey(envPrefix: 'live' | 'test' = 'live'): GeneratedApiKey {
  const prefixHex = crypto.randomBytes(8).toString('hex');
  const keyPrefix = `b2x_${envPrefix}_${prefixHex}`;
  const secret = crypto.randomBytes(32).toString('hex');
  const rawKey = `${keyPrefix}_${secret}`;
  const keyHash = hashSecret(secret);

  return {
    rawKey,
    keyPrefix,
    secret,
    keyHash,
  };
}

/**
 * Parses a raw API Key and extracts prefix and secret.
 * Returns null if format is invalid.
 */
export function parseApiKey(rawKey: string): ParsedApiKey | null {
  if (!rawKey || typeof rawKey !== 'string') {
    return null;
  }

  const trimmed = rawKey.trim();
  const match = trimmed.match(API_KEY_REGEX);
  if (!match) {
    return null;
  }

  const [, keyPrefix, secret] = match;
  return {
    keyPrefix,
    secret,
  };
}

/**
 * Computes a SHA-256 hash of the secret string.
 * Because the secret has 256 bits of cryptographic entropy, SHA-256 provides
 * optimal security against preimage/brute-force attacks without high CPU overhead.
 */
export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret, 'utf8').digest('hex');
}

/**
 * Constant-time comparison to prevent timing attacks.
 */
export function verifySecret(secret: string, expectedHash: string): boolean {
  if (!secret || !expectedHash) {
    return false;
  }

  const computedHash = hashSecret(secret);
  const bufA = Buffer.from(computedHash, 'utf8');
  const bufB = Buffer.from(expectedHash, 'utf8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
