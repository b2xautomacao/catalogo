import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateEnv } from '../src/config/env.js';

describe('Environment Configuration Validation (validateEnv)', () => {
  const validBase = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SECRET_KEY: 'secret-token-123',
  };

  it('validates correct single_tenant configuration', () => {
    const res = validateEnv({
      ...validBase,
      MCP_AUTH_MODE: 'single_tenant',
      MCP_STORE_ID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });

    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.MCP_AUTH_MODE, 'single_tenant');
      assert.equal(res.data.MCP_STORE_ID, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    }
  });

  it('fails single_tenant configuration when MCP_STORE_ID is missing', () => {
    const res = validateEnv({
      ...validBase,
      MCP_AUTH_MODE: 'single_tenant',
    });

    assert.equal(res.success, false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path.includes('MCP_STORE_ID'));
      assert.ok(issue);
    }
  });

  it('fails single_tenant configuration when MCP_STORE_ID is not a valid UUID', () => {
    const res = validateEnv({
      ...validBase,
      MCP_AUTH_MODE: 'single_tenant',
      MCP_STORE_ID: 'not-a-uuid',
    });

    assert.equal(res.success, false);
  });

  it('validates correct authenticated configuration with B2X_API_KEY', () => {
    const res = validateEnv({
      ...validBase,
      MCP_AUTH_MODE: 'authenticated',
      B2X_API_KEY: 'b2x_live_0123456789abcdef_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567',
    });

    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.MCP_AUTH_MODE, 'authenticated');
      assert.ok(res.data.B2X_API_KEY);
    }
  });

  it('fails authenticated configuration when B2X_API_KEY is missing', () => {
    const res = validateEnv({
      ...validBase,
      MCP_AUTH_MODE: 'authenticated',
    });

    assert.equal(res.success, false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path.includes('B2X_API_KEY'));
      assert.ok(issue);
    }
  });

  it('fails when SUPABASE_URL is not a valid URL', () => {
    const res = validateEnv({
      SUPABASE_URL: 'invalid-url',
      SUPABASE_SECRET_KEY: 'secret',
      MCP_AUTH_MODE: 'single_tenant',
      MCP_STORE_ID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });

    assert.equal(res.success, false);
  });
});
