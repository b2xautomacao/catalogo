import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AgentContext } from './agent-context.js';
import { parseApiKey, verifySecret } from './api-key.crypto.js';
import { CredentialRepository } from './credential.repository.js';
import { InvalidCredentialError } from '../domain/errors.js';

export class AuthenticatedContextProvider {
  private repository: CredentialRepository;
  private apiKey: string;

  constructor(apiKey?: string, repository?: CredentialRepository) {
    this.apiKey = apiKey || env.B2X_API_KEY || '';
    this.repository = repository || new CredentialRepository();
  }

  async getContext(): Promise<AgentContext> {
    if (!this.apiKey) {
      throw new InvalidCredentialError('INVALID_CREDENTIAL');
    }

    const parsed = parseApiKey(this.apiKey);
    if (!parsed) {
      throw new InvalidCredentialError('INVALID_CREDENTIAL');
    }

    const credential = await this.repository.findByPrefix(parsed.keyPrefix);
    if (!credential) {
      throw new InvalidCredentialError('INVALID_CREDENTIAL');
    }

    // Check revocation (do not disclose whether the key existed)
    if (credential.revoked_at) {
      throw new InvalidCredentialError('INVALID_CREDENTIAL');
    }

    // Check expiration (do not disclose expiration specifics)
    if (credential.expires_at) {
      const expiresAt = new Date(credential.expires_at).getTime();
      if (expiresAt <= Date.now()) {
        throw new InvalidCredentialError('INVALID_CREDENTIAL');
      }
    }

    // Timing-safe secret verification
    const isValid = verifySecret(parsed.secret, credential.key_hash);
    if (!isValid) {
      throw new InvalidCredentialError('INVALID_CREDENTIAL');
    }

    // Fire-and-forget last_used_at update
    this.repository.touchLastUsed(credential.id).catch((err) => {
      console.error('[AuthenticatedContextProvider] Error updating last_used_at:', err);
    });

    const sessionId = crypto.randomUUID();

    // Resolve tenant identity
    if (credential.principal_type === 'tenant') {
      if (!credential.store_id) {
        throw new InvalidCredentialError('INVALID_CREDENTIAL');
      }

      return {
        principalType: 'tenant',
        principalId: credential.principal_id || credential.id,
        storeAccess: {
          mode: 'restricted',
          storeIds: [credential.store_id],
        },
        activeStoreId: credential.store_id,
        scopes: credential.scopes || ['catalog:read'],
        sessionId,
      };
    }

    // Resolve superadmin identity (storeAccess.mode = 'all', activeStoreId is null until selected)
    if (credential.principal_type === 'superadmin') {
      return {
        principalType: 'superadmin',
        principalId: credential.principal_id || credential.id,
        storeAccess: {
          mode: 'all',
        },
        activeStoreId: null,
        scopes: credential.scopes || ['catalog:read'],
        sessionId,
      };
    }

    // Resolve user identity
    return {
      principalType: 'user',
      principalId: credential.principal_id || credential.id,
      storeAccess: {
        mode: 'restricted',
        storeIds: credential.store_id ? [credential.store_id] : [],
      },
      activeStoreId: credential.store_id || null,
      scopes: credential.scopes || ['catalog:read'],
      sessionId,
    };
  }
}
