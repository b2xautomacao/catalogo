import { supabase } from '../lib/supabase.js';
import { PrincipalType } from './agent-context.js';

export interface CredentialRecord {
  id: string;
  key_prefix: string;
  key_hash: string;
  principal_type: PrincipalType;
  principal_id: string | null;
  store_id: string | null;
  scopes: string[];
  name: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  last_used_at: string | null;
}

export interface CreateCredentialInput {
  key_prefix: string;
  key_hash: string;
  principal_type: PrincipalType;
  principal_id?: string | null;
  store_id?: string | null;
  scopes?: string[];
  name: string;
  expires_at?: string | null;
}

export class CredentialRepository {
  async findByPrefix(keyPrefix: string): Promise<CredentialRecord | null> {
    const { data, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('key_prefix', keyPrefix)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as CredentialRecord;
  }

  async touchLastUsed(id: string): Promise<void> {
    const { error } = await supabase
      .from('api_credentials')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[CredentialRepository] Failed to update last_used_at:', error.message);
    }
  }

  async createCredential(input: CreateCredentialInput): Promise<CredentialRecord> {
    const { data, error } = await supabase
      .from('api_credentials')
      .insert({
        key_prefix: input.key_prefix,
        key_hash: input.key_hash,
        principal_type: input.principal_type,
        principal_id: input.principal_id || null,
        store_id: input.store_id || null,
        scopes: input.scopes || ['catalog:read'],
        name: input.name,
        expires_at: input.expires_at || null,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create API credential: ${error?.message || 'Unknown database error'}`);
    }

    return data as CredentialRecord;
  }

  async revokeCredential(id: string): Promise<void> {
    const { error } = await supabase
      .from('api_credentials')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to revoke API credential: ${error.message}`);
    }
  }
}
