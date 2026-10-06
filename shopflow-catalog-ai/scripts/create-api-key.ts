import { supabase } from '../src/lib/supabase.js';
import { generateApiKey } from '../src/auth/api-key.crypto.js';
import { CredentialRepository } from '../src/auth/credential.repository.js';
import { PrincipalType } from '../src/auth/agent-context.js';

const ALLOWED_SCOPES = [
  'catalog:read',
  'catalog:write',
  'stock:read',
  'stock:adjust',
  'grade:read',
  'grade:write',
  'store:list',
  'store:select',
];

function parseArgs() {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        options[key] = nextArg;
        i++;
      } else {
        options[key] = 'true';
      }
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  const type = (options['type'] || '').toLowerCase() as PrincipalType;
  const storeId = options['store'] || options['store-id'] || null;
  const name = options['name'] || 'API Key';
  const rawScopes = options['scopes'] || options['scope'] || null;
  const expiresInDays = options['expires-in-days'] ? parseInt(options['expires-in-days'], 10) : null;

  if (!['tenant', 'superadmin'].includes(type)) {
    console.error('Error: --type must be either "tenant" or "superadmin"');
    console.error('Usage: npm run api-key:create -- --type <tenant|superadmin> [--store <store_id>] --name "<name>" [--scopes <comma_separated_scopes>] [--expires-in-days <days>]');
    process.exit(1);
  }

  if (type === 'tenant') {
    if (!storeId) {
      console.error('Error: --store <store_id> is required for tenant credentials');
      process.exit(1);
    }

    // Validate store existence in database
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('id', storeId)
      .maybeSingle();

    if (storeError || !store) {
      console.error(`Error: Store with ID "${storeId}" was not found in the database.`);
      process.exit(1);
    }

    console.log(`Validated target store: "${store.name}" (${store.id})`);
  }

  // Determine and validate scopes
  let scopes: string[];
  if (rawScopes) {
    const requested = rawScopes.split(',').map((s) => s.trim()).filter(Boolean);
    for (const s of requested) {
      if (!ALLOWED_SCOPES.includes(s)) {
        console.error(`Error: Scope "${s}" is not allowed. Allowlist: ${ALLOWED_SCOPES.join(', ')}`);
        process.exit(1);
      }
    }
    scopes = Array.from(new Set(requested));
  } else {
    // Default role-based scopes
    scopes =
      type === 'superadmin'
        ? ['catalog:read', 'catalog:write', 'store:list', 'store:select']
        : ['catalog:read', 'store:list'];
  }

  // Calculate expiration timestamp if provided
  let expiresAt: string | null = null;
  if (expiresInDays && expiresInDays > 0) {
    const d = new Date();
    d.setDate(d.getDate() + expiresInDays);
    expiresAt = d.toISOString();
  }

  // Generate strong cryptographic API Key
  const { rawKey, keyPrefix, keyHash } = generateApiKey('live');

  // Persist only hash and prefix to database
  const repo = new CredentialRepository();
  const credential = await repo.createCredential({
    key_prefix: keyPrefix,
    key_hash: keyHash,
    principal_type: type,
    store_id: type === 'tenant' ? storeId : null,
    scopes,
    name,
    expires_at: expiresAt,
  });

  console.log('\n====================================================');
  console.log(' Credential created successfully.');
  console.log('====================================================');
  console.log(`ID:         ${credential.id}`);
  console.log(`Type:       ${credential.principal_type}`);
  if (credential.store_id) {
    console.log(`Store ID:   ${credential.store_id}`);
  }
  console.log(`Name:       ${credential.name}`);
  console.log(`Scopes:     ${credential.scopes.join(', ')}`);
  console.log(`Key Prefix: ${credential.key_prefix}`);
  if (credential.expires_at) {
    console.log(`Expires At: ${credential.expires_at}`);
  }
  console.log('----------------------------------------------------');
  console.log('API KEY:');
  console.log(rawKey);
  console.log('----------------------------------------------------');
  console.log('Save this key now.');
  console.log('It will NOT be shown again.');
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('Fatal error generating API Key:', err instanceof Error ? err.message : err);
  process.exit(1);
});
