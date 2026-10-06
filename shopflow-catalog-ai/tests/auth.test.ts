import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateApiKey, parseApiKey, hashSecret, verifySecret } from '../src/auth/api-key.crypto.js';
import { AuthenticatedContextProvider } from '../src/auth/authenticated-context-provider.js';
import { CredentialRepository, CredentialRecord } from '../src/auth/credential.repository.js';
import { InvalidCredentialError } from '../src/domain/errors.js';

describe('API Key Cryptography & Parser', () => {
  it('generates a valid API key matching b2x_live_<16hex>_<64hex>', () => {
    const generated = generateApiKey('live');
    assert.match(generated.rawKey, /^b2x_live_[a-f0-9]{16}_[a-f0-9]{64}$/);
    assert.equal(generated.rawKey, `${generated.keyPrefix}_${generated.secret}`);
    assert.equal(generated.keyHash, hashSecret(generated.secret));
  });

  it('parses valid API keys correctly', () => {
    const generated = generateApiKey('live');
    const parsed = parseApiKey(generated.rawKey);
    assert.ok(parsed);
    assert.equal(parsed.keyPrefix, generated.keyPrefix);
    assert.equal(parsed.secret, generated.secret);
  });

  it('rejects invalid API key formats without throwing', () => {
    assert.equal(parseApiKey(''), null);
    assert.equal(parseApiKey('invalid-token'), null);
    assert.equal(parseApiKey('b2x_live_short_secret'), null);
    assert.equal(parseApiKey('b2x_live_1234567890abcdef_short'), null);
    assert.equal(parseApiKey(null as unknown as string), null);
  });

  it('verifies valid secrets with hash', () => {
    const secret = '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff';
    const hash = hashSecret(secret);
    assert.equal(verifySecret(secret, hash), true);
  });

  it('rejects incorrect secrets', () => {
    const secret = '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff';
    const wrongSecret = '99999944556677889900aabbccddeeff11223344556677889900aabbccddeeff';
    const hash = hashSecret(secret);
    assert.equal(verifySecret(wrongSecret, hash), false);
  });
});

describe('AuthenticatedContextProvider (Mock Repository)', () => {
  const storeId = '11111111-2222-3333-4444-555555555555';
  const tenantKey = generateApiKey('live');
  const superadminKey = generateApiKey('live');
  const revokedKey = generateApiKey('live');
  const expiredKey = generateApiKey('live');

  const mockDb = new Map<string, CredentialRecord>([
    [
      tenantKey.keyPrefix,
      {
        id: 'cred-tenant-1',
        key_prefix: tenantKey.keyPrefix,
        key_hash: tenantKey.keyHash,
        principal_type: 'tenant',
        principal_id: 'tenant-user-1',
        store_id: storeId,
        scopes: ['catalog:read', 'store:list'],
        name: 'Grok Integration',
        created_at: new Date().toISOString(),
        expires_at: null,
        revoked_at: null,
        last_used_at: null,
      },
    ],
    [
      superadminKey.keyPrefix,
      {
        id: 'cred-superadmin-1',
        key_prefix: superadminKey.keyPrefix,
        key_hash: superadminKey.keyHash,
        principal_type: 'superadmin',
        principal_id: 'admin-user-1',
        store_id: null,
        scopes: ['catalog:read', 'store:list', 'store:select'],
        name: 'Platform Admin',
        created_at: new Date().toISOString(),
        expires_at: null,
        revoked_at: null,
        last_used_at: null,
      },
    ],
    [
      revokedKey.keyPrefix,
      {
        id: 'cred-revoked-1',
        key_prefix: revokedKey.keyPrefix,
        key_hash: revokedKey.keyHash,
        principal_type: 'tenant',
        principal_id: 'tenant-user-2',
        store_id: storeId,
        scopes: ['catalog:read'],
        name: 'Revoked Key',
        created_at: new Date().toISOString(),
        expires_at: null,
        revoked_at: new Date(Date.now() - 60000).toISOString(),
        last_used_at: null,
      },
    ],
    [
      expiredKey.keyPrefix,
      {
        id: 'cred-expired-1',
        key_prefix: expiredKey.keyPrefix,
        key_hash: expiredKey.keyHash,
        principal_type: 'tenant',
        principal_id: 'tenant-user-3',
        store_id: storeId,
        scopes: ['catalog:read'],
        name: 'Expired Key',
        created_at: new Date(Date.now() - 100000).toISOString(),
        expires_at: new Date(Date.now() - 50000).toISOString(),
        revoked_at: null,
        last_used_at: null,
      },
    ],
  ]);

  const mockRepo = {
    async findByPrefix(prefix: string) {
      return mockDb.get(prefix) || null;
    },
    async touchLastUsed() {},
  } as unknown as CredentialRepository;

  it('resolves valid tenant key to restricted StoreAccess and activeStoreId', async () => {
    const provider = new AuthenticatedContextProvider(tenantKey.rawKey, mockRepo);
    const context = await provider.getContext();

    assert.equal(context.principalType, 'tenant');
    assert.equal(context.activeStoreId, storeId);
    assert.deepEqual(context.storeAccess, { mode: 'restricted', storeIds: [storeId] });
    assert.deepEqual(context.scopes, ['catalog:read', 'store:list']);
    assert.ok(context.sessionId);
  });

  it('resolves valid superadmin key with StoreAccess mode all and activeStoreId = null', async () => {
    const provider = new AuthenticatedContextProvider(superadminKey.rawKey, mockRepo);
    const context = await provider.getContext();

    assert.equal(context.principalType, 'superadmin');
    assert.equal(context.activeStoreId, null);
    assert.deepEqual(context.storeAccess, { mode: 'all' });
    assert.deepEqual(context.scopes, ['catalog:read', 'store:list', 'store:select']);
    assert.ok(context.sessionId);
  });

  it('rejects revoked keys with generic INVALID_CREDENTIAL', async () => {
    const provider = new AuthenticatedContextProvider(revokedKey.rawKey, mockRepo);
    await assert.rejects(
      async () => await provider.getContext(),
      (err: Error) => err instanceof InvalidCredentialError && err.message === 'INVALID_CREDENTIAL'
    );
  });

  it('rejects expired keys with generic INVALID_CREDENTIAL', async () => {
    const provider = new AuthenticatedContextProvider(expiredKey.rawKey, mockRepo);
    await assert.rejects(
      async () => await provider.getContext(),
      (err: Error) => err instanceof InvalidCredentialError && err.message === 'INVALID_CREDENTIAL'
    );
  });

  it('rejects unknown key prefix with generic INVALID_CREDENTIAL', async () => {
    const unknownKey = generateApiKey('live');
    const provider = new AuthenticatedContextProvider(unknownKey.rawKey, mockRepo);
    await assert.rejects(
      async () => await provider.getContext(),
      (err: Error) => err instanceof InvalidCredentialError && err.message === 'INVALID_CREDENTIAL'
    );
  });

  it('rejects forged secret with valid prefix with generic INVALID_CREDENTIAL', async () => {
    const forgedKey = `${tenantKey.keyPrefix}_0000000000000000000000000000000000000000000000000000000000000000`;
    const provider = new AuthenticatedContextProvider(forgedKey, mockRepo);
    await assert.rejects(
      async () => await provider.getContext(),
      (err: Error) => err instanceof InvalidCredentialError && err.message === 'INVALID_CREDENTIAL'
    );
  });
});
