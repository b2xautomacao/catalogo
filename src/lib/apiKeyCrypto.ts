/**
 * Utility for generating and handling cryptographically strong API keys.
 * Compatible with both Browser (Web Crypto API) and Node.js (globalThis.crypto).
 * Format: b2x_live_<16-hex-prefix>_<64-hex-secret>
 * Matching shopflow-catalog-ai/src/auth/api-key.crypto.ts
 */

export interface GeneratedClientApiKey {
  rawKey: string;
  apiKey: string;
  keyPrefix: string;
  secret: string;
  keyHash: string;
}

export type CredentialStatus = 'ATIVA' | 'REVOGADA' | 'EXPIRADA';

/**
 * Computes SHA-256 hash of a string using globalThis.crypto.subtle.
 */
export async function hashSecretBrowser(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const cryptoObj = globalThis.crypto;
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const hashApiKeySHA256 = hashSecretBrowser;

/**
 * Generates an API key using the standard Crypto API (Web Crypto & Node 19+).
 */
export async function generateClientApiKey(envPrefix: 'live' | 'test' = 'live'): Promise<GeneratedClientApiKey> {
  const prefixBytes = new Uint8Array(8);
  const secretBytes = new Uint8Array(32);

  const cryptoObj = globalThis.crypto;
  cryptoObj.getRandomValues(prefixBytes);
  cryptoObj.getRandomValues(secretBytes);

  const prefixHex = Array.from(prefixBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const secretHex = Array.from(secretBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const keyPrefix = `b2x_${envPrefix}_${prefixHex}`;
  const rawKey = `${keyPrefix}_${secretHex}`;
  const keyHash = await hashSecretBrowser(secretHex);

  return {
    rawKey,
    apiKey: rawKey,
    keyPrefix,
    secret: secretHex,
    keyHash,
  };
}

/**
 * Masks the API key prefix for safe display.
 * E.g.: "b2x_live_a1b2c3d4e5f60718" -> "b2x_live_a1b2••••••"
 */
export function maskKeyPrefix(keyPrefix: string): string {
  if (!keyPrefix) return '';
  if (keyPrefix.length <= 13) return `${keyPrefix}••••••`;
  return `${keyPrefix.slice(0, 13)}••••••`;
}

/**
 * Evaluates the operational status of an API credential.
 * Accepts either an object { revoked_at, expires_at } or two arguments (revokedAt, expiresAt).
 */
export function getCredentialStatus(
  arg1?: { revoked_at?: string | null; expires_at?: string | null } | string | null,
  arg2?: string | null
): CredentialStatus {
  let revokedAt: string | null | undefined = null;
  let expiresAt: string | null | undefined = null;

  if (arg1 && typeof arg1 === 'object') {
    revokedAt = arg1.revoked_at;
    expiresAt = arg1.expires_at;
  } else {
    revokedAt = typeof arg1 === 'string' ? arg1 : null;
    expiresAt = arg2;
  }

  if (revokedAt) {
    return 'REVOGADA';
  }
  if (expiresAt) {
    const expiry = new Date(expiresAt);
    if (!isNaN(expiry.getTime()) && expiry < new Date()) {
      return 'EXPIRADA';
    }
  }
  return 'ATIVA';
}
